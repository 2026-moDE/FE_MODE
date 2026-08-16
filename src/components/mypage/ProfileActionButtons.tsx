import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Dimensions} from 'react-native';

import {fontFamily} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import IconShare from '../../assets/icons/IconShare';

const pencilIcon = require('../../assets/image/pencil.png');

const DESIGN_WIDTH = 393;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / DESIGN_WIDTH;
const px = (value: number) => value * scale;

type Props = {
  onPressEdit: () => void;
  onPressShare: () => void;
};

export default function ProfileActionButtons({onPressEdit, onPressShare}: Props) {
  return (
    <View style={styles.profileActionsRow}>
      <TouchableOpacity activeOpacity={0.85} style={styles.editButton} onPress={onPressEdit}>
        <Image source={pencilIcon} style={styles.editButtonIcon} resizeMode="contain" />
        <Text style={styles.editButtonText}>프로필 수정</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} style={styles.shareButton} onPress={onPressShare}>
        <IconShare size={px(16)} color={colors.icon.inverse} />
        <Text style={styles.shareButtonText}>프로필 공유</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileActionsRow: {
    flexDirection: 'row',
    marginHorizontal: px(16),
    marginTop: px(20),
    gap: px(10),
  },

  editButton: {
    width: px(176),
    height: px(41),
    borderRadius: px(radius.md),
    backgroundColor: colors.button.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(10),
  },

  editButtonIcon: {
    width: px(16),
    height: px(16),
    tintColor: colors.icon.inverse,
  },

  editButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(14),
    color: colors.text.inverse,
  },

  shareButton: {
    width: px(176),
    height: px(41),
    borderRadius: px(radius.md),
    backgroundColor: colors.button.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: px(10),
  },

  shareButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: px(14),
    color: colors.text.inverse,
  },
});
