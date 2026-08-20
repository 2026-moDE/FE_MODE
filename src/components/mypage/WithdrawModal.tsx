import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';

import {
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const cautionIcon = require('../../assets/image/caution.png');

type WithdrawModalProps = {
  visible: boolean;
  onClose: () => void;
  onWithdraw: () => void;
};

export default function WithdrawModal({
  visible,
  onClose,
  onWithdraw,
}: WithdrawModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Image
            source={cautionIcon}
            style={styles.cautionIcon}
            resizeMode="contain"
          />

          <Text allowFontScaling={false} style={styles.title}>
            정말 탈퇴하시겠어요?
          </Text>

          <Text allowFontScaling={false} style={styles.description}>
            탈퇴 시 계정 정보와 작성한 콘텐츠는{'\n'}삭제되며 복구할 수 없습니다.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.cancelButtonText}>
                취소하기
              </Text>
            </Pressable>

            <Pressable style={styles.withdrawButton} onPress={onWithdraw}>
              <Text allowFontScaling={false} style={styles.withdrawButtonText}>
                탈퇴
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.dimDarker,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: 320,
    backgroundColor: colors.surface.white,
    borderRadius: radius['2xl'],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },

  cautionIcon: {
    width: 60,
    height: 60,
    marginBottom: spacing.s,
  },

  title: {
    fontSize: fontSize.h2,
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
    lineHeight: 26,
    letterSpacing: -0.3,
    includeFontPadding: false,
    marginBottom: spacing.s,
  },

  description: {
    width: 280,
    fontSize: fontSize.b6,
    fontFamily: fontFamily.medium,
    color: colors.text.subtle,
    textAlign: 'center',
    lineHeight: lineHeight.b6,
    letterSpacing: letterSpacing.b6,
    includeFontPadding: false,
    marginBottom: spacing.lg,
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    gap: spacing.md,
  },

  cancelButton: {
    flex: 1,
    height: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },

  withdrawButton: {
    width: 101,
    height: 42,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing['3xl'],
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  withdrawButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },
});
