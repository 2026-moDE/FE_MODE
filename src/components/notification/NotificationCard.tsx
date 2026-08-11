import React from 'react';
import {View, Text, Image, Pressable, StyleSheet, PixelRatio} from 'react-native';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {Notification} from '../../types/notifications';
import {formatRelativeTime} from '../placeDetail/ReviewCard';

const IconRun = require('../../assets/icons/IconRun.png');
// 기기마다 화면 밀도 차이로 ui깨짐
const ICON_SIZE = PixelRatio.roundToNearestPixel(40 / PixelRatio.get()); 

type Props = {
    item: Notification;
    onPress?: (id: number) => void;
};

export default function NotificationCard({item, onPress}: Props) {
    const {id, title, body, is_read, created_at} = item;

    const timeAgo = formatRelativeTime(created_at);

    return (
        <Pressable
            style={styles.container}
            onPress={() => onPress?.(id)}>
            <Image source={IconRun} style={[styles.icon, is_read && styles.iconRead]} />
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
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface.white,
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        resizeMode: 'contain',
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
