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

type ReviewExitModalProps = {
  visible: boolean;
  onClose: () => void;
  onExit: () => void;
};

const ReviewExitModal = ({
  visible,
  onClose,
  onExit,
}: ReviewExitModalProps) => {
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
            아직 리뷰 작성 중이에요!
          </Text>

          <Text allowFontScaling={false} style={styles.description}>
            이대로 나가면 작성 중인 리뷰가 삭제돼요.{'\n'}
            나가시겠어요?
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.keepButton} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.keepButtonText}>
                계속 작성하기
              </Text>
            </Pressable>

            <Pressable style={styles.exitButton} onPress={onExit}>
              <Text allowFontScaling={false} style={styles.exitButtonText}>
                나가기
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewExitModal;

const styles = StyleSheet.create({
  // 반투명 배경입니다.
  overlay: {
    flex: 1,
    backgroundColor: colors.background.dimDarker,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 흰색 컨테이너
  modalBox: {
    width: 320,
    backgroundColor: colors.surface.white,
    borderRadius: radius['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },

  // 아이콘 박스
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
    marginBottom: spacing.xl,
  },

  // 하단 버튼
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    gap: spacing.md,
  },

  keepButton: {
    flex: 1,
    height: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  keepButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },

  exitButton: {
    width: 101,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exitButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },
});
