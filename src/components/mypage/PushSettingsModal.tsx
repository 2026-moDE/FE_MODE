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

type PushSettingsModalProps = {
  visible: boolean;
  // 끄려고 눌렀는지(true) 켜려고 눌렀는지(false) — 안내 문구가 달라진다
  isTurningOff: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
};

// 앱에서는 OS 알림 권한을 끌 수 없고, 한 번 거부된 뒤엔 다시 켜게 할 수도 없다.
// 두 경우 모두 OS 설정으로 보내야 해서 이 모달로 안내한다.
const PushSettingsModal = ({
  visible,
  isTurningOff,
  onClose,
  onOpenSettings,
}: PushSettingsModalProps) => {
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
            {isTurningOff ? '알림을 끄시겠어요?' : '알림이 꺼져 있어요'}
          </Text>

          <Text allowFontScaling={false} style={styles.description}>
            {isTurningOff ? (
              <>
                푸시 알림은 기기 설정에서 끌 수 있어요.{'\n'}
                설정으로 이동할까요?
              </>
            ) : (
              <>
                기기 설정에서 moing 알림을 허용하면{'\n'}
                알림을 받을 수 있어요.
              </>
            )}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.keepButton} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.keepButtonText}>
                취소
              </Text>
            </Pressable>

            <Pressable style={styles.settingsButton} onPress={onOpenSettings}>
              <Text allowFontScaling={false} style={styles.settingsButtonText}>
                설정으로 이동
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PushSettingsModal;

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

  settingsButton: {
    width: 130,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsButtonText: {
    fontSize: fontSize.b5,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    includeFontPadding: false,
  },
});
