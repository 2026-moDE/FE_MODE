import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';

import {fontFamily, fontSize, lineHeight, letterSpacing} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import {MyProfile} from '../../api/mypage';

const settingIcon = require('../../assets/image/setting.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
  profile: MyProfile | null;
  isProfileLoading: boolean;
  onPressBack: () => void;
  onPressSettings: () => void;
  onPressFriends: () => void;
};

export default function ProfileHeaderCard({
  profile,
  isProfileLoading,
  onPressBack,
  onPressSettings,
  onPressFriends,
}: Props) {
  return (
    <View style={styles.profileCard}>
      {profile?.profile_image_url ? (
        <FastImage
          source={{
            uri: profile.profile_url ?? profile.profile_image_url,
            priority: FastImage.priority.high,
          }}
          style={styles.profileImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.profileImagePlaceholder} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={styles.profileScrim}
        pointerEvents="none"
      />

      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.profileIconButton, styles.profileBackButton]}
        onPress={onPressBack}>
        <IconArrowLeft size={px(25)} color={colors.icon.inverse} />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.profileIconButton, styles.profileSettingButton]}
        onPress={onPressSettings}>
        <Image source={settingIcon} style={styles.settingImage} resizeMode="contain" />
      </TouchableOpacity>

      <View style={styles.profileBottomRow}>
        {isProfileLoading && !profile ? (
          <ActivityIndicator size="small" color={colors.icon.inverse} />
        ) : (
          <Text style={styles.profileNickname}>{profile?.nickname ?? '닉네임'}</Text>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.friendCountRow}
          onPress={onPressFriends}>
          <View style={styles.friendCountTextRow}>
            <Text style={styles.profileFriendLabel}>친구</Text>
            <Text style={styles.profileFriendCount}>{profile?.follower_count ?? 0}</Text>
          </View>
          <IconChevronDown
            size={px(16)}
            color={colors.icon.inverse}
            style={styles.friendCountArrow}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    width: '100%',
    height: px(448),
    borderBottomLeftRadius: px(radius.xl),
    borderBottomRightRadius: px(radius.xl),
    overflow: 'hidden',
    backgroundColor: colors.background.dark,
  },

  profileImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  profileImagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.dark,
  },

  profileScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: px(120),
  },

  profileIconButton: {
    position: 'absolute',
    top: px(spacing.lg),
    width: px(36),
    height: px(36),
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileBackButton: {
    left: px(spacing.xl),
  },

  profileSettingButton: {
    right: px(spacing.xl),
  },

  settingImage: {
    width: px(28),
    height: px(28),
    tintColor: colors.icon.inverse,
  },

  profileBottomRow: {
    position: 'absolute',
    left: px(spacing.xl),
    right: px(spacing.xl),
    bottom: px(spacing.lg),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  profileNickname: {
    fontFamily: fontFamily.bold,
    fontSize: px(fontSize.h1),
    lineHeight: px(lineHeight.h1),
    color: colors.text.inverse,
  },

  friendCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(12),
  },

  friendCountTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: px(8),
  },

  friendCountArrow: {
    transform: [{rotate: '-90deg'}],
  },

  profileFriendLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: px(fontSize.b5),
    lineHeight: px(lineHeight.b5),
    letterSpacing: letterSpacing.b5,
    color: colors.text.inverse,
  },

  profileFriendCount: {
    fontFamily: fontFamily.regular,
    fontSize: px(fontSize.b6),
    lineHeight: px(lineHeight.b6),
    letterSpacing: letterSpacing.b6,
    color: colors.text.inverse,
  },
});
