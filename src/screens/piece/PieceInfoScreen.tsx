import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {PieceStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import {createPiece, getPieceImagePresignedUrl} from '../../api/piece';
import {uploadImageToS3} from '../../api/imageUpload';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<PieceStackParamList, 'PieceInfo'>;

const refreshCameraIcon = require('../../assets/image/refresh_camera.png');
const timerIcon = require('../../assets/icons/ic_round-timer.png');

const MAX_LABEL_LENGTH = 10;

const TOGGLE_TRACK_WIDTH = 44;
const TOGGLE_TRACK_HEIGHT = 24;
const TOGGLE_PADDING = 3;
const TOGGLE_THUMB_SIZE = 18;
const TOGGLE_TRAVEL = TOGGLE_TRACK_WIDTH - TOGGLE_PADDING * 2 - TOGGLE_THUMB_SIZE;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatCapturedAt = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${
    DAYS[date.getDay()]
  }) ${hours}:${minutes}`;
};

// SettingScreen의 토글과 같은 생김새 (공용 컴포넌트가 아직 없어서 같은 수치로 맞춤)
function ToggleSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [anim, value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOGGLE_TRAVEL],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)} hitSlop={8}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <Animated.View
          style={[styles.toggleThumb, {transform: [{translateX}]}]}
        />
      </View>
    </Pressable>
  );
}

const PieceInfoScreen = ({navigation, route}: Props) => {
  const {cutoutUri, reviewId, placeName, capturedAt} = route.params;

  const [showOnProfile, setShowOnProfile] = useState(true);
  const [label, setLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const trimmedLabel = label.trim();
  const isSubmitActive = trimmedLabel.length > 0 && !isSubmitting;

  const handleRetake = () => {
    // 촬영 화면까지 되돌아감 (PieceCamera → PieceDetect → PieceInfo)
    navigation.popTo('PieceCamera', route.params);
  };

  const handleSubmit = async () => {
    if (!isSubmitActive) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 누끼는 투명 배경 PNG라 리뷰 사진(JPEG)과 다른 경로/타입으로 올린다.
      // piece/ 경로는 썸네일 변환을 안 타서 투명 배경이 유지됨
      const {presigned_url, image_url} = await getPieceImagePresignedUrl(
        `piece_${Date.now()}.png`,
      );
      console.log('[조각] presigned-url 발급 완료');

      // 발급 때 쓴 content_type과 PUT 헤더가 다르면 S3가 403을 준다 - 양쪽 다 image/png
      await uploadImageToS3({
        presignedUrl: presigned_url,
        imageUri: cutoutUri,
        contentType: 'image/png',
      });
      console.log('[조각] S3 업로드 완료 image_url:', image_url);

      // 일시/장소는 서버가 원본 리뷰에서 가져가므로 보내지 않는다
      await createPiece({
        review_id: reviewId,
        image_url,
        name: trimmedLabel,
        visibility: showOnProfile ? 'PUBLIC' : 'PRIVATE',
      });

      navigation.navigate('PieceComplete', {
        cutoutUri,
        placeName,
        label: trimmedLabel,
      });
    } catch (error) {
      console.log('[조각 등록 실패]', error);

      // 리뷰 1건당 조각 1개라 이미 만든 리뷰면 409가 온다 - 재시도해도 소용없는 경우라 따로 안내
      const status = (error as {response?: {status?: number}})?.response?.status;

      Alert.alert(
        '오류',
        status === 409
          ? '이 리뷰로는 이미 조각을 만들었어요.'
          : '조각을 등록하지 못했어요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.basic} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 모으기</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Image source={{uri: cutoutUri}} style={styles.cutout} />

          <View style={styles.cardFooter}>
            <View style={styles.cardMeta}>
              <Text style={styles.cardPlace} numberOfLines={1}>
                {placeName}
              </Text>

              <View style={styles.cardDateRow}>
                <Image source={timerIcon} style={styles.cardDateIcon} />
                <Text style={styles.cardDate}>{formatCapturedAt(capturedAt)}</Text>
              </View>
            </View>

            <Pressable style={styles.retakeChip} onPress={handleRetake} hitSlop={8}>
              <Image source={refreshCameraIcon} style={styles.retakeChipIcon} />
              <Text style={styles.retakeChipText}>다시 찍기</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.profileRow}>
          <Text style={styles.sectionLabel}>프로필에 표시하기</Text>
          <ToggleSwitch value={showOnProfile} onValueChange={setShowOnProfile} />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          어떤 조각인가요?
        </Text>

        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="조각 이름을 적어주세요"
            placeholderTextColor={colors.text.disabled}
            maxLength={MAX_LABEL_LENGTH}
            returnKeyType="done"
            // 입력창이 화면 아래쪽이라, 키보드가 올라오면 끝까지 스크롤해서 가려지지 않게 한다
            onFocus={() =>
              requestAnimationFrame(() => scrollRef.current?.scrollToEnd({animated: true}))
            }
          />

          <View style={styles.counterRow}>
            <Text style={styles.counterCurrent}>{label.length}</Text>
            <Text style={styles.counterTotal}>/ {MAX_LABEL_LENGTH}</Text>
          </View>
        </View>
      </ScrollView>

        <Pressable
          style={[styles.submitButton, !isSubmitActive && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isSubmitActive}>
          <Text
            style={[styles.submitText, !isSubmitActive && styles.submitTextDisabled]}>
            완료
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PieceInfoScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: padding.lg,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.b1,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  keyboardArea: {
    flex: 1,
  },

  body: {
    flex: 1,
    paddingHorizontal: padding.lg,
  },

  bodyContent: {
    paddingBottom: gap.xl,
  },

  // 시안 393x852 기준: 카드 361x307, 헤더(111) 아래 18
  card: {
    height: 307,
    marginTop: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface.inverse,
    overflow: 'hidden',
  },

  // 시안에서 조각은 카드 가운데가 아니라 살짝 위에 놓인다 (아래 장소명과 겹치지 않게)
  cutout: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    height: '65%',
    resizeMode: 'contain',
  },

  cardFooter: {
    position: 'absolute',
    left: padding.lg,
    right: padding.lg,
    bottom: padding.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: gap.sm,
  },

  cardMeta: {
    flexShrink: 1,
    gap: 2,
  },

  cardPlace: {
    ...typography.b5,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  cardDateIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    tintColor: colors.text.disabled,
  },

  // 장소명은 흰색이지만 일시는 한 단계 흐린 회색 (시안 text-disabled)
  cardDate: {
    ...typography.c2,
    color: colors.text.disabled,
    includeFontPadding: false,
  },

  retakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
    paddingHorizontal: padding.s,
    paddingVertical: padding.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background.dimDarkest,
  },

  retakeChipIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },

  retakeChipText: {
    ...typography.c2,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  profileRow: {
    marginTop: gap.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionLabel: {
    ...typography.b1,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  // 토글 행은 행 자체에 marginTop이 있어서, 단독으로 놓이는 라벨에만 간격을 준다
  sectionLabelSpaced: {
    marginTop: gap.xl,
  },

  inputBox: {
    marginTop: gap.md,
    padding: padding.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: gap.sm,
  },

  input: {
    ...typography.c2,
    flex: 1,
    padding: 0,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  counterCurrent: {
    ...typography.c1,
    color: colors.text.subtle,
    includeFontPadding: false,
  },

  counterTotal: {
    ...typography.c2,
    color: colors.text.disabled,
    includeFontPadding: false,
  },

  submitButton: {
    marginHorizontal: padding.lg,
    marginBottom: gap.sm,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: colors.button.disabledFill,
  },

  submitText: {
    ...typography.b3,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  submitTextDisabled: {
    color: colors.text.disabled,
  },

  toggleTrack: {
    width: TOGGLE_TRACK_WIDTH,
    height: TOGGLE_TRACK_HEIGHT,
    borderRadius: TOGGLE_TRACK_HEIGHT / 2,
    padding: TOGGLE_PADDING,
    justifyContent: 'center',
    backgroundColor: colors.border.strong,
  },

  toggleTrackOn: {
    backgroundColor: colors.brand.secondary,
  },

  toggleThumb: {
    width: TOGGLE_THUMB_SIZE,
    height: TOGGLE_THUMB_SIZE,
    borderRadius: TOGGLE_THUMB_SIZE / 2,
    backgroundColor: colors.white,
  },
});
