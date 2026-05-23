import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from '../context/AuthContext';
import {LocationProvider} from '../context/LocationContext';
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
      <LocationProvider>
        <NavigationContainer>
          <Navigator />
        </NavigationContainer>
      </LocationProvider>
    </AuthProvider>
  );
}
