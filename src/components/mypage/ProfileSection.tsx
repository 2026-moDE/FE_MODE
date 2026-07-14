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

import {useNavigation} from '@react-navigation/native';
import {fontFamily} from '../../constants/typography';
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
          <Image
            source={{
              uri: profile.profile_image_url,
              cache: 'reload',
            }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : null}
      </View>

      {isLoading && !profile ? (
        <ActivityIndicator
          size="small"
          color="#2C343F"
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
    borderRadius: px(12),
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#E0E0E4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  loading: {
    marginTop: px(12),
  },

  nicknameRow: {
    marginTop: px(12),
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
    marginLeft: px(10),
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