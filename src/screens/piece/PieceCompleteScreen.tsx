import React from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {PieceStackParamList} from '../../types/navigation';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import DashedBorder from '../../components/common/DashedBorder';
import {typography, fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {padding, gap} from '../../constants/spacing';
import {radius} from '../../constants/radius';

type Props = NativeStackScreenProps<PieceStackParamList, 'PieceComplete'>;

// 시안 background/bg-dark
const BACKGROUND_COLOR = colors.background.dark;

// 후기 완료 화면과 같은 카드 그라데이션 (navy 900 투명 → surface.subtle)
const CARD_GRADIENT_TOP = 'rgba(27, 33, 41, 0)';

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
          <Image source={{uri: cutoutUri}} style={styles.piece} />

          <View style={styles.labelChip}>
            <Text style={styles.labelText} numberOfLines={1}>
              {label}
            </Text>

            <View style={styles.labelPlaceRow}>
              <IconPlaceLocation size={10} color={colors.icon.tertiary} />
              <Text style={styles.labelPlace} numberOfLines={1}>
                {placeName}
              </Text>
            </View>

            <DashedBorder radius={radius.lg} color={colors.border.default} />
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
    marginBottom: padding.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingTop: 100,
  },

  completeText: {
    ...typography.h2,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  pieceArea: {
    marginTop: gap['3xl'],
    width: '72%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  piece: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    // 시안처럼 살짝 기울여 둔다
    transform: [{rotate: '-6deg'}],
  },

  // 조각 오른쪽 아래에 걸치는 흰색 라벨
  labelChip: {
    position: 'absolute',
    right: 0,
    bottom: '12%',
    maxWidth: '62%',
    paddingHorizontal: padding.md,
    paddingVertical: padding.s,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.white,
    alignItems: 'center',
    gap: 2,
  },

  labelText: {
    ...typography.b5,
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
    fontFamily: fontFamily.medium,
    flexShrink: 1,
    color: colors.text.tertiary,
    includeFontPadding: false,
  },

  goButton: {
    marginHorizontal: padding.lg,
    marginBottom: 33,
    height: 48,
    borderRadius: radius.md,
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
