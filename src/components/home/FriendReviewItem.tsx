import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {FriendReview} from '../../api/friend';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap} from '../../constants/spacing';

type Props = {
    item: FriendReview;
    onPress?: (item: FriendReview) => void;
};

const PHOTO_SIZE = 48;
const AVATAR_SIZE = 24;
// 닉네임 최대 8자 안 잘리게 이거 기준으로 패딩 설정
const NICKNAME_MAX_WIDTH = 78;

export default function FriendReviewItem({item, onPress}: Props) {
    return (
        <Pressable style={styles.container} onPress={() => onPress?.(item)}>
            <View style={styles.photoWrapper}>
                <FastImage
                    source={{uri: item.thumbnail_small_url ?? item.thumbnail_url}}
                    style={styles.photo}
                    resizeMode={FastImage.resizeMode.cover}
                />
                {item.user.profile_url ? (
                    <FastImage
                        source={{uri: item.user.profile_url}}
                        style={styles.avatar}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback]} />
                )}
            </View>
            <Text style={styles.nickname} numberOfLines={1}>{item.user.nickname}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: NICKNAME_MAX_WIDTH,
        gap: gap.sm,
    },
    photoWrapper: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
    },
    photo: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderRadius: PHOTO_SIZE / 2,
        backgroundColor: colors.surface.muted,
    },
    avatar: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 1,
        borderColor: colors.surface.white,
    },
    avatarFallback: {
        backgroundColor: colors.surface.muted,
    },
    nickname: {
        ...typography.c3,
        color: colors.text.inverse,
        textAlign: 'center',
    },
});
