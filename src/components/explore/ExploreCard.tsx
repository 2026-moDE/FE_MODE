import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {CurrentReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {gap, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {formatReviewTime} from '../../utils/date';
import ProfileAvatar from '../common/ProfileAvatar';

type Props = {
    review: CurrentReview;
    onPress?: () => void;
    onLongPress?: () => void;
};

export default function ExploreCard({review, onPress, onLongPress}: Props) {
    const {thumbnail_url, image_url, comment, user, created_at} = review;
    const uri = thumbnail_url ?? image_url;
    const timeAgo = formatReviewTime(created_at, false);

    return (
        <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.container}>
            <View style={styles.inner}>
                <FastImage
                    source={{uri, priority: FastImage.priority.high}}
                    style={styles.image}
                    resizeMode={FastImage.resizeMode.cover}
                />

                <View style={StyleSheet.absoluteFill}>
                    {/* 상단: 사용자 */}
                    <View style={styles.topRow}>
                        <ProfileAvatar
                            profileUrl={user.profile_url}
                            profileImageUrl={user.profile_image_url}
                            style={styles.avatar}
                        />
                        <Text style={styles.nickname} numberOfLines={1}>
                            {user.nickname}
                        </Text>
                    </View>

                    {/* 중앙: 코멘트 */}
                    {!!comment && (
                        <View style={styles.commentArea}>
                            <Text style={styles.comment} numberOfLines={2}>
                                {comment}
                            </Text>
                        </View>
                    )}

                    {/* 하단: 시간 */}
                    <View style={styles.timeBadgeWrapper}>
                        <View style={styles.timeBadge}>
                            <Text style={styles.timeText}>{timeAgo}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        aspectRatio: 177 / 233,
        backgroundColor: colors.surface.muted,
        borderRadius: radius.xl,
        padding: 2,
    },
    inner: {
        flex: 1,
        borderRadius: radius.xl - 2,
        overflow: 'hidden',
        backgroundColor: colors.surface.muted,
    },
    image: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: padding.md,
    },
    avatar: {
        width: 18,
        height: 18,
        borderRadius: radius.full,
        backgroundColor: colors.surface.muted,
        marginRight: gap.sm,
    },
    nickname: {
        ...typography.c3,
        color: colors.text.inverse,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
        flexShrink: 1,
    },
    commentArea: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: padding.lg,
    },
    comment: {
        ...typography.c1,
        color: colors.text.inverse,
        letterSpacing: -0.06,
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
        textAlign: 'center',
    },
    timeBadgeWrapper: {
        position: 'absolute',
        bottom: padding.s,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    timeBadge: {
        backgroundColor: colors.background.dimDarker,
        borderRadius: radius.md,
        paddingHorizontal: padding.sm,
        paddingVertical: padding.xs,
    },
    timeText: {
        ...typography.c2,
        color: colors.text.inverse,
    },
});
