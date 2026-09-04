import React, {useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {fontFamily, fontSize, lineHeight, letterSpacing} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconChevronDown from '../../assets/icons/IconChevronDown';
import IconFriend from '../../assets/icons/IconFriend';
import {MyProfile} from '../../api/mypage';
import ProfileAvatar from '../common/ProfileAvatar';

const settingIcon = require('../../assets/image/setting.png');
const menuIcon = require('../../assets/image/vertical_ellipis.png');

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
  // 없으면 친구 수를 눌러도 갈 곳이 없다는 뜻 - 화살표를 숨기고 탭도 막음 (다른 유저 마이페이지)
  onPressFriends?: () => void;
  showSettings?: boolean;
  // 이미 친구인 다른 유저 마이페이지에서 닉네임 앞에 별 배지 표시
  isFriend?: boolean;
  // 친구 마이페이지에서만 넘겨줌 - 있으면 설정 톱니 대신 ⋮ 메뉴(신고하기/친구 끊기) 버튼을 보여줌
  // 버튼의 실제 화면 좌표(measureInWindow)를 같이 넘겨서, 드롭다운이 세이프에어리어 계산 없이 버튼 바로 밑에 붙게 함
  onPressMenu?: (anchor: {top: number; right: number}) => void;
};

export default function ProfileHeaderCard({
  profile,
  isProfileLoading,
  onPressBack,
  onPressSettings,
  onPressFriends,
  showSettings = true,
  isFriend = false,
  onPressMenu,
}: Props) {
  const menuButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const handlePressMenu = () => {
    menuButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      onPressMenu?.({
        top: y + height,
        right: Dimensions.get('window').width - (x + width),
      });
    });
  };

  return (
    <View style={styles.profileCard}>
      <ProfileAvatar
        profileUrl={profile?.profile_url}
        profileImageUrl={profile?.profile_image_url}
        style={styles.profileImage}
      />

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

      {onPressMenu ? (
        <TouchableOpacity
          ref={menuButtonRef}
          activeOpacity={0.7}
          style={[styles.profileIconButton, styles.profileMenuButton]}
          onPress={handlePressMenu}>
          <Image source={menuIcon} style={styles.settingImage} resizeMode="contain" />
        </TouchableOpacity>
      ) : (
        showSettings && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.profileIconButton, styles.profileSettingButton]}
            onPress={onPressSettings}>
            <Image source={settingIcon} style={styles.settingImage} resizeMode="contain" />
          </TouchableOpacity>
        )
      )}

      <View style={styles.profileBottomRow}>
        {isProfileLoading && !profile ? (
          <ActivityIndicator size="small" color={colors.icon.inverse} />
        ) : (
          <View style={styles.nicknameRow}>
            {isFriend && <IconFriend size={24} color={colors.icon.brand} />}
            <Text style={[styles.profileNickname, isFriend && styles.profileNicknameFriend]}>
              {profile?.nickname ?? '닉네임'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.friendCountRow}
          disabled={!onPressFriends}
          onPress={onPressFriends}>
          <View style={styles.friendCountTextRow}>
            <Text style={styles.profileFriendLabel}>친구</Text>
            <Text style={styles.profileFriendCount}>{profile?.friend_count ?? 0}</Text>
          </View>
          {/* 이동할 곳이 있을 때만 화살표 표시 - 안 그러면 눌러도 아무 일 없는데 눌리는 것처럼 보임 */}
          {!!onPressFriends && (
            <IconChevronDown
              size={16}
              color={colors.icon.inverse}
              style={styles.friendCountArrow}
            />
          )}
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

  profileMenuButton: {
    width: 32,
    height: 32,
    right: 15,
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

  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  profileNickname: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h1,
    lineHeight: lineHeight.h1,
    color: colors.text.inverse,
  },

  profileNicknameFriend: {
    color: colors.icon.brand,
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
