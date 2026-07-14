import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';

const pencilIcon = require('../../assets/image/pencil.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
  imageUrl: string | null;
  uploading: boolean;
  onPressEdit: () => void;
};

export default function ProfileImageEditor({
  imageUrl,
  uploading,
  onPressEdit,
}: Props) {
  return (
    <View style={styles.profileImageWrapper}>
      <View style={styles.profileImageBox}>
        {imageUrl ? (
          <FastImage
            source={{uri: imageUrl}}
            style={styles.profileImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : null}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.imageEditBadge}
        onPress={onPressEdit}
        disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color="#A3A3AA" />
        ) : (
          <Image
            source={pencilIcon}
            style={styles.imageEditIcon}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileImageWrapper: {
    width: px(88),
    height: px(88),
    position: 'relative',
    overflow: 'visible',
  },

  profileImageBox: {
    width: px(88),
    height: px(88),
    borderRadius: px(12),
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#E0E0E4',
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  imageEditBadge: {
    position: 'absolute',
    right: px(-10),
    bottom: px(-8),
    width: px(36),
    height: px(36),
    borderRadius: px(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  imageEditIcon: {
    width: px(16),
    height: px(16),
    tintColor: '#A3A3AA',
  },
});