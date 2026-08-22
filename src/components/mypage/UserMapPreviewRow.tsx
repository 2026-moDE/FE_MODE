import React from 'react';
import {View, StyleSheet} from 'react-native';

import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {MyReview} from '../../api/mypage';
import ArchivedReviewStack from '../placeDetail/ArchivedReviewStack';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';

type Props = {
  reviews: MyReview[];
};

// 다른 유저 마이페이지용 지도/월별리뷰 프리뷰 — 탭 비활성, MyMapSection과 달리 본인 리뷰를 내부에서 따로 조회하지 않음
export default function UserMapPreviewRow({reviews}: Props) {
  const photoReviews = reviews.filter((r): r is MyReview & {image_url: string} => !!r.image_url).slice(0, 3);

  return (
    <View style={styles.row}>
      <View style={styles.mapPlaceholder}>
        <IconPlaceLocation size={28} color={colors.icon.subtle} />
      </View>

      <View style={styles.monthlyReviewCard}>
        <ArchivedReviewStack
          reviews={photoReviews}
          onPress={() => {}}
          label="월별 리뷰 확인하기"
          style={{width: '100%', height: '100%', aspectRatio: undefined, flex: undefined}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.xl,
  },

  mapPlaceholder: {
    flex: 1,
    height: 224,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthlyReviewCard: {
    flex: 1,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
});
