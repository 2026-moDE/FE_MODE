import React from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {fontFamily, fontSize, lineHeight, letterSpacing} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {AppStackParamList} from '../../types/navigation';
import {MyReview} from '../../api/mypage';
import MyMapSection from './MyMapSection';
import ArchivedReviewStack from '../placeDetail/ArchivedReviewStack';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
  mapRef: React.RefObject<NaverMapViewRef | null>;
  reviews: MyReview[];
};

export default function MyMapRow({mapRef, reviews}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const photoReviews = reviews.filter((r): r is MyReview & {image_url: string} => !!r.image_url).slice(0, 3);

  return (
    <View style={styles.myMapRow}>
      <View style={styles.myMapCard}>
        <MyMapSection mapRef={mapRef} />
      </View>

      <View style={styles.monthlyReviewCard}>
        {photoReviews.length > 0 ? (
          <ArchivedReviewStack
            reviews={photoReviews}
            onPress={() => navigation.navigate('MonthlyReview')}
            label="월별 리뷰 확인하기"
            style={{width: '100%', height: '100%', aspectRatio: undefined, flex: undefined}}
          />
        ) : (
          <TouchableOpacity
            style={styles.emptyMonthlyReview}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MonthlyReview')}>
            <View style={styles.cardStackIcon}>
              <View style={[styles.cardStackLayer, styles.cardStackLayerBack]} />
              <View style={[styles.cardStackLayer, styles.cardStackLayerMid]} />
              <View style={[styles.cardStackLayer, styles.cardStackLayerFront]} />
            </View>
            <Text style={styles.monthlyReviewText}>월별 리뷰 확인하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  myMapRow: {
    flexDirection: 'row',
    marginHorizontal: px(spacing.xl),
    marginTop: px(spacing.xl),
    gap: px(spacing.xl),
  },

  myMapCard: {
    width: px(168),
    height: px(224),
    borderRadius: px(radius.lg),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  monthlyReviewCard: {
    width: px(168),
    height: px(224),
    alignItems: 'center',
    justifyContent: 'center',
      paddingTop: px(40),
  },

  emptyMonthlyReview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardStackIcon: {
    width: px(56),
    height: px(56),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: px(spacing.md),
  },

  cardStackLayer: {
    position: 'absolute',
    width: px(40),
    height: px(48),
    borderRadius: px(radius.md),
    backgroundColor: colors.gray[100],
  },

  cardStackLayerBack: {
    transform: [{rotate: '-10deg'}],
  },

  cardStackLayerMid: {
    transform: [{rotate: '6deg'}],
  },

  cardStackLayerFront: {
    backgroundColor: colors.gray[0],
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  monthlyReviewText: {
    fontFamily: fontFamily.bold,
    fontSize: px(fontSize.b5),
    lineHeight: px(lineHeight.b5),
    letterSpacing: letterSpacing.b5,
    color: colors.text.inverse,
  },
});
