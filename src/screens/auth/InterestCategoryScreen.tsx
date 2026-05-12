import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {AuthStackParamList} from '../../types/navigation';
import {fontFamily, fontSize} from '../../constants/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'InterestCategory'>;

const InterestCategoryScreen = ({navigation}: Props) => {
  const handleNext = () => {
    // 지금은 관심 카테고리 선택 없이 그냥 다음 화면으로 이동
    navigation.navigate('SignupComplete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content} />

      <View style={styles.bottomArea}>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>다음</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default InterestCategoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: 27,
    paddingBottom: 34,
  },
  nextButton: {
    height: 60,
    borderRadius: 11,
    backgroundColor: '#1D232C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
});