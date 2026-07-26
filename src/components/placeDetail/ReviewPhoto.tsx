import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Pressable, Modal, StyleSheet, Animated, PanResponder, ScrollView, Dimensions, TextInput} from 'react-native';
import FastImage from 'react-native-fast-image';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import {formatRelativeTime} from './ReviewCard';
import {fontSize} from '../../constants/typography';
import ReviewActionModal from './ReviewActionModal';

type Props = {
    reviews: (CurrentReview | ArchivedReview)[];
    startIndex: number;
    visible: boolean; // 리뷰 사진 모달 클릭 여부
    onClose: () => void;
    onDelete: () => void;
    onReport: () => void;
    useAbsoluteDate?: boolean;
};

const THUMBNAIL_WIDTH = 40;
const THUMBNAIL_GAP = 10;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
// 하단 리뷰 중앙 정렬을 위한 패딩
const THUMBNAIL_PADDING = (SCREEN_WIDTH - THUMBNAIL_WIDTH) / 2;

function formatAbsoluteDate(isoString: string): string {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}년 ${m}월 ${d}일`;
}

export default function ReviewPhoto({reviews, startIndex, visible, onClose, onDelete, onReport, useAbsoluteDate}: Props) {
    // 리뷰 사진 인덱스
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const isOwner = reviews[currentIndex]?.is_mine ?? false;
    // ⋮ 클릭 모달 여부
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({top: 0, right: 0});
    const ellipsisRef = useRef<any>(null);
    const thumbnailScrollRef = useRef<ScrollView>(null);
    // 텍스트 수정
    const [changedComment, setChangedComment] = useState(reviews[currentIndex]?.comment??'');

    // image_url 있는 리뷰만 썸네일로, 원래 index 보존
    const thumbnailReviews = reviews
        .map((r, i) => ({...r, originalIndex: i}))  // originalIndex 필드를 추가 (filter할 때 없어지는 index위함)
        .filter(r => r.image_url);

    // 스와이프 닫기용 위치 값 (Animated)
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(()=> {setChangedComment(reviews[currentIndex]?.comment??'')},[reviews,currentIndex]);

    // visible 켜질 때마다 startIndex로 초기화 + 위치 리셋
    useEffect(() => {
        if (visible) {
            setCurrentIndex(startIndex);
            translateY.setValue(0);
        } else {
            setMenuOpen(false);
        }
    }, [visible, startIndex, translateY]);

    // 썸네일 스크롤 끝났을 때 가운데 있는 것을 currentIndex로
    const handleThumbnailScrollEnd = (e: any) => {
        const scrollX = e.nativeEvent.contentOffset.x;  // x방향으로 스크롤된 정도
        const thumbIdx = Math.round(scrollX / (THUMBNAIL_WIDTH + THUMBNAIL_GAP)); // 반올림해서 스크롤값을 인덱스값으로 
        const clamped = Math.max(0, Math.min(thumbnailReviews.length - 1, thumbIdx)); // 인덱스는 0~length 사이로 오게끔 방어
        setCurrentIndex(thumbnailReviews[clamped].originalIndex);
    };

    // currentIndex 바뀔 때 썸네일 가운데로 스크롤
    useEffect(() => {
        const thumbIdx = thumbnailReviews.findIndex(r => r.originalIndex === currentIndex);
        if (thumbIdx < 0) return;
        const offset = thumbIdx * (THUMBNAIL_WIDTH + THUMBNAIL_GAP); // 인덱스 활용해서 스크롤값 계산
        thumbnailScrollRef.current?.scrollTo({x: offset, animated: true});
    }, [currentIndex]);


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
                        onClose(); // start함수에 콜백 넣으면 애니메이션 시작 후 끝난 다음에 실행
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
                <Animated.View
                    style={{transform: [{translateY}]}}
                    {...panResponder.panHandlers}>

                    <View style={styles.imageWrapper}>
                        {/* 이미지 */}
                        <FastImage
                            source={{uri: review.image_url, priority: FastImage.priority.high}}
                            style={styles.image}
                            resizeMode={FastImage.resizeMode.cover}
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
                                <FastImage
                                    source={{uri: review.user.profile_image_url}}
                                    style={styles.avatar}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                <Text style={styles.nickname} numberOfLines={1}>
                                    {review.user.nickname}
                                </Text>
                            </View>
                        </View>

                        {/* ── 우측 상단 ⋮ 버튼 ──  */}
                        <Pressable
                            ref={ellipsisRef}
                            style={styles.verticalEllipsis}
                            hitSlop={14}
                            onPress={() => {
                                ellipsisRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
                                    setMenuPosition({
                                        top: y + height + 4,
                                        right: SCREEN_WIDTH - x - width / 2 - 16,
                                    });
                                    setMenuOpen(true);
                                });
                            }}>
                            <Text style={styles.verticalEllipsisIcon}>⋮</Text>
                        </Pressable>

                        {/* ── 중하단: 시간 + 코멘트 (이미지 위 가운데~하단) ── */}
                        <View style={styles.commentArea} pointerEvents={isOwner? 'auto':"none"}>
                            <View style={styles.timeBadge}>
                                <Text style={styles.timeText}>
                                    {useAbsoluteDate ? formatAbsoluteDate(review.created_at) : formatRelativeTime(review.created_at)}
                                </Text>
                            </View>
                            {isOwner ?
                                <TextInput
                                    style={styles.comment}
                                    value={changedComment}
                                    onChangeText={setChangedComment}
                                    multiline
                                />
                                :<Text style={styles.comment}>{review.comment}</Text>
                            }
                        </View>

                    </View>

                    {/* 하단 썸네일 스트립 - Animated.View 안에 있어서 스와이프시 함께 이동 */}
                    {thumbnailReviews.length > 1 && (
                        <ScrollView
                            ref={thumbnailScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.thumbnailStrip}
                            contentContainerStyle={[styles.thumbnailContent, {paddingHorizontal: THUMBNAIL_PADDING}]}
                            decelerationRate="fast"
                            snapToInterval={THUMBNAIL_WIDTH + THUMBNAIL_GAP} // 간격 맞춰서 스크롤 딱딱 되게
                            onMomentumScrollEnd={handleThumbnailScrollEnd}
                            onScrollEndDrag={handleThumbnailScrollEnd}>
                            {thumbnailReviews.map(r => (
                                <Pressable key={r.id} onPress={() => setCurrentIndex(r.originalIndex)}>
                                    <FastImage
                                        source={{uri: r.image_url!, priority: FastImage.priority.normal}}
                                        style={styles.thumbnail}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    {r.originalIndex !== currentIndex && (
                                        <View style={styles.thumbnailDim} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
                </Animated.View>
            </View>

            <ReviewActionModal
                visible={menuOpen}
                isOwner={isOwner}
                position={menuPosition}
                onClose={() => setMenuOpen(false)}
                onDelete={onDelete}
                onReport={onReport}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(20,20,20,0.98)',
        justifyContent: 'center',
    },

// ─────────────────── 리뷰 사진 관련  ─────────────────── 
    imageWrapper: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: radius.xl,
        backgroundColor: colors.surface.muted,
        marginBottom : 10,
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

// ─────────────────── X버튼 관련  ─────────────────── 
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

        closeIcon: {
        color: colors.text.inverse,
        fontSize: 30,
        fontWeight: '400',
    },

// ─────────────────── 리뷰 프로필 관련  ─────────────────── 
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
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.surface.muted,
        borderColor: colors.surface.white,
    },
    nickname: {
        color: colors.text.inverse,
        fontSize: fontSize.b1,
        fontWeight: '700',
        flexShrink: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },

    // ─────────────────── 점3개 관련  ─────────────────── 
    verticalEllipsis:{
        position: 'absolute',
        top: 16,
        right: 25,
        zIndex: 2,
        height: 30,
        width : 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verticalEllipsisIcon: {
        color: colors.text.inverse,
        fontSize: 20,
    },

// ─────────────────── 텍스트 관련  ─────────────────── 
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

    // ─────────────────── 작성 시간 관련  ─────────────────── 
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
// ─────────────────── 하단 리뷰 관련  ─────────────────── 
    thumbnailStrip: {
        width: '100%',
        
        
    },
    thumbnailContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: THUMBNAIL_GAP,
    },
    thumbnail: {
        width: THUMBNAIL_WIDTH,
        aspectRatio: 3 / 4,
        borderRadius: 8,
    },
    thumbnailDim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
});
