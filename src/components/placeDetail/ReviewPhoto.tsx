import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Image, Pressable, Modal, StyleSheet, Animated, PanResponder} from 'react-native';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {formatRelativeTime} from './ReviewCard';

type Props = {
    reviews: (CurrentReview | ArchivedReview)[];
    startIndex: number;
    visible: boolean;
    onClose: () => void;
};

export default function ReviewPhoto({reviews, startIndex, visible, onClose}: Props) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    // 스와이프 닫기용 위치 값 (Animated)
    const translateY = useRef(new Animated.Value(0)).current;

    // visible 켜질 때마다 startIndex로 초기화 + 위치 리셋
    useEffect(() => {
        if (visible) {
            setCurrentIndex(startIndex);
            translateY.setValue(0);
        }
    }, [visible, startIndex, translateY]);

    const review = reviews[currentIndex];

    // 이전/다음 사진 (양 끝에서는 비활성)
    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };
    const handleNext = () => {
        if (currentIndex < reviews.length - 1) setCurrentIndex(currentIndex + 1);
    };

    // 스와이프 닫기 제스처 (사진이 따라 움직임)
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) =>
                Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 10,
            onPanResponderMove: (_, gesture) => {
                translateY.setValue(gesture.dy);
            },
            onPanResponderRelease: (_, gesture) => {
                if (Math.abs(gesture.dy) > 100) {
                    Animated.timing(translateY, {
                        toValue: gesture.dy > 0 ? 800 : -800,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onClose();
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        }),
    ).current;

    if (!review) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            {/* 어두운 배경 (상하단 검은 여백) */}
            <View style={styles.backdrop}>
                {/* 이미지 컨테이너 (3:4 비율 + 스와이프 시 같이 이동) */}
                <Animated.View
                    style={[styles.imageWrapper, {transform: [{translateY}]}]}
                    {...panResponder.panHandlers}>
                    {/* 이미지 */}
                    <Image
                        source={{uri: review.image_url}}
                        style={styles.image}
                        resizeMode="cover"
                        resizeMethod="resize"
                    />

                    {/* 좌측 탭 영역: 이전 사진 */}
                    <Pressable
                        style={[styles.tapZone, styles.leftZone]}
                        onPress={handlePrev}
                    />

                    {/* 우측 탭 영역: 다음 사진 */}
                    <Pressable
                        style={[styles.tapZone, styles.rightZone]}
                        onPress={handleNext}
                    />

                    {/* ── 닫기 버튼: 원 + 반원이 이미지 상단 중앙에 걸침 ── */}
                    <View style={styles.closeOuter}>
                        <Pressable onPress={onClose} style={styles.xCircle} hitSlop={16}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </Pressable>
                        {/* <View style={styles.semicircle} /> */}
                    </View>

                    {/* ── 상단: 사용자 (이미지 위에 오버레이) ── */}
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
                    </View>

                    {/* ── 중하단: 시간 + 코멘트 (이미지 위 가운데~하단) ── */}
                    <View style={styles.commentArea} pointerEvents="none">
                        <View style={styles.timeBadge}>
                            <Text style={styles.timeText}>
                                {formatRelativeTime(review.created_at)}
                            </Text>
                        </View>
                        <Text style={styles.comment}>{review.comment}</Text>
                    </View>

                    {/* 페이지 인디케이터 (여러 사진일 때) */}
                    {reviews.length > 1 && (
                        <View style={styles.indicator} pointerEvents="none">
                            <Text style={styles.indicatorText}>
                                {/* {currentIndex + 1} / {reviews.length} */}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(20,20,20,0.98)',
        justifyContent: 'center',
    },

    imageWrapper: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: radius.xl,
        backgroundColor: colors.surface.muted,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: radius.xl,
    },

    tapZone: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
    },
    leftZone: {
        left: 0,
    },
    rightZone: {
        right: 0,
    },

    closeOuter: {
        position: 'absolute',
        top: -27,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    xCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(20,20,20,0.98)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    topRow: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
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
        borderColor: colors.surface.white,
    },
    nickname: {
        color: colors.text.inverse,
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },
    closeIcon: {
        color: colors.text.inverse,
        fontSize: 30,
        fontWeight: '400',
    },

    indicator: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        zIndex: 1,
    },
    indicatorText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: '500',
    },

    commentArea: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 24,
        zIndex: 1,
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
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 4,
    },
});
