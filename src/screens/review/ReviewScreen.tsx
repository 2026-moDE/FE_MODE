import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useNavigation, useRoute, useIsFocused} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import type {RouteProp} from '@react-navigation/native';
import {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import IconFlashOn from '../../assets/icons/IconFlashOn';
import IconFlashOff from '../../assets/icons/IconFlashOff';

type ReviewNav = NativeStackNavigationProp<ReviewStackParamList>;
type CameraPosition = 'back' | 'front';

const refreshIcon = require('../../assets/image/refresh.png');
const logoIcon = require('../../assets/image/logo.png');
const photoIcon = require('../../assets/image/photo.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

const figmaY = (value: number) => px(value);

const CAMERA_MARGIN_X = px(spacing['3xl']);
const CAMERA_WIDTH = SCREEN_WIDTH - CAMERA_MARGIN_X * 2;
const CAMERA_HEIGHT = px(585);

const TOP_SECTION_HEIGHT = figmaY(129);
const LOGO_TOP = figmaY(77);

const ZOOM_LEVELS = [
  {label: '0.5x', value: 0.5},
  {label: '1x', value: 1},
  {label: '2x', value: 2},
];

export default function ReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
  const route = useRoute<RouteProp<ReviewStackParamList, 'ReviewCamera'>>();
  // 장소 상세에서 진입 시 미리 선택된 장소 (없으면 undefined)
  const {placeId, placeName} = route.params ?? {};
  const cameraRef = useRef<Camera>(null);
  // 화면 벗어나도 카메라가 계속 켜진 채로 남아있으면 홈으로 돌아왔을 때 지도 렌더링과 리소스를
  // 다투다가 지도가 빈 화면으로 남는 문제가 있어서, 포커스 여부에 따라 꺼줘야 함
  const isFocused = useIsFocused();

  const [cameraPosition, setCameraPosition] =
    useState<CameraPosition>('back');

  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  const device = useCameraDevice(cameraPosition, {
    physicalDevices:
      cameraPosition === 'back'
        ? [
            'ultra-wide-angle-camera',
            'wide-angle-camera',
            'telephoto-camera',
          ]
        : ['wide-angle-camera'],
  });

  const {hasPermission, requestPermission} = useCameraPermission();

  useEffect(() => {
    const checkPermission = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    };

    checkPermission();
  }, [hasPermission, requestPermission]);

  const getCameraZoom = () => {
    if (!device) {
      return 1;
    }

    const minZoom = device.minZoom;
    const maxZoom = device.maxZoom;
    const neutralZoom = device.neutralZoom;

    switch (zoom) {
      case 0.5:
        return minZoom;

      case 1:
        return neutralZoom;

      case 2:
        return Math.min(neutralZoom * 2, maxZoom);

      default:
        return neutralZoom;
    }
  };

  const handleToggleFlash = () => {
    if (cameraPosition === 'front') {
      Alert.alert('알림', '전면 카메라에서는 플래시를 사용할 수 없어요.');
      return;
    }

    if (!device?.hasFlash) {
      Alert.alert('알림', '이 카메라는 플래시를 지원하지 않아요.');
      return;
    }

    setFlash(prev => (prev === 'off' ? 'on' : 'off'));
  };

  const handleCapture = async () => {
    try {
      if (!cameraRef.current) {
        return;
      }

      const photo = await cameraRef.current.takePhoto({
        flash: cameraPosition === 'back' ? flash : 'off',
      });

      const rawPhotoUri =
        Platform.OS === 'android'
          ? `file://${photo.path}`
          : photo.path;

      console.log('[촬영 원본]', {
        width: photo.width,
        height: photo.height,
        orientation: photo.orientation,
        path: photo.path,
      });

      let photoUri = rawPhotoUri;

      try {
        // 수동으로 90도/270도 돌리지 않고
        // EXIF 방향을 실제 이미지 픽셀에 반영한 새 파일 생성
        const normalized = await ImageResizer.createResizedImage(
          rawPhotoUri,
          photo.width,
          photo.height,
          'JPEG',
          100,
          0,
          undefined,
          false,
          {
            mode: 'contain',
            onlyScaleDown: true,
          },
        );

        photoUri = normalized.uri;

        console.log('[사진 정규화 완료]', {
          width: normalized.width,
          height: normalized.height,
          uri: normalized.uri,
        });
      } catch (resizeError) {
        console.log('[사진 정규화 실패]', resizeError);
      }

      navigation.navigate('ReviewPhotoConfirm', {
        photoUri,
        placeId,
        placeName,
      });
    } catch (error) {
      console.log('[사진 촬영 실패]', error);
      Alert.alert('오류', '사진 촬영에 실패했어요.');
    }
  };

  const handleSwitchCamera = () => {
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
    setFlash('off');
    setZoom(1);
  };

  const handleClose = () => {
    navigation.getParent()?.navigate('Tab' as never);
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#050509" />
        <Text style={styles.permissionText}>카메라 권한이 필요해요</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#050509" />
        <ActivityIndicator color={colors.icon.inverse} />
        <Text style={styles.loadingText}>카메라 준비 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050509" />

      <View style={styles.topSection}>
        <View style={styles.logoWrapper}>
          <Image source={logoIcon} style={styles.logo} resizeMode="contain" />
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.8}
          onPress={handleClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraSection}>
        <View style={styles.cameraBox}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused}
            photo={true}
            zoom={getCameraZoom()}
            outputOrientation="device"
          />

          <View style={styles.zoomContainer}>
            {ZOOM_LEVELS.map(item => {
              const isActive = zoom === item.value;

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.zoomButton,
                    isActive && styles.zoomButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setZoom(item.value)}>
                  <Text
                    style={[
                      styles.zoomText,
                      isActive && styles.zoomTextActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.sideIconButton}
          activeOpacity={0.8}
          onPress={handleToggleFlash}>
          {flash === 'on' ? (
            <IconFlashOn size={px(32)} />
          ) : (
            <IconFlashOff size={px(32)} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          activeOpacity={0.85}
          onPress={handleCapture}>
          <Image source={photoIcon} style={styles.captureIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideIconButton}
          activeOpacity={0.8}
          onPress={handleSwitchCamera}>
          <Image source={refreshIcon} style={styles.sideIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050509',
  },
  center: {
    flex: 1,
    backgroundColor: '#050509',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: colors.text.inverse,
    fontSize: px(16),
    fontFamily: fontFamily.regular,
  },
  loadingText: {
    marginTop: px(spacing.md),
    color: colors.text.inverse,
    fontSize: px(14),
    fontFamily: fontFamily.regular,
  },

  topSection: {
    width: '100%',
    height: TOP_SECTION_HEIGHT,
    position: 'relative',
  },
  logoWrapper: {
    position: 'absolute',
    top: LOGO_TOP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: px(60.44),
    height: px(32),
  },
  closeButton: {
    position: 'absolute',
    top: LOGO_TOP,
    right: CAMERA_MARGIN_X,
    width: px(32),
    height: px(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: colors.text.inverse,
    fontSize: px(32),
    fontFamily: fontFamily.regular,
    lineHeight: px(32),
  },

  cameraSection: {
    width: '100%',
    alignItems: 'center',
  },
  cameraBox: {
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
    borderRadius: px(20),
    overflow: 'hidden',
    backgroundColor: '#111',
  },

  zoomContainer: {
    position: 'absolute',
    bottom: px(spacing.xl),
    alignSelf: 'center',
    width: px(150),
    height: px(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoomButton: {
    width: px(40),
    height: px(40),
    borderRadius: px(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  zoomText: {
    color: colors.text.inverse,
    fontSize: px(13),
    fontFamily: fontFamily.regular,
  },
  zoomTextActive: {
    color: '#FFD400',
    fontFamily: fontFamily.bold,
  },

  bottomSection: {
    flex: 1,
    width: '100%',
    paddingHorizontal: CAMERA_MARGIN_X,
    paddingTop: px(14),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sideIconButton: {
    width: px(32),
    height: px(72),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideIcon: {
    width: px(32),
    height: px(32),
    resizeMode: 'contain',
  },
  captureButton: {
    width: px(72),
    height: px(72),
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureIcon: {
    width: px(72),
    height: px(72),
    resizeMode: 'contain',
  },
});