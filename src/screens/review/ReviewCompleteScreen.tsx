import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, Image, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

import type {ReviewStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconArchive from '../../assets/icons/IconArchive';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import {getMyProfile, type MyProfile} from '../../api/mypage';
import {isSubjectExtractionAvailable} from '../../native/SubjectExtractor';
import {fontFamily, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing, padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewComplete'>;

const BACKGROUND_COLOR = '#000000';
// 카드 그라데이션 시작색: #1B2129(navy 900) 투명도 0%
const CARD_GRADIENT_TOP = 'rgba(27, 33, 41, 0)';
// 후기 작성 화면의 등록하기 버튼과 같은 위치 (하단 safe area 위로 33)
const CHECK_BUTTON_BOTTOM = 33;

const ReviewCompleteScreen = ({navigation, route}: Props) => {
  const {photoUri, placeId, placeName, reviewId} = route.params;
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  // 작성 화면에서 스택을 [홈 탭, 리뷰 스택(이 화면 하나)]으로 바꿔두므로
  // iOS 스와이프 / 안드로이드 뒤로가기도 별도 처리 없이 홈으로 감. 헤더 ←도 같은 동작
  const handleGoHome = () => {
    navigation.getParent()?.navigate('Tab', {screen: 'Home'} as never);
  };

  // 리뷰 작성 스택을 지우고 [홈 탭, 장소 상세]로 교체 → 장소 상세에서 뒤로가기 시 홈으로
  const handleCheckReview = () => {
    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          {name: 'Tab', params: {screen: 'Home'}},
          {name: 'PlaceDetail', params: {placeId, placeName, reviewId}},
        ],
      }),
    );
  };

  // 조각 누끼는 iOS 17 Vision / 안드로이드 ML Kit에 기대므로, 안 되는 기기에서는 진입 자체를 막는다
  const handleCollectPieces = async () => {
    if (!(await isSubjectExtractionAvailable())) {
      Alert.alert(
        '사용할 수 없어요',
        '이 기기에서는 조각 모으기를 사용할 수 없어요.',
      );
      return;
    }

    navigation.getParent()?.navigate('PieceStack', {
      screen: 'PieceCamera',
      params: {reviewId, placeId, placeName},
    } as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_COLOR} />

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleGoHome} hitSlop={10}>
          <IconArrowLeft size={24} />
        </Pressable>

        <Text style={styles.headerTitle}>후기 작성</Text>
      </View>

      {/* 등록 결과 카드 */}
      <LinearGradient
        colors={[CARD_GRADIENT_TOP, colors.surface.subtle]}
        style={styles.card}>
        <View style={styles.photoWrapper}>
          <Image source={{uri: photoUri}} style={styles.photo} />

          {/* 작성자(나) 프로필 */}
          {profile && (
            <View style={styles.authorRow}>
              <ProfileAvatar
                profileUrl={profile.profile_url}
                profileImageUrl={profile.profile_image_url}
                style={styles.authorAvatar}
              />
              <Text style={styles.authorName} numberOfLines={1}>
                {profile.nickname}
              </Text>
            </View>
          )}

          <View style={styles.timeChip}>
            <Text style={styles.timeChipText}>방금</Text>
          </View>
        </View>

        <Text style={styles.completeText}>후기가 등록됐어요!</Text>

        <Pressable style={styles.archiveButton} onPress={handleCollectPieces}>
          <IconArchive size={16} color={colors.text.basic} />
          <Text style={styles.archiveButtonText}>해당 장소의 조각 모으기</Text>
        </Pressable>
      </LinearGradient>

      <Pressable style={styles.checkButton} onPress={handleCheckReview}>
        <Text style={styles.checkButtonText}>후기 확인하기</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default ReviewCompleteScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },

  header: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Body/B1 (Bold)
  headerTitle: {
    ...typography.b1,
    color: colors.text.inverse,
  },

  // 시안 360x620 고정이지만 기기 높이에 맞게 남은 공간을 채움 (헤더와 7, 버튼과 20 간격)
  card: {
    flex: 1,
    marginTop: 7,
    marginHorizontal: padding.lg,
    marginBottom: padding.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingTop: 69,
  },

  // 199x267 사진 + 1px 흰색 실선 테두리
  photoWrapper: {
    width: 199,
    height: 267,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.inverse,
    overflow: 'hidden',
    backgroundColor: colors.surface.subtleDarker,
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  authorRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  authorAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // Caption/C3 (Medium)
  authorName: {
    ...typography.c3,
    fontFamily: fontFamily.medium,
    flexShrink: 1,
    color: colors.text.inverse,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },

  // 사진 아래와 padding-md 간격
  timeChip: {
    position: 'absolute',
    bottom: padding.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: radius.md,
    backgroundColor: colors.background.dimDarkest,
  },

  timeChipText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  // Body/B1 (Bold)
  completeText: {
    ...typography.b1,
    marginTop: gap['3xl'],
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  // 36 고정 높이, 좌우 padding-md, 아이콘-글자 gap-sm
  // 시안의 상하 padding-sm(10)을 넣으면 내용 영역이 16px라 B5(lineHeight 18) 글자 아래가 잘림
  // → 높이 고정 + 세로 가운데 정렬로 같은 위치를 만듦
  archiveButton: {
    marginTop: gap.xl,
    height: 36,
    paddingHorizontal: padding.md,
    borderRadius: radius.full,
    backgroundColor: colors.button.primaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
  },

  // Body/B5
  archiveButtonText: {
    ...typography.b5,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  checkButton: {
    marginHorizontal: padding.lg,
    marginBottom: CHECK_BUTTON_BOTTOM,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body/B3 - 리뷰 플로우 하단 버튼 공통
  checkButtonText: {
    ...typography.b3,
    color: colors.text.inverse,
    includeFontPadding: false,
  },
});
