import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, StatusBar, ScrollView, NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

import {colors} from '../../constants/colors';
import {useActivePieces} from '../../hooks/useActivePieces';
import PieceProfileHeader from '../../components/mypage/PieceProfileHeader';
import FriendActionButton from '../../components/mypage/FriendActionButton';
import RecentReviewSection, {RecentReviewSectionRef} from '../../components/mypage/RecentReviewSection';
import FriendLiveReviewSection from '../../components/mypage/FriendLiveReviewSection';
import FriendProfileMenu from '../../components/mypage/FriendProfileMenu';
import UserBlockModal from '../../components/mypage/UserBlockModal';
import {getUserProfile, getUserReviews, UserProfile, UserReview} from '../../api/user';
import {sendFriendRequest, deleteFriend} from '../../api/friend';
import {blockUser, isBlockedError} from '../../api/block';
import {getUserPieces, type Piece} from '../../api/piece';
import {notifyBlockChanged} from '../../store/blockEvents';
import {useToast} from '../../components/common/Toast';
import {AppStackParamList} from '../../types/navigation';

const REVIEW_PAGE_LIMIT = 20;
const SCROLL_END_THRESHOLD = 120;

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type UserMyPageRouteProp = RouteProp<AppStackParamList, 'UserMyPage'>;

export default function UserMyPageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserMyPageRouteProp>();
  const {userId} = route.params;
  const {showToast} = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<UserReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const isLoadingMoreRef = useRef(false);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{top: number; right: number} | null>(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const recentReviewSectionRef = useRef<RecentReviewSectionRef>(null);
  const [allPieces, setPieces] = useState<Piece[]>([]);
  const pieces = useActivePieces(allPieces);
  // 화면에 들어올 때마다 조각이 다시 떨어져 쌓이는 애니메이션을 보여주려고 보드를 새로 마운트시킨다
  const [boardRunId, setBoardRunId] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const result = await getUserProfile(userId);

      console.log('[다른 유저 프로필 재조회 성공]', result);
      setProfile(result);
    } catch (error) {
      console.log('[다른 유저 프로필 재조회 실패]', error);

      // 차단 관계면 프로필 자체를 못 본다 (알림/딥링크로 바로 들어온 경우) - 안내하고 되돌린다
      if (isBlockedError(error)) {
        showToast('차단한 사용자입니다');
        navigation.goBack();
      }
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId, navigation, showToast]);

  const loadRecentReviews = useCallback(async () => {
    try {
      const data = await getUserReviews(userId, {limit: REVIEW_PAGE_LIMIT});
      setRecentReviews(data.reviews);
      setNextCursor(data.next_cursor);
    } catch (error) {
      console.log('[다른 유저 리뷰 조회 실패]', error);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [userId]);

  const loadMoreReviews = useCallback(async () => {
    if (isLoadingMoreRef.current || nextCursor == null) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMoreReviews(true);
    try {
      const data = await getUserReviews(userId, {cursor: nextCursor, limit: REVIEW_PAGE_LIMIT});
      setRecentReviews(prev => [...prev, ...data.reviews]);
      setNextCursor(data.next_cursor);
    } catch (error) {
      console.log('[다른 유저 리뷰 추가 조회 실패]', error);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMoreReviews(false);
    }
  }, [userId, nextCursor]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadRecentReviews();
    }, [loadProfile, loadRecentReviews]),
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 스크롤하면 카드 위치가 바뀌어서 이모지 피커가 엉뚱한 자리에 뜨는 문제가 있어서, 스크롤 시작하면 바로 닫음
    recentReviewSectionRef.current?.closeEmojiPicker();

    // 친구 아니면 최근 리뷰 3건만 보여주고 끝 - 더 불러올 필요 없음
    if (!isFriend) return;

    // 친구면 위쪽 가로 캐러셀(FriendLiveReviewSection)도 자체적으로 loadMoreReviews를 트리거하지만,
    // 아래 전체 리뷰 피드용 세로 스크롤 페이지네이션도 그대로 필요함 - loadMoreReviews가 중복 호출을 막아줌
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);

    if (distanceFromBottom < SCROLL_END_THRESHOLD) {
      loadMoreReviews();
    }
  };

  const handleSendFriendRequest = async () => {
    setIsRequestSubmitting(true);
    try {
      await sendFriendRequest(userId);
      setProfile(prev => (prev ? {...prev, friend_status: 'PENDING'} : prev));
    } catch (error) {
      console.log('[친구 요청 전송 실패]', error);

      if (isBlockedError(error)) {
        showToast('차단한 사용자에게는 친구 요청을 보낼 수 없습니다');
      }
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const isFriend = profile?.friend_status === 'ACCEPTED';

  const loadPieces = useCallback(async () => {
    try {
      const data = await getUserPieces(userId, 'board');

      setPieces(data.pieces);
    } catch (error) {
      console.log('[다른 유저 조각 목록 조회 실패]', error);
      setPieces([]);
    } finally {
      setBoardRunId(prev => prev + 1);
    }
  }, [userId]);

  // 공개 보드는 친구 여부와 무관하게 조회하며, 차단 관계는 서버가 검사한다.
  useFocusEffect(
    useCallback(() => {
      loadPieces();
    }, [loadPieces]),
  );

  // TODO: 유저 신고 api/화면 아직 없음 - 연결 준비되면 붙이기
  const handlePressReport = () => {
    console.log('[유저 신고] TODO: 아직 구현 안 됨', {userId});
  };

  const handleBlock = async () => {
    if (isBlocking) return;

    setIsBlocking(true);
    try {
      await blockUser(userId);
      setBlockModalVisible(false);

      // 지도 버블 / 탐색 피드 / 친구 리뷰 / 댓글 목록이 들고 있는 캐시를 버리게 한다
      // (앱 재시작 없이 바로 사라져야 함)
      notifyBlockChanged();

      showToast('차단했습니다');
      // 차단한 사용자의 프로필에 그대로 머물러 있으면 안 된다
      navigation.goBack();
    } catch (error) {
      console.log('[사용자 차단 실패]', error);
      setBlockModalVisible(false);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnfriend = async () => {
    try {
      await deleteFriend(userId);
      setProfile(prev => (prev ? {...prev, friend_status: 'NONE'} : prev));
    } catch (error) {
      console.log('[친구 끊기 실패]', error);
    }
  };

  return (
    // 조각 보드가 상태바 아래까지 올라붙어야 해서 위쪽 세이프에어리어는 주지 않는다
    // (보드가 insets.top을 보고 자리를 잡음)
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.white} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}>
        <PieceProfileHeader
          profile={profile}
          isProfileLoading={isProfileLoading}
          pieces={pieces}
          boardRunId={boardRunId}
          showSettings={false}
          isFriend={isFriend}
          // 남의 보드라 옮기거나 크기를 바꿀 수 없다 (위치 저장은 내 보드 전용 API)
          readOnly
          onPressBack={() => navigation.goBack()}
          onPlacePieces={() => {}}
          onEditPiece={() => {}}
          // 친구가 아니어도 차단은 할 수 있어야 해서 ⋮ 메뉴는 항상 띄운다
          onPressMenu={anchor => {
            setMenuAnchor(anchor);
            setMenuVisible(true);
          }}
        />

        {isFriend && profile ? (
          <>
            <FriendLiveReviewSection
              friend={profile}
              reviews={recentReviews}
              isLoading={isReviewsLoading}
              isLoadingMore={isLoadingMoreReviews}
              onLoadMore={loadMoreReviews}
            />

            {/* 친구 공개 게시물 포함 전체 리뷰 - 내 마이페이지와 동일한 피드 UI */}
            <RecentReviewSection
              ref={recentReviewSectionRef}
              profile={profile}
              recentReviews={recentReviews}
              isReviewsLoading={isReviewsLoading}
              isLoadingMore={isLoadingMoreReviews}
              isOwner={false}
              showFriendBadge
              onReportReview={reviewId => navigation.navigate('ReviewReport', {reviewId})}
            />
          </>
        ) : (
          <>
            {profile && (
              <FriendActionButton
                friendStatus={profile.friend_status}
                isSubmitting={isRequestSubmitting}
                onPressRequest={handleSendFriendRequest}
              />
            )}

            <RecentReviewSection
              ref={recentReviewSectionRef}
              profile={profile}
              recentReviews={recentReviews.slice(0, 3)}
              isReviewsLoading={isReviewsLoading}
              isOwner={false}
              showTime={false}
              onReportReview={reviewId => navigation.navigate('ReviewReport', {reviewId})}
            />
          </>
        )}
      </ScrollView>

      <FriendProfileMenu
        visible={menuVisible}
        anchor={menuAnchor}
        isFriend={isFriend}
        onClose={() => setMenuVisible(false)}
        onPressReport={handlePressReport}
        onPressBlock={() => setBlockModalVisible(true)}
        onPressUnfriend={handleUnfriend}
      />

      <UserBlockModal
        visible={blockModalVisible}
        mode="block"
        nickname={profile?.nickname ?? ''}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={handleBlock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },

  scrollContent: {
    paddingBottom: 110,
  },
});
