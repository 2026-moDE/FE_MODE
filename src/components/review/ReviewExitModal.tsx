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


type ReviewExitModalProps = {
  visible: boolean;
  onClose: () => void;
  onExit: () => void;
};

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

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
    width: px(320),
    backgroundColor: colors.surface.white,
    borderRadius: px(radius['2xl']),
    paddingTop: px(spacing.xl),
    paddingBottom: px(spacing.xl),
    paddingHorizontal: px(spacing.xl),
    alignItems: 'center',
  },

  // 아이콘 박스
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
    marginBottom: px(spacing.xl),
  },

  // 하단 버튼
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: px(280),
    gap: px(spacing.md),
  },

  keepButton: {
    flex: 1,
    height: px(42),
    borderRadius: px(radius.lg),
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  keepButtonText: {
    fontSize: px(fontSize.b2),
    fontFamily: fontFamily.bold,
    color: colors.text.basic,
    lineHeight: px(17),
    includeFontPadding: false,
  },

  exitButton: {
    width: px(101),
    height: px(42),
    borderRadius: px(radius.lg),
    backgroundColor: colors.button.secondaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exitButtonText: {
    fontSize: px(fontSize.b2),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    lineHeight: px(17),
    includeFontPadding: false,
  },
});
