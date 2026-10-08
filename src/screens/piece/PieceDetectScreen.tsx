import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {PieceStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconCheck from '../../assets/icons/IconCheck';
import DistortedPhoto from '../../components/piece/DistortedPhoto';
import {
  extractSubject,
  getSubjectExtractionErrorCode,
  type ExtractedSubject,
} from '../../native/SubjectExtractor';
import {px, PHOTO_WIDTH, PHOTO_HEIGHT} from './photoFrame';
import {typography, fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<PieceStackParamList, 'PieceDetect'>;
type Status = 'detecting' | 'success' | 'failed';

const refreshCameraIcon = require('../../assets/image/refresh_camera.png');

// 시안의 피사체 윤곽선 색 (디자인 토큰에 없는 값이라 여기서만 씀)
const OUTLINE_COLOR = '#F0A868';

// 시안에서 사진 상단(129)과 안내 문구 중앙(184.5)의 간격
const TOAST_TOP = px(44);
// 왜곡 중에는 사진을 60%로 깔아 둔다 (시안 ShaderEffect 안쪽 opacity)
const DETECTING_OPACITY = 0.6;
// 시안 왜곡 애니메이션 한 바퀴 길이. 인식이 더 빨리 끝나도 이만큼은 보여준다
const DETECT_MIN_DURATION_MS = 2000;

const PieceDetectScreen = ({navigation, route}: Props) => {
  const {photoUri, reviewId, placeId, placeName} = route.params;

  const [status, setStatus] = useState<Status>('detecting');
  const [subject, setSubject] = useState<ExtractedSubject | null>(null);
  const [failureMessage, setFailureMessage] = useState('조각 인식이 불가능해요');

  useEffect(() => {
    let cancelled = false;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const startedAt = Date.now();

    // Vision 분석이 1초도 안 걸려서, 그냥 두면 "찾는 중" 화면과 왜곡 애니메이션이
    // 보이기도 전에 지나간다. 시안 애니메이션 한 바퀴(2초)는 채우고 넘어가게 함
    const holdForAnimation = () =>
      new Promise<void>(resolve => {
        const remaining = DETECT_MIN_DURATION_MS - (Date.now() - startedAt);

        if (remaining <= 0) {
          resolve();
          return;
        }

        holdTimer = setTimeout(resolve, remaining);
      });

    const run = async () => {
      try {
        const extracted = await extractSubject(photoUri);
        await holdForAnimation();

        if (cancelled) {
          return;
        }

        setSubject(extracted);
        setStatus('success');
      } catch (error) {
        const code = getSubjectExtractionErrorCode(error);
        console.log('[조각 인식 실패]', code, error);

        await holdForAnimation();

        if (cancelled) {
          return;
        }

        // 어떤 실패든 사용자가 할 수 있는 건 다시 찍는 것뿐이라 문구는 시안 그대로 두고,
        // 기기가 아예 지원하지 않는 경우만 따로 안내한다
        setFailureMessage(
          code === 'UNSUPPORTED_OS' || code === 'UNAVAILABLE'
            ? '이 기기에서는 조각을 만들 수 없어요'
            : '조각 인식이 불가능해요',
        );
        setStatus('failed');
      }
    };

    run();

    return () => {
      cancelled = true;

      if (holdTimer != null) {
        clearTimeout(holdTimer);
      }
    };
  }, [photoUri]);

  const handleRetake = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirm = useCallback(() => {
    if (subject == null) {
      return;
    }

    navigation.navigate('PieceInfo', {
      photoUri,
      cutoutUri: subject.uri,
      reviewId,
      placeId,
      placeName,
      capturedAt: new Date().toISOString(),
    });
  }, [navigation, photoUri, reviewId, placeId, placeName, subject]);

  const isDetecting = status === 'detecting';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.dark} />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.inverse} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 모으기</Text>

        {status === 'success' && (
          <Pressable
            style={styles.confirmButton}
            onPress={handleConfirm}
            hitSlop={10}>
            <IconCheck size={16} color={colors.icon.brand} />
            <Text style={styles.confirmText}>확인</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.photoBox}>
          {isDetecting ? (
            // 분석 중에는 시안의 Lens distortion 애니메이션을 입힌다
            <View style={styles.detectingPhoto}>
              <DistortedPhoto
                uri={photoUri}
                width={PHOTO_WIDTH}
                height={PHOTO_HEIGHT}
                animating={true}
              />
            </View>
          ) : (
            <Image source={{uri: photoUri}} style={styles.photo} />
          )}

          {status === 'success' && subject?.outlineUri != null && (
            <Image
              source={{uri: subject.outlineUri}}
              style={[styles.photo, styles.outline]}
            />
          )}

          {isDetecting && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>모을 조각을 찾는 중이에요</Text>
            </View>
          )}

          {status === 'failed' && (
            <View style={styles.failureToast}>
              <Text style={styles.failureToastText}>{failureMessage}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {status === 'success' && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>조각이 마음에 들지 않는다면?</Text>
          </View>
        )}

        <Pressable style={styles.retakeButton} onPress={handleRetake} hitSlop={10}>
          <Image source={refreshCameraIcon} style={styles.retakeIcon} />
          <Text style={styles.retakeText}>다시 찍기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default PieceDetectScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark,
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
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  confirmButton: {
    position: 'absolute',
    right: padding.lg,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  confirmText: {
    ...typography.b5,
    color: colors.text.brand,
    includeFontPadding: false,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoBox: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: radius['2xl'],
  },

  detectingPhoto: {
    opacity: DETECTING_OPACITY,
  },

  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius['2xl'],
    resizeMode: 'cover',
  },

  // 원본과 같은 해상도로 만들어진 흰색 윤곽선이라 같은 resizeMode로 겹치면 정확히 맞는다
  outline: {
    tintColor: OUTLINE_COLOR,
  },

  toast: {
    position: 'absolute',
    top: TOAST_TOP,
    alignSelf: 'center',
    paddingHorizontal: padding.lg,
    paddingVertical: padding.sm,
    borderRadius: radius.md,
  },

  toastText: {
    ...typography.b5,
    color: colors.text.inverse,
    textAlign: 'center',
    includeFontPadding: false,
  },

  failureToast: {
    position: 'absolute',
    bottom: padding.lg,
    alignSelf: 'center',
    paddingHorizontal: padding.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.background.dimDarkest,
  },

  failureToastText: {
    ...typography.c2,
    fontFamily: fontFamily.medium,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  footer: {
    height: px(106),
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.sm,
  },

  tooltip: {
    paddingHorizontal: padding.s,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
  },

  tooltipText: {
    ...typography.c2,
    fontFamily: fontFamily.medium,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.md,
  },

  retakeIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  retakeText: {
    ...typography.b3,
    color: colors.text.inverse,
    includeFontPadding: false,
  },
});
