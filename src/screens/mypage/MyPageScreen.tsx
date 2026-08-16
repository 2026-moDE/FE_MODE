import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, StatusBar, ScrollView, Share} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {colors} from '../../constants/colors';
import ProfileHeaderCard from '../../components/mypage/ProfileHeaderCard';
import ProfileActionButtons from '../../components/mypage/ProfileActionButtons';
import MyMapRow from '../../components/mypage/MyMapRow';
import RecentReviewSection from '../../components/mypage/RecentReviewSection';
import ProfileShareModal from '../../components/mypage/ProfileShareModal';
import {getMyProfile, getMyReviews, MyProfile, MyReview} from '../../api/mypage';
import {changeReview, deleteReview} from '../../api/review';

const RECENT_REVIEW_LIMIT = 100;

export default function MypageScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<NaverMapViewRef>(null);
  const shareModalRef = useRef<BottomSheetModal>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState<MyReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const result = await getMyProfile();

      console.log('[프로필 재조회 성공]', result);
      setProfile(result);
    } catch (error) {
      console.log('[프로필 재조회 실패]', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const loadRecentReviews = useCallback(async () => {
    try {
      const data = await getMyReviews({limit: RECENT_REVIEW_LIMIT});
      setRecentReviews(data.reviews);
    } catch (error) {
      console.log('[최신 리뷰 조회 실패]', error);
    } finally {
      setIsReviewsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadRecentReviews();
    }, [loadProfile, loadRecentReviews]),
  );

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await deleteReview(reviewId);
      setRecentReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.log('[리뷰 삭제 실패]', error);
    }
  };

  const handleEditReviewComment = async (reviewId: number, comment: string) => {
    try {
      await changeReview(reviewId, {comment});
      setRecentReviews(prev => prev.map(r => (r.id === reviewId ? {...r, comment} : r)));
    } catch (error) {
      console.log('[리뷰 수정 실패]', error);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `${profile?.nickname ?? '모잉'}님의 모잉 프로필을 확인해보세요!`,
      });
    } catch (error) {
      console.log('[프로필 공유 실패]', error);
    }
  };

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
          onPressBack={() => navigation.navigate('Tab', {screen: 'Home'})}
          onPressSettings={() => navigation.navigate('Setting')}
          onPressFriends={() => navigation.navigate('FollowList')}
        />

        <ProfileActionButtons
          onPressEdit={() =>
            navigation.navigate('ProfileEdit', {
              nickname: profile?.nickname ?? '',
              profileImageUrl: profile?.profile_image_url ?? null,
            })
          }
          onPressShare={() => shareModalRef.current?.present()}
        />

        <MyMapRow mapRef={mapRef} reviews={recentReviews} />

        <RecentReviewSection
          profile={profile}
          recentReviews={recentReviews}
          isReviewsLoading={isReviewsLoading}
          onDeleteReview={handleDeleteReview}
          onEditComment={handleEditReviewComment}
        />
      </ScrollView>

      <ProfileShareModal ref={shareModalRef} onSelectShare={handleShareProfile} />
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
