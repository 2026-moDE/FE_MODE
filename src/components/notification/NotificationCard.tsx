import React, {useEffect} from 'react';
import {View, Text, Image, Pressable, StyleSheet, PixelRatio} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    runOnJS,
} from 'react-native-reanimated';
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

const DELETE_ACTION_WIDTH = 88;

// type으로 세부 아이콘 판별
function getReviewIconSource(type: Notification['type']) {
    if (type === 'REACTION') return iconReviewEmoji;
    if (type === 'COMMENT') return iconReviewComment;
    if (type === 'REVIEW') return iconReviewPost;
    return iconReviewNew;
}

type Props = {
    item: Notification;
    isOpen: boolean;
    // 부모에게 삭제 버튼 열린 상태 여부를 알려주는 콜백 (다른 카드가 열리면 이 카드는 자동으로 닫힘)
    onOpenChange: (isOpen: boolean) => void;
    onPress?: (id: number) => void;
    onDelete: (id: number) => void;
};

export default function NotificationCard({item, isOpen, onOpenChange, onPress, onDelete}: Props) {
    const {id, type, title, body, is_read, created_at} = item;

    const timeAgo = formatRelativeTime(created_at);
    const isFriendType = type === 'FRIEND_REQUEST' || type === 'FRIEND_ACCEPT';

    // 지금 카드가 얼마나 왼쪽으로 밀려있는지 (0 = 닫힘, -DELETE_ACTION_WIDTH = 열림)
    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);

    // 다른 카드가 열리면(부모가 isOpen을 false로 바꾸면) 이 카드는 원위치로
    useEffect(() => {
        if (!isOpen) {
            translateX.value = withTiming(0);
        }
    }, [isOpen, translateX]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-10, 10])
        .onStart(() => {
            startX.value = translateX.value;
        })
        .onUpdate(event => {
            translateX.value = Math.min(
                0,
                Math.max(-DELETE_ACTION_WIDTH, startX.value + event.translationX),
            );
        })
        .onEnd(() => {
            const shouldOpen = translateX.value < -DELETE_ACTION_WIDTH / 2;
            translateX.value = withTiming(shouldOpen ? -DELETE_ACTION_WIDTH : 0);
            runOnJS(onOpenChange)(shouldOpen);
        });

    const tapGesture = Gesture.Tap().onEnd(() => {
        if (isOpen) {
            runOnJS(onOpenChange)(false);
        } else if (onPress) {
            runOnJS(onPress)(id);
        }
    });

    const rowGesture = Gesture.Race(panGesture, tapGesture);

    // 카드가 밀려서 열려있는 동안 행 배경색을 흰색 → 회색으로 변경 (친구 목록/장소 설정과 동일)
    const rowAnimatedStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            translateX.value,
            [-DELETE_ACTION_WIDTH, 0],
            [colors.surface.default, colors.surface.white],
        ),
    }));

    // 평소엔 안 보이는 곳에 있다가, 카드가 밀리는 만큼 같이 따라 들어옴
    const deleteAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{translateX: translateX.value + DELETE_ACTION_WIDTH}],
    }));

    return (
        <View style={styles.rowContainer}>
            <GestureDetector gesture={rowGesture}>
                <Reanimated.View style={[styles.container, rowAnimatedStyle]}>
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
                </Reanimated.View>
            </GestureDetector>

            <Reanimated.View style={[styles.deleteAction, deleteAnimatedStyle]}>
                <Pressable style={styles.deleteButton} onPress={() => onDelete(id)}>
                    <Text style={styles.deleteText}>삭제</Text>
                </Pressable>
            </Reanimated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowContainer: {
        overflow: 'hidden',
    },
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
    deleteAction: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: DELETE_ACTION_WIDTH,
        backgroundColor: colors.brand.secondary,
    },
    deleteButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        ...typography.b3,
        color: colors.text.inverse,
    },
});
