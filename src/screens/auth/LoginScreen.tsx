import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Pressable,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
  Alert,
} from 'react-native';
import {login, loginWithKakaoAccount} from '@react-native-seoul/kakao-login';
import {socialLoginApi} from '../../api/auth';
import {saveTokens} from '../../storage/tokenStorage';
import {useAuth} from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../../types/navigation';
import {fontFamily, fontSize} from '../../constants/typography';

const kakaoLogo = require('../../assets/image/kakao_logo.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const slides = [
  {
    id: '1',
    title: '메인텍스트',
    description: '설명 서브텍스트',
  },
  {
    id: '2',
    title: '메인텍스트',
    description: '설명 서브텍스트',
  },
  {
    id: '3',
    title: '메인텍스트',
    description: '설명 서브텍스트',
  },
  {
    id: '4',
    title: '메인텍스트',
    description: '설명 서브텍스트',
  },
];

export default function LoginScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const {setIsLoggedIn} = useAuth();

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <FlatList
          data={slides}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.imageArea} />

              <View style={styles.contentArea}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.dots}>
                  {slides.map((_, index) =>
                    currentIndex === index ? (
                      <View key={index} style={styles.activeDot} />
                    ) : (
                      <View key={index} style={styles.dot} />
                    ),
                  )}
                </View>
              </View>
            </View>
          )}
        />

  <Pressable
  style={({ pressed }) => [
    styles.kakaoButton,
    pressed && styles.kakaoButtonPressed,
    isLoginLoading && styles.kakaoButtonPressed,
  ]}
  onPress={handleKakaoLogin}
  disabled={isLoginLoading}>
  <View style={styles.kakaoContent}>
    <Image source={kakaoLogo} style={styles.kakaoLogo} />
    <Text style={styles.kakaoButtonText}>카카오 로그인 </Text>
  </View>
</Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  slide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  imageArea: {
    height: 582,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },

  contentArea: {
    alignItems: 'center',
  },

  title: {
    color: '#000000',
    fontSize: 20,
    fontFamily: 'Pretendard',
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },

  description: {
    marginTop: 4,
    color: '#000000',
    fontSize: 14,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
  },

  dots: {
    marginTop: 32,
    height: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8D99AE',
    marginHorizontal: 2,
  },

  activeDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C343F',
    marginHorizontal: 2,
  },

  kakaoButton: {
  position: 'absolute',
  left: 30,
  right: 30,
  bottom: 54,
  height: 45,
  borderRadius: 6,
  backgroundColor: '#FEE500',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 14,
},
kakaoContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},


  kakaoButtonPressed: {
    opacity: 0.75,
  },

  kakaoLogo: {
  width: 18,
  height: 16.8,
  marginRight: 6,
  resizeMode: 'contain',
},


  kakaoButtonText: {
  color: 'rgba(0, 0, 0, 0.85)',
  fontSize: 15,
  fontFamily: 'Pretendard',
  fontWeight: '600',
  lineHeight: 22.5,
  includeFontPadding: false,
  textAlignVertical: 'center',
},
});