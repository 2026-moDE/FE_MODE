import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {formatRelativeTime} from '../../utils/date';
import {MyReview} from '../../api/mypage';
import ReviewChatModal from '../placeDetail/ReviewChatModal';

type FriendInfo = {
  nickname: string;
  profile_image_url: string | null;
  profile_url?: string | null;
};

type Props = {
  friend: FriendInfo;
  reviews: MyReview[];
  isLoading: boolean;
};

// 친구 상태(ACCEPTED)일 때 다른유저 마이페이지에 보여주는 실시간 리뷰 캐러셀
export default function FriendLiveReviewSection({friend, reviews, isLoading}: Props) {
  const chatSheetRef = useRef<BottomSheetModal>(null);
  const [activeChatReviewId, setActiveChatReviewId] = useState<number | null>(null);

  const openChat = (reviewId: number) => {
    setActiveChatReviewId(reviewId);
    chatSheetRef.current?.present();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>친구의 실시간 리뷰</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.icon.basic} style={styles.loadingIndicator} />
      ) : reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>아직 작성한 리뷰가 없어요</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}>
          {reviews.map(review => (
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
                  <Text style={styles.time}>{formatRelativeTime(review.created_at)}</Text>
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
    ...typography.h4,
    color: colors.text.inverse,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  loadingIndicator: {
    marginTop: 8,
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 160,
    gap: spacing.md,
  },

  emptyText: {
    ...typography.b5,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  card: {
    width: 320,
    flexDirection: 'row',
    backgroundColor: colors.surface.default,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  thumbnail: {
    width: 104,
    height: 104,
    backgroundColor: colors.surface.subtleDarker,
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  avatar: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.surface.muted,
  },

  nickname: {
    ...typography.c1,
    color: colors.text.inverse,
    flexShrink: 1,
  },

  time: {
    ...typography.c2,
    color: colors.text.tertiary,
    marginLeft: 'auto',
  },

  comment: {
    ...typography.c1,
    color: colors.text.inverse,
  },

  ctaButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtleDarker,
  },

  ctaText: {
    ...typography.c2,
    color: colors.text.inverse,
  },
});
