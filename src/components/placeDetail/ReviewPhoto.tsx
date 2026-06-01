import React from 'react';
import {View, Text, Image, Pressable, StyleSheet, Dimensions} from 'react-native';
import ImageView from 'react-native-image-viewing';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {formatRelativeTime} from './ReviewCard';

// 화면 높이 (오버레이를 전체 화면에 깔기 위해)
const {height: SCREEN_HEIGHT} = Dimensions.get('window');

type Props = {
    reviews: (CurrentReview | ArchivedReview)[];
    startIndex: number;
    visible: boolean;
    onClose: () => void;
};

export default function ReviewPhoto({reviews, startIndex, visible, onClose}: Props) {
    // 이미지 소스 배열로 변환
    const images = reviews.map(r => ({uri: r.image_url}));

    return (
        <ImageView
            images={images}
            imageIndex={startIndex}
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="overFullScreen"
            backgroundColor="rgba(0,0,0,0)"      // 완전 투명 (어둠은 컨테이너가 담당)
            // HeaderComponent 하나로 전체 오버레이 만들기 (Footer 사용 X)
            HeaderComponent={({imageIndex}) => {
                const review = reviews[imageIndex];
                if (!review) return null;

                return (
                    // pointerEvents="box-none" → 빈 공간 터치는 이미지에 전달 (줌/스와이프 유지)
                    <View style={styles.overlay} pointerEvents="box-none">
                        {/* ── 상단: 사용자 정보 + 닫기 ── */}
                        <View style={styles.topRow}>
                            <View style={styles.userGroup}>
                                <Image
                                    source={{uri: review.user.profile_image_url}}
                                    style={styles.avatar}
                                />
                                <Text style={styles.nickname} numberOfLines={1}>
                                    {review.user.nickname}
                                </Text>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </Pressable>
                        </View>

                        {/* ── 중하단: 시간 뱃지 + 코멘트 ── */}
                        <View style={styles.commentArea}>
                            <View style={styles.timeBadge}>
                                <Text style={styles.timeText}>
                                    {formatRelativeTime(review.created_at)}
                                </Text>
                            </View>
                            <Text style={styles.comment}>{review.comment}</Text>
                        </View>
                    </View>
                );
            }}
        />
    );
}

const styles = StyleSheet.create({
    // 전체 화면 오버레이 (Header 슬롯 안에서 absolute로 화면 전체 차지)
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT,
    },

    // ─────────── 상단 ───────────
    topRow: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.195,        // 화면 위에서 18% (사진 시작 지점 근처)
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 1,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.surface.muted,
    },
    nickname: {
        color: colors.text.inverse,
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2,
    },
    closeButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        color: colors.text.inverse,
        fontSize: 22,
        fontWeight: '300',
    },

    // ─────────── 시간 + 코멘트 (사진 위 중하단에 둥둥) ───────────
    commentArea: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.32,   // 화면 하단에서 32% 위 (디자인 위치 맞춤)
        left: 0,
        right: 0,
        alignItems: 'center',
        gap: 8,
    },
    timeBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    timeText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: '500',
    },
    comment: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },
});
