import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const cautionIcon = require('../../assets/image/caution.png');

type WithdrawModalProps = {
  visible: boolean;
  onClose: () => void;
  onWithdraw: () => void;
};

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

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
    width: px(320),
    backgroundColor: colors.surface.white,
    borderRadius: px(radius['2xl']),
    paddingVertical: px(spacing.xl),
    paddingHorizontal: px(spacing.xl),
    alignItems: 'center',
  },

  cautionIcon: {
    width: px(60),
    height: px(60),
    marginBottom: px(spacing.s),
  },

  title: {
    fontSize: px(fontSize.h2),
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
    lineHeight: px(26),
    letterSpacing: -0.3,
    includeFontPadding: false,
    marginBottom: px(spacing.s),
  },

  description: {
    width: px(280),
    fontSize: px(fontSize.b2),
    fontFamily: fontFamily.medium,
    color: colors.text.subtle,
    textAlign: 'center',
    lineHeight: px(17),
    includeFontPadding: false,
    marginBottom: px(spacing.lg),
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: px(280),
    gap: px(spacing.md),
  },

  cancelButton: {
    flex: 1,
    height: px(42),
    borderRadius: px(radius.lg),
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: px(fontSize.b2),
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
    lineHeight: px(17),
    includeFontPadding: false,
  },

  withdrawButton: {
    width: px(101),
    height: px(42),
    borderRadius: px(radius.lg),
    paddingVertical: px(spacing.sm),
    paddingHorizontal: px(spacing['3xl']),
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  withdrawButtonText: {
    fontSize: px(fontSize.b2),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: px(17),
    includeFontPadding: false,
  },
});
