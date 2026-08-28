import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, TextInput} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {fontFamily, fontSize, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import {formatRelativeTime} from '../../utils/date';
import ReviewMenuModal from '../placeDetail/ReviewMenuModal';
import ReviewChatModal from '../placeDetail/ReviewChatModal';
import ReviewReactionsModal from './ReviewReactionsModal';
import QuickReviewButton from '../home/QuickReviewButton';
import {MyProfile, MyReview} from '../../api/mypage';
import {fetchEmojis, EmojiReaction} from '../../api/review';
import {AppStackParamList} from '../../types/navigation';

const chatIcon = require('../../assets/image/comment.png');
const emojiIcon = require('../../assets/image/emoji.png');
const menuIcon = require('../../assets/image/vertical_ellipis.png');

// 다른 유저 프로필(UserProfile)도 그대로 넘길 수 있도록 실제 사용하는 필드만 뽑아서 타입 지정
type ReviewAuthorInfo = Pick<MyProfile, 'nickname' | 'profile_image_url' | 'profile_url'>;

type Props = {
  profile: ReviewAuthorInfo | null;
  recentReviews: MyReview[];
  isReviewsLoading: boolean;
  isOwner?: boolean;
  onDeleteReview?: (reviewId: number) => void;
  onEditComment?: (reviewId: number, comment: string) => void;
  onReportReview?: (reviewId: number) => void;
};

export default function RecentReviewSection({
  profile,
  recentReviews,
  isReviewsLoading,
  isOwner = true,
  onDeleteReview,
  onEditComment,
  onReportReview,
}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const menuTargetRef = useRef<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftComments, setDraftComments] = useState<Record<number, string>>({});
  const inputRefs = useRef<Record<number, TextInput | null>>({});
  const reactionsSheetRef = useRef<BottomSheetModal>(null);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isReactionsLoading, setIsReactionsLoading] = useState(false);
  const chatSheetRef = useRef<BottomSheetModal>(null);
  const [activeChatReviewId, setActiveChatReviewId] = useState<number | null>(null);

  const openMenu = (reviewId: number) => {
    menuTargetRef.current = reviewId;
    setMenuVisible(true);
  };

  const openChat = (reviewId: number) => {
    setActiveChatReviewId(reviewId);
    chatSheetRef.current?.present();
  };

  const openReactions = async (reviewId: number) => {
    reactionsSheetRef.current?.present();
    setIsReactionsLoading(true);
    try {
      const res = await fetchEmojis(reviewId);
      setReactions(res.reactions);
    } catch (error) {
      console.log('[이모지 반응 조회 실패]', error);
      setReactions([]);
    } finally {
      setIsReactionsLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      {isReviewsLoading ? (
        <ActivityIndicator size="small" color={colors.icon.basic} style={styles.loadingIndicator} />
      ) : recentReviews.length === 0 ? (
        isOwner ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>아직 작성한 리뷰가 없어요</Text>
            <QuickReviewButton
              onPress={() => navigation.navigate('ReviewStack', {screen: 'ReviewCamera'})}
            />
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTextOther}>아직 작성한 리뷰가 없어요</Text>
          </View>
        )
      ) : (
        <View style={styles.list}>
          {recentReviews.map(review => (
            <View key={review.id} style={styles.card}>
              <View style={styles.header}>
                {profile?.profile_image_url ? (
                  <FastImage
                    source={{uri: profile.profile_url ?? profile.profile_image_url}}
                    style={styles.headerAvatar}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.headerAvatar} />
                )}

                <Text style={styles.headerNickname} numberOfLines={1}>
                  {profile?.nickname ?? '닉네임'}
                </Text>

                <Text style={styles.headerTime}>
                  {formatRelativeTime(review.created_at)}
                </Text>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerActionButton}
                    hitSlop={10}
                    onPress={() => openMenu(review.id)}>
                    <Image source={menuIcon} style={styles.headerActionIcon} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardPhoto}>
                {review.image_url ? (
                  <FastImage
                    source={{
                      uri:
                        review.thumbnail_url ??
                        review.thumbnail_small_url ??
                        review.image_url,
                    }}
                    style={styles.cardPhotoImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.cardPhotoPlaceholder} />
                )}

                {editingId === review.id ? (
                  <View style={styles.cardCommentOverlay}>
                    <TextInput
                      ref={ref => {
                        inputRefs.current[review.id] = ref;
                      }}
                      style={[styles.cardCommentText, styles.cardCommentInput]}
                      value={draftComments[review.id] ?? review.comment ?? ''}
                      onChangeText={text =>
                        setDraftComments(prev => ({...prev, [review.id]: text}))
                      }
                      multiline
                      onBlur={() => {
                        const comment = draftComments[review.id] ?? '';
                        setEditingId(null);
                        if (comment !== (review.comment ?? '')) {
                          onEditComment?.(review.id, comment);
                        }
                      }}
                    />
                  </View>
                ) : (
                  !!review.comment && (
                    <View style={styles.cardCommentOverlay} pointerEvents="none">
                      <Text style={styles.cardCommentText} numberOfLines={2}>
                        {review.comment}
                      </Text>
                    </View>
                  )
                )}
              </View>

              <View style={styles.cardFooter}>
                <IconPlaceLocation size={24} color={colors.icon.inverse} />
                <Text style={styles.cardPlaceName} numberOfLines={1}>
                  {review.place.name}
                </Text>
                <TouchableOpacity
                  hitSlop={10}
                  style={styles.cardReactionIconFirst}
                  onPress={() => openChat(review.id)}>
                  <Image source={chatIcon} style={styles.cardReactionIconImage} resizeMode="contain" />
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={10}
                  style={styles.cardReactionIconSpacing}
                  onPress={() => openReactions(review.id)}>
                  <Image source={emojiIcon} style={styles.cardReactionIconImage} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <ReviewMenuModal
        visible={menuVisible}
        isOwner={isOwner}
        onClose={() => setMenuVisible(false)}
        onDelete={() => {
          const id = menuTargetRef.current;
          if (id != null) onDeleteReview?.(id);
        }}
        onReport={() => {
          const id = menuTargetRef.current;
          if (id != null) onReportReview?.(id);
        }}
        onEdit={() => {
          const id = menuTargetRef.current;
          if (id == null) return;
          setEditingId(id);
          setTimeout(() => inputRefs.current[id]?.focus(), 50);
        }}
      />

      <ReviewReactionsModal ref={reactionsSheetRef} reactions={reactions} isLoading={isReactionsLoading} />

      {/* MyReview엔 visibility가 없어서 비밀 댓글 체크박스는 못 띄움 */}
      <ReviewChatModal ref={chatSheetRef} reviewId={activeChatReviewId ?? undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: spacing.xl,
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
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.text.inverse,
  },

  emptyTextOther: {
    ...typography.b5,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface.muted,
    marginRight: spacing.sm,
  },

  headerNickname: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.b1,
    color: colors.text.inverse,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  headerTime: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.c2,
    color: colors.text.inverse,
    marginLeft: spacing.md,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginLeft: 'auto',
  },

  headerActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerActionIcon: {
    width: 18,
    height: 18,
    tintColor: colors.icon.inverse,
  },

  list: {
    gap: spacing['2xl'],
  },

  card: {
    width: '100%',
  },

  cardPhoto: {
    width: '100%',
    height: 628,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface.subtleDarker,
  },

  cardPhotoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  cardPhotoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface.subtleDarker,
  },

  cardCommentOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  cardCommentText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.b1,
    color: colors.text.inverse,
    letterSpacing: -0.06,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },

  cardCommentInput: {
    width: '100%',
    padding: 0,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },

  cardPlaceName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.b3,
    color: colors.text.inverse,
    flexShrink: 1,
    marginLeft: spacing.xs,
    marginRight: spacing.md,
  },

  cardReactionIconImage: {
    width: 32,
    height: 32,
    tintColor: colors.icon.inverse,
  },

  cardReactionIconFirst: {
    marginLeft: 'auto',
  },

  cardReactionIconSpacing: {
    marginLeft: spacing.lg,
  },
});
