import React from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {CurrentReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {gap, padding} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import {formatReviewTime} from '../../utils/date';
import ProfileAvatar from '../common/ProfileAvatar';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
// 시안은 카드 폭 257(393pt 기준 65%)이지만 상세 화면 역할이라 그보다 키웠다.
// 86%까지 올렸다가 너무 커서 원래 쓰던 75%로 되돌림.
const CARD_W = SCREEN_W * 0.75;

type Props = {
    review: CurrentReview | null;
    onClose: () => void;
    onPressDetail?: (review: CurrentReview) => void;
};

export default function ExplorePreviewCard({review, onClose, onPressDetail}: Props) {
    if (!review) {return null;}

    const {thumbnail_url, image_url, comment, user, created_at, place_name} = review;
    const uri = thumbnail_url ?? image_url;
    const timeAgo = formatReviewTime(created_at, false);

    return (
        <Modal
            visible={!!review}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card} onPress={() => {}}>
                    {/* 상단 메타 */}
                    <View style={styles.topBar}>
                        <View style={styles.userRow}>
                            <ProfileAvatar
                                profileUrl={user.profile_url}
                                profileImageUrl={user.profile_image_url}
                                style={styles.avatar}
                            />
                            <Text style={styles.nickname} numberOfLines={1}>
                                {user.nickname}
                            </Text>
                            <Text style={styles.timeText}>{timeAgo}</Text>
                        </View>
                        {!!place_name && (
                            <View style={styles.locationRow}>
                                <IconPlaceLocation size={12} color={colors.text.inverse} />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {place_name}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* 이미지 영역 */}
                    <View style={styles.imageContainer}>
                        <FastImage
                            source={{uri, priority: FastImage.priority.high}}
                            style={styles.image}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        {!!comment && (
                            <View style={styles.commentOverlay}>
                                <Text style={styles.comment} numberOfLines={3}>
                                    {comment}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* 자세히 보기 버튼 */}
                    <View style={styles.footer}>
                        <Pressable
                            style={styles.detailButton}
                            onPress={() => onPressDetail?.(review)}>
                            <Text style={styles.detailText}>자세히 보기 →</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: CARD_W,
        backgroundColor: colors.background.dark,
        borderRadius: radius['2xl'],
        overflow: 'hidden',
        gap: gap.sm,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: padding.lg,
        paddingTop: padding.lg,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,
        flex: 1,
    },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: radius.full,
        backgroundColor: colors.surface.muted,
    },
    nickname: {
        ...typography.c1,
        color: colors.text.inverse,
        flexShrink: 1,
    },
    timeText: {
        ...typography.c2,
        color: colors.text.inverse,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,
        flexShrink: 0,
    },

    locationText: {
        ...typography.c2,
        color: colors.text.inverse,
        maxWidth: CARD_W * 0.3,
    },
    imageContainer: {
        marginHorizontal: padding.lg,
        // 시안 225x402
        aspectRatio: 225 / 402,
        // 카드를 키운 만큼 이 비율대로면 이미지도 높아진다. 상단 메타/버튼까지 한 화면에
        // 들어가는 선에서 잡은 상한 - 작은 화면에서만 걸린다
        maxHeight: SCREEN_H * 0.65,
        backgroundColor: colors.surface.muted,
        overflow: 'hidden',
        borderRadius: radius.xl,
    },
    image: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    commentOverlay: {
        position: 'absolute',
        top: '45%',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: padding['2xl'],
    },
    comment: {
        // 시안 Caption/C1(Bold) 12px
        ...typography.c1,
        color: colors.text.inverse,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 4,
        letterSpacing: -0.3,
    },
    footer: {
        // 이미지와 같은 좌우 여백이라야 버튼 오른쪽 끝이 사진 오른쪽 끝과 맞는다
        paddingHorizontal: padding.lg,
        paddingBottom: padding.lg,
        alignItems: 'flex-end',
    },
    detailButton: {
        backgroundColor: colors.surface.subtleDarker,
        borderRadius: radius.lg,
        paddingHorizontal: padding.lg,
        paddingVertical: padding.sm,
    },
    detailText: {
        ...typography.c2,
        color: colors.text.inverse,
    },
});
