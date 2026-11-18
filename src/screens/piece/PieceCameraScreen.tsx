import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import ImageResizer from '@bam.tech/react-native-image-resizer';

import type {PieceStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconFlashOn from '../../assets/icons/IconFlashOn';
import IconFlashOff from '../../assets/icons/IconFlashOff';
import {px, PHOTO_WIDTH, PHOTO_HEIGHT} from './photoFrame';
import DashedBorder from '../../components/common/DashedBorder';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<PieceStackParamList, 'PieceCamera'>;
type CameraPosition = 'back' | 'front';

const refreshIcon = require('../../assets/image/refresh.png');

// 시안 background/bg-dark
const BACKGROUND_COLOR = colors.background.dark;

// 조각을 가운데 두도록 유도하는 가이드 박스 (시안 Rectangle 4305: 사진 안 22, 79 위치의 285x411)
const GUIDE_WIDTH = px(285);
const GUIDE_HEIGHT = px(411);
const GUIDE_TOP = px(79);
// 시안 가이드 박스 안쪽 채움 (흰색 20%, 디자인 토큰에 없는 값)
const GUIDE_FILL = 'rgba(255, 255, 255, 0.2)';

// 말풍선(bubbleChip) 박스 높이와 아래 꼬리 크기
const TOOLTIP_HEIGHT = 28;
const TOOLTIP_TAIL_WIDTH = 14;
const TOOLTIP_TAIL_HEIGHT = 12;
// 시안은 꼬리 끝이 가이드 박스에 6만큼 걸치는데, 가이드와 겹쳐 보여서
// 꼬리 끝이 가이드 박스 위로 이만큼 떨어지게 올린다
const TOOLTIP_GAP = -4;
// 꼬리는 박스와의 틈을 막으려고 1 겹쳐 그린다 (tooltipTail의 marginTop)
const TOOLTIP_TOP =
  GUIDE_TOP - TOOLTIP_GAP - (TOOLTIP_HEIGHT + TOOLTIP_TAIL_HEIGHT - 1);

// 시안 줌 컨트롤은 사진 위에서 525 내려온 곳의 100x40
const ZOOM_TOP = px(525);
// 시안 활성 줌 글자색 (ReviewScreen 줌 버튼과 같은 값, 디자인 토큰에 없음)
const ZOOM_ACTIVE_COLOR = '#FFD400';

const ZOOM_LEVELS = [
  {label: '1x', value: 1},
  {label: '2x', value: 2},
];

const PieceCameraScreen = ({navigation, route}: Props) => {
  const {reviewId, placeId, placeName} = route.params;

  const cameraRef = useRef<Camera>(null);
  // ReviewScreen과 같은 이유 - Fabric에서 레이아웃 전에 카메라가 켜지면 0x0 Surface로 뜸
  const [cameraBoxReady, setCameraBoxReady] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);

  const device = useCameraDevice(cameraPosition);
  const {hasPermission, requestPermission} = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const getCameraZoom = () => {
    if (!device) {
      return 1;
    }

    return zoom === 2
      ? Math.min(device.neutralZoom * 2, device.maxZoom)
      : device.neutralZoom;
  };

  const handleToggleFlash = () => {
    if (cameraPosition === 'front' || !device?.hasFlash) {
      Alert.alert('알림', '이 카메라에서는 플래시를 사용할 수 없어요.');
      return;
    }

    setFlash(prev => (prev === 'off' ? 'on' : 'off'));
  };

  const handleSwitchCamera = () => {
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
    setFlash('off');
    setZoom(1);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePhoto({
        flash: cameraPosition === 'back' ? flash : 'off',
      });

      const rawPhotoUri =
        Platform.OS === 'android' ? `file://${photo.path}` : photo.path;

      let photoUri = rawPhotoUri;

      try {
        // EXIF 방향을 픽셀에 굽는다. Vision도 방향을 따로 받지 않으므로
        // 여기서 정규화해두면 마스크가 돌아간 채로 나오는 걸 막을 수 있음
        const normalized = await ImageResizer.createResizedImage(
          rawPhotoUri,
          photo.width,
          photo.height,
          'JPEG',
          100,
          0,
          undefined,
          false,
          {mode: 'contain', onlyScaleDown: true},
        );

        photoUri = normalized.uri;
      } catch (resizeError) {
        console.log('[조각 사진 정규화 실패]', resizeError);
      }

      navigation.navigate('PieceDetect', {photoUri, reviewId, placeId, placeName});
    } catch (error) {
      console.log('[조각 촬영 실패]', error);
      Alert.alert('오류', '사진 촬영에 실패했어요.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_COLOR} />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.inverse} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 모으기</Text>
      </View>

      <View style={styles.cameraArea}>
        <View
          style={styles.cameraBox}
          onLayout={event => {
            const {width, height} = event.nativeEvent.layout;

            if (width > 0 && height > 0) {
              setCameraBoxReady(true);
            }
          }}>
          {hasPermission && device && cameraBoxReady ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={true}
              zoom={getCameraZoom()}
              outputOrientation="device"
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              {hasPermission ? (
                <ActivityIndicator color={colors.icon.inverse} />
              ) : (
                <Text style={styles.placeholderText}>카메라 권한이 필요해요</Text>
              )}
            </View>
          )}

          {/* 조각을 가운데 두도록 유도하는 점선 가이드 */}
          <View pointerEvents="none" style={styles.guideFrame}>
            <DashedBorder radius={radius['2xl']} color={colors.border.inverse} />
          </View>

          <View pointerEvents="none" style={styles.tooltip}>
            <View style={styles.tooltipBox}>
              <Text style={styles.tooltipText}>모을 조각을 가운데에 놓고 찍어주세요</Text>
            </View>
            <View style={styles.tooltipTail} />
          </View>

          <View style={styles.zoomRow}>
            {ZOOM_LEVELS.map(level => {
              const isActive = zoom === level.value;

              return (
                <Pressable
                  key={level.label}
                  style={[styles.zoomButton, isActive && styles.zoomButtonActive]}
                  onPress={() => setZoom(level.value)}>
                  <Text
                    style={[styles.zoomText, isActive && styles.zoomTextActive]}>
                    {level.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.sideButton}
          onPress={handleToggleFlash}
          hitSlop={10}>
          {flash === 'on' ? <IconFlashOn size={32} /> : <IconFlashOff size={32} />}
        </Pressable>

        <Pressable
          style={styles.shutterOuter}
          onPress={handleCapture}
          disabled={isCapturing}>
          <View style={styles.shutterInner} />
        </Pressable>

        <Pressable
          style={styles.sideButton}
          onPress={handleSwitchCamera}
          hitSlop={10}>
          <Image source={refreshIcon} style={styles.sideIcon} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default PieceCameraScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },

  header: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: padding.lg,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.b1,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  cameraArea: {
    flex: 1,
    marginTop: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 인식 화면 사진 박스와 같은 크기. 비율이 어긋나면 프리뷰에서 잡은 화각과
  // 결과 화각이 달라져서 (둘 다 cover로 잘린다) 반드시 같이 움직여야 함
  cameraBox: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.surface.subtleDarker,
  },

  cameraPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    ...typography.b6,
    color: colors.text.inverse,
  },

  guideFrame: {
    position: 'absolute',
    alignSelf: 'center',
    top: GUIDE_TOP,
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    borderRadius: radius['2xl'],
    backgroundColor: GUIDE_FILL,
  },

  tooltip: {
    position: 'absolute',
    top: TOOLTIP_TOP,
    alignSelf: 'center',
    alignItems: 'center',
  },

  tooltipBox: {
    height: TOOLTIP_HEIGHT,
    paddingHorizontal: padding.md,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
  },

  tooltipText: {
    ...typography.c1,
    lineHeight: 16,
    color: colors.text.basic,
    textAlign: 'center',
    includeFontPadding: false,
  },

  tooltipTail: {
    marginTop: -1, // 박스와의 서브픽셀 틈 방지
    width: 0,
    height: 0,
    borderLeftWidth: TOOLTIP_TAIL_WIDTH / 2,
    borderRightWidth: TOOLTIP_TAIL_WIDTH / 2,
    borderTopWidth: TOOLTIP_TAIL_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.brand.primary,
  },

  zoomRow: {
    position: 'absolute',
    top: ZOOM_TOP,
    alignSelf: 'center',
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoomButtonActive: {
    backgroundColor: colors.background.dimDarker,
  },

  zoomText: {
    ...typography.b6,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  zoomTextActive: {
    color: ZOOM_ACTIVE_COLOR,
  },

  controls: {
    height: 108,
    paddingHorizontal: padding['3xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sideButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  // 시안 셔터(Group 8): 지름 72 링(두께 약 4) + 지름 약 58 원
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.border.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
});
