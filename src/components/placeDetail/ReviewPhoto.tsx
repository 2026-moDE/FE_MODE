import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Image, Pressable, StyleSheet, Animated, PanResponder, ScrollView, Dimensions, Keyboard} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {CurrentReview, ArchivedReview} from '../../types/place';
import {colors} from '../../constants/colors';
import {radius} from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import {fontFamily, fontSize} from '../../constants/typography';
import ReviewMenuModal from './ReviewMenuModal';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import ReviewChatModal from './ReviewChatModal';
import {useReviewPhotoReactions, ReviewPhotoReactionButtons, ReviewPhotoEmojiPicker} from './ReviewPhotoReactions';
import ReviewPhotoComment, {ReviewPhotoCommentHandle} from './ReviewPhotoComment';
import {formatRelativeTime, formatAbsoluteDate} from '../../utils/date';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import {addEmoji, removeEmoji, fetchEmojis} from '../../api/review';

type Props = {
    reviews: (CurrentReview | ArchivedReview)[];
    startIndex: number;
    visible: boolean; // 리뷰 사진 모달 클릭 여부
    placeName?: string;
    onClose: () => void;
    onDelete: () => void;
    onReport: () => void;
    onChangeComment?: (reviewId: number, comment: string) => void;
    useAbsoluteDate?: boolean;
    // 내 리뷰일 때 이모지 버튼 누르면 피커 대신 반응 목록을 보여줘야 함 (다른 화면, 별도 구현)
    onOpenReactionList?: (reviewId: number) => void;
    // 마이페이지 등에서는 댓글을 조회만 하고 작성은 안 함 - 입력창 자체를 안 보여줌
    readOnlyComments?: boolean;
};

const verticalEllipsisIcon = require('../../assets/image/vertical_ellipis.png');
const closeIcon = require('../../assets/image/x.png');

const THUMBNAIL_WIDTH = 40;
const THUMBNAIL_GAP = 10;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
// 하단 리뷰 중앙 정렬을 위한 패딩
const THUMBNAIL_PADDING = (SCREEN_WIDTH - THUMBNAIL_WIDTH) / 2;

export default function ReviewPhoto({reviews, startIndex, visible, placeName, onClose, onDelete, onReport, onChangeComment, useAbsoluteDate, onOpenReactionList, readOnlyComments}: Props) {
    // 리뷰 사진 인덱스
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const isOwner = reviews[currentIndex]?.is_mine ?? false;
    // ⋮ 클릭 모달 여부
    const [menuOpen, setMenuOpen] = useState(false);
    const thumbnailScrollRef = useRef<ScrollView>(null);
    const commentRef = useRef<ReviewPhotoCommentHandle>(null);
    // 현재 사진의 가로세로 비율 (width/height) - 가로 사진 대응용
    const [imageRatio, setImageRatio] = useState<number | null>(null);
    //댓글
    const modalRef = useRef<BottomSheetModal>(null);
    // 채팅/이모지 반응 (애니메이션만 담당)
    const {showPicker, emojiPop, emojiBurst, isExiting, togglePicker, closePicker, playSelectAnimation, playCancelAnimation, syncEmoji} = useReviewPhotoReactions();
    // 리뷰별 이모지 선택 상태 (리뷰마다 따로 관리해야 다른 리뷰로 넘어가도 안 섞임)
    const [emojiSelections, setEmojiSelections] = useState<Record<number, string>>({});

    // image_url 있는 리뷰만 썸네일로, 원래 index 보존
    const thumbnailReviews = reviews
        .map((r, i) => ({...r, originalIndex: i}))  // originalIndex 필드를 추가 (filter할 때 없어지는 index위함)
        .filter(r => r.image_url);

    // 스와이프 닫기용 위치 값 (Animated)
    const translateY = useRef(new Animated.Value(0)).current;

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

    // currentIndex 바뀔 때 썸네일 가운데로 스크롤 + 사진 비율 리셋
    useEffect(() => {
        setImageRatio(null);   // 새 사진 비율은 onLoad에서 다시 잡음
        const thumbIdx = thumbnailReviews.findIndex(r => r.originalIndex === currentIndex);
        if (thumbIdx < 0) return;
        const offset = thumbIdx * (THUMBNAIL_WIDTH + THUMBNAIL_GAP); // 인덱스 활용해서 스크롤값 계산
        thumbnailScrollRef.current?.scrollTo({x: offset, animated: true});
    }, [currentIndex]);


    const review = reviews[currentIndex];
    const selectedEmoji = review ? emojiSelections[review.id] ?? null : null;

    // 지금 보고 있는 리뷰 index를 비동기 콜백에서도 최신값으로 읽기 위한 ref
    const currentIndexRef = useRef(currentIndex);
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // 리뷰(사진)마다 서버에 저장된 내 리액션을 한 번만 조회해서 초기 상태로 채움
    const fetchedEmojiReviewIds = useRef<Set<number>>(new Set());
    useEffect(() => {
        if (!review || fetchedEmojiReviewIds.current.has(review.id)) return;
        fetchedEmojiReviewIds.current.add(review.id);
        const reviewId = review.id;

        fetchEmojis(reviewId)
            .then(res => {
                const mine = res.reactions.find(r => r.is_mine);
                if (mine) {
                    setEmojiSelections(prev => ({...prev, [reviewId]: mine.emoji}));
                    // 데이터가 도착했을 때도 여전히 이 리뷰를 보고 있으면 애니메이션 없이 바로 반영
                    if (reviews[currentIndexRef.current]?.id === reviewId) {
                        syncEmoji(true);
                    }
                }
            })
            .catch(err => console.warn('이모지 반응 조회 실패:', err?.message));
    }, [currentIndex]);

    // 리뷰(사진) 전환 시에만(선택/취소 애니메이션과는 별개로), 그 리뷰의 실제 선택 상태로 즉시 맞춤
    useEffect(() => {
        if (!review) return;
        syncEmoji(!!emojiSelections[review.id]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    // 이모지 선택
    const handleSelectEmoji = (emoji: string) => {
        if (!review) return;
        setEmojiSelections(prev => ({...prev, [review.id]: emoji}));
        playSelectAnimation();
        addEmoji(review.id, emoji).catch(err => console.warn('이모지 추가 실패:', err?.message));
    };

    // 이모지 선택 취소
    const handleCancelEmoji = () => {
        // 퇴장 애니메이션 재생 중에 중복으로 눌리는 것 방지 (겹치면 애니메이션/터치가 꼬임)
        if (!review || !selectedEmoji || isExiting) return;
        const emoji = selectedEmoji;
        const reviewId = review.id;
        removeEmoji(reviewId, emoji).catch(err => console.warn('이모지 삭제 실패:', err?.message));
        playCancelAnimation(() => {
            setEmojiSelections(prev => {
                const next = {...prev};
                delete next[reviewId];
                return next;
            });
        });
    };

    // 이전/다음 사진
    // 편집 중이었으면 그 탭은 "편집 닫기"로만 처리하고, 사진 넘기기는 취소함
    const handlePrev = () => {
        if (commentRef.current?.blurIfEditing()) return;
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };
    const handleNext = () => {
        if (commentRef.current?.blurIfEditing()) return;
        if (currentIndex < reviews.length - 1) setCurrentIndex(currentIndex + 1);
    };

    // 스와이프 닫기 제스처
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

    if (!visible || !review) return null;

    return (
        <>
        {/* 사진 뷰어 (Modal 없이 화면 위에 바로 오버레이) */}
        <>
            {/* 검은 배경 - 코멘트 입력 중 여기(텍스트 아닌 곳) 누르면 키보드 내려가며 저장됨 */}
            <Pressable style={styles.backdrop} onPress={() => Keyboard.dismiss()}>
                <Animated.View
                    style={{transform: [{translateY}]}}
                    {...panResponder.panHandlers}>

                    {/* ── 상단: 사용자(아바타+닉네임+시간) + ⋮ + X (이미지 바깥, 검은 배경 위) ── */}
                    <View style={styles.topRow}>
                        <View style={styles.leftGroup}>
                            <View style={styles.userGroup}>
                                <FastImage
                                    source={{uri: review.user.profile_url ?? review.user.profile_image_url}}
                                    style={styles.avatar}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                <Text style={styles.nickname} numberOfLines={1}>
                                    {review.user.nickname}
                                </Text>
                            </View>
                            <Text style={styles.timeText} numberOfLines={1}>
                                {useAbsoluteDate ? formatAbsoluteDate(review.created_at) : formatRelativeTime(review.created_at)}
                            </Text>
                        </View>

                        <View style={styles.actionGroup}>
                            {/* ⋮ 버튼 */}
                            <Pressable
                                style={styles.iconButton}
                                hitSlop={14}
                                onPress={() => setMenuOpen(true)}>
                                <Image source={verticalEllipsisIcon} style={styles.verticalEllipsisIcon} resizeMode="contain" />
                            </Pressable>

                            {/* X 버튼 */}
                            <Pressable onPress={onClose} style={styles.iconButton} hitSlop={14}>
                                <Image source={closeIcon} style={styles.closeIcon} resizeMode="contain" />
                            </Pressable>
                        </View>
                    </View>

                    {/* 가로 사진이면 실제 비율(가로), 아니면 세로 2:3 유지 */}
                    <View style={[styles.imageWrapper, imageRatio && imageRatio > 1 ? {aspectRatio: imageRatio} : null]}>
                        {/* 이미지 */}
                        <FastImage
                            source={{uri: review.image_url, priority: FastImage.priority.high}}
                            style={styles.image}
                            resizeMode={FastImage.resizeMode.cover}
                            onLoad={e => {
                                const {width, height} = e.nativeEvent;
                                if (width && height) setImageRatio(width / height);
                            }}
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

                        {/* ── 중하단: 코멘트 (이미지 위 가운데~하단) ── */}
                        <ReviewPhotoComment
                            ref={commentRef}
                            review={review}
                            isOwner={isOwner}
                            onChangeComment={onChangeComment}
                        />

                    </View>

                    {/* ── 이미지 바로 아래: 장소명 + 채팅/이모지 반응 버튼 (가로 배치) ── */}
                    <View style={styles.bottomRow}>
                        {placeName ? (
                            <View style={styles.placeGroup}>
                                <IconPlaceLocation size={22} color={colors.icon.inverse} />
                                <Text style={styles.placeName} numberOfLines={1}>
                                    {placeName}
                                </Text>
                            </View>
                        ) : <View />}

                        <ReviewPhotoReactionButtons
                            onOpenChat={() => modalRef.current?.present()}
                            selectedEmoji={selectedEmoji}
                            emojiPop={emojiPop}
                            emojiBurst={emojiBurst}
                            isExiting={isExiting}
                            onPressEmojiButton={
                                isOwner
                                    ? () => onOpenReactionList?.(review.id)
                                    : togglePicker
                            }
                            onCancelEmoji={handleCancelEmoji}
                        />
                    </View>

                    {/* 하단 썸네일 스트립 - Animated.View 안에 있어서 스와이프시 함께 이동 */}
                    {/* {thumbnailReviews.length > 1 && (
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
                                        source={{uri: r.thumbnail_small_url ?? r.image_url!, priority: FastImage.priority.normal}}
                                        style={styles.thumbnail}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    {r.originalIndex !== currentIndex && (
                                        <View style={styles.thumbnailDim} />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    )} */}
                </Animated.View>

                {/* ── 이모지 반응 : 화면 전체 오버레이 + 이모지 목록 ── */}
                <ReviewPhotoEmojiPicker visible={showPicker} onClose={closePicker} onSelect={handleSelectEmoji} />
            </Pressable>
        </>

        {/* ⋮ 메뉴 / 삭제·신고 확인 (독립 — 사진 뷰어와 중첩되지 않게 형제로 분리) */}
        <ReviewMenuModal
            visible={menuOpen}
            isOwner={isOwner}
            onClose={() => setMenuOpen(false)}
            onDelete={onDelete}
            onReport={onReport}
            onEdit={() => commentRef.current?.focusEnd()}
        />

        {/* 댓글 채팅 시트 (독립) - Provider는 App.tsx 최상단 것 하나만 사용 */}
        <ReviewChatModal ref={modalRef} reviewId={review.id} reviewVisibility={review.visibility} readOnly={readOnlyComments} />
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background.dark,   // bg-dark
        justifyContent: 'center',
        zIndex: 100,
        elevation: 100,   // 안드로이드 - 다른 형제 View 위로 올라오게
    },

// ─────────────────── 리뷰 사진 관련  ─────────────────── 
    imageWrapper: {
        marginHorizontal: spacing.xl,   // 20 - 이미지 양옆 여백
        aspectRatio: 9 / 16,
        borderRadius: radius.xl,
        backgroundColor: colors.surface.muted,
        marginBottom : 10,   // 위 여백(중앙정렬)과 비슷하게 맞춤
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

// ─────────────────── 상단: 프로필 + ⋮ + X (한 줄) ───────────────────
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,   // 20 - 이미지 marginHorizontal과 맞춤
        marginBottom: spacing.lg,        // 이미지와의 간격
    },

// ─────────────────── 이미지 바로 아래: 장소명 + 채팅/이모지 버튼 (한 줄) ───────────────────
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,   // 20 - 이미지 marginHorizontal과 맞춤
        marginBottom: spacing.md,
    },
    placeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,                 // 4 (gap-xs)
        flexShrink: 1,
    },
    placeName: {
        color: colors.text.inverse,
        fontSize: fontSize.b3,
        fontFamily: fontFamily.bold,
        flexShrink: 1,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    userGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
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
        fontFamily: fontFamily.bold,
        flexShrink: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },
    timeText: {
        color: colors.text.inverse,
        fontSize: fontSize.c2,
        fontFamily: fontFamily.medium,
        marginLeft: spacing.md,               // Gap/gap-md (닉네임 ↔ 시간)
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },

    // ─────────────────── ⋮ / X 버튼 ───────────────────
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,                      // Gap/gap-lg (⋮ ↔ X)
    },
    iconButton: {
        height: 30,
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verticalEllipsisIcon: {
        width: 24,
        height: 24,
    },
    closeIcon: {
        width: 24,
        height: 24,
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
        aspectRatio: 2 / 3,
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
