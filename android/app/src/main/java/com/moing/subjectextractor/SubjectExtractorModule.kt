package com.moing.subjectextractor

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.media.ExifInterface
import android.os.SystemClock
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.Subject
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.net.URLDecoder
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min

// iOS의 SubjectExtractorModule.m(Vision VNGenerateForegroundInstanceMaskRequest)과 같은 계약을
// ML Kit Subject Segmentation으로 맞춘 구현. 돌려주는 키/에러 코드는 양쪽이 같아야 한다.
class SubjectExtractorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        // 조각을 가운데 놓고 찍게 안내하므로, 후보가 여러 개면 화면 중앙 영역을 가장 많이 차지한 것을 고른다.
        private const val CENTER_WINDOW_RATIO = 0.5

        // ML Kit 마스크는 0~1 신뢰도라서 피사체/배경을 가를 기준이 필요하다.
        private const val MASK_THRESHOLD = 0.5f

        // 원본 해상도 그대로면 마스크 배열 + 적분 이미지 + 비트맵이 한꺼번에 떠서 저사양 기기에서 OOM이 난다.
        // 조각은 작게 보여주는 이미지라 긴 변 2048이면 충분하다.
        private const val MAX_SOURCE_SIZE = 2048

        // 윤곽선 두께. 원본 해상도가 제각각이라 고정값을 쓰면 큰 사진에선 선이 안 보인다. (iOS와 같은 비율)
        private const val MIN_OUTLINE_RADIUS = 2
        private const val OUTLINE_RADIUS_RATIO = 0.004

        // 세그멘테이션 모델은 Play 서비스가 내려주므로, 설치 전이면 기다려야 한다.
        private const val MODEL_WAIT_TIMEOUT_MS = 30_000L
        private const val MODEL_POLL_INTERVAL_MS = 1_000L

        // Play 서비스 / ML Kit 쪽 Task는 다른 프로세스를 타서 응답이 안 올 수도 있다.
        // 여기서 막히면 인식 화면이 영원히 "찾는 중"으로 남으므로 전부 상한을 둔다.
        private const val MODULE_QUERY_TIMEOUT_SEC = 10L
        private const val MODULE_INSTALL_TIMEOUT_SEC = 60L
        private const val PROCESS_TIMEOUT_SEC = 60L
    }

    // 세그멘테이션은 사진 한 장에 수백 ms~수 초가 걸리므로 JS 스레드를 막지 않게 전용 스레드에서 돌린다.
    private val worker = Executors.newSingleThreadExecutor()

    // 모델 미리 받기는 몇 분이 걸릴 수도 있어서, 뒤에 들어온 extract가 큐에서 밀리지 않게 분리한다.
    private val prefetcher = Executors.newSingleThreadExecutor()

    private var segmenterOrNull: SubjectSegmenter? = null

    private val segmenter: SubjectSegmenter
        get() = synchronized(this) {
            segmenterOrNull ?: SubjectSegmentation.getClient(
                SubjectSegmenterOptions.Builder()
                    .enableMultipleSubjects(
                        SubjectSegmenterOptions.SubjectResultOptions.Builder()
                            // 중앙 피사체를 고르는 데 쓰는 마스크와, 잘라낸 조각 비트맵
                            .enableConfidenceMask()
                            .enableSubjectBitmap()
                            .build(),
                    )
                    .build(),
            ).also { segmenterOrNull = it }
        }

    override fun getName() = "SubjectExtractor"

    override fun invalidate() {
        worker.shutdown()
        prefetcher.shutdown()

        synchronized(this) {
            segmenterOrNull?.close()
            segmenterOrNull = null
        }

        super.invalidate()
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        // ML Kit 세그멘테이션은 Play 서비스를 타므로 Play 서비스가 없는 기기에서는 쓸 수 없다.
        val available = GoogleApiAvailability.getInstance()
            .isGooglePlayServicesAvailable(reactApplicationContext) == ConnectionResult.SUCCESS

        promise.resolve(available)

        // 진입 가능 여부만 먼저 돌려주고, 모델이 아직 없으면 미리 받아두게 요청만 걸어둔다.
        if (available) {
            prefetcher.execute { runCatching { requestModelInstall() } }
        }
    }

    @ReactMethod
    fun extract(imagePath: String, promise: Promise) {
        worker.execute {
            var source: Bitmap? = null

            try {
                source = loadUprightBitmap(normalizedPath(imagePath))

                if (source == null) {
                    promise.reject("LOAD_FAILED", "사진을 불러오지 못했어요.")
                    return@execute
                }

                if (!awaitModelReady()) {
                    promise.reject("MODEL_NOT_READY", "조각 인식 준비가 아직 끝나지 않았어요.")
                    return@execute
                }

                val result = try {
                    Tasks.await(
                        segmenter.process(InputImage.fromBitmap(source, 0)),
                        PROCESS_TIMEOUT_SEC,
                        TimeUnit.SECONDS,
                    )
                } catch (error: Exception) {
                    promise.reject("ANALYZE_FAILED", "조각을 분석하지 못했어요.", error)
                    return@execute
                }

                val subjects = result.subjects

                if (subjects.isEmpty()) {
                    promise.reject("NO_SUBJECT", "조각 인식이 불가능해요.")
                    return@execute
                }

                val subject = dominantSubject(subjects, source.width, source.height)
                val cutout = subject.bitmap

                if (cutout == null) {
                    promise.reject("EXTRACT_FAILED", "조각을 분리하지 못했어요.")
                    return@execute
                }

                val cutoutPath = writePng(cutout, "moing-piece")

                if (cutoutPath == null) {
                    promise.reject("WRITE_FAILED", "조각 이미지를 저장하지 못했어요.")
                    return@execute
                }

                // 인식 성공 화면에서 원본 사진 위에 덧그릴 윤곽선. 실패해도 조각 자체는 쓸 수 있으니 넘어간다.
                val outlinePath = buildOutline(subject, source.width, source.height)
                    ?.let { outline ->
                        val path = writePng(outline, "moing-piece-outline")
                        outline.recycle()
                        path
                    }

                promise.resolve(
                    Arguments.createMap().apply {
                        putString("uri", "file://$cutoutPath")
                        putInt("width", cutout.width)
                        putInt("height", cutout.height)
                        putInt("sourceWidth", source.width)
                        putInt("sourceHeight", source.height)
                        putInt("instanceCount", subjects.size)

                        if (outlinePath != null) {
                            putString("outlineUri", "file://$outlinePath")
                        }
                    },
                )
            } catch (error: Throwable) {
                promise.reject("EXTRACT_FAILED", "조각을 분리하지 못했어요.", error)
            } finally {
                source?.recycle()
            }
        }
    }

    // MARK: 모델 설치

    private fun isModelInstalled(): Boolean =
        Tasks.await(
            ModuleInstall.getClient(reactApplicationContext).areModulesAvailable(segmenter),
            MODULE_QUERY_TIMEOUT_SEC,
            TimeUnit.SECONDS,
        ).areModulesAvailable()

    private fun requestModelInstall() {
        if (isModelInstalled()) {
            return
        }

        Tasks.await(
            ModuleInstall.getClient(reactApplicationContext)
                .installModules(ModuleInstallRequest.newBuilder().addApi(segmenter).build()),
            MODULE_INSTALL_TIMEOUT_SEC,
            TimeUnit.SECONDS,
        )
    }

    private fun awaitModelReady(): Boolean {
        return try {
            if (isModelInstalled()) {
                return true
            }

            requestModelInstall()

            // installModules 가 다운로드 완료까지 기다려주는지는 보장이 없어서 가능 여부를 다시 폴링한다.
            val deadline = SystemClock.elapsedRealtime() + MODEL_WAIT_TIMEOUT_MS

            while (SystemClock.elapsedRealtime() < deadline) {
                Thread.sleep(MODEL_POLL_INTERVAL_MS)

                if (isModelInstalled()) {
                    return true
                }
            }

            false
        } catch (error: Exception) {
            // 설치 여부를 못 물어보는 상황(Play 서비스 구버전 등)에서는 매니페스트 선언으로 이미
            // 받아져 있을 수 있으니, 막지 말고 실제 process() 결과로 판단하게 둔다.
            true
        }
    }

    // MARK: 경로 / 이미지 유틸

    private fun normalizedPath(path: String): String {
        val withoutScheme = if (path.startsWith("file://")) path.removePrefix("file://") else path

        // URLDecoder는 '+'를 공백으로 바꿔버리므로, 퍼센트 인코딩이 실제로 있을 때만 쓴다.
        if (!withoutScheme.contains('%')) {
            return withoutScheme
        }

        return runCatching { URLDecoder.decode(withoutScheme, "UTF-8") }.getOrDefault(withoutScheme)
    }

    // ML Kit은 넘긴 비트맵을 그대로 해석하므로, EXIF 회전 정보를 픽셀에 먼저 구워둔다.
    // (안 그러면 세로로 찍은 사진에서 마스크가 90도 돌아간 채로 나옴)
    private fun loadUprightBitmap(path: String): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, bounds)

        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            return null
        }

        val options = BitmapFactory.Options().apply {
            inSampleSize = sampleSizeFor(bounds.outWidth, bounds.outHeight)
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }

        val decoded = BitmapFactory.decodeFile(path, options) ?: return null

        return rotatedByExif(decoded, path)
    }

    private fun sampleSizeFor(width: Int, height: Int): Int {
        var sample = 1

        while (max(width, height) / sample > MAX_SOURCE_SIZE) {
            sample *= 2
        }

        return sample
    }

    private fun rotatedByExif(bitmap: Bitmap, path: String): Bitmap {
        val orientation = runCatching {
            ExifInterface(path).getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL,
            )
        }.getOrDefault(ExifInterface.ORIENTATION_NORMAL)

        val matrix = Matrix()

        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            ExifInterface.ORIENTATION_TRANSPOSE -> {
                matrix.postRotate(90f)
                matrix.postScale(-1f, 1f)
            }
            ExifInterface.ORIENTATION_TRANSVERSE -> {
                matrix.postRotate(270f)
                matrix.postScale(-1f, 1f)
            }
            else -> return bitmap
        }

        val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)

        if (rotated != bitmap) {
            bitmap.recycle()
        }

        return rotated
    }

    // MARK: 피사체 선택

    // 중앙 영역을 가장 많이 덮은 피사체를 고르고, 중앙이 전부 배경이면 전체에서 가장 넓은 것으로 떨어진다.
    private fun dominantSubject(subjects: List<Subject>, width: Int, height: Int): Subject {
        val margin = (1.0 - CENTER_WINDOW_RATIO) / 2.0
        val centerMinX = (width * margin).toInt()
        val centerMaxX = (width * (1.0 - margin)).toInt()
        val centerMinY = (height * margin).toInt()
        val centerMaxY = (height * (1.0 - margin)).toInt()

        var bestCentered: Subject? = null
        var bestCenterCount = 0L
        var bestOverall = subjects.first()
        var bestTotalCount = -1L

        for (subject in subjects) {
            val mask = subject.confidenceMask
            var centerCount = 0L
            var totalCount = 0L

            for (y in 0 until subject.height) {
                val imageY = subject.startY + y
                val inCenterRow = imageY >= centerMinY && imageY < centerMaxY

                for (x in 0 until subject.width) {
                    // 마스크를 못 받았으면 경계 상자 전체를 피사체로 보고 센다.
                    if (mask != null && mask.get(y * subject.width + x) < MASK_THRESHOLD) {
                        continue
                    }

                    totalCount++

                    val imageX = subject.startX + x

                    if (inCenterRow && imageX >= centerMinX && imageX < centerMaxX) {
                        centerCount++
                    }
                }
            }

            if (centerCount > bestCenterCount) {
                bestCenterCount = centerCount
                bestCentered = subject
            }

            if (totalCount > bestTotalCount) {
                bestTotalCount = totalCount
                bestOverall = subject
            }
        }

        return bestCentered ?: bestOverall
    }

    // MARK: 윤곽선

    // 원본 사진 크기 그대로인 흰색 윤곽선 PNG. 색은 JS에서 tintColor로 입힌다.
    private fun buildOutline(subject: Subject, width: Int, height: Int): Bitmap? {
        val mask = subject.confidenceMask ?: return null

        val filled = ByteArray(width * height)

        for (y in 0 until subject.height) {
            val imageY = subject.startY + y

            if (imageY < 0 || imageY >= height) {
                continue
            }

            for (x in 0 until subject.width) {
                val imageX = subject.startX + x

                if (imageX < 0 || imageX >= width) {
                    continue
                }

                if (mask.get(y * subject.width + x) >= MASK_THRESHOLD) {
                    filled[imageY * width + imageX] = 1
                }
            }
        }

        val radius = max(MIN_OUTLINE_RADIUS, (min(width, height) * OUTLINE_RADIUS_RATIO).toInt())

        // (팽창 - 침식) = 경계. 반경만큼 이웃을 매번 훑으면 사진 해상도에서 너무 느려서,
        // 적분 이미지로 박스 합을 O(1)에 구한 뒤 "전부 배경도 아니고 전부 피사체도 아닌" 픽셀만 남긴다.
        val stride = width + 1
        val integral = IntArray(stride * (height + 1))

        for (y in 0 until height) {
            var rowSum = 0

            for (x in 0 until width) {
                rowSum += filled[y * width + x].toInt()
                integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum
            }
        }

        val pixels = IntArray(width * height)

        for (y in 0 until height) {
            val minY = max(0, y - radius)
            val maxY = min(height - 1, y + radius)

            for (x in 0 until width) {
                val minX = max(0, x - radius)
                val maxX = min(width - 1, x + radius)

                val sum = integral[(maxY + 1) * stride + (maxX + 1)] -
                    integral[minY * stride + (maxX + 1)] -
                    integral[(maxY + 1) * stride + minX] +
                    integral[minY * stride + minX]

                if (sum != 0 && sum != (maxX - minX + 1) * (maxY - minY + 1)) {
                    pixels[y * width + x] = Color.WHITE
                }
            }
        }

        return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
    }

    // MARK: PNG 저장

    private fun writePng(bitmap: Bitmap, prefix: String): String? {
        val file = File(reactApplicationContext.cacheDir, "$prefix-${UUID.randomUUID()}.png")

        return try {
            FileOutputStream(file).use { stream ->
                if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)) {
                    return null
                }
            }

            file.absolutePath
        } catch (error: Exception) {
            null
        }
    }
}
