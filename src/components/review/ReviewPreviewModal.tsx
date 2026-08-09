import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

import {fontFamily, fontSize} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import IconGlobe from '../../assets/icons/IconGlobe';
import IconStar from '../../assets/icons/IconStar';

export type ReviewVisibility = 'all' | 'friends';

type ReviewPreviewModalProps = {
  visible: boolean;
  photoUri: string;
  reviewText: string;
  onChangeVisibility: (visibility: ReviewVisibility) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

const ReviewPreviewModal = ({
  visible,
  photoUri,
  reviewText,
  onChangeVisibility,
  isSubmitting,
  onClose,
  onSubmit,
}: ReviewPreviewModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text allowFontScaling={false} style={styles.title}>
                잠깐! 이렇게 올라가요
              </Text>

              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
                <Text allowFontScaling={false} style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.imageWrapper}>
              <Image source={{uri: photoUri}} style={styles.image} resizeMode="cover" />

              <View style={styles.commentArea} pointerEvents="none">
                {!!reviewText && (
                  <Text allowFontScaling={false} style={styles.comment}>
                    {reviewText}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.visibilityRow}>
              <Pressable
                style={[styles.visibilityButton, isSubmitting && styles.visibilityButtonDisabled]}
                disabled={isSubmitting}
                onPress={() => {
                  onChangeVisibility('all');
                  onSubmit();
                }}>
                <IconGlobe size={px(16)} color={colors.text.inverse} />
                <Text allowFontScaling={false} style={styles.visibilityTextAll}>
                  전체 공개
                </Text>
              </Pressable>

              <Pressable
                style={[styles.visibilityButton, isSubmitting && styles.visibilityButtonDisabled]}
                disabled={isSubmitting}
                onPress={() => {
                  onChangeVisibility('friends');
                  onSubmit();
                }}>
                <IconStar size={px(16)} color={colors.text.brand} filled />
                <Text allowFontScaling={false} style={styles.visibilityTextFriends}>
                  친구 공개
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewPreviewModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.dimDarker,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: px(340),
    maxHeight: SCREEN_HEIGHT * 0.86,
    backgroundColor: colors.background.dimDarker,
    borderRadius: px(radius['2xl']),
    paddingTop: px(spacing.xl),
    paddingHorizontal: px(spacing.lg),
    paddingBottom: px(spacing.xl),
  },

  scrollContent: {
    paddingBottom: px(spacing.md),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: px(spacing.lg),
  },

  title: {
    fontSize: px(fontSize.h4),
    lineHeight: px(28),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  closeButton: {
    width: px(28),
    height: px(28),
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: px(28),
    lineHeight: px(28),
    fontFamily: fontFamily.regular,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  imageWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: px(radius.xl),
    overflow: 'hidden',
    backgroundColor: colors.surface.muted,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  commentArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: px(spacing['2xl']),
  },

  comment: {
    fontSize: px(fontSize.b2),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  visibilityRow: {
    flexDirection: 'row',
    gap: px(spacing.s),
    marginTop: px(spacing.lg),
  },

  visibilityButton: {
    flex: 1,
    height: px(44),
    borderRadius: px(radius.lg),
    backgroundColor: colors.background.dimDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(spacing.xs),
  },

  visibilityButtonDisabled: {
    opacity: 0.6,
  },

  visibilityTextAll: {
    fontSize: px(14),
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    includeFontPadding: false,
  },

  visibilityTextFriends: {
    fontSize: px(14),
    fontFamily: fontFamily.bold,
    color: colors.text.brand,
    includeFontPadding: false,
  },
});
