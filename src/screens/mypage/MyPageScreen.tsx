import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NaverMapViewRef} from '@mj-studio/react-native-naver-map';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';

import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import MyMapSection from '../../components/mypage/MyMapSection';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {formatRelativeTime} from '../../components/placeDetail/ReviewCard';
import {getMyProfile, getMyReviews, MyProfile, MyReview} from '../../api/mypage';

const settingIcon = require('../../assets/image/setting.png');
const pencilIcon = require('../../assets/image/pencil.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const RECENT_REVIEW_LIMIT = 5;

export default function MypageScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<NaverMapViewRef>(null);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.white} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          {profile?.profile_image_url ? (
            <FastImage
              source={{
                uri: profile.profile_url ?? profile.profile_image_url,
                priority: FastImage.priority.high,
              }}
              style={styles.profileImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.profileScrim}
            pointerEvents="none"
          />

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.profileIconButton, styles.profileBackButton]}
            onPress={() =>
              navigation.navigate('Tab', {
                screen: 'Home',
              })
            }>
            <IconArrowLeft size={px(28)} color={colors.icon.inverse} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.profileIconButton, styles.profileSettingButton]}
            onPress={() => navigation.navigate('Setting')}>
            <Image
              source={settingIcon}
              style={styles.settingImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.profileBottomRow}>
            {isProfileLoading && !profile ? (
              <ActivityIndicator size="small" color={colors.icon.inverse} />
            ) : (
              <Text style={styles.profileNickname}>{profile?.nickname ?? '닉네임'}</Text>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FollowList', {type: 'follower'})}>
              <Text style={styles.profileFriendCount}>
                친구 {profile?.follower_count ?? 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 프로필 수정 버튼 */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('ProfileEdit', {
              nickname: profile?.nickname ?? '',
              profileImageUrl: profile?.profile_image_url ?? null,
            })
          }>
          <Image source={pencilIcon} style={styles.editButtonIcon} resizeMode="contain" />
          <Text style={styles.editButtonText}>프로필 수정하기</Text>
        </TouchableOpacity>

        {/* 마이맵 */}
        <View style={styles.myMapBox}>
          <MyMapSection mapRef={mapRef} />
        </View>

        {/* 최신 리뷰 */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>최신 리뷰</Text>

          {isReviewsLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.icon.basic}
              style={styles.reviewLoading}
            />
          ) : recentReviews.length === 0 ? (
            <Text style={styles.emptyText}>작성한 리뷰가 없어요</Text>
          ) : (
            recentReviews.map(review => (
              <TouchableOpacity
                key={review.id}
                activeOpacity={0.85}
                style={styles.reviewCard}
                onPress={() =>
                  navigation.navigate('PlaceDetail', {
                    placeId: review.place.id,
                    placeName: review.place.name,
                  })
                }>
                {review.image_url ? (
                  <FastImage
                    source={{
                      uri:
                        review.thumbnail_small_url ??
                        review.thumbnail_url ??
                        review.image_url,
                    }}
                    style={styles.reviewImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.reviewImagePlaceholder} />
                )}

                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewPlaceName} numberOfLines={1}>
                    {review.place.name}
                  </Text>
                  <Text style={styles.reviewComment} numberOfLines={2}>
                    {review.comment}
                  </Text>
                  <Text style={styles.reviewTime}>
                    {formatRelativeTime(review.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  scrollContent: {
    paddingBottom: px(110),
  },

  profileCard: {
    aspectRatio: 353 / 418,
    borderBottomLeftRadius: px(radius.xl),
    borderBottomRightRadius: px(radius.xl),
    overflow: 'hidden',
    backgroundColor: colors.surface.muted,
  },

  profileImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  profileImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface.muted,
  },

  profileScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: px(120),
  },

  profileIconButton: {
    position: 'absolute',
    top: px(16),
    width: px(36),
    height: px(36),
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileBackButton: {
    left: px(20),
  },

  profileSettingButton: {
    right: px(20),
  },

  settingImage: {
    width: px(28),
    height: px(28),
    tintColor: colors.icon.inverse,
  },

  profileBottomRow: {
    position: 'absolute',
    left: px(20),
    right: px(20),
    bottom: px(16),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  profileNickname: {
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    color: colors.text.inverse,
  },

  profileFriendCount: {
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    color: colors.text.inverse,
  },

  editButton: {
    marginHorizontal: px(16),
    marginTop: px(20),
    height: px(43),
    borderRadius: px(radius.md),
    backgroundColor: colors.button.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(10),
  },

  editButtonIcon: {
    width: px(16),
    height: px(16),
    tintColor: colors.icon.inverse,
  },

  editButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(14),
    color: colors.text.inverse,
  },

  myMapBox: {
    marginHorizontal: px(16),
    marginTop: px(20),
    height: px(160),
    borderRadius: px(radius.lg),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  reviewSection: {
    marginTop: px(24),
    paddingHorizontal: px(16),
  },

  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(16),
    color: colors.text.basic,
    marginBottom: px(12),
  },

  reviewLoading: {
    marginTop: px(8),
  },

  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: px(13),
    color: colors.text.tertiary,
  },

  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: px(14),
    gap: px(12),
  },

  reviewImage: {
    width: px(72),
    height: px(72),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.muted,
  },

  reviewImagePlaceholder: {
    width: px(72),
    height: px(72),
    borderRadius: px(radius.md),
    backgroundColor: colors.surface.muted,
  },

  reviewInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  reviewPlaceName: {
    fontFamily: fontFamily.bold,
    fontSize: px(14),
    color: colors.text.basic,
  },

  reviewComment: {
    fontFamily: fontFamily.regular,
    fontSize: px(13),
    color: colors.text.tertiary,
    marginTop: px(4),
  },

  reviewTime: {
    fontFamily: fontFamily.medium,
    fontSize: px(11),
    color: colors.text.disabled,
    marginTop: px(4),
  },
});
