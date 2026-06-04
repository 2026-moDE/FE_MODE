import React from 'react';
import {View, Text, ImageBackground, Image, Pressable, StyleSheet} from 'react-native';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';

type Props = {
    review: CurrentReview | ArchivedReview;
    onPress?: () => void;
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

export default function ReviewCard({review, onPress}: Props) {
    const {image_url, comment, user, created_at} = review;
    const timeAgo = formatRelativeTime(created_at);

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <ImageBackground
                source={{uri: image_url}}
                style={styles.image}
                imageStyle={styles.imageRadius}
                resizeMethod="resize">
                {/* 상단: 사용자 정보(좌) + 시간(우) */}
                <View style={styles.topRow}>
                    {/* 사용자 (아바타 + 닉네임) */}
                    <View style={styles.userGroup}>
                        <Image
                            source={{uri: user.profile_image_url}}
                            style={styles.avatar}
                        />
                        <Text style={styles.nickname} numberOfLines={1}>
                            {user.nickname}
                        </Text>
                    </View>

                    {/* 시간 뱃지 (어두운 캡슐) */}
                    <View style={styles.timeBadge}>
                        <Text style={styles.timeText}>{timeAgo}</Text>
                    </View>
                </View>

                {/* 하단: 코멘트 (하단에서 살짝 위로 올림) */}
                <View style={styles.commentArea}>
                    <Text style={styles.comment} numberOfLines={2}>
                        {comment}
                    </Text>
                </View>
            </ImageBackground>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        aspectRatio: 177 / 233,                             // 3:4 비율
        borderRadius: radius.lg,                            // 12
        overflow: 'hidden',
    },
    image: {
        flex: 1,
        justifyContent: 'space-between',                    // 상단/하단 분리
        backgroundColor: colors.surface.muted,
    },
    imageRadius: {
        borderRadius: radius.lg,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.s,                                 // 8
        gap: spacing.xs,                                    // 4
    },
    userGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,                                    // 4
        flexShrink: 1,
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: radius.full,
        backgroundColor: colors.surface.muted,
        borderWidth: 1,
        borderColor: colors.surface.white,
    },
    nickname: {
        ...typography.caption1,
        color: colors.text.inverse,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
        flexShrink: 1,
    },
    timeBadge: {
        backgroundColor: colors.background.dimDarkest,
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,                      // 12
        paddingVertical: spacing.xs,                        // 4
    },
    timeText: {
        ...typography.caption1,
        color: colors.text.inverse,
    },
    commentArea: {
        paddingHorizontal: spacing.lg,                      // 16
        paddingBottom: spacing['2xl'],                      // 24 - 하단에서 띄움
    },
    comment: {
        ...typography.b3,                                   // fontSize: 12, bold
        color: colors.text.inverse,
        letterSpacing: -0.06,
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
        textAlign: 'center',                                // 가운데 정렬
    },
});
