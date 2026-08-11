import React from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing, gap, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';

type Props = {
    review: CurrentReview | ArchivedReview;
    onPress?: () => void;
    isArchived?: boolean;
};

/**
 * ISO 시간 → "2분 전", "1시간 전"형태로 변환
 * 흠 나중에
 */
export function formatRelativeTime(isoString: string): string {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - past) / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${diffDay}일 전`;
}

/**
 * 실시간 탭: "방금"(1분 미만) / "N분 전" / "N시간 전"
 * 과거 탭: "월/일" (연도가 다르면 "년/월/일")
 */
export function formatReviewTime(isoString: string, isArchived: boolean): string {
    const date = new Date(isoString);

    if (isArchived) {
        const now = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        if (date.getFullYear() !== now.getFullYear()) {
            return `${date.getFullYear()}/${month}/${day}`;
        }
        return `${month}/${day}`;
    }

    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    return `${diffHour}시간 전`;
}

export default function ReviewCard({review, onPress, isArchived}: Props) {
    const {thumbnail_url, image_url, comment, user, created_at} = review;
    const timeAgo = formatReviewTime(created_at, isArchived ?? false);

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <FastImage
                source={{uri: thumbnail_url ?? image_url , priority: FastImage.priority.high}}
                style={styles.image}
                resizeMode={FastImage.resizeMode.cover}
            />
            {/* 상단: 사용자 정보 */}
            <View style={styles.topRow}>
                {/* 사용자 (아바타 + 닉네임) */}
                <View style={styles.userGroup}>
                    <FastImage
                        source={{uri: user.profile_url ?? user.profile_image_url}}
                        style={styles.avatar}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                    <Text style={styles.nickname} numberOfLines={1}>
                        {user.nickname}
                    </Text>
                </View>
            </View>

            {/* 중앙: 코멘트 */}
            <View style={styles.commentArea}>
                <Text style={styles.comment} numberOfLines={2}>
                    {comment}
                </Text>
            </View>

            {/* 하단 중앙: 시간 */}
            <View style={styles.timeBadgeWrapper}>
                <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{timeAgo}</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        aspectRatio: 177 / 233,  
        borderWidth: 2,
        borderColor: colors.surface.muted,                           // 3:4 비율
        borderRadius: radius.xl,                            // 16
        overflow: 'hidden',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: radius.xl - 2,                        // container borderWidth(2)만큼 뺀 반지름
        backgroundColor: colors.surface.muted,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: padding.md,            
    },
    userGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,                                    
        flexShrink: 1,
    },
    avatar: {
        width: 18,
        height: 18,
        borderRadius: radius.full,
        backgroundColor: colors.surface.muted,
    },
    nickname: {
        ...typography.c3,
        color: colors.text.inverse,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
        flexShrink: 1,
    },
    timeBadgeWrapper: {
        position: 'absolute',
        bottom: padding.s,                                  // 8
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    timeBadge: {
        backgroundColor: colors.background.dimDarker,
        borderRadius: radius.md,
        paddingHorizontal: padding.sm,                      // 10
        paddingVertical: padding.xs,                        // 4
    },
    timeText: {
        ...typography.c2,
        color: colors.text.inverse,
    },
    commentArea: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: padding.lg,
        zIndex: 1,
    },
    comment: {
        ...typography.c1,                                   // fontSize: 12, bold
        color: colors.text.inverse,
        letterSpacing: -0.06,
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
        textAlign: 'center',                                // 가운데 정렬
    },
});
