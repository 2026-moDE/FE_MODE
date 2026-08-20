import React from 'react';
import {View, Text, Image, Pressable, StyleSheet, PixelRatio} from 'react-native';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {Notification} from '../../types/notifications';
import {formatRelativeTime} from '../../utils/date';
import IconFriend from '../../assets/icons/IconFriend';

// 리뷰 알림 세부 종류별 아이콘
const iconReviewPost = require('../../assets/image/alarm_post.png');
const iconReviewEmoji = require('../../assets/image/alarm_emoji.png');
const iconReviewComment = require('../../assets/image/alarm_comment.png');
const iconReviewNew = require('../../assets/image/alarm_new.png');
// 기기마다 화면 밀도 차이로 ui깨짐
const ICON_SIZE = PixelRatio.roundToNearestPixel(60 / PixelRatio.get());

// type으로 세부 아이콘 판별
function getReviewIconSource(type: Notification['type']) {
    if (type === 'REACTION') return iconReviewEmoji;
    if (type === 'COMMENT') return iconReviewComment;
    if (type === 'REVIEW') return iconReviewPost;
    return iconReviewNew;
}

type Props = {
    item: Notification;
    onPress?: (id: number) => void;
};

export default function NotificationCard({item, onPress}: Props) {
    const {id, type, title, body, is_read, created_at} = item;

    const timeAgo = formatRelativeTime(created_at);
    const isFriendType = type === 'FRIEND_REQUEST' || type === 'FRIEND_ACCEPT';

    return (
        <Pressable
            style={styles.container}
            onPress={() => onPress?.(id)}>
            {isFriendType ? (
                <View style={[styles.iconWrapper, is_read && styles.iconRead]}>
                    <IconFriend size={ICON_SIZE} color={colors.icon.subtle} />
                </View>
            ) : (
                <Image source={getReviewIconSource(type)} style={[styles.icon, is_read && styles.iconRead]} />
            )}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, is_read && styles.titleRead]} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={[styles.time, is_read && styles.timeRead]}>{timeAgo}</Text>
                </View>
                <Text style={[styles.body, is_read && styles.bodyRead]} numberOfLines={2}>
                    {body}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface.white,
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        resizeMode: 'contain',
    },
    iconWrapper: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconRead: {
        opacity: 0.4,
    },
    content: {
        flex: 1,
        gap: spacing.xs,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.s,
    },
    title: {
        ...typography.b5,
        color: colors.text.basic,
        flexShrink: 1,
    },
    titleRead: {
        color: colors.text.disabled,
    },
    time: {
        ...typography.c2,
        color: colors.text.tertiary,
        flexShrink: 0,
    },
    timeRead: {
        color: colors.text.disabled,
    },
    body: {
        ...typography.c2,
        color: colors.text.subtle,
        lineHeight: 20,
    },
    bodyRead: {
        color: colors.text.disabled,
    },
});
