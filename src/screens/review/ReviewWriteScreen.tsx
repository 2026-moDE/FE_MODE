import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, StatusBar, Image, Pressable, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import {CommonActions} from '@react-navigation/native';

import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {fontFamily, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {useLocation} from '../../context/LocationContext';
import {createReview, verifyPlaceLocation, getReviewImagePresignedUrl, type CongestionLevel} from '../../api/review';
import {uploadImageToS3} from '../../api/imageUpload';
import ReviewExitModal from '../../components/review/ReviewExitModal';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewWrite'>;

const refreshCameraIcon = require('../../assets/image/refresh_camera.png');
const timerIcon = require('../../assets/image/timer.png');
const pencilIcon = require('../../assets/image/pencil.png');

const CONGESTION_OPTIONS = ['한산해요', '적당해요', '붐벼요', '매우 붐벼요'] as const;
const getCongestionLevel = (
  congestion: CongestionType,
): CongestionLevel => {
  switch (congestion) {
    case '한산해요':
      return 'RELAXED';
    case '적당해요':
      return 'MODERATE';
    case '붐벼요':
      return 'CROWDED';
    case '매우 붐벼요':
      return 'VERY_CROWDED';
  }
};
type CongestionType = (typeof CONGESTION_OPTIONS)[number];

const CHIP_WIDTHS: Record<CongestionType, number> = {
  한산해요: 73,
  적당해요: 73,
  붐벼요: 61,
  '매우 붐벼요': 88,
};

// 선택된 칩의 혼잡도별 배경 / 테두리 / 글자 색
const CHIP_SELECTED_COLORS: Record<
  CongestionType,
  {background: string; border: string; text: string}
> = {
  한산해요: {background: '#CFFFC1', border: '#78D73D', text: colors.text.subtle},
  적당해요: {background: colors.brand.primary, border: colors.border.brand, text: colors.text.brandDarker},
  붐벼요: {background: '#FFD18D', border: '#D7943D', text: colors.text.brandDarker},
  '매우 붐벼요': {background: '#FFA1A1', border: '#D73D3D', text: colors.text.subtle},
};

const CONGESTION_DESCRIPTIONS: Record<CongestionType, string> = {
  한산해요: '대기 없이 바로 이용했어요',
  적당해요: '조금 붐볐지만 괜찮아요',
  붐벼요: '대기가 있었어요',
  '매우 붐벼요': '오래 기다렸다가 이용했어요',
};

const MAX_REVIEW_LENGTH = 100;

const ReviewWriteScreen = ({navigation, route}: Props) => {
  const {photoUri, placeId, placeName, congestion, reviewText: savedReviewText} = route.params;
  const {location} = useLocation();

  const [selectedCongestion, setSelectedCongestion] =
    useState<CongestionType | null>(
      (congestion as CongestionType) ?? null,
    );
  const [reviewText, setReviewText] = useState(savedReviewText ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const now = new Date();
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const formattedDate = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} (${DAYS[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // placeId 없이 placeName만 있으면 등록 자체가 불가능하므로 버튼도 비활성화
  const isSubmitActive = useMemo(() => {
    return !!placeId && !!placeName && !!selectedCongestion && !isSubmitting;
  }, [placeId, placeName, selectedCongestion, isSubmitting]);

    const handlePressPlace = () => {
      navigation.getParent()?.navigate('Search', {
        reviewPhotoUri: photoUri,
        reviewCongestion: selectedCongestion ?? undefined,
        reviewText: reviewText || undefined,
      } as never);
    };

    const handleRetakePhoto = () => {
      navigation.navigate('ReviewCamera');
    };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // 조용히 return하면 버튼이 안 눌리는 것처럼 보여서, 막힌 이유를 항상 알려줌
    if (!placeId || !placeName) {
      Alert.alert('장소를 선택해주세요', '후기를 남길 장소를 먼저 설정해주세요.');
      return;
    }

    if (!selectedCongestion) {
      Alert.alert('혼잡도를 선택해주세요', '이용하신 곳의 혼잡도 상태를 골라주세요.');
      return;
    }

    if (!location) {
      Alert.alert('위치 확인 실패', '현재 위치를 확인한 뒤 다시 시도해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const {latitude, longitude} = location;

      // 1. 위치 인증
      console.log('[리뷰] 위치 인증 요청 placeId:', placeId, 'lat:', latitude, 'lng:', longitude);
      const locationResult = await verifyPlaceLocation(Number(placeId), latitude, longitude);
      console.log('[리뷰] 위치 인증 결과:', locationResult);

      if (!locationResult.verified) {
        Alert.alert('위치 인증 실패', `해당 장소에서 ${locationResult.distance}m 떨어져 있어요.`);
        return;
      }

      // 2. presigned-url 발급
      console.log('[리뷰] presigned-url 요청');
      const {presigned_url, image_url} = await getReviewImagePresignedUrl(`review_${Date.now()}.jpg`);
      console.log('[리뷰] presigned-url 발급 완료');

      // 3. S3 업로드
      console.log('[리뷰] S3 업로드 시작');
      await uploadImageToS3({presignedUrl: presigned_url, imageUri: photoUri, contentType: 'image/jpeg'});
      console.log('[리뷰] S3 업로드 완료 image_url:', image_url);

      // 4. 리뷰 등록
      const reviewBody = {
        place_id: Number(placeId),
        image_url,
        congestion_level: getCongestionLevel(selectedCongestion),
        visibility: 'PUBLIC' as const,
        latitude,
        longitude,
        ...(reviewText.trim() && {comment: reviewText.trim()}),
      };
      const createdReview = await createReview(reviewBody);
      console.log('[리뷰] 등록 완료');

      // 전체 스택을 [홈 탭, 리뷰 스택(완료 화면 하나)]으로 교체
      // → 완료 화면에서 iOS 스와이프 / 안드로이드 뒤로가기 시 작성 화면이 아니라 홈으로 감
      navigation.getParent()?.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            {name: 'Tab', params: {screen: 'Home'}},
            {
              name: 'ReviewStack',
              state: {
                routes: [
                  {
                    name: 'ReviewComplete',
                    params: {
                      photoUri,
                      placeId: Number(placeId),
                      placeName,
                      reviewId: createdReview.id,
                    },
                  },
                ],
              },
            },
          ],
        }),
      );
    } catch (error: any) {
      Alert.alert('등록 실패', error?.response?.data?.message || error?.message || '알 수 없는 오류가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.white} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => setExitModalVisible(true)}
            hitSlop={10}>
            <IconArrowLeft size={24} color="#1F2933" />
          </Pressable>

          <Text style={styles.headerTitle}>후기 작성</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.placeSection}>
            <View style={styles.photoWrapper}>
              <Image source={{uri: photoUri}} style={styles.photo} />

              <Pressable style={styles.retakeButton} onPress={handleRetakePhoto}>
                <Image source={refreshCameraIcon} style={styles.retakeIcon} />
                <Text style={styles.retakeText}>다시 찍기</Text>
              </Pressable>
            </View>

            <Pressable style={styles.placeInfo} onPress={handlePressPlace}>
              <View style={styles.placeTitleRow}>
                <Text
                  style={[
                    styles.placeTitle,
                    placeName ? styles.placeTitleActive : styles.placeTitleEmpty,
                  ]}
                  numberOfLines={1}>
                  {placeName ?? '장소를 설정해주세요.'}
                </Text>

                {placeName && (
                  <View style={styles.editPlaceButton}>
                    <Image source={pencilIcon} style={styles.editPlaceIcon} />
                    <Text style={styles.editPlaceText}>수정하기</Text>
                  </View>
                )}
              </View>

              <View style={styles.dateRow}>
                <Image source={timerIcon} style={styles.timerIcon} />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.congestionTitleRow}>
              <Text style={styles.sectionTitle}>혼잡도 상태</Text>

              {selectedCongestion && (
                <Text style={styles.congestionDescription} numberOfLines={1}>
                  {CONGESTION_DESCRIPTIONS[selectedCongestion]}
                </Text>
              )}
            </View>

            <View style={styles.chipRow}>
              {CONGESTION_OPTIONS.map(option => {
                const isSelected = selectedCongestion === option;
                const selectedColors = CHIP_SELECTED_COLORS[option];

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.chip,
                      // 시안 너비를 최소값으로 두고, 글자가 더 길면(선택 시 굵어짐) 늘어나도록
                      {minWidth: CHIP_WIDTHS[option]},
                      isSelected && [
                        styles.chipSelected,
                        {
                          backgroundColor: selectedColors.background,
                          borderColor: selectedColors.border,
                        },
                      ],
                    ]}
                    onPress={() => setSelectedCongestion(option)}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && [
                          styles.chipTextSelected,
                          {color: selectedColors.text},
                        ],
                      ]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>이용 후기를 작성해주세요.</Text>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={reviewText}
                onChangeText={text => {
                  if (text.length <= MAX_REVIEW_LENGTH) {
                    setReviewText(text);
                  }
                }}
                placeholder="100자 이내로 짧은 코멘트 작성해주세요."
                placeholderTextColor="#C8CDD4"
                multiline
                maxLength={MAX_REVIEW_LENGTH}
                textAlignVertical="top"
              />

              <Text style={styles.countText}>
                {reviewText.length} / {MAX_REVIEW_LENGTH}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
       <Pressable
          style={[
            styles.submitButton,
            isSubmitActive ? styles.submitButtonActive : styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isSubmitActive}>
          <Text
            style={[
              styles.submitText,
              isSubmitActive ? styles.submitTextActive : styles.submitTextDisabled,
            ]}>
            ✓  등록하기
          </Text>
        </Pressable>
          <ReviewExitModal
            visible={exitModalVisible}
            onClose={() => setExitModalVisible(false)}
            onExit={() => {
              setExitModalVisible(false);

              navigation.getParent()?.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Tab',
                      params: {
                        screen: 'Home',
                      },
                    },
                  ],
                }),
              );
            }}
          />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReviewWriteScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  keyboardView: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  header: {
    height: 52,
    paddingVertical: spacing.sm,
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

  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#111827',
    lineHeight: 21,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  contentInner: {
    paddingTop: spacing.lg,
    paddingBottom: 90,
  },

  placeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['3xl'],
  },

  photoWrapper: {
    width: 105,
    height: 105,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },

  photo: {
    width: 105,
    height: 105,
    borderRadius: radius.lg,
  },

  retakeButton: {
    position: 'absolute',
    left: spacing.md,
    top: spacing['4xl'],
    width: 81,
    height: 24,
    borderRadius: radius.md,
    backgroundColor: colors.background.dimDarker,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  retakeIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },

  retakeText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.text.inverse,
  },

  placeInfo: {
    flex: 1,
    marginLeft: spacing.lg,
    paddingTop: 6,
  },

  placeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.text.basic,
    lineHeight: 24,
    marginRight: spacing.xs,
    flexShrink: 1,
  },

  placeTitleEmpty: {
    color: '#C8CDD4',
  },

  placeTitleActive: {
    color: '#111827',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9.5,
  },

  timerIcon: {
    width: 14,
    height: 14,
    marginRight: spacing.s,
    resizeMode: 'contain',
    transform: [{translateY: 1}],
  },

  dateText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#374151',
    lineHeight: 17,
  },

  section: {
    marginBottom: spacing['3xl'],
  },

  sectionTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: '#111827',
    lineHeight: 26,
  },

  congestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  congestionDescription: {
    marginLeft: spacing.md, 
    flexShrink: 1,
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.text.brandDarker
  },

  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.s,
  },

  chip: {
    minHeight: 33,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.md,
    backgroundColor: colors.navy[50],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 색은 혼잡도별로 CHIP_SELECTED_COLORS에서 지정
  chipSelected: {
    borderWidth: 1.5,
  },

  // Body/B6
  chipText: {
    ...typography.b6,
    color: '#4B5563',
    textAlign: 'center',
  },

  // Body/B5 (색은 혼잡도별로 CHIP_SELECTED_COLORS에서 지정)
  chipTextSelected: {
    ...typography.b5,
  },

  reviewSection: {
    marginTop: 0,
  },

  inputBox: {
    width: '100%',
    height: 121,
    borderWidth: 1,
    borderColor: '#DADDE2',
    borderRadius: radius.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.white,
  },

  textInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#111827',
    lineHeight: 17,
  },

  countText: {
    alignSelf: 'flex-end',
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#6B7280',
    lineHeight: 17,
  },

  submitButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 33,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#DADDE2',
  },

  submitButtonActive: {
    backgroundColor: colors.button.secondaryFill,
  },

  // Body/B3 - 리뷰 플로우 하단 버튼 공통
  submitText: {
    ...typography.b3,
  },

  submitTextDisabled: {
    color: colors.text.inverse,
    opacity: 0.7,
  },

  submitTextActive: {
    color: colors.text.inverse,
  },

  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  editPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 3,
  },

  editPlaceIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    tintColor: '#8A919E',
  },

  editPlaceText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#8A919E',
    includeFontPadding: false,
  },
});
