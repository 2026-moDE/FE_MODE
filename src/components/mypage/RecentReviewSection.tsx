import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator, TextInput} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import {formatRelativeTime} from '../../utils/date';
import ReviewMenuModal from '../placeDetail/ReviewMenuModal';
import ReviewReactionsModal from './ReviewReactionsModal';
import {MyProfile, MyReview} from '../../api/mypage';
import {fetchEmojis, EmojiReaction} from '../../api/review';

const chatIcon = require('../../assets/image/comment.png');
const emojiIcon = require('../../assets/image/emoji.png');
const menuIcon = require('../../assets/image/vertical_ellipis.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
  profile: MyProfile | null;
  recentReviews: MyReview[];
  isReviewsLoading: boolean;
  onDeleteReview: (reviewId: number) => void;
  onEditComment: (reviewId: number, comment: string) => void;
};

export default function RecentReviewSection({
  profile,
  recentReviews,
  isReviewsLoading,
  onDeleteReview,
  onEditComment,
}: Props) {
  const menuTargetRef = useRef<number | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftComments, setDraftComments] = useState<Record<number, string>>({});
  const inputRefs = useRef<Record<number, TextInput | null>>({});
  const reactionsSheetRef = useRef<BottomSheetModal>(null);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isReactionsLoading, setIsReactionsLoading] = useState(false);

  const openMenu = (reviewId: number) => {
    menuTargetRef.current = reviewId;
    setMenuVisible(true);
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
        <Text style={styles.emptyText}>작성한 리뷰가 없어요</Text>
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
                          onEditComment(review.id, comment);
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
                <IconPlaceLocation size={px(24)} color={colors.icon.inverse} />
                <Text style={styles.cardPlaceName} numberOfLines={1}>
                  {review.place.name}
                </Text>
                <Image
                  source={chatIcon}
                  style={[styles.cardReactionIcon, styles.cardReactionIconFirst]}
                  resizeMode="contain"
                />
                <TouchableOpacity hitSlop={10} onPress={() => openReactions(review.id)}>
                  <Image source={emojiIcon} style={styles.cardReactionIcon} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <ReviewMenuModal
        visible={menuVisible}
        isOwner
        onClose={() => setMenuVisible(false)}
        onDelete={() => {
          const id = menuTargetRef.current;
          if (id != null) onDeleteReview(id);
        }}
        onReport={() => {}}
        onEdit={() => {
          const id = menuTargetRef.current;
          if (id == null) return;
          setEditingId(id);
          setTimeout(() => inputRefs.current[id]?.focus(), 50);
        }}
      />

      <ReviewReactionsModal ref={reactionsSheetRef} reactions={reactions} isLoading={isReactionsLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: px(24),
    paddingHorizontal: px(spacing.xl),
  },

  loadingIndicator: {
    marginTop: px(8),
  },

  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    color: colors.text.disabled,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: px(12),
  },

  headerAvatar: {
    width: px(32),
    height: px(32),
    borderRadius: px(radius.full),
    backgroundColor: colors.surface.muted,
    marginRight: px(spacing.sm),
  },

  headerNickname: {
    fontFamily: fontFamily.bold,
    fontSize: px(fontSize.b1),
    color: colors.text.inverse,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  headerTime: {
    fontFamily: fontFamily.medium,
    fontSize: px(fontSize.c2),
    color: colors.text.inverse,
    marginLeft: px(spacing.md),
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(spacing.lg),
    marginLeft: 'auto',
  },

  headerActionButton: {
    width: px(24),
    height: px(24),
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerActionIcon: {
    width: px(18),
    height: px(18),
    tintColor: colors.icon.inverse,
  },

  list: {
    gap: px(spacing['2xl']),
  },

  card: {
    width: '100%',
  },

  cardPhoto: {
    width: '100%',
    height: px(628),
    borderRadius: px(radius.xl),
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
    paddingHorizontal: px(spacing.lg),
  },

  cardCommentText: {
    fontFamily: fontFamily.bold,
    fontSize: px(fontSize.b1),
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
    paddingTop: px(spacing.lg),
  },

  cardPlaceName: {
    fontFamily: fontFamily.bold,
    fontSize: px(fontSize.b3),
    color: colors.text.inverse,
    flexShrink: 1,
    marginLeft: px(spacing.xs),
    marginRight: px(spacing.md),
  },

  cardReactionIcon: {
    width: px(32),
    height: px(32),
    tintColor: colors.icon.inverse,
    marginLeft: px(spacing.lg),
  },

  cardReactionIconFirst: {
    marginLeft: 'auto',
  },
});
