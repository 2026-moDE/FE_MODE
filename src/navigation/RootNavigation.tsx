import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '../context/AuthContext';
import {LocationProvider} from '../context/LocationContext';
import BrandSplash from '../components/common/BrandSplash';
import AuthStack from './AuthStack';
import AppNavigator from './AppNavigator';

function Navigator() {
  const {isLoggedIn, isLoading} = useAuth();

  // 로그인 토큰 확인 중. 스피너를 돌리면 네이티브 런치스크린 → 여기 → 스플래시로 넘어가며
  // 그림이 한 번 끊기므로, 런치스크린과 똑같은 브랜드 화면을 그대로 이어서 보여준다
  // (AsyncStorage 한 번 읽는 거라 수십 ms면 끝나서 로딩 표시가 따로 필요하지도 않다)
  if (isLoading) {
    return <BrandSplash />;
  }

  return isLoggedIn ? <AppNavigator /> : <AuthStack />;
}

export default function RootNavigation() {
  return (
    <AuthProvider>
      <LocationProvider>
        <NavigationContainer>
          <Navigator />
        </NavigationContainer>
      </LocationProvider>
    </AuthProvider>
  );
}
