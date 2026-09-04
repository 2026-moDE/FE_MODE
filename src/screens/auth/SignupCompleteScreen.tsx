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
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {useAuth} from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupComplete'>;

const logo = require('../../assets/image/logo_new.png');

const SignupCompleteScreen = () => {
  const {setIsLoggedIn} = useAuth();

  const handleStart = () => {
    setIsLoggedIn(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <Image
          source={logo}
          tintColor={colors.brand.secondary}
          style={styles.logo}
          resizeMode="contain"
        />

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
    marginBottom: 30,
  },
  title: {
    ...typography.h1,
    color: colors.gray[900],
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  startButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.button.secondaryFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    ...typography.b1,
    color: colors.text.inverse,
  },
});