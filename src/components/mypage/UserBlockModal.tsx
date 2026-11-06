import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable, Image} from 'react-native';

import {
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';

const cautionIcon = require('../../assets/image/caution_yellow.png');

type UserBlockModalProps = {
  visible: boolean;
  // 'block' = 차단 확인, 'unblock' = 차단 해제 확인
  mode: 'block' | 'unblock';
  nickname: string;
  onClose: () => void;
  onConfirm: () => void;
};

// 사용자 차단 / 차단 해제 확인 모달 (친구 삭제 모달과 동일한 레이아웃)
const UserBlockModal = ({
  visible,
  mode,
  nickname,
  onClose,
  onConfirm,
}: UserBlockModalProps) => {
  const isBlock = mode === 'block';

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
            {isBlock
              ? `${nickname}님을 차단할까요?`
              : `${nickname}님을 차단 해제할까요?`}
          </Text>

          {/* 친구 관계가 끊기는 건(그리고 해제해도 안 돌아오는 건) 되돌릴 수 없어서 양쪽 모두 알려준다 */}
          <Text allowFontScaling={false} style={styles.description}>
            {isBlock ? (
              <>
                차단하면 서로의 리뷰와 댓글이 보이지 않습니다.{'\n'}
                친구 관계도 함께 해제되며, 차단을 해제해도{'\n'}
                자동으로 복구되지 않습니다.
              </>
            ) : (
              '차단을 해제해도 친구 관계는 복구되지 않습니다.'
            )}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.cancelButtonText}>
                취소
              </Text>
            </Pressable>

            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Text allowFontScaling={false} style={styles.confirmButtonText}>
                {isBlock ? '차단' : '차단 해제'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserBlockModal;

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
    textAlign: 'center',
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
    marginBottom: spacing.xl,
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

  confirmButton: {
    width: 101,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },
});
