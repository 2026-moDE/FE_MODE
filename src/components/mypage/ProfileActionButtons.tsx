import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';

import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import IconShare from '../../assets/icons/IconShare';

const pencilIcon = require('../../assets/image/pencil.png');

type Props = {
  onPressEdit: () => void;
  onPressShare: () => void;
};

export default function ProfileActionButtons({onPressEdit, onPressShare}: Props) {
  return (
    <View style={styles.profileActionsRow}>
      <TouchableOpacity activeOpacity={0.85} style={styles.editButton} onPress={onPressEdit}>
        <Image source={pencilIcon} style={styles.editButtonIcon} resizeMode="contain" />
        <Text style={styles.editButtonText} numberOfLines={1} ellipsizeMode="tail">프로필 수정</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} style={styles.shareButton} onPress={onPressShare}>
        <IconShare size={16} color={colors.icon.inverse} />
        <Text style={styles.shareButtonText} numberOfLines={1} ellipsizeMode="tail">프로필 공유</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileActionsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },

  editButton: {
    flex: 1,
    height: 41,
    borderRadius: radius.md,
    backgroundColor: colors.button.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  editButtonIcon: {
    width: 16,
    height: 16,
    tintColor: colors.icon.inverse,
  },

  editButtonText: {
    ...typography.b5,
    color: colors.text.inverse,
  },

  shareButton: {
    flex: 1,
    height: 41,
    borderRadius: radius.md,
    backgroundColor: colors.button.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  shareButtonText: {
    ...typography.b5,
    color: colors.text.inverse,
  },
});
