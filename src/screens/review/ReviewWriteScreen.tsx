import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';
import {CommonActions} from '@react-navigation/native';

import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import {useLocation} from '../../context/LocationContext';
import {getPresignedUrl, uploadImageToS3, createReview, verifyPlaceLocation, type CongestionLevel,} from '../../api/review';
import ReviewExitModal from '../../components/review/ReviewExitModal';
import ReviewPreviewModal, {type ReviewVisibility} from '../../components/review/ReviewPreviewModal';

type Props = NativeStackScreenProps<ReviewStackParamList, 'ReviewWrite'>;

const refreshCameraIcon = require('../../assets/image/refresh_camera.png');
const timerIcon = require('../../assets/image/timer.png');
const pencilIcon = require('../../assets/image/pencil.png');

const CONGESTION_OPTIONS = ['여유', '보통', '혼잡'] as const;
const getCongestionLevel = (
  congestion: CongestionType,
): CongestionLevel => {
  switch (congestion) {
    case '여유':
      return 'LOW';
    case '보통':
      return 'MEDIUM';
    case '혼잡':
      return 'HIGH';
  }
};
type CongestionType = (typeof CONGESTION_OPTIONS)[number];

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

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
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [, setReviewVisibility] = useState<ReviewVisibility>('all');

  const now = new Date();
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const formattedDate = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} (${DAYS[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const isSubmitActive = useMemo(() => {
    return !!placeName && !!selectedCongestion && !isSubmitting;
  }, [placeName, selectedCongestion, isSubmitting]);

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
    if (!isSubmitActive || !selectedCongestion) return;

    if (!placeId) {
      console.log('placeId 없음. 장소 선택 먼저 필요');
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
      const {presigned_url, image_url} = await getPresignedUrl(`original/review_${Date.now()}.jpg`);
      console.log('[리뷰] presigned-url 발급 완료');

      // 3. S3 업로드
      console.log('[리뷰] S3 업로드 시작');
      await uploadImageToS3(photoUri, presigned_url);
      console.log('[리뷰] S3 업로드 완료 image_url:', image_url);

      // 4. 리뷰 등록
      const reviewBody = {
        place_id: Number(placeId),
        image_url,
        congestion_level: getCongestionLevel(selectedCongestion),
        latitude,
        longitude,
        ...(reviewText.trim() && {comment: reviewText.trim()}),
      };
      await createReview(reviewBody);
      console.log('[리뷰] 등록 완료');

      setPreviewModalVisible(false);
      navigation.navigate('ReviewComplete');
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
            <IconArrowLeft size={px(24)} color="#1F2933" />
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
            <Text style={styles.sectionTitle}>혼잡도 상태</Text>

            <View style={styles.chipRow}>
              {CONGESTION_OPTIONS.map(option => {
                const isSelected = selectedCongestion === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedCongestion(option)}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
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
          onPress={() => setPreviewModalVisible(true)}
          disabled={!isSubmitActive}>
          <Text
            style={[
              styles.submitText,
              isSubmitActive ? styles.submitTextActive : styles.submitTextDisabled,
            ]}>
            ✓  등록하기
          </Text>
        </Pressable>
          <ReviewPreviewModal
            visible={previewModalVisible}
            photoUri={photoUri}
            reviewText={reviewText}
            onChangeVisibility={setReviewVisibility}
            isSubmitting={isSubmitting}
            onClose={() => setPreviewModalVisible(false)}
            onSubmit={handleSubmit}
          />
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
    height: px(52),
    paddingVertical: px(spacing.sm),
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: px(spacing.lg),
    width: px(32),
    height: px(32),
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    color: '#111827',
    lineHeight: px(21),
  },

  content: {
    flex: 1,
    paddingHorizontal: px(spacing.lg),
  },

  contentInner: {
    paddingTop: px(spacing.lg),
    paddingBottom: px(90),
  },

  placeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: px(spacing['3xl']),
  },

  photoWrapper: {
    width: px(105),
    height: px(105),
    borderRadius: px(radius.lg),
    overflow: 'hidden',
    position: 'relative',
  },

  photo: {
    width: px(105),
    height: px(105),
    borderRadius: px(radius.lg),
  },

  retakeButton: {
    position: 'absolute',
    left: px(spacing.md),
    top: px(spacing['4xl']),
    width: px(81),
    height: px(24),
    borderRadius: px(radius.md),
    backgroundColor: colors.background.dimDarker,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(spacing.xs),
  },

  retakeIcon: {
    width: px(12),
    height: px(12),
    resizeMode: 'contain',
  },

  retakeText: {
    fontSize: px(12),
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
    fontSize: px(20),
    color: colors.text.basic,
    lineHeight: px(24),
    marginRight: px(spacing.xs),
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
    marginTop: px(9.5),
  },

  timerIcon: {
    width: px(14),
    height: px(14),
    marginRight: px(spacing.s),
    resizeMode: 'contain',
    transform: [{translateY: px(1)}],
  },

  dateText: {
    fontSize: px(14),
    fontFamily: fontFamily.bold,
    color: '#374151',
    lineHeight: px(17),
  },

  section: {
    marginBottom: spacing['3xl'],
  },

  sectionTitle: {
    fontSize: px(22),
    fontFamily: fontFamily.bold,
    color: '#111827',
    lineHeight: px(26),
  },

  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
  },

  chip: {
    height: 33,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radius.md,
    backgroundColor: colors.navy[50],
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipSelected: {
    backgroundColor: colors.surface.brand,
  },

  chipText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#4B5563',
    lineHeight: 17,
    textAlign: 'center',
  },

  chipTextSelected: {
    color: colors.text.brandDarker,
    fontFamily: fontFamily.bold,
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
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: '#111827',
    lineHeight: px(17),
  },

  countText: {
    alignSelf: 'flex-end',
    fontSize: px(14),
    fontFamily: fontFamily.medium,
    color: '#6B7280',
    lineHeight: px(17),
  },

  submitButton: {
    position: 'absolute',
    left: px(spacing.lg),
    right: px(spacing.lg),
    bottom: px(33),
    height: px(48),
    borderRadius: px(radius.md),
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#DADDE2',
  },

  submitButtonActive: {
    backgroundColor: colors.button.secondaryFill,
  },

  submitText: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    lineHeight: px(21),
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
    marginLeft: px(6),
    gap: px(3),
  },

  editPlaceIcon: {
    width: px(12),
    height: px(12),
    resizeMode: 'contain',
    tintColor: '#8A919E',
  },

  editPlaceText: {
    fontFamily: fontFamily.medium,
    fontSize: px(12),
    lineHeight: px(14),
    color: '#8A919E',
    includeFontPadding: false,
  },
});
