import React, {useEffect} from 'react';
import {Image, StatusBar, StyleSheet, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AuthStackParamList} from '../../types/navigation';
import {colors} from '../../constants/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({navigation}: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.dark} />

      {/* 로그인 화면과 같은 새 로고 + 브랜드 옐로우 틴트 */}
      <Image
        source={require('../../assets/image/logo_new.png')}
        tintColor={colors.brand.primary}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 로그인 화면과 같은 단색 배경 - 그라디언트였을 때 색이 달라 화면 전환 시 이질감이 있었음
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // logo_new.png 원본 비율(192:120)에 맞춤 - 예전 로고(122:66)와 비율이 달라서 높이를 다시 잡음
  logo: {
    width: 120,
    height: 75,
  },
});
