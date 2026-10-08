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
import {PHOTO_WIDTH, PHOTO_HEIGHT} from './photoFrame';
import DashedBorder from '../../components/common/DashedBorder';
import {typography, fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<PieceStackParamList, 'PieceCamera'>;
type CameraPosition = 'back' | 'front';

const refreshIcon = require('../../assets/image/refresh.png');

// 시안 background/bg-dark
const BACKGROUND_COLOR = colors.background.dark;

// 조각은 가운데 영역을 기준으로 고르므로(네이티브 MoingDominantInstanceLabel),
// 가이드 프레임도 그 중앙 50%와 대략 맞춰 둔다
const GUIDE_WIDTH_RATIO = 0.62;
const GUIDE_HEIGHT_RATIO = 0.56;

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
            <DashedBorder radius={radius.md} color={colors.border.inverse} />
          </View>

          <View pointerEvents="none" style={styles.tooltip}>
            <Text style={styles.tooltipText}>모을 조각을 가운데 놓고 찍어주세요</Text>
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
          {flash === 'on' ? <IconFlashOn size={28} /> : <IconFlashOff size={28} />}
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
    borderRadius: radius.xl,
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
    top: '22%',
    width: `${GUIDE_WIDTH_RATIO * 100}%`,
    height: `${GUIDE_HEIGHT_RATIO * 100}%`,
  },

  tooltip: {
    position: 'absolute',
    top: padding.md,
    alignSelf: 'center',
    paddingHorizontal: padding.s,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
  },

  tooltipText: {
    ...typography.c2,
    fontFamily: fontFamily.medium,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  zoomRow: {
    position: 'absolute',
    bottom: padding.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: gap.md,
  },

  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoomButtonActive: {
    backgroundColor: colors.background.dimDarker,
  },

  zoomText: {
    ...typography.c2,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  zoomTextActive: {
    ...typography.c1,
    color: colors.text.brand,
    includeFontPadding: false,
  },

  controls: {
    height: 108,
    paddingHorizontal: padding['3xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },

  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: colors.border.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
});
