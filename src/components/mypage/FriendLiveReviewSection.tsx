import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {formatRelativeTime} from '../../utils/date';
import {UserReview} from '../../api/user';
import ReviewChatModal from '../placeDetail/ReviewChatModal';

type FriendInfo = {
  nickname: string;
  profile_image_url: string | null;
  profile_url?: string | null;
};

type Props = {
  friend: FriendInfo;
  reviews: UserReview[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};

const SCROLL_END_THRESHOLD = 200;
const CARD_WIDTH = 320;
const CARD_GAP = spacing.md;

// 친구 상태(ACCEPTED)일 때 다른유저 마이페이지에 보여주는 실시간 리뷰 캐러셀
export default function FriendLiveReviewSection({
  friend,
  reviews,
  isLoading,
  isLoadingMore = false,
  onLoadMore,
}: Props) {
  const chatSheetRef = useRef<BottomSheetModal>(null);
  const [activeChatReviewId, setActiveChatReviewId] = useState<number | null>(null);

  const openChat = (reviewId: number) => {
    setActiveChatReviewId(reviewId);
    chatSheetRef.current?.present();
  };

  // 72시간 이내(is_recent) 리뷰만 노출 - 없으면 섹션 자체를 안 띄움
  const recentReviews = reviews.filter(review => review.is_recent);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const distanceFromEnd = contentSize.width - (layoutMeasurement.width + contentOffset.x);

    if (distanceFromEnd < SCROLL_END_THRESHOLD) {
      onLoadMore?.();
    }
  };

  if (!isLoading && recentReviews.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>친구의 실시간 리뷰</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.icon.basic} style={styles.loadingIndicator} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast">
          {recentReviews.map(review => (
            <View key={review.id} style={styles.card}>
              <View style={styles.thumbnail}>
                {review.image_url && (
                  <FastImage
                    source={{uri: review.thumbnail_small_url ?? review.thumbnail_url ?? review.image_url}}
                    style={styles.thumbnailImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                )}
              </View>

              <View style={styles.content}>
                <View style={styles.header}>
                  {friend.profile_image_url ? (
                    <FastImage
                      source={{uri: friend.profile_url ?? friend.profile_image_url}}
                      style={styles.avatar}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <View style={styles.avatar} />
                  )}
                  <Text style={styles.nickname} numberOfLines={1}>
                    {friend.nickname}
                  </Text>
                  {!!review.created_at && (
                    <Text style={styles.time}>{formatRelativeTime(review.created_at)}</Text>
                  )}
                </View>

                <Text style={styles.comment} numberOfLines={2}>
                  {review.comment}
                </Text>

                <Pressable style={styles.ctaButton} onPress={() => openChat(review.id)}>
                  <Text style={styles.ctaText}>반응 남기러 가기 →</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {isLoadingMore && (
            <View style={[styles.card, styles.loadingMoreCard]}>
              <ActivityIndicator size="small" color={colors.icon.basic} />
            </View>
          )}
        </ScrollView>
      )}

      <ReviewChatModal ref={chatSheetRef} reviewId={activeChatReviewId ?? undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },

  title: {
    ...typography.b1,
    color: colors.text.inverse,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  loadingIndicator: {
    marginTop: 8,
  },

  list: {
    paddingHorizontal: spacing.xl,
    gap: CARD_GAP,
  },

  card: {
    width: CARD_WIDTH,
    height: 161,
    flexDirection: 'row',
    backgroundColor: colors.surface.subtleDarker,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },

  loadingMoreCard: {
    width: 104,
    height: 161,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbnail: {
    width: 73,
    height: 129,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtleDarker,
    overflow: 'hidden',
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surface.muted,
  },

  nickname: {
    ...typography.b5,
    color: colors.text.inverse,
    flexShrink: 1,
    marginLeft: spacing.sm,
  },

  time: {
    ...typography.c3,
    color: colors.text.tertiary,
    marginLeft: spacing.md,
  },

  comment: {
    ...typography.c2,
    color: colors.text.inverse,
    marginTop: spacing.md,
  },

  ctaButton: {
    alignSelf: 'flex-end',
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.subtle,
  },

  ctaText: {
    ...typography.c1,
    color: colors.text.inverse,
  },
});
