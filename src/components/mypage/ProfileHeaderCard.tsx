import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';

import {fontFamily, fontSize, lineHeight, letterSpacing} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import {MyProfile} from '../../api/mypage';

const settingIcon = require('../../assets/image/setting.png');

// 다른 유저 프로필(UserProfile)도 이 카드에 그대로 넘길 수 있도록 실제 사용하는 필드만 뽑아서 타입 지정
type ProfileHeaderInfo = Pick<
  MyProfile,
  'nickname' | 'profile_image_url' | 'profile_url' | 'friend_count'
>;

type Props = {
  profile: ProfileHeaderInfo | null;
  isProfileLoading: boolean;
  onPressBack: () => void;
  onPressSettings?: () => void;
  onPressFriends: () => void;
  showSettings?: boolean;
};

export default function ProfileHeaderCard({
  profile,
  isProfileLoading,
  onPressBack,
  onPressSettings,
  onPressFriends,
  showSettings = true,
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
        <IconArrowLeft size={20} color={colors.icon.inverse} />
      </TouchableOpacity>

      {showSettings && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.profileIconButton, styles.profileSettingButton]}
          onPress={onPressSettings}>
          <Image source={settingIcon} style={styles.settingImage} resizeMode="contain" />
        </TouchableOpacity>
      )}

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
            <Text style={styles.profileFriendCount}>{profile?.friend_count ?? 0}</Text>
          </View>
          <IconChevronDown
            size={16}
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
    height: 448,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
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
    height: 120,
  },

  profileIconButton: {
    position: 'absolute',
    top: spacing.lg,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileBackButton: {
    left: spacing.lg,
  },

  profileSettingButton: {
    right: spacing.lg,
  },

  settingImage: {
    width: 20,
    height: 20,
    tintColor: colors.icon.inverse,
  },

  profileBottomRow: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  profileNickname: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h1,
    lineHeight: lineHeight.h1,
    color: colors.text.inverse,
  },

  friendCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  friendCountTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  friendCountArrow: {
    transform: [{rotate: '-90deg'}],
  },

  profileFriendLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.b5,
    lineHeight: lineHeight.b5,
    letterSpacing: letterSpacing.b5,
    color: colors.text.inverse,
  },

  profileFriendCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.b6,
    lineHeight: lineHeight.b6,
    letterSpacing: letterSpacing.b6,
    color: colors.text.inverse,
  },
});
