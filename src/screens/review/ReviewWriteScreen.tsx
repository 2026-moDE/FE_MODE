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
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {ReviewStackParamList} from '../../types/navigation';

import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {fontFamily} from '../../constants/typography';

import {getPresignedUrl, uploadImageToS3, createReview, verifyPlaceLocation, type CongestionLevel,} from '../../api/review';

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
      return 'MODERATE';
    case '혼잡':
      return 'CROWDED';
  }
};
type CongestionType = (typeof CONGESTION_OPTIONS)[number];

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const MAX_REVIEW_LENGTH = 50;

const ReviewWriteScreen = ({navigation, route}: Props) => {
  const {photoUri, placeId, placeName} = route.params;

  const [selectedCongestion, setSelectedCongestion] =
    useState<CongestionType | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitActive = useMemo(() => {
    return !!placeName && !!selectedCongestion && !isSubmitting;
  }, [placeName, selectedCongestion, isSubmitting]);

    const handlePressPlace = () => {
      navigation.getParent()?.navigate('Search', {
        reviewPhotoUri: photoUri,
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

    try {
      setIsSubmitting(true);
      
      const latitude = 37.5660;
      const longitude = 126.9823;

      const locationResult = await verifyPlaceLocation(
        Number(placeId),
        latitude,
        longitude,
      );

      console.log('위치 인증 결과:', locationResult);

      if (!locationResult.verified) {
        Alert.alert(
          '위치 인증 실패',
          `해당 장소에서 ${locationResult.distance}m 떨어져 있어요.`,
        );
        return;
      }

      const fileName = `review_${Date.now()}.jpg`;

      // 1. presigned-url 발급
      const {presigned_url, image_url} = await getPresignedUrl(fileName);

      // 2. S3 업로드
      await uploadImageToS3(photoUri, presigned_url);

      console.log('S3 업로드 성공 image_url:', image_url);

      // 3. 리뷰 등록
      const trimmedComment = reviewText.trim();

      const reviewBody: {
        place_id: number;
        image_url: string;
        congestion_level: CongestionLevel;
        latitude: number;
        longitude: number;
        comment?: string;
      } = {
        place_id: Number(placeId),
        image_url,
        congestion_level: getCongestionLevel(selectedCongestion),
        latitude,
        longitude,
      };

      if (trimmedComment.length > 0) {
        reviewBody.comment = trimmedComment;
      }

      console.log('리뷰 등록 request body:', reviewBody);

      const review = await createReview(reviewBody);

      // 4. 완료 화면 이동
      navigation.navigate('ReviewComplete');
    } catch (error) {
      console.log('리뷰 등록 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={10}>
            <IconArrowLeft size={px(24)} color="#1F2933" />
          </Pressable>

          <Text style={styles.headerTitle}>후기 작성</Text>
        </View>

        <View style={styles.content}>

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
                <Text style={styles.dateText}>2026.4.23 (목) 20:11</Text>
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
                placeholder="50자 이내로 짧은 코멘트 작성해주세요."
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
        </View>

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
            {isSubmitting ? '등록 중...' : '✓  등록하기'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReviewWriteScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: px(16),
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
    paddingHorizontal: px(16),
    paddingTop: px(16),
    paddingBottom: px(90),
  },

  placeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: px(32),
  },

  photoWrapper: {
    width: px(105),
    height: px(105),
    borderRadius: px(12),
    overflow: 'hidden',
    position: 'relative',
  },

  photo: {
    width: px(105),
    height: px(105),
    borderRadius: px(12),
  },

  retakeButton: {
    position: 'absolute',
    left: px(12),
    top: px(40),
    width: px(81),
    height: px(24),
    borderRadius: px(8),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(4),
  },

  retakeIcon: {
    width: px(12),
    height: px(12),
    resizeMode: 'contain',
  },

  retakeText: {
    fontSize: px(12),
    fontFamily: fontFamily.medium,
    color: '#FFFFFF',
  },

  placeInfo: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 6,
  },

  placeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: px(20),
    color: '#111114',
    lineHeight: px(24),
    marginRight: px(4),
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
    marginRight: px(8),
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
    marginBottom: 32,
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
    gap: 8,
    marginTop: 8,
  },

  chip: {
    height: 33,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipSelected: {
    backgroundColor: '#83A6FF',
  },

  chipText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: '#4B5563',
    lineHeight: 17,
  },

  chipTextSelected: {
    color: '#FFFFFF',
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
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
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
    left: px(16),
    right: px(16),
    bottom: px(33),
    height: px(48),
    borderRadius: px(8),
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#DADDE2',
  },

  submitButtonActive: {
    backgroundColor: '#2C343F',
  },

  submitText: {
    fontSize: px(18),
    fontFamily: fontFamily.bold,
    lineHeight: px(21),
  },

  submitTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.7,
  },

  submitTextActive: {
    color: '#FFFFFF',
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
