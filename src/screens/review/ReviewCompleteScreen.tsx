import React from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, Image} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewComplete'>;

const completeMapIcon = require('../../assets/image/map_yellow.png');

const ReviewCompleteScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();

  const handleGoHome = () => {
    // Home 탭으로 명확히 지정 + 리뷰 작성 스택(카메라~완료) 기록을 지워야
    // 나중에 다른 탭으로 갔다가 뒤로가기를 눌러도 이 화면들이 다시 튀어나오지 않음
    navigation.getParent()?.navigate('Tab', {screen: 'Home'} as never);
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <View style={styles.container}>
        <View style={styles.centerBox}>
          <Image source={completeMapIcon} style={styles.completeIcon} />

          <Text style={styles.completeText}>후기가 등록됐어요!</Text>
        </View>

        <Pressable
          style={[
            styles.homeButton,
            {
              bottom: Math.max(insets.bottom, 14),
            },
          ]}
          onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ReviewCompleteScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  centerBox: {
    position: 'absolute',
    top: 264,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  completeIcon: {
    width: 99,
    height: 99,
    resizeMode: 'contain',
  },

  completeText: {
    marginTop: spacing.lg,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 26,
    color: '#111827',
    includeFontPadding: false,
  },

  homeButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 21,
    color: colors.text.inverse,
    includeFontPadding: false,
  },
});