import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, StatusBar, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

import {colors} from '../../constants/colors';
import ProfileHeaderCard from '../../components/mypage/ProfileHeaderCard';
import FriendActionButton from '../../components/mypage/FriendActionButton';
import RecentReviewSection from '../../components/mypage/RecentReviewSection';
import FriendLiveReviewSection from '../../components/mypage/FriendLiveReviewSection';
import {getUserProfile, getUserReviews, UserProfile} from '../../api/user';
import {sendFriendRequest} from '../../api/friend';
import {MyReview} from '../../api/mypage';
import {AppStackParamList} from '../../types/navigation';

const RECENT_REVIEW_LIMIT = 100;

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type UserMyPageRouteProp = RouteProp<AppStackParamList, 'UserMyPage'>;

export default function UserMyPageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserMyPageRouteProp>();
  const {userId, mockUser} = route.params;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<MyReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const result = await getUserProfile(userId);

      console.log('[다른 유저 프로필 재조회 성공]', result);
      setProfile(result);
    } catch (error) {
      console.log('[다른 유저 프로필 재조회 실패]', error);
      // 타인 프로필 조회 api가 아직 없어서, 진입 시 넘겨받은 리뷰 작성자 정보로 임시 목데이터를 채워둠
      if (mockUser) {
        setProfile({
          id: userId,
          nickname: mockUser.nickname,
          profile_image_url: mockUser.profileImageUrl,
          profile_url: mockUser.profileUrl ?? null,
          review_count: 0,
          place_count: 0,
          subscription_count: 0,
          friend_count: 0,
          friend_status: mockUser.friendStatus ?? 'NONE',
        });
      }
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId, mockUser]);

  const loadRecentReviews = useCallback(async () => {
    try {
      const data = await getUserReviews(userId, {limit: RECENT_REVIEW_LIMIT});
      setRecentReviews(data.reviews);
    } catch (error) {
      console.log('[다른 유저 리뷰 조회 실패]', error);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadRecentReviews();
    }, [loadProfile, loadRecentReviews]),
  );

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.white} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileHeaderCard
          profile={profile}
          isProfileLoading={isProfileLoading}
          showSettings={false}
          isFriend={isFriend}
          onPressBack={() => navigation.goBack()}
          onPressSettings={() => {}}
          onPressFriends={() => {}}
        />

        {isFriend && profile ? (
          <FriendLiveReviewSection
            friend={profile}
            reviews={recentReviews}
            isLoading={isReviewsLoading}
          />
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
              recentReviews={recentReviews}
              isReviewsLoading={isReviewsLoading}
              isOwner={false}
              onReportReview={reviewId => navigation.navigate('ReviewReport', {reviewId})}
            />
          </>
        )}
      </ScrollView>
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
