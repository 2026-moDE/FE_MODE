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

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const LogoutModal = ({visible, onClose, onLogout}: LogoutModalProps) => {
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
            로그아웃 하시겠어요?
          </Text>

          <Text allowFontScaling={false} style={styles.description}>
            로그아웃하면 다시 로그인해야{'\n'}
            서비스를 이용할 수 있어요.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.keepButton} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.keepButtonText}>
                취소
              </Text>
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={onLogout}>
              <Text allowFontScaling={false} style={styles.logoutButtonText}>
                로그아웃
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutModal;

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

  logoutButton: {
    width: 101,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },
});
