import React from 'react';
import {Image, StatusBar, StyleSheet, View} from 'react-native';

import {colors} from '../../constants/colors';

// 앱을 켠 직후 보이는 브랜드 화면. 네이티브 런치스크린(ios/moing/LaunchScreen.storyboard)과
// 배경색·로고·크기·위치가 모두 같아야 전환이 안 보이므로, 한 군데서만 정의하고
// RootNavigation(토큰 확인 중)과 SplashScreen(로그인 전 1.6초)이 같이 쓴다.
// 여기 값을 바꾸면 LaunchScreen.storyboard도 같이 맞춰야 한다.
export default function BrandSplash() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.dark} />

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
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // logo_new.png 원본 비율(192:120)에 맞춤
  logo: {
    width: 120,
    height: 75,
  },
});
