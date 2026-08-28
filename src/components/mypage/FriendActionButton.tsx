import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {typography} from '../../constants/typography';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import IconFriendAdd from '../../assets/icons/IconFriendAdd';
import {FriendStatus} from '../../api/friend';

type Props = {
  friendStatus: FriendStatus;
  isSubmitting: boolean;
  onPressRequest: () => void;
};

export default function FriendActionButton({friendStatus, isSubmitting, onPressRequest}: Props) {
  if (friendStatus === 'ACCEPTED') {
    return (
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>친구</Text>
      </View>
    );
  }

  if (friendStatus === 'PENDING') {
    return (
      <View style={styles.requestButton}>
        <IconFriendAdd size={16} color={colors.text.disabled} />
        <Text style={[styles.requestButtonText, styles.pendingButtonText]}>친구 요청 중</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.requestButton}
      disabled={isSubmitting}
      onPress={onPressRequest}>
      {isSubmitting ? (
        <ActivityIndicator size="small" color={colors.icon.inverse} />
      ) : (
        <>
          <IconFriendAdd size={16} color={colors.icon.inverse} />
          <Text style={styles.requestButtonText}>친구 신청</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  requestButton: {
    height: 41,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: radius.md,
    backgroundColor: colors.button.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  requestButtonText: {
    ...typography.b5,
    color: colors.text.inverse,
  },

  pendingButtonText: {
    color: colors.text.disabled,
  },

  labelRow: {
    height: 41,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelText: {
    ...typography.b5,
    color: colors.text.tertiary,
  },
});
