import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import {useNavigation} from '@react-navigation/native';
import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import type {MyProfile} from '../../api/mypage';

const pencilIcon = require('../../assets/image/pencil.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

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
        {profile?.profile_image_url ? (
          <FastImage
            source={{
              uri: profile.profile_url ?? profile.profile_image_url,
              priority: FastImage.priority.high,
            }}
            style={styles.profileImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  profileArea: {
    alignItems: 'center',
    paddingTop: px(15),
    paddingBottom: px(18),
  },

  profileImageBox: {
    width: px(88),
    height: px(88),
    borderRadius: px(radius.lg),
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
    marginTop: px(spacing.md),
  },

  nicknameRow: {
    marginTop: px(spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nickname: {
    fontFamily: fontFamily.bold,
    fontSize: px(18),
    lineHeight: px(22),
    color: '#000000',
  },

  editButton: {
    marginLeft: px(spacing.sm),
    width: px(16),
    height: px(16),
    alignItems: 'center',
    justifyContent: 'center',
  },

  pencilImage: {
    width: px(16),
    height: px(16),
    tintColor: '#9A9A9A',
  },
});