import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {loginWithKakaoAccount} from '@react-native-seoul/kakao-login';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {socialLoginApi} from '../../api/auth';
import {saveTokens} from '../../storage/tokenStorage';
import {useAuth} from '../../context/AuthContext';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {getFcmToken} from '../../utils/fcm';

import type {AuthStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';
import KakaoLoginButton from '../../components/auth/KakaoLoginButton';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import AppleLoginButton from '../../components/auth/AppleLoginButton';

const logo = require('../../assets/image/logo.png');
const iphoneMockup = require('../../assets/image/iphone_mockup.png');

// 디자인(Figma) 기준 프레임 너비. 목업 이미지·로고 위치를 이 값 대비 비율로 환산해
// 기기 화면 너비가 달라져도 디자인과 동일한 비율로 보이게 한다.
const DESIGN_WIDTH = 393;
const LOGO_TOP = 78;
const LOGO_WIDTH = 75;
const LOGO_HEIGHT = 40;
const LOGO_MOCKUP_GAP = 43;
const MOCKUP_WIDTH = 262;
const MOCKUP_HEIGHT = 397;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const {setIsLoggedIn} = useAuth();
  const {width: windowWidth} = useWindowDimensions();
  const scale = windowWidth / DESIGN_WIDTH;
  const insets = useSafeAreaInsets();

  const handleKakaoLogin = async () => {
    try {
      setIsLoginLoading(true);

      console.log('[1] 카카오 로그인 시작');

      const kakaoToken = await loginWithKakaoAccount();
      console.log('[2] 카카오 토큰 획득:', kakaoToken.accessToken);

      const fcmToken = await getFcmToken();

      const result = await socialLoginApi({
        provider: 'KAKAO',
        accessToken: kakaoToken.accessToken,
        fcmToken,
      });

      console.log('[3] 백엔드 응답:', JSON.stringify(result));

      if (!result.success || !result.data) {
        throw new Error(result.message || '로그인 응답이 올바르지 않습니다.');
      }

      const {access_token, refresh_token, is_new_user, user} = result.data;

      await saveTokens(access_token, refresh_token);

      console.log('[4] 토큰 저장 완료');
      console.log('[5] 신규 유저 여부:', is_new_user);
      console.log('[6] 유저 정보:', user);

      if (is_new_user) {
        navigation.navigate('Terms');
        return;
      }

      setIsLoggedIn(true);
    } catch (error: any) {
      console.log('[ERROR] message:', error?.message);
      console.log('[ERROR] status:', error?.response?.status);
      console.log('[ERROR] data:', JSON.stringify(error?.response?.data));

      Alert.alert(
        '로그인 실패',
        error?.message || '로그인 중 문제가 발생했습니다.',
      );
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoginLoading(true);

      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // 사용자가 로그인을 취소한 경우 별도 안내 없이 종료
        return;
      }

      // 백엔드 access_token 필드에는 Google의 idToken을 담아 전달함(백엔드 스펙 확인 완료).
      const idToken = response.data.idToken;

      if (!idToken) {
        throw new Error('Google ID 토큰을 가져오지 못했습니다.');
      }

      const fcmToken = await getFcmToken();

      const result = await socialLoginApi({
        provider: 'GOOGLE',
        accessToken: idToken,
        fcmToken,
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || '로그인 응답이 올바르지 않습니다.');
      }

      const {access_token, refresh_token, is_new_user, user} = result.data;

      await saveTokens(access_token, refresh_token);

      if (is_new_user) {
        navigation.navigate('Terms');
        return;
      }

      setIsLoggedIn(true);
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
        return;
      }

      console.log('[ERROR] message:', error?.message);
      console.log('[ERROR] status:', error?.response?.status);
      console.log('[ERROR] data:', JSON.stringify(error?.response?.data));

      Alert.alert(
        '로그인 실패',
        error?.message || '로그인 중 문제가 발생했습니다.',
      );
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleAppleLogin = () => {
    // TODO: 애플 로그인 SDK 연동
    Alert.alert('안내', 'Apple 로그인은 준비 중입니다.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2C343F" />

      <View style={styles.backgroundLayer} pointerEvents="none">
        <Image
          source={logo}
          style={{
            width: LOGO_WIDTH * scale,
            height: LOGO_HEIGHT * scale,
            marginTop: LOGO_TOP * scale,
          }}
          resizeMode="contain"
        />

        <Image
          source={iphoneMockup}
          style={{
            width: MOCKUP_WIDTH * scale,
            height: MOCKUP_HEIGHT * scale,
            marginTop: LOGO_MOCKUP_GAP * scale,
          }}
          resizeMode="contain"
        />
      </View>

      <View
        style={[
          styles.bottomSection,
          {paddingBottom: insets.bottom + 16},
        ]}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>실시간으로 탐색하는 장소 정보</Text>

          <Text style={styles.description}>
            혼잡도 정보부터 장소 사진 확인까지{'\n'}모잉에서 한 번에!
          </Text>
        </View>

        <View style={styles.socialButtonGroup}>
          <KakaoLoginButton
            onPress={handleKakaoLogin}
            disabled={isLoginLoading}
            scale={scale}
          />
          <GoogleLoginButton
            onPress={handleGoogleLogin}
            disabled={isLoginLoading}
            style={{marginTop: 5 * scale}}
            scale={scale}
          />
          <AppleLoginButton
            onPress={handleAppleLogin}
            style={{marginTop: 5 * scale}}
            scale={scale}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C343F',
    justifyContent: 'flex-end',
  },

  // 로고·목업 이미지는 화면 상단 기준 절대 위치로 고정한다.
  // bottomSection의 높이(버튼 개수)가 늘어나도 이미지 위치가 밀리지 않도록 하기 위함.
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },

  bottomSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 30,
    alignItems: 'center',
  },

  textGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    color: '#000000',
    fontSize: 20,
    fontFamily: fontFamily.bold,
    lineHeight: 24,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },

  description: {
    color: '#000000',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    textAlign: 'center',
  },

  socialButtonGroup: {
    width: '100%',
  },
});