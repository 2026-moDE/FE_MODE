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
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';

type ReviewNav = NativeStackNavigationProp<ReviewStackParamList>;

const flashIcon = require('../../assets/image/flash.png');
const refreshIcon = require('../../assets/image/refresh.png');
const logoIcon = require('../../assets/image/logo.png');
const photoIcon = require('../../assets/image/photo.png');

const DESIGN_WIDTH = 393;

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

const figmaY = (value: number) => Math.max(0, px(value - STATUS_BAR_HEIGHT));

const CAMERA_MARGIN_X = px(32);
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

  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>(
    'back',
  );
  const device = useCameraDevice(cameraPosition);

  const cameraRef = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  useEffect(() => {
    const getPermission = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    };

    getPermission();
  }, []);

  const getCameraZoom = () => {
    if (!device) {
      return 1;
    }

    const minZoom = device.minZoom ?? 1;
    const maxZoom = device.maxZoom ?? 1;
    const neutralZoom = device.neutralZoom ?? 1;

    if (zoom === 0.5) {
      return minZoom;
    }

    if (zoom === 1) {
      return Math.min(Math.max(neutralZoom, minZoom), maxZoom);
    }

    return Math.min(Math.max(neutralZoom * 2, minZoom), maxZoom);
  };

  const handleCapture = async () => {
    try {
      if (!cameraRef.current) {
        return;
      }

      const photo = await cameraRef.current.takePhoto({
        flash: cameraPosition === 'back' ? flash : 'off',
      });

      const photoUri =
        Platform.OS === 'android' ? `file://${photo.path}` : photo.path;

      navigation.navigate('ReviewPhotoConfirm', {
        photoUri,
      });
    } catch (e) {
      console.log('사진 촬영 실패:', e);
      Alert.alert('오류', '사진 촬영에 실패했어요.');
    }
  };

  const handleSwitchCamera = () => {
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
    setFlash('off');
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
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050509" />

      {/* 상단 영역 */}
      <View style={styles.topSection}>
        <View style={styles.logoWrapper}>
          <Image source={logoIcon} style={styles.logo} resizeMode="contain" />
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* 카메라 프리뷰 */}
      <View style={styles.cameraSection}>
        <View style={styles.cameraBox}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            zoom={getCameraZoom()}
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

      {/* 하단 버튼 영역 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.sideIconButton}
          activeOpacity={0.8}
          onPress={() => setFlash(prev => (prev === 'off' ? 'on' : 'off'))}>
          <Image source={flashIcon} style={styles.sideIcon} />
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
    color: '#fff',
    fontSize: px(16),
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
    color: '#fff',
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
    bottom: px(20),
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
    color: '#FFFFFF',
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