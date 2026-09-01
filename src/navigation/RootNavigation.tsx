import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '../context/AuthContext';
import {LocationProvider} from '../context/LocationContext';
import AuthStack from './AuthStack';
import AppNavigator from './AppNavigator';

function Navigator() {
  const {isLoggedIn, isLoading} = useAuth();

  // 로그인 토큰 확인 중 - 빈 화면(흰 배경) 대신 로딩 표시
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return isLoggedIn ? <AppNavigator /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

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
