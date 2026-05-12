import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppNavigator from './AppNavigator';

function Navigator() {
  const {isLoggedIn, isLoading} = useAuth();

  if (isLoading) {
    return null;
  }

  return isLoggedIn ? <AppNavigator /> : <AuthStack />;
}

export default function RootNavigation() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
