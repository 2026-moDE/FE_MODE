import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AuthStackParamList} from '../../types/navigation';
import {fontFamily, fontSize} from '../../constants/typography';
import {useAuth} from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupComplete'>;

const logoNavy = require('../../assets/image/logo_navy.png');

const SignupCompleteScreen = () => {
  const {setIsLoggedIn} = useAuth();

  const handleStart = () => {
    setIsLoggedIn(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <Image source={logoNavy} style={styles.logo} />

        <Text style={styles.title}>가입이 완료되었어요</Text>
      </View>

      <View style={styles.bottomArea}>
        <Pressable style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default SignupCompleteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120,
  },
  logo: {
    width: 94,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: 'Pretendard',
    color: '#111114',
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 25,
    paddingBottom: 34,
  },
  startButton: {
    height: 60,
    borderRadius: 11,
    backgroundColor: '#1D232C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
});