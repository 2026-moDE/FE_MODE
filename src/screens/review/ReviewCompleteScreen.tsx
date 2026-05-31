import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import {fontFamily} from '../../constants/typography';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewComplete'>;

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const completeMapIcon = require('../../assets/image/map.png');

const ReviewCompleteScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();

  const handleGoHome = () => {
    navigation.getParent()?.navigate('Tab' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  centerBox: {
    position: 'absolute',
    top: px(264),
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  completeIcon: {
    width: px(99),
    height: px(99),
    resizeMode: 'contain',
  },

  completeText: {
    marginTop: px(16),
    fontFamily: fontFamily.bold,
    fontSize: px(22),
    lineHeight: px(26),
    color: '#111827',
    includeFontPadding: false,
  },

  homeButton: {
    position: 'absolute',
    left: px(16),
    right: px(16),
    height: px(52),
    borderRadius: px(8),
    backgroundColor: '#2C343F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(21),
    color: '#FFFFFF',
    includeFontPadding: false,
  },
});