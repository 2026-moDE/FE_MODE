import React, {forwardRef, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';

import {fontFamily, typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';

const kakaoIcon = require('../../assets/image/social_kakao.png');
const instagramIcon = require('../../assets/image/social_insta.png');
const xIcon = require('../../assets/image/social_x.png');
const threadsIcon = require('../../assets/image/social_thread.png');
const linkIcon = require('../../assets/image/social_etc.png');

const SHARE_OPTIONS = [
  {key: 'kakao', icon: kakaoIcon},
  {key: 'instagram', icon: instagramIcon},
  {key: 'x', icon: xIcon},
  {key: 'threads', icon: threadsIcon},
  {key: 'link', icon: linkIcon},
] as const;

type Props = {
  onSelectShare: () => void;
};

const ProfileShareModal = forwardRef<BottomSheetModal, Props>(function ProfileShareModal(
  {onSelectShare},
  ref,
) {
  const snapPoints = useMemo(() => ['32%'], []);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}>
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>프로필 공유</Text>

        <View style={styles.row}>
          {SHARE_OPTIONS.map(option => (
            <TouchableOpacity key={option.key} activeOpacity={0.8} onPress={onSelectShare}>
              <Image source={option.icon} style={styles.icon} resizeMode="contain" />
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ProfileShareModal;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background.dark,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    backgroundColor: colors.gray[600],
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.b1,
    fontFamily: fontFamily.bold,
    color: colors.text.inverse,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing['2xl'],
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
  },
});
