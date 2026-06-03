import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import {loginWithKakaoAccount} from '@react-native-seoul/kakao-login';
import {socialLoginApi} from '../../api/auth';
import {saveTokens} from '../../storage/tokenStorage';
import {useAuth} from '../../context/AuthContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AuthStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';

const kakaoLogo = require('../../assets/image/kakao_logo.png');
const logo = require('../../assets/image/logo.png');
const iphoneMockup = require('../../assets/image/iphone_mockup.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const {setIsLoggedIn} = useAuth();

  const handleKakaoLogin = async () => {
    try {
      setIsLoginLoading(true);

      console.log('[1] 카카오 로그인 시작');

      const kakaoToken = await loginWithKakaoAccount();
      console.log('[2] 카카오 토큰 획득:', kakaoToken.accessToken);

      const result = await socialLoginApi({
        provider: 'KAKAO',
        accessToken: kakaoToken.accessToken,
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

      Alert.alert(
        '로그인 실패',
        error?.message || '로그인 중 문제가 발생했습니다.',
      );
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C343F" />

      <View style={styles.topSection}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <Image
          source={iphoneMockup}
          style={styles.mockupImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>실시간으로 탐색하는 장소 정보</Text>

          <Text style={styles.description}>
            혼잡도 정보부터 장소 사진 확인까지{'\n'}모잉에서 한 번에!
          </Text>
        </View>

        <Pressable
          style={({pressed}) => [
            styles.kakaoButton,
            pressed && styles.kakaoButtonPressed,
            isLoginLoading && styles.kakaoButtonPressed,
          ]}
          onPress={handleKakaoLogin}
          disabled={isLoginLoading}>
          <View style={styles.kakaoContent}>
            <Image source={kakaoLogo} style={styles.kakaoLogo} />
            <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C343F',
  },

  topSection: {
    flex: 1,
    backgroundColor: '#2C343F',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 36,
  },

  logo: {
    width: 75,
    height: 40,
    position: 'absolute',
    top: 78,
  },

  mockupImage: {
    width: 262,
    height: 397,
    marginBottom: 0
  },

  bottomSection: {
    width: '100%',
    height: 254,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 41,
    alignItems: 'center',
  },

  textGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },

  title: {
    color: '#000000',
    fontSize: 20,
    fontFamily: fontFamily.bold,
    lineHeight: 24,
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

  kakaoButton: {
    width: '100%',
    height: 45,
    borderRadius: 6,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  kakaoButtonPressed: {
    opacity: 0.75,
  },

  kakaoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  kakaoLogo: {
    width: 18,
    height: 17,
    marginRight: 6,
    resizeMode: 'contain',
  },

  kakaoButtonText: {
    color: 'rgba(0, 0, 0, 0.85)',
    fontSize: 15,
    fontFamily: fontFamily.bold,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});