import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import {loginWithKakaoAccount} from '@react-native-seoul/kakao-login';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {socialLoginApi} from '../../api/auth';
import {saveTokens} from '../../storage/tokenStorage';
import {useAuth} from '../../context/AuthContext';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {getFcmToken} from '../../utils/fcm';

import type {AuthStackParamList} from '../../types/navigation';
import {colors} from '../../constants/colors';
import {gap} from '../../constants/spacing';
import KakaoLoginButton from '../../components/auth/KakaoLoginButton';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import AppleLoginButton from '../../components/auth/AppleLoginButton';
import OnboardingCarousel from '../../components/auth/OnboardingCarousel';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const {setIsLoggedIn} = useAuth();
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

  const handleAppleLogin = async () => {
    try {
      setIsLoginLoading(true);

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const {identityToken} = appleAuthRequestResponse;

      if (!identityToken) {
        throw new Error('Apple ID 토큰을 가져오지 못했습니다.');
      }

      const fcmToken = await getFcmToken();

      const result = await socialLoginApi({
        provider: 'APPLE',
        accessToken: identityToken,
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
      if (error?.code === appleAuth.Error.CANCELED) {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.dark} />

      {/* 온보딩 3장 좌우 캐러셀 (시안 온보딩-01~03) */}
      <View style={styles.carouselSection}>
        <OnboardingCarousel />
      </View>

      <View
        style={[
          styles.socialButtonGroup,
          {paddingBottom: insets.bottom + 20},
        ]}>
        <KakaoLoginButton
          onPress={handleKakaoLogin}
          disabled={isLoginLoading}
        />
        <GoogleLoginButton
          onPress={handleGoogleLogin}
          disabled={isLoginLoading}
        />
        {Platform.OS === 'ios' && (
          <AppleLoginButton
            onPress={handleAppleLogin}
            disabled={isLoginLoading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  // 시안 기준 카드 top 72 - 상태바 59 = 13
  carouselSection: {
    flex: 1,
    paddingTop: 13,
  },

  // 시안: 페이지 점과 버튼 사이 40, 좌우 24
  socialButtonGroup: {
    width: '100%',
    marginTop: 40,
    paddingHorizontal: gap['2xl'],
    gap: gap.md,
  },
});