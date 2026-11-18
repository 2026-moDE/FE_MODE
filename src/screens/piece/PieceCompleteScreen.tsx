import React from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {PieceStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import DashedBorder from '../../components/common/DashedBorder';
import StickerCutout from '../../components/piece/StickerCutout';
import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<PieceStackParamList, 'PieceComplete'>;

// 시안 background/bg-dark
const BACKGROUND_COLOR = colors.background.dark;

// 후기 완료 화면과 같은 카드 그라데이션 (navy 900 투명 → surface.subtle)
const CARD_GRADIENT_TOP = 'rgba(27, 33, 41, 0)';

// 시안(393x852) 카드 안 배치. 카드는 헤더 아래 7, 위치 (17, 118)
// - 완료 문구: 카드 위에서 128
// - 조각: 카드 가운데보다 10 왼쪽, 중심이 카드 위에서 296 (시안 조각 121x134를 담는 박스)
// - 라벨: 조각 중심에서 왼쪽 8.5, 아래 43 지점이 라벨 왼쪽 위
const COMPLETE_TEXT_TOP = 128;
const PIECE_BOX_SIZE = 140;
const PIECE_CENTER_TOP = 296;
const PIECE_CENTER_OFFSET_X = -10;
const LABEL_OFFSET_X = -8.5;
const LABEL_OFFSET_Y = 43;

const PieceCompleteScreen = ({navigation, route}: Props) => {
  const {cutoutUri, placeName, label} = route.params;

  const handleGoHome = () => {
    navigation.getParent()?.navigate('Tab', {screen: 'Home'} as never);
  };

  const handleGoToPieces = () => {
    navigation.getParent()?.navigate('Tab', {screen: 'Mypage'} as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_COLOR} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleGoHome} hitSlop={10}>
          <IconArrowLeft size={24} color={colors.icon.inverse} />
        </Pressable>

        <Text style={styles.headerTitle}>조각 모으기</Text>
      </View>

      <LinearGradient
        colors={[CARD_GRADIENT_TOP, colors.surface.subtle]}
        style={styles.card}>
        <Text style={styles.completeText}>조각 등록이 완료되었어요</Text>

        <View style={styles.pieceArea}>
          <StickerCutout uri={cutoutUri} />

          <View style={styles.labelChip}>
            <Text style={styles.labelText} numberOfLines={1}>
              {label}
            </Text>

            <View style={styles.labelPlaceRow}>
              <IconPlaceLocation size={12} color={colors.icon.tertiary} />
              <Text style={styles.labelPlace} numberOfLines={1}>
                {placeName}
              </Text>
            </View>

            {/* 시안 점선: 1px, 2 칠하고 2 비움 */}
            <DashedBorder
              radius={radius.lg}
              color={colors.border.black}
              dash={[2, 2]}
            />
          </View>
        </View>
      </LinearGradient>

      <Pressable style={styles.goButton} onPress={handleGoToPieces}>
        <Text style={styles.goButtonText}>조각 보러가기</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default PieceCompleteScreen;

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

  card: {
    flex: 1,
    marginTop: 7,
    marginHorizontal: padding.lg,
    marginBottom: padding.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
  },

  completeText: {
    ...typography.h2,
    marginTop: COMPLETE_TEXT_TOP,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  pieceArea: {
    position: 'absolute',
    top: PIECE_CENTER_TOP - PIECE_BOX_SIZE / 2,
    left: '50%',
    marginLeft: PIECE_CENTER_OFFSET_X - PIECE_BOX_SIZE / 2,
    width: PIECE_BOX_SIZE,
    height: PIECE_BOX_SIZE,
  },

  // 조각 오른쪽 아래에 걸치는 흰색 라벨 (점선 테두리)
  labelChip: {
    position: 'absolute',
    left: PIECE_BOX_SIZE / 2 + LABEL_OFFSET_X,
    top: PIECE_BOX_SIZE / 2 + LABEL_OFFSET_Y,
    maxWidth: 160,
    paddingHorizontal: padding.md,
    paddingVertical: padding.s,
    borderRadius: radius.lg,
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    gap: gap.xs,
  },

  labelText: {
    ...typography.c1,
    color: colors.text.basic,
    includeFontPadding: false,
  },

  labelPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
  },

  labelPlace: {
    ...typography.c3,
    flexShrink: 1,
    color: colors.text.disabled,
    includeFontPadding: false,
  },

  // 시안: 카드 아래 16, 화면 아래(홈 바 영역 위) 8
  goButton: {
    marginHorizontal: padding.lg,
    marginBottom: gap.sm,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.button.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goButtonText: {
    ...typography.b3,
    color: colors.text.basic,
    includeFontPadding: false,
  },
});
