import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, StatusBar, ScrollView, NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

import {colors} from '../../constants/colors';
import ProfileHeaderCard from '../../components/mypage/ProfileHeaderCard';
import FriendActionButton from '../../components/mypage/FriendActionButton';
import RecentReviewSection from '../../components/mypage/RecentReviewSection';
import FriendLiveReviewSection from '../../components/mypage/FriendLiveReviewSection';
import FriendProfileMenu from '../../components/mypage/FriendProfileMenu';
import {getUserProfile, getUserReviews, UserProfile, UserReview} from '../../api/user';
import {sendFriendRequest, deleteFriend} from '../../api/friend';
import {AppStackParamList} from '../../types/navigation';

const REVIEW_PAGE_LIMIT = 20;
const SCROLL_END_THRESHOLD = 120;

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type UserMyPageRouteProp = RouteProp<AppStackParamList, 'UserMyPage'>;

export default function UserMyPageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserMyPageRouteProp>();
  const {userId} = route.params;

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

  const loadProfile = useCallback(async () => {
    try {
      const result = await getUserProfile(userId);

      console.log('[다른 유저 프로필 재조회 성공]', result);
      setProfile(result);
    } catch (error) {
      console.log('[다른 유저 프로필 재조회 실패]', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

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
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const isFriend = profile?.friend_status === 'ACCEPTED';

  // TODO: 유저 신고 api/화면 아직 없음 - 연결 준비되면 붙이기
  const handlePressReport = () => {
    console.log('[유저 신고] TODO: 아직 구현 안 됨', {userId});
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.white} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}>
        <ProfileHeaderCard
          profile={profile}
          isProfileLoading={isProfileLoading}
          showSettings={false}
          isFriend={isFriend}
          onPressBack={() => navigation.goBack()}
          onPressSettings={() => {}}
          onPressFriends={() => {}}
          onPressMenu={
            isFriend
              ? anchor => {
                  setMenuAnchor(anchor);
                  setMenuVisible(true);
                }
              : undefined
          }
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
        onClose={() => setMenuVisible(false)}
        onPressReport={handlePressReport}
        onPressUnfriend={handleUnfriend}
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
