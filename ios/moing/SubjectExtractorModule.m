#import "SubjectExtractorModule.h"

#import <CoreImage/CoreImage.h>
#import <CoreVideo/CoreVideo.h>
#import <UIKit/UIKit.h>
#import <Vision/Vision.h>

// 인스턴스 라벨은 instanceMask에 픽셀값으로 들어오므로 8비트 범위를 넘지 않는다.
static const NSUInteger kMoingMaxInstanceLabel = 256;

// 조각을 가운데 놓고 찍게 안내하므로, 후보가 여러 개면 화면 중앙 영역을 가장 많이 차지한 것을 고른다.
static const CGFloat kMoingCenterWindowRatio = 0.5;

#pragma mark - 경로 / 이미지 유틸

static NSString *MoingNormalizedPath(NSString *path) {
    NSString *normalized = path;

    if ([normalized hasPrefix:@"file://"]) {
        NSURL *url = [NSURL URLWithString:normalized];
        normalized = url.path ?: [normalized substringFromIndex:[@"file://" length]];
    }

    return [normalized stringByRemovingPercentEncoding] ?: normalized;
}

// Vision은 EXIF 방향을 모르는 CGImage를 그대로 해석하므로, 회전 정보를 픽셀에 먼저 구워둔다.
// (안 그러면 세로로 찍은 사진에서 마스크가 90도 돌아간 채로 나옴)
static CGImageRef MoingCreateUprightCGImage(UIImage *image) CF_RETURNS_RETAINED {
    if (image.imageOrientation == UIImageOrientationUp && image.CGImage != NULL) {
        return CGImageRetain(image.CGImage);
    }

    UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
    format.scale = 1.0;
    format.opaque = NO;

    UIGraphicsImageRenderer *renderer =
        [[UIGraphicsImageRenderer alloc] initWithSize:image.size format:format];

    UIImage *upright = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
        (void)context;
        [image drawInRect:CGRectMake(0, 0, image.size.width, image.size.height)];
    }];

    return CGImageRetain(upright.CGImage);
}

#pragma mark - 인스턴스 선택

// instanceMask는 픽셀마다 "몇 번째 인스턴스인지"를 담고 있고 0은 배경이다.
// 중앙 영역에서 가장 넓은 라벨을 고르고, 중앙이 전부 배경이면 전체에서 가장 넓은 라벨로 떨어진다.
static NSUInteger MoingDominantInstanceLabel(CVPixelBufferRef mask) {
    if (mask == NULL) {
        return 0;
    }

    CVPixelBufferLockBaseAddress(mask, kCVPixelBufferLock_ReadOnly);

    const size_t width = CVPixelBufferGetWidth(mask);
    const size_t height = CVPixelBufferGetHeight(mask);
    const size_t bytesPerRow = CVPixelBufferGetBytesPerRow(mask);
    const OSType format = CVPixelBufferGetPixelFormatType(mask);
    const uint8_t *base = (const uint8_t *)CVPixelBufferGetBaseAddress(mask);

    if (base == NULL || width == 0 || height == 0) {
        CVPixelBufferUnlockBaseAddress(mask, kCVPixelBufferLock_ReadOnly);
        return 0;
    }

    NSUInteger centerCounts[kMoingMaxInstanceLabel];
    NSUInteger totalCounts[kMoingMaxInstanceLabel];
    memset(centerCounts, 0, sizeof(centerCounts));
    memset(totalCounts, 0, sizeof(totalCounts));

    const CGFloat margin = (1.0 - kMoingCenterWindowRatio) / 2.0;
    const size_t centerMinX = (size_t)(width * margin);
    const size_t centerMaxX = (size_t)(width * (1.0 - margin));
    const size_t centerMinY = (size_t)(height * margin);
    const size_t centerMaxY = (size_t)(height * (1.0 - margin));

    for (size_t y = 0; y < height; y++) {
        const uint8_t *row = base + y * bytesPerRow;
        const BOOL inCenterRow = (y >= centerMinY && y < centerMaxY);

        for (size_t x = 0; x < width; x++) {
            NSUInteger label = 0;

            if (format == kCVPixelFormatType_OneComponent8) {
                label = row[x];
            } else if (format == kCVPixelFormatType_OneComponent32Float) {
                const float value = ((const float *)row)[x];
                label = (value <= 0.0f) ? 0 : (NSUInteger)lroundf(value);
            } else {
                // 예상 못 한 포맷이면 라벨을 읽을 수 없으므로 선택을 포기하고 전체 인스턴스를 쓰게 둔다.
                CVPixelBufferUnlockBaseAddress(mask, kCVPixelBufferLock_ReadOnly);
                return 0;
            }

            if (label == 0 || label >= kMoingMaxInstanceLabel) {
                continue;
            }

            totalCounts[label]++;

            if (inCenterRow && x >= centerMinX && x < centerMaxX) {
                centerCounts[label]++;
            }
        }
    }

    CVPixelBufferUnlockBaseAddress(mask, kCVPixelBufferLock_ReadOnly);

    NSUInteger bestLabel = 0;
    NSUInteger bestCount = 0;

    for (NSUInteger label = 1; label < kMoingMaxInstanceLabel; label++) {
        if (centerCounts[label] > bestCount) {
            bestCount = centerCounts[label];
            bestLabel = label;
        }
    }

    if (bestLabel != 0) {
        return bestLabel;
    }

    for (NSUInteger label = 1; label < kMoingMaxInstanceLabel; label++) {
        if (totalCounts[label] > bestCount) {
            bestCount = totalCounts[label];
            bestLabel = label;
        }
    }

    return bestLabel;
}

#pragma mark - PNG 저장

static NSString *MoingWritePNG(CIImage *image, CIContext *context, NSString *prefix) {
    if (image == nil || CGRectIsEmpty(image.extent) || CGRectIsInfinite(image.extent)) {
        return nil;
    }

    CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGImageRef cgImage = [context createCGImage:image
                                       fromRect:image.extent
                                         format:kCIFormatRGBA8
                                     colorSpace:colorSpace];
    CGColorSpaceRelease(colorSpace);

    if (cgImage == NULL) {
        return nil;
    }

    NSData *data = UIImagePNGRepresentation([UIImage imageWithCGImage:cgImage]);
    CGImageRelease(cgImage);

    if (data == nil) {
        return nil;
    }

    NSString *fileName = [NSString stringWithFormat:@"%@-%@.png", prefix, [[NSUUID UUID] UUIDString]];
    NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];

    if (![data writeToFile:path atomically:YES]) {
        return nil;
    }

    return path;
}

#pragma mark - 모듈

@implementation SubjectExtractorModule

RCT_EXPORT_MODULE(SubjectExtractor);

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

// Vision 분석은 사진 한 장에 수백 ms~수 초가 걸리므로 JS 스레드를 막지 않게 전용 큐에서 돌린다.
- (dispatch_queue_t)methodQueue {
    return dispatch_queue_create("com.moing.subjectextractor", DISPATCH_QUEUE_SERIAL);
}

RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (@available(iOS 17.0, *)) {
        resolve(@YES);
    } else {
        resolve(@NO);
    }
}

RCT_EXPORT_METHOD(extract:(NSString *)imagePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (@available(iOS 17.0, *)) {
        NSString *path = MoingNormalizedPath(imagePath);
        UIImage *image = [UIImage imageWithContentsOfFile:path];

        if (image == nil) {
            reject(@"LOAD_FAILED", @"사진을 불러오지 못했어요.", nil);
            return;
        }

        CGImageRef cgImage = MoingCreateUprightCGImage(image);

        if (cgImage == NULL) {
            reject(@"LOAD_FAILED", @"사진을 불러오지 못했어요.", nil);
            return;
        }

        VNGenerateForegroundInstanceMaskRequest *request =
            [[VNGenerateForegroundInstanceMaskRequest alloc] init];
        VNImageRequestHandler *handler =
            [[VNImageRequestHandler alloc] initWithCGImage:cgImage options:@{}];

        NSError *error = nil;

        if (![handler performRequests:@[request] error:&error]) {
            CGImageRelease(cgImage);
            reject(@"ANALYZE_FAILED", @"조각을 분석하지 못했어요.", error);
            return;
        }

        VNInstanceMaskObservation *observation = request.results.firstObject;

        if (observation == nil || observation.allInstances.count == 0) {
            CGImageRelease(cgImage);
            reject(@"NO_SUBJECT", @"조각 인식이 불가능해요.", nil);
            return;
        }

        // 라벨을 못 고르면(포맷을 못 읽는 등) 빈 IndexSet을 넘겨 Vision이 전체 인스턴스를 쓰게 한다.
        const NSUInteger label = MoingDominantInstanceLabel(observation.instanceMask);
        NSIndexSet *selected = (label == 0)
            ? [NSIndexSet indexSet]
            : [NSIndexSet indexSetWithIndex:label];

        CVPixelBufferRef cutout = [observation generateMaskedImageOfInstances:selected
                                                          fromRequestHandler:handler
                                                    croppedToInstancesExtent:YES
                                                                       error:&error];

        if (cutout == NULL) {
            CGImageRelease(cgImage);
            reject(@"EXTRACT_FAILED", @"조각을 분리하지 못했어요.", error);
            return;
        }

        CVPixelBufferRef scaledMask = [observation generateScaledMaskForImageForInstances:selected
                                                                      fromRequestHandler:handler
                                                                                   error:&error];

        CIContext *context = [CIContext contextWithOptions:nil];

        const size_t cutoutWidth = CVPixelBufferGetWidth(cutout);
        const size_t cutoutHeight = CVPixelBufferGetHeight(cutout);
        const size_t sourceWidth = CGImageGetWidth(cgImage);
        const size_t sourceHeight = CGImageGetHeight(cgImage);

        NSString *cutoutPath =
            MoingWritePNG([CIImage imageWithCVPixelBuffer:cutout], context, @"moing-piece");

        // 인식 성공 화면에서 원본 사진 위에 피사체 윤곽선을 덧그리기 위한 이미지.
        // 마스크의 경계만 남기고(모폴로지 그래디언트) 밝기를 알파로 바꿔 투명 PNG로 만든다.
        // 흰색으로 저장해두고 색은 JS에서 tintColor로 입힌다.
        NSString *outlinePath = nil;

        if (scaledMask != NULL) {
            CIImage *maskImage = [CIImage imageWithCVPixelBuffer:scaledMask];
            // 원본 해상도가 제각각이라 고정 반경을 쓰면 큰 사진에선 선이 안 보인다.
            const CGFloat shorterSide = MIN(maskImage.extent.size.width, maskImage.extent.size.height);
            const CGFloat outlineRadius = MAX(2.0, shorterSide * 0.004);

            CIFilter *gradient = [CIFilter filterWithName:@"CIMorphologyGradient"];
            [gradient setValue:maskImage forKey:kCIInputImageKey];
            [gradient setValue:@(outlineRadius) forKey:kCIInputRadiusKey];

            CIFilter *maskToAlpha = [CIFilter filterWithName:@"CIMaskToAlpha"];
            [maskToAlpha setValue:gradient.outputImage forKey:kCIInputImageKey];

            // 모폴로지 결과는 extent가 원본보다 커질 수 있어서 원본 크기로 잘라낸다.
            CIImage *outline = [maskToAlpha.outputImage imageByCroppingToRect:maskImage.extent];
            outlinePath = MoingWritePNG(outline, context, @"moing-piece-outline");

            CFRelease(scaledMask);
        }

        CFRelease(cutout);
        CGImageRelease(cgImage);

        if (cutoutPath == nil) {
            reject(@"WRITE_FAILED", @"조각 이미지를 저장하지 못했어요.", nil);
            return;
        }

        NSMutableDictionary *result = [NSMutableDictionary dictionary];
        result[@"uri"] = [@"file://" stringByAppendingString:cutoutPath];
        result[@"width"] = @(cutoutWidth);
        result[@"height"] = @(cutoutHeight);
        result[@"sourceWidth"] = @(sourceWidth);
        result[@"sourceHeight"] = @(sourceHeight);
        result[@"instanceCount"] = @(observation.allInstances.count);

        if (outlinePath != nil) {
            result[@"outlineUri"] = [@"file://" stringByAppendingString:outlinePath];
        }

        resolve(result);
    } else {
        reject(@"UNSUPPORTED_OS", @"이 기기에서는 조각 모으기를 사용할 수 없어요.", nil);
    }
}

@end
