import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import ReviewExitModal from '../../components/review/ReviewExitModal';

import RNFS from 'react-native-fs';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  Group,
  //Paint,
  //Blur,
  Skia,
  useCanvasRef,
  ImageFormat,
  RuntimeShader,
} from '@shopify/react-native-skia';

type ReviewNav = NativeStackNavigationProp<ReviewStackParamList>;
type ReviewPhotoConfirmRoute = RouteProp<
  ReviewStackParamList,
  'ReviewPhotoConfirm'
>;

type BlurPoint = {
  id: number;
  x: number;
  y: number;
};

const checkBlueIcon = require('../../assets/image/check_blue.png');
const mdiBlurIcon = require('../../assets/image/mdi_blur.png');
const eraserIcon = require('../../assets/image/eraser.png');
const blurRefreshIcon = require('../../assets/image/blur_refresh.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

const figmaY = (value: number) => px(value);

// 사진 영역과 헤더 위치 치수
const SIDE_MARGIN = px(spacing['3xl']);
const MAX_PHOTO_WIDTH = SCREEN_WIDTH - SIDE_MARGIN * 2;
const MAX_PHOTO_HEIGHT = px(570);
const TOP_SECTION_HEIGHT = figmaY(129);
const LOGO_TOP = figmaY(77);
const TOOL_AREA_HEIGHT = px(120);
const BRUSH_RADIUS = px(24);
const ERASE_RADIUS = px(28);
//const BLUR_SIGMA = 12;
const MOSAIC_BLOCK_SIZE = 14;
const MIN_BRUSH_DISTANCE = px(10);

const mosaicRuntimeEffect = Skia.RuntimeEffect.Make(`
uniform shader image;

half4 main(float2 xy) {
  float blockSize = ${MOSAIC_BLOCK_SIZE.toFixed(1)};
  float2 block = floor(xy / blockSize) * blockSize + blockSize * 0.5;
  return image.eval(block);
}
`)!;

export default function ReviewPhotoConfirmScreen() {
  const navigation = useNavigation<ReviewNav>();
  const route = useRoute<ReviewPhotoConfirmRoute>();

  const [showBlurToast, setShowBlurToast] = useState(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [exitModalVisible, setExitModalVisible] = useState(false);

  // 블러 도구가 켜져 있는지
  const [isBlurMode, setIsBlurMode] = useState(false);

  const [blurPoints, setBlurPoints] = useState<BlurPoint[]>([]);
  const [selectedTool, setSelectedTool] = useState<'blur' | 'eraser'>('blur');

  const blurPointIdRef = useRef(0);
  const lastPointRef = useRef<{x: number; y: number} | null>(null);

  const canvasRef = useCanvasRef();
  const {photoUri} = route.params;
  const photoSkiaImage = useImage(photoUri);

  // 세로 사진은 리뷰(카메라) 화면과 동일한 고정 박스에 cover로 채우고,
  // 가로 사진은 잘리는 부분 없이 화면 전체 너비로 보이도록 한다.
  const photoDisplaySize = useMemo(() => {
    if (!photoSkiaImage) {
      return {
        width: MAX_PHOTO_WIDTH,
        height: MAX_PHOTO_HEIGHT,
        isLandscape: false,
      };
    }

    const originalWidth = photoSkiaImage.width();
    const originalHeight = photoSkiaImage.height();

    console.log('[Confirm 이미지 크기]', {
      originalWidth,
      originalHeight,
    });

    if (originalWidth <= 0 || originalHeight <= 0) {
      return {
        width: MAX_PHOTO_WIDTH,
        height: MAX_PHOTO_HEIGHT,
        isLandscape: false,
      };
    }

    const aspectRatio = originalWidth / originalHeight;
    const isLandscape = originalWidth > originalHeight;

    // 가로 사진도 세로와 동일한 좌우 여백 유지
    if (isLandscape) {
      const width = MAX_PHOTO_WIDTH;
      const height = width / aspectRatio;

      return {
        width,
        height,
        isLandscape: true,
      };
    }

    // 세로 사진은 리뷰(카메라) 화면과 동일한 고정 박스 크기 유지
    return {
      width: MAX_PHOTO_WIDTH,
      height: MAX_PHOTO_HEIGHT,
      isLandscape: false,
    };
  }, [photoSkiaImage]);

  const {
    width: displayPhotoWidth,
    height: displayPhotoHeight,
    isLandscape,
  } = photoDisplaySize;
    
  const showToastForThreeSeconds = () => {
    setShowBlurToast(true);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setShowBlurToast(false);
    }, 3000);
  };

  useEffect(() => {
    showToastForThreeSeconds();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    // 블러 모드에서는 뒤로가기 대신 기본 모드
    if (isBlurMode) {
      setIsBlurMode(false);
      return;
    }

    setExitModalVisible(true);
  };
  
  const handleExitToHome = () => {
  setExitModalVisible(false);

  (navigation as any).getParent()?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Tab',
          params: {
            screen: 'Home',
          },
        },
      ],
    }),
  );
};

const handleConfirm = async () => {
  try {
    if (blurPoints.length === 0) {
      navigation.navigate('ReviewWrite', {photoUri});
      return;
    }

    const snapshot = canvasRef.current?.makeImageSnapshot();

    if (!snapshot) {
      throw new Error('Skia snapshot 생성 실패');
    }

    const base64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);
    const filePath = `${RNFS.CachesDirectoryPath}/review_blur_${Date.now()}.png`;

    await RNFS.writeFile(filePath, base64, 'base64');

    navigation.navigate('ReviewWrite', {
      photoUri: `file://${filePath}`,
    });
  } catch (error) {
    console.log('Skia blur 이미지 저장 실패:', error);
    navigation.navigate('ReviewWrite', {photoUri});
  }
};

  const handleBlurPress = () => {
    setSelectedTool('blur');
    setIsBlurMode(true);
  };

  const addBlurPoint = useCallback((x: number, y: number) => {
    if (lastPointRef.current) {
      const dx = lastPointRef.current.x - x;
      const dy = lastPointRef.current.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_BRUSH_DISTANCE) {
        return;
      }
    }

    lastPointRef.current = {x, y};

    const newPoint: BlurPoint = {
      id: blurPointIdRef.current,
      x,
      y,
    };

    blurPointIdRef.current += 1;

    setBlurPoints(prev => [...prev, newPoint]);
  }, []);

  const eraseBlurPoint = useCallback((x: number, y: number) => {
    setBlurPoints(prev =>
      prev.filter(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance > ERASE_RADIUS;
      }),
    );
  }, []);

  const handleDraw = useCallback(
    (x: number, y: number) => {
      if (
        x < 0 ||
        x > displayPhotoWidth ||
        y < 0 ||
        y > displayPhotoHeight
      ) {
        return;
      }

      if (selectedTool === 'blur') {
        addBlurPoint(x, y);
      } else {
        eraseBlurPoint(x, y);
      }
    },
    [
      addBlurPoint,
      eraseBlurPoint,
      selectedTool,
      displayPhotoWidth,
      displayPhotoHeight,
    ],
  );

  const panResponder = useMemo(
  () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => isBlurMode,
      onMoveShouldSetPanResponder: () => isBlurMode,

      onPanResponderGrant: event => {
        const {locationX, locationY} = event.nativeEvent;
        handleDraw(locationX, locationY);
      },

      onPanResponderMove: event => {
        const {locationX, locationY} = event.nativeEvent;
        handleDraw(locationX, locationY);
      },
    }),
  [handleDraw, isBlurMode],
);

  const handleResetBlur = () => {
      setBlurPoints([]);
      lastPointRef.current = null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050509" />

      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={handleBack}>
          <IconArrowLeft size={px(20)} />
        </TouchableOpacity>

        {/* 블러 모드일 때만 제목 노출 */}
        {isBlurMode && <Text style={styles.headerTitle}>블러</Text>}

        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={handleConfirm}>
          <Image source={checkBlueIcon} style={styles.checkIcon} />
          <Text style={styles.confirmText}>확인</Text>
        </TouchableOpacity>
      </View>

      {/* 사진 영역 */}
      <View
        style={[
          styles.photoSection,
          {justifyContent: isLandscape ? 'center' : 'flex-start'},
        ]}>
        <View
          style={[
            styles.photoWrapper,
            {
              width: displayPhotoWidth,
              height: displayPhotoHeight,
            },
          ]}>
          <View
            style={[
              styles.photoBox,
              {
                width: displayPhotoWidth,
                height: displayPhotoHeight,
              },
            ]}
            {...(isBlurMode ? panResponder.panHandlers : {})}>
            {photoSkiaImage ? (
              <Canvas ref={canvasRef} style={styles.photo}>
                <SkiaImage
                  image={photoSkiaImage}
                  x={0}
                  y={0}
                  width={displayPhotoWidth}
                  height={displayPhotoHeight}
                  fit={isLandscape ? 'contain' : 'cover'}
                />

                {blurPoints.map(point => {
                  const clipPath = Skia.Path.Make();
                  clipPath.addCircle(point.x, point.y, BRUSH_RADIUS);

                  return (
                  <Group key={point.id} clip={clipPath}>
                    <SkiaImage
                      image={photoSkiaImage}
                      x={0}
                      y={0}
                      width={displayPhotoWidth}
                      height={displayPhotoHeight}
                      fit={isLandscape ? 'contain' : 'cover'}>
                      <RuntimeShader source={mosaicRuntimeEffect} />
                    </SkiaImage>
                  </Group>
                  );
                })}
              </Canvas>
            ) : (
              <View
                style={[
                  styles.photoLoadingBox,
                  {
                    width: displayPhotoWidth,
                    height: displayPhotoHeight,
                  },
                ]}>
                <Text style={styles.photoLoadingText}>이미지 불러오는 중...</Text>
              </View>
            )}
          </View>
          
            {/*
          {showBlurToast && !isBlurMode && (
            <View style={styles.aiBubble}>
              <Text style={styles.aiBubbleText}>
                AI 기능으로 자동 블러 처리되어 있어요
              </Text>
              <View style={styles.aiBubbleTail} />
            </View>
          )}
            */}
        </View>
      </View>

      {/* 하단 툴바 */}
      {!isBlurMode ? (
        <View style={styles.toolSection}>
          <TouchableOpacity
            style={styles.toolButton}
            activeOpacity={0.8}
            onPress={handleBlurPress}>
            <Image source={mdiBlurIcon} style={styles.toolIcon} />
            <Text style={styles.toolText}>블러</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.blurToolSection}>
          <View style={styles.blurToolRow}>
            <View style={styles.leftToolGroup}>
              <TouchableOpacity
                style={
                  selectedTool === 'blur'
                    ? styles.selectedCircleButton
                    : styles.outlineCircleButton
                }
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedTool('blur');
                  setIsBlurMode(true);
                }}>
                <Image
                  source={mdiBlurIcon}
                  style={
                    selectedTool === 'blur'
                      ? styles.selectedBlurIcon
                      : styles.outlineToolIcon
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  selectedTool === 'eraser'
                    ? styles.selectedCircleButton
                    : styles.outlineCircleButton
                }
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedTool('eraser');
                  setIsBlurMode(true);
                }}>
                <Image
                  source={eraserIcon}
                  style={
                    selectedTool === 'eraser'
                      ? styles.selectedBlurIcon
                      : styles.outlineToolIcon
                  }
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.outlineCircleButton}
              activeOpacity={0.8}
              onPress={handleResetBlur}>
              <Image source={blurRefreshIcon} style={styles.outlineToolIcon} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <ReviewExitModal
        visible={exitModalVisible}
        onClose={() => setExitModalVisible(false)}
        onExit={handleExitToHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050509',
  },

  // 상단 헤더 영역
  header: {
    width: '100%',
    height: TOP_SECTION_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: px(spacing.lg),
  },
  // 왼쪽 뒤로가기 화살표 버튼
  backButton: {
    position: 'absolute',
    top: LOGO_TOP,
    left: px(spacing.lg),
    width: px(32),
    height: px(32),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 블러 모드일 때 가운데에 보이는 제목
  headerTitle: {
    position: 'absolute',
    top: LOGO_TOP + px(3),
    alignSelf: 'center',
    color: colors.text.inverse,
    fontSize: px(17),
    fontFamily: fontFamily.bold,
  },
  confirmButton: {
    position: 'absolute',
    top: LOGO_TOP,
    right: px(spacing.lg),
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(spacing.s),
  },
  checkIcon: {
    width: px(24),
    height: px(24),
    resizeMode: 'contain',
  },
  confirmText: {
    color: colors.text.inverse,
    fontSize: px(16),
    fontFamily: fontFamily.bold,
  },

  // 사진 영역: 세로는 리뷰 카메라 화면처럼 헤더 바로 아래(flex-start),
  // 가로는 높이가 짧아지므로 남은 공간에서 가운데 정렬(center)
  photoSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: TOOL_AREA_HEIGHT,
  },
  
  // 사진과 말풍선을 같이 담는 박스
  photoWrapper: {
    alignSelf: 'center',
  },

  photoBox: {
    borderRadius: px(20),
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // 사진 위에 뜨는 AI 안내 말풍선
  aiBubble: {
    position: 'absolute',
    left: px(61),
    bottom: px(-14),
    minWidth: px(207),
    height: px(28),
    paddingHorizontal: px(spacing.md),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBubbleText: {
    color: colors.text.basic,
    fontSize: px(12),
    fontFamily: fontFamily.bold,
  },
  aiBubbleTail: {
    position: 'absolute',
    bottom: px(-6),
    right: px(96),
    width: 0,
    height: 0,
    borderLeftWidth: px(8),
    borderRightWidth: px(8),
    borderTopWidth: px(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface.brand,
  },

  // 기본 모드에서 보이는 하단 도구 영역
  toolSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: px(spacing['4xl']),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(spacing.s),
  },
  // 기본 모드의 블러 아이콘
  toolIcon: {
    width: px(32),
    height: px(32),
    resizeMode: 'contain',
    tintColor: colors.icon.inverse,
  },
  // 기본 모드의 도구 텍스트
  toolText: {
    color: colors.text.inverse,
    fontSize: px(16),
    fontFamily: fontFamily.bold,
  },

  // 블러 모드에서 보이는 하단 편집 도구 영역
  blurToolSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: px(spacing['4xl']),
    alignItems: 'center',
    justifyContent: 'center',
  },

  blurToolRow: {
    width: MAX_PHOTO_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftToolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(spacing['3xl']),
  },
  // 현재 선택된 도구 버튼
  selectedCircleButton: {
    width: px(40),
    height: px(40),
    borderRadius: px(radius['2xl']),
    backgroundColor: colors.button.tertiaryFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 선택된 블러 아이콘
  selectedBlurIcon: {
    width: px(28),
    height: px(28),
    resizeMode: 'contain',
    tintColor: colors.text.basic,
  },
  // 선택되지 않은 원형 버튼
  outlineCircleButton: {
    width: px(40),
    height: px(40),
    borderRadius: px(radius['2xl']),
    borderWidth: px(1),
    borderColor: colors.border.inverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 선택되지 않은 도구 아이콘
  outlineToolIcon: {
    width: px(23),
    height: px(23),
    resizeMode: 'contain',
    tintColor: colors.icon.inverse,
  },
  // 블러 초기화 아이콘 텍스트
  resetIcon: {
    color: colors.text.inverse,
    fontSize: px(26),
    lineHeight: px(30),
    fontFamily: fontFamily.regular,
  },
  photoLoadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9EDF3',
  },

  photoLoadingText: {
    fontSize: px(14),
    color: '#6B7280',
    fontFamily: fontFamily.regular,
  },
});

