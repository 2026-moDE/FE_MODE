import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Shadow} from 'react-native-shadow-2';

import {fontFamily} from '../../constants/typography';
import {getMyReviews, MyReview, MyProfile} from '../../api/mypage';
import {CurrentReview} from '../../types/place';
import ReviewPhoto from '../placeDetail/ReviewPhoto';
import {deleteReview} from '../../api/review';

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type ReviewGroup = {
  month: string;
  reviews: MyReview[];
};

type Props = {
  profile: MyProfile | null;
};

export default function ReviewSection({profile}: Props) {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageIndex, setImageIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getMyReviews({
        limit: 20,
      });

      setReviews(data.reviews);
    } catch (error) {
      console.log('내 리뷰 목록 조회 실패:', error);
      setErrorMessage('리뷰 목록을 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  };

  // MyReview → CurrentReview 변환 (ReviewPhoto용)
  const photoReviews: CurrentReview[] = useMemo(() =>
    reviews
      .filter(r => r.image_url)
      .map(r => ({
        id: r.id,
        image_url: r.image_url!,
        congestion_level: r.congestion_level as CurrentReview['congestion_level'],
        comment: r.comment ?? '',
        helpful_count: r.helpful_count,
        is_helpful: false,
        is_mine: true,
        user: {
          id: profile?.id ?? 0,
          nickname: profile?.nickname ?? '',
          profile_image_url: profile?.profile_image_url ?? '',
        },
        created_at: r.created_at,
      })),
    [reviews, profile],
  );

  // 전체 리뷰 리스트에서의 index → photoReviews에서의 index 찾기
  const findPhotoIndex = (reviewId: number) => {
    return photoReviews.findIndex(r => r.id === reviewId);
  };

  const groupedReviews = groupReviewsByMonth(reviews);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="small" color="#2C343F" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyText}>{errorMessage}</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyText}>작성한 리뷰가 없어요</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {groupedReviews.map(group => (
        <View key={group.month} style={styles.monthBlock}>
          <Text style={styles.monthTitle}>{group.month}</Text>

          <View style={styles.reviewGrid}>
            {group.reviews.map(review => (
              <TouchableOpacity
                key={review.id}
                activeOpacity={0.85}
                onPress={() => {
                  if (!review.image_url) return;
                  const idx = findPhotoIndex(review.id);
                  if (idx >= 0) setImageIndex(idx);
                }}>
                <Shadow
                  distance={5}
                  startColor="rgba(0, 0, 0, 0.06)"
                  endColor="rgba(0, 0, 0, 0)"
                  offset={[0, 2]}
                  style={styles.reviewShadow}>
                  <View style={styles.reviewImageBox}>
                    {review.image_url ? (
                      <Image
                        source={{uri: review.image_url}}
                        style={styles.reviewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <>
                        <View style={styles.mockImageTop} />
                        <View style={styles.mockImageBottom} />
                      </>
                    )}

                    <View style={styles.dateTextBox}>
                      <Text style={styles.dateNumber}>
                        {getDay(review.created_at)}
                      </Text>
                    </View>
                  </View>
                </Shadow>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>

    {/* 리뷰 사진 풀스크린 뷰어 */}
    <ReviewPhoto
      reviews={photoReviews}
      startIndex={imageIndex ?? 0}
      visible={imageIndex !== null}
      onClose={() => setImageIndex(null)}
      onDelete={async () => {
        if (imageIndex === null) return;
        try {
          await deleteReview(photoReviews[imageIndex].id);
          setReviews(prev => prev.filter(r => r.id !== photoReviews[imageIndex].id));
          setImageIndex(null);
        } catch (error) {
          console.error('리뷰 삭제 실패:', error);
        }
      }}
      onReport={() => setImageIndex(null)}
      useAbsoluteDate
    />
    </>
  );
}

const groupReviewsByMonth = (reviews: MyReview[]): ReviewGroup[] => {
  const groupMap: Record<string, MyReview[]> = {};

  reviews.forEach(review => {
    const date = new Date(review.created_at);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}년 ${month}월`;

    if (!groupMap[key]) {
      groupMap[key] = [];
    }

    groupMap[key].push(review);
  });

  return Object.keys(groupMap).map(month => ({
    month,
    reviews: groupMap[month],
  }));
};

const getDay = (dateString: string) => {
  const date = new Date(dateString);
  return String(date.getDate());
};

const GRID_PADDING_HORIZONTAL = px(20);
const THUMB_GAP = px(8);
const THUMB_SIZE =
  (SCREEN_WIDTH - GRID_PADDING_HORIZONTAL * 2 - THUMB_GAP * 4) / 5;
const CARD_RADIUS = px(12);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: GRID_PADDING_HORIZONTAL,
    paddingTop: px(15),

    // 하단 네비게이션바가 공통으로 깔릴 거라서
    // 마지막 리뷰가 바에 가려지지 않게 여백만 줌
    paddingBottom: px(110),
  },

  monthBlock: {
    marginBottom: px(22),
  },

  monthTitle: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: '#000000',
    marginBottom: px(12),
  },

  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THUMB_GAP,
  },

  reviewShadow: {
    borderRadius: CARD_RADIUS,
  },

  reviewImageBox: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#DADADA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  reviewImage: {
    width: '100%',
    height: '100%',
  },

  mockImageTop: {
    flex: 1,
    backgroundColor: '#BFC2C5',
  },

  mockImageBottom: {
    flex: 1,
    backgroundColor: '#71805E',
  },

  dateTextBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateNumber: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: px(80),
  },

  emptyText: {
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: '#999999',
  },
});