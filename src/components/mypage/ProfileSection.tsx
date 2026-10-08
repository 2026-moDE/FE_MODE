import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator} from 'react-native';
import FastImage from '@d11/react-native-fast-image';

import {useNavigation} from '@react-navigation/native';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import type {MyProfile} from '../../api/mypage';
import ProfileAvatar from '../common/ProfileAvatar';

const pencilIcon = require('../../assets/image/pencil.png');

type Props = {
  profile: MyProfile | null;
  isLoading: boolean;
  onEditPress?: () => void;
};

export default function ProfileSection({
  profile,
  isLoading,
  onEditPress,
}: Props) {
  const navigation = useNavigation<any>();

  const handleEditPress = () => {
    if (onEditPress) {
      onEditPress();
      return;
    }

    navigation.navigate('ProfileEdit', {
      nickname: profile?.nickname ?? '',
      profileImageUrl: profile?.profile_image_url ?? null,
    });
  };

  return (
    <View style={styles.profileArea}>
      <View style={styles.profileImageBox}>
        <ProfileAvatar
          profileUrl={profile?.profile_url}
          profileImageUrl={profile?.profile_image_url}
          style={styles.profileImage}
        />
      </View>

      {isLoading && !profile ? (
        <ActivityIndicator
          size="small"
          color={colors.icon.basic}
          style={styles.loading}
        />
      ) : (
        <View style={styles.nicknameRow}>
          <Text style={styles.nickname}>
            {profile?.nickname ?? '닉네임'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.editButton}
            onPress={handleEditPress}>
            <Image
              source={pencilIcon}
              style={styles.pencilImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.followRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.followItem}
          onPress={() => navigation.navigate('FollowList')}>
          <Text style={styles.followLabel}>친구</Text>
          <Text style={styles.followCount}>{profile?.friend_count ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileArea: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 18,
  },

  profileImageBox: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  loading: {
    marginTop: spacing.md,
  },

  nicknameRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nickname: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: '#000000',
  },

  editButton: {
    marginLeft: spacing.sm,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pencilImage: {
    width: 16,
    height: 16,
    tintColor: '#9A9A9A',
  },

  followRow: {
    width: '100%',
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 123,
  },

  followItem: {
    alignItems: 'center',
  },

  followLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.tertiary,
  },

  followCount: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.text.basic,
  },
});