import React from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {CurrentReview, ArchivedReview, ReviewUser} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {spacing, gap, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {formatReviewTime} from '../../utils/date';
import IconFriend from '../../assets/icons/IconFriend';
import ProfileAvatar from '../common/ProfileAvatar';

type Props = {
    review: CurrentReview | ArchivedReview;
    onPress?: () => void;
    onPressUser?: (user: ReviewUser) => void;
    isArchived?: boolean;
};

export default function ReviewCard({review, onPress, onPressUser, isArchived}: Props) {
    const {thumbnail_url, image_url, comment, user, created_at, is_friend} = review;
    const timeAgo = formatReviewTime(created_at, isArchived ?? false);

    const userGroup = (
        <View style={styles.userGroup}>
            <ProfileAvatar
                profileUrl={user.profile_url}
                profileImageUrl={user.profile_image_url}
                style={styles.avatar}
            />
            <Text style={styles.nickname} numberOfLines={1}>
                {user.nickname}
            </Text>
            {/* 친구가 남긴 리뷰 표시 */}
            {is_friend && (
                <View style={styles.friendIconWrapper}>
                    <IconFriend size={14} color={colors.brand.primary} />
                </View>
            )}
        </View>
    );

    return (
        <Pressable onPress={onPress} style={[styles.container, is_friend && styles.containerFriend]}>
            <FastImage
                source={{uri: thumbnail_url ?? image_url , priority: FastImage.priority.high}}
                style={styles.image}
                resizeMode={FastImage.resizeMode.cover}
            />
            {/* 상단: 사용자 정보 */}
            <View style={styles.topRow}>
                {/* user_id가 없는 응답(목록 api 일부)이면 다른 유저 마이페이지로 이동할 수 없어 탭 비활성화 */}
                {onPressUser && user.user_id != null ? (
                    <Pressable onPress={() => onPressUser(user)} hitSlop={6}>
                        {userGroup}
                    </Pressable>
                ) : (
                    userGroup
                )}
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
    // 친구가 남긴 리뷰
    containerFriend: {
        borderColor: colors.border.brand,
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
        flexShrink: 1,
    },
    avatar: {
        width: 18,
        height: 18,
        borderRadius: radius.full,
        backgroundColor: colors.surface.muted,
        marginRight: gap.sm,   // 아바타 ↔ 닉네임
    },
    nickname: {
        ...typography.c3,
        color: colors.text.inverse,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
        flexShrink: 1,
    },
    friendIconWrapper: {
        marginLeft: gap.xs,   // 닉네임 ↔ 별 아이콘
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
