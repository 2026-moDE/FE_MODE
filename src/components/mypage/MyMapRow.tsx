import React from 'react';
import {View, StyleSheet} from 'react-native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {AppStackParamList} from '../../types/navigation';
import {MyReview} from '../../api/mypage';
import MyMapSection from './MyMapSection';
import ArchivedReviewStack from '../placeDetail/ArchivedReviewStack';

type Props = {
  mapRef: React.RefObject<NaverMapViewRef | null>;
  reviews: MyReview[];
  isReviewsLoading?: boolean;
};

export default function MyMapRow({mapRef, reviews, isReviewsLoading = false}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const photoReviews = reviews.filter((r): r is MyReview & {image_url: string} => !!r.image_url).slice(0, 3);

  return (
    <View style={styles.myMapRow}>
      <View style={styles.myMapCard}>
        <MyMapSection mapRef={mapRef} reviews={reviews} isLoading={isReviewsLoading} />
      </View>

      <View style={styles.monthlyReviewCard}>
        <ArchivedReviewStack
          reviews={photoReviews}
          onPress={() => navigation.navigate('MonthlyReview')}
          label="월별 리뷰 확인하기"
          style={{width: '100%', height: '100%', aspectRatio: undefined, flex: undefined}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  myMapRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.xl,
  },

  myMapCard: {
    flex: 1,
    height: 224,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  monthlyReviewCard: {
    flex: 1,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
});
