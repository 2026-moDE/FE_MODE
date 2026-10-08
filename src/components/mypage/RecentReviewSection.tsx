import React, {useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
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
import IconFriend from '../../assets/icons/IconFriend';
import {formatRelativeTime} from '../../utils/date';
import ReviewMenuModal from '../placeDetail/ReviewMenuModal';
import ReviewChatModal from '../placeDetail/ReviewChatModal';
import ReviewReactionsModal from './ReviewReactionsModal';
import {ReviewPhotoEmojiPicker, type PickerAnchor} from '../placeDetail/ReviewPhotoReactions';
import ProfileAvatar from '../common/ProfileAvatar';
import QuickReviewButton from '../home/QuickReviewButton';
import {MyProfile, MyReview} from '../../api/mypage';
import {UserReview} from '../../api/user';
import {fetchEmojis, addEmoji, removeEmoji, EmojiReaction} from '../../api/review';
import {AppStackParamList} from '../../types/navigation';

const chatIcon = require('../../assets/image/placeDeail_comment.png'); // 파일명에 오타 있음(Detail -> Deail)
const emojiIcon = require('../../assets/image/placeDetail_emoji.png');       // 타인 리뷰 - 반응 남기기
const emojiIconFill = require('../../assets/image/placeDetail_emojiFill.png'); // 본인 리뷰 - 반응 조회
const menuIcon = require('../../assets/image/vertical_ellipis.png');

// 다른 유저 프로필(UserProfile)도 그대로 넘길 수 있도록 실제 사용하는 필드만 뽑아서 타입 지정
type ReviewAuthorInfo = Pick<MyProfile, 'nickname' | 'profile_image_url' | 'profile_url'>;

type ReviewItem = MyReview | UserReview;

type Props = {
  profile: ReviewAuthorInfo | null;
  recentReviews: ReviewItem[];
  isReviewsLoading: boolean;
  isLoadingMore?: boolean;
  isOwner?: boolean;
  // 친구 마이페이지 피드에서만 시간 옆에 친구 공개 뱃지(별)를 보여줌
  showFriendBadge?: boolean;
  // 친구 아닌 다른 유저 마이페이지에서는 작성 시간 자체를 노출하지 않음
  showTime?: boolean;
  onDeleteReview?: (reviewId: number) => void;
  onEditComment?: (reviewId: number, comment: string) => void;
  onReportReview?: (reviewId: number) => void;
};

// 스크롤하면서 이모지 피커 위치(anchor)가 카드와 어긋나는 걸 막기 위해, 부모의 onScroll에서
// closeEmojiPicker()를 호출해 피커를 닫을 수 있게 ref로 노출
export type RecentReviewSectionRef = {
  closeEmojiPicker: () => void;
};

const RecentReviewSection = React.forwardRef<RecentReviewSectionRef, Props>(function RecentReviewSection({
  profile,
  recentReviews,
  isReviewsLoading,
  isLoadingMore = false,
  isOwner = true,
  showFriendBadge = false,
  showTime = true,
  onDeleteReview,
  onEditComment,
  onReportReview,
}: Props, ref) {
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

  // 남의 리뷰(!isOwner)에서 내가 남긴 반응 - null이면 확인 결과 반응 없음, undefined면 아직 서버에서 확인 안 함(이모지 버튼 눌렀을 때 지연 조회)
  const [myEmojiByReview, setMyEmojiByReview] = useState<Record<number, string | null>>({});
  const myEmojiByReviewRef = useRef<Record<number, string | null>>({});
  const [pickerReviewId, setPickerReviewId] = useState<number | null>(null);

  // 이미 조회를 걸어둔 리뷰 - 목록이 다시 그려져도 같은 리뷰를 중복 조회하지 않게 함
  const prefetchedEmojiIdsRef = useRef<Set<number>>(new Set());

  // 남의 피드를 열면 카드에 내 반응이 바로 보여야 해서, 목록에 있는 리뷰들의 내 반응을 미리 조회함
  // (리뷰 목록 API에 내 반응 정보가 없어서 리뷰마다 따로 조회해야 함)
  useEffect(() => {
    if (isOwner) return;

    const targets = recentReviews
      .map(r => r.id)
      .filter(id => !prefetchedEmojiIdsRef.current.has(id));
    if (targets.length === 0) return;

    targets.forEach(id => prefetchedEmojiIdsRef.current.add(id));

    let cancelled = false;
    Promise.all(
      targets.map(id =>
        fetchEmojis(id)
          .then(res => ({id, emoji: res.reactions.find(r => r.is_mine)?.emoji ?? null}))
          .catch(() => ({id, emoji: null})),
      ),
    ).then(results => {
      if (cancelled) return;
      const next = {...myEmojiByReviewRef.current};
      let changed = false;
      results.forEach(({id, emoji}) => {
        // 조회하는 사이에 사용자가 직접 남기거나 취소했으면 그쪽이 최신이므로 덮어쓰지 않음
        if (next[id] === undefined) {
          next[id] = emoji;
          changed = true;
        }
      });
      if (!changed) return;
      myEmojiByReviewRef.current = next;
      setMyEmojiByReview(next);
    });

    return () => {
      cancelled = true;
    };
  }, [recentReviews, isOwner]);

  // 카드 하나하나가 최신 콜백을 계속 참조하면서도 의존성 없이(=항상 같은 함수 참조로) 넘어가게 하기 위한 ref
  const onEditCommentRef = useRef(onEditComment);
  useEffect(() => {
    onEditCommentRef.current = onEditComment;
  });

  const openMenu = useCallback((reviewId: number) => {
    menuTargetRef.current = reviewId;
    setMenuVisible(true);
  }, []);

  const openChat = useCallback((reviewId: number) => {
    setActiveChatReviewId(reviewId);
    chatSheetRef.current?.present();
  }, []);

  const openReactions = useCallback(async (reviewId: number) => {
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
  }, []);

  // 서버 저장이 실패했는데 화면만 바뀐 채로 두면, 다음에 다시 볼 때 반응이 사라진 것처럼 보임 - 원래 값으로 되돌림
  const rollbackEmoji = useCallback((reviewId: number, prevEmoji: string | null) => {
    myEmojiByReviewRef.current = {...myEmojiByReviewRef.current, [reviewId]: prevEmoji};
    setMyEmojiByReview(myEmojiByReviewRef.current);
  }, []);

  // 남의 리뷰 이모지 버튼: 처음 누를 때만 내 반응 여부를 조회해서 캐싱, 이미 반응했으면 취소 / 아니면 피커 열기
  const handlePressEmojiButton = useCallback(async (reviewId: number) => {
    let mine = myEmojiByReviewRef.current[reviewId];
    if (mine === undefined) {
      try {
        const res = await fetchEmojis(reviewId);
        mine = res.reactions.find(r => r.is_mine)?.emoji ?? null;
      } catch (error) {
        console.log('[내 이모지 반응 조회 실패]', error);
        mine = null;
      }
      myEmojiByReviewRef.current = {...myEmojiByReviewRef.current, [reviewId]: mine};
      setMyEmojiByReview(myEmojiByReviewRef.current);
    }

    // 사진 뷰어와 동일하게, 이미 반응이 있어도 바로 취소하지 않고 피커를 엶
    // (피커 안에서 다른 이모지를 누르면 변경, 같은 걸 누르면 취소)
    setPickerReviewId(reviewId);
  }, []);

  // 취소는 서버가 지워준 걸 확인한 뒤에만 화면에서 지움 - 실패하면 반응을 그대로 둠
  const handleCancelEmoji = useCallback(async (reviewId: number): Promise<boolean> => {
    const mine = myEmojiByReviewRef.current[reviewId];
    if (!mine) return false;

    try {
      await removeEmoji(reviewId, mine);
    } catch (err: any) {
      console.log('[이모지 삭제 실패]', err?.message);
      return false; // 피커가 이모지를 원래대로 되돌림
    }

    myEmojiByReviewRef.current = {...myEmojiByReviewRef.current, [reviewId]: null};
    setMyEmojiByReview(myEmojiByReviewRef.current);
    return true;
  }, []);

  const onPressEmojiButton = useCallback((reviewId: number) => {
    if (isOwner) {
      openReactions(reviewId);
    } else {
      handlePressEmojiButton(reviewId);
    }
  }, [isOwner, openReactions, handlePressEmojiButton]);

  // 이미 남긴 반응이 있으면 그걸 지우고 새 걸로 교체
  const handleSelectEmoji = useCallback(async (reviewId: number, emoji: string) => {
    const prevEmoji = myEmojiByReviewRef.current[reviewId] ?? null;
    if (prevEmoji === emoji) return; // 같은 이모지는 취소 경로에서 처리

    myEmojiByReviewRef.current = {...myEmojiByReviewRef.current, [reviewId]: emoji};
    setMyEmojiByReview(myEmojiByReviewRef.current);
    setPickerReviewId(null);

    try {
      // 반응은 리뷰당 하나라, 바꿀 때는 기존 걸 먼저 지워야 두 개로 남지 않음
      if (prevEmoji) await removeEmoji(reviewId, prevEmoji);
      await addEmoji(reviewId, emoji);
    } catch (err: any) {
      console.log('[이모지 반영 실패]', err?.message);
      rollbackEmoji(reviewId, prevEmoji);
    }
  }, [rollbackEmoji]);

  const closePicker = useCallback(() => setPickerReviewId(null), []);

  useImperativeHandle(ref, () => ({closeEmojiPicker: closePicker}), [closePicker]);

  const onChangeDraftComment = useCallback((reviewId: number, text: string) => {
    setDraftComments(prev => ({...prev, [reviewId]: text}));
  }, []);

  const onRegisterInputRef = useCallback((reviewId: number, ref: TextInput | null) => {
    inputRefs.current[reviewId] = ref;
  }, []);

  // comment/originalComment는 카드가 자기 props로 이미 들고 있는 값을 그대로 넘겨줌 - draftComments를 의존성으로 안 잡아도 되게
  const onBlurComment = useCallback((reviewId: number, comment: string, originalComment: string) => {
    setEditingId(null);
    if (comment !== originalComment) {
      onEditCommentRef.current?.(reviewId, comment);
    }
  }, []);

  const openEditor = useCallback((reviewId: number) => {
    setEditingId(reviewId);
    setTimeout(() => inputRefs.current[reviewId]?.focus(), 50);
  }, []);

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
            <ReviewFeedCard
              key={review.id}
              review={review}
              profile={profile}
              isOwner={isOwner}
              showFriendBadge={showFriendBadge}
              showTime={showTime}
              isEditing={editingId === review.id}
              draftComment={draftComments[review.id]}
              myEmoji={isOwner ? undefined : myEmojiByReview[review.id]}
              showPicker={pickerReviewId === review.id}
              onPressMenu={openMenu}
              onPressChat={openChat}
              onPressEmojiButton={onPressEmojiButton}
              onChangeDraftComment={onChangeDraftComment}
              onBlurComment={onBlurComment}
              onRegisterInputRef={onRegisterInputRef}
              onClosePicker={closePicker}
              onSelectEmoji={handleSelectEmoji}
              onCancelEmoji={handleCancelEmoji}
            />
          ))}
        </View>
      )}

      {isLoadingMore && (
        <ActivityIndicator size="small" color={colors.icon.basic} style={styles.loadingMoreIndicator} />
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
          if (id != null) openEditor(id);
        }}
      />

      <ReviewReactionsModal ref={reactionsSheetRef} reactions={reactions} isLoading={isReactionsLoading} />

      <ReviewChatModal
        ref={chatSheetRef}
        reviewId={activeChatReviewId ?? undefined}
      />
    </View>
  );
});

export default RecentReviewSection;

type ReviewFeedCardProps = {
  review: ReviewItem;
  profile: ReviewAuthorInfo | null;
  isOwner: boolean;
  showFriendBadge: boolean;
  showTime: boolean;
  isEditing: boolean;
  draftComment: string | undefined;
  myEmoji: string | null | undefined;
  showPicker: boolean;
  onPressMenu: (reviewId: number) => void;
  onPressChat: (reviewId: number) => void;
  onPressEmojiButton: (reviewId: number) => void;
  onChangeDraftComment: (reviewId: number, text: string) => void;
  onBlurComment: (reviewId: number, comment: string, originalComment: string) => void;
  onRegisterInputRef: (reviewId: number, ref: TextInput | null) => void;
  onClosePicker: () => void;
  onSelectEmoji: (reviewId: number, emoji: string) => void;
  // 취소 성공 여부를 돌려줌 - 실패하면 피커가 이모지를 원래대로 되돌림
  onCancelEmoji: (reviewId: number) => Promise<boolean>;
};

// 리스트 안 카드 하나 - React.memo로 감싸서, 이 카드와 무관한 상태(반응 목록 로딩 등)가 바뀌어도
// 다른 카드들까지 전부 리렌더링되지 않게 함 (리뷰가 많을 때 이모지/댓글 시트를 열 때 버벅이던 원인)
const ReviewFeedCard = React.memo(function ReviewFeedCard({
  review,
  profile,
  isOwner,
  showFriendBadge,
  showTime,
  isEditing,
  draftComment,
  myEmoji,
  showPicker,
  onPressMenu,
  onPressChat,
  onPressEmojiButton,
  onChangeDraftComment,
  onBlurComment,
  onRegisterInputRef,
  onClosePicker,
  onSelectEmoji,
  onCancelEmoji,
}: ReviewFeedCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const originalComment = review.comment ?? '';
  const currentDraft = draftComment ?? originalComment;
  // 피드 전체가 아니라, 그중 친구공개(FRIENDS)로 쓴 리뷰에만 친구 배지/노란 테두리 표시 (내 마이페이지·친구 마이페이지 공통)
  const isFriendOnlyPost = showFriendBadge && review.visibility === 'FRIENDS';

  // 피커는 카드 안에 그리면 카드 바깥 탭을 못 받아서 안 닫힘 - Modal로 띄우려고 사진 영역의 화면 좌표를 재둠
  const photoRef = useRef<View>(null);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | undefined>(undefined);
  useEffect(() => {
    if (!showPicker) {
      setPickerAnchor(undefined);
      return;
    }
    // 상태 변경 직후 바로 재면(특히 안드로이드) 아직 레이아웃이 안 잡혀서 0에 가까운 값이
    // 나올 때가 있어서, 한 프레임 넘긴 뒤에 측정함
    const raf = requestAnimationFrame(() => {
      photoRef.current?.measureInWindow((x, y, width, height) =>
        setPickerAnchor({x, y, width, height}),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [showPicker]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ProfileAvatar
          profileUrl={profile?.profile_url}
          profileImageUrl={profile?.profile_image_url}
          style={styles.headerAvatar}
        />

        <Text style={styles.headerNickname} numberOfLines={1}>
          {profile?.nickname ?? '닉네임'}
        </Text>

        {showTime && !!review.created_at && (
          <Text style={styles.headerTime}>
            {formatRelativeTime(review.created_at)}
          </Text>
        )}

        {isFriendOnlyPost && (
          <View style={styles.friendBadge}>
            <IconFriend size={12} color={colors.brand.primary} />
          </View>
        )}

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            hitSlop={10}
            onPress={() => onPressMenu(review.id)}>
            <Image source={menuIcon} style={styles.headerActionIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <View
        ref={photoRef}
        style={styles.cardPhoto}>
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

        {isEditing ? (
          <View style={styles.cardCommentOverlay}>
            <TextInput
              ref={ref => onRegisterInputRef(review.id, ref)}
              style={[styles.cardCommentText, styles.cardCommentInput]}
              value={currentDraft}
              onChangeText={text => onChangeDraftComment(review.id, text)}
              multiline
              onBlur={() => onBlurComment(review.id, currentDraft, originalComment)}
            />
          </View>
        ) : (
          !!review.comment && (
            <View style={styles.cardCommentOverlay} pointerEvents="none">
              <Text style={styles.cardCommentText}>{review.comment}</Text>
            </View>
          )
        )}

        {!isOwner && pickerAnchor && (
          <ReviewPhotoEmojiPicker
            visible={showPicker}
            anchor={pickerAnchor}
            onClose={onClosePicker}
            onSelect={emoji => onSelectEmoji(review.id, emoji)}
            selectedEmoji={myEmoji ?? null}
            onCancel={() => onCancelEmoji(review.id)}
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.cardPlaceRow}
          onPress={() =>
            navigation.navigate('PlaceDetail', {
              placeId: review.place.id,
              placeName: review.place.name,
            })
          }>
          <IconPlaceLocation size={24} color={colors.icon.inverse} />
          <Text style={styles.cardPlaceName} numberOfLines={1}>
            {review.place.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={10}
          style={[styles.cardReactionBtn, styles.cardReactionIconFirst]}
          onPress={() => onPressChat(review.id)}>
          <Image source={chatIcon} style={styles.cardReactionIconImage} resizeMode="contain" />
          <Text style={styles.cardReactionLabel}>댓글 {review.comment_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={10}
          style={[styles.cardReactionBtn, styles.cardReactionIconSpacing]}
          onPress={() => onPressEmojiButton(review.id)}>
          {!isOwner && myEmoji ? (
            <Text style={styles.selectedEmojiText}>{myEmoji}</Text>
          ) : (
            <>
              <Image
                source={isOwner ? emojiIconFill : emojiIcon}
                style={styles.cardReactionIconImage}
                resizeMode="contain"
              />
              <Text style={styles.cardReactionLabel}>{isOwner ? '반응 조회' : '반응 남기기'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: spacing.xl,
  },

  loadingIndicator: {
    marginTop: 8,
  },

  loadingMoreIndicator: {
    marginTop: spacing['2xl'],
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
    ...typography.c2,
    color: colors.text.inverse,
    marginLeft: spacing.md,
  },

  friendBadge: {
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
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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

  cardPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  cardPlaceName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.b3,
    color: colors.text.inverse,
    flexShrink: 1,
    marginLeft: spacing.xs,
    marginRight: spacing.md,
  },

  cardReactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  cardReactionIconImage: {
    width: 24,
    height: 24,
  },

  cardReactionLabel: {
    ...typography.c2,
    color: colors.text.inverse,
  },

  selectedEmojiText: {
    fontSize: 26,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },

  cardReactionIconFirst: {
    marginLeft: 'auto',
  },

  cardReactionIconSpacing: {
    marginLeft: spacing.lg,
  },
});
