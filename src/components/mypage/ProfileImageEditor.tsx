import React from 'react';
import {View, Image, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';

const pencilIcon = require('../../assets/image/pencil.png');

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
          <ActivityIndicator size="small" color={colors.icon.tertiary} />
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
    width: 88,
    height: 88,
    position: 'relative',
    overflow: 'visible',
  },

  profileImageBox: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  imageEditBadge: {
    position: 'absolute',
    right: (-10),
    bottom: (-8),
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.button.tertiaryFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  imageEditIcon: {
    width: 16,
    height: 16,
    tintColor: colors.icon.tertiary,
  },
});