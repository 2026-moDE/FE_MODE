import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Image, Pressable, StyleSheet, Animated, PanResponder, ScrollView, Dimensions, Keyboard} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import {CurrentReview, ArchivedReview, ReviewUser} from '../../types/place';
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
import { typography } from '../../constants/typography';
import ProfileAvatar from '../common/ProfileAvatar';

type Props = {
    reviews: (CurrentReview | ArchivedReview)[];
    startIndex: number;
    visible: boolean; // 리뷰 사진 모달 클릭 여부
    placeName?: string; // 장소상세처럼 장소가 하나로 고정된 경우용. 리뷰마다 장소가 다르면 reviews[].place_name을 대신 채워서 넘기면 됨
    onClose: () => void;
    // 뷰어 안에서 사진을 넘길 수 있어서, 부모가 처음 열었던 index로 지우면 엉뚱한 리뷰가 지워짐.
    // 지금 보고 있는 리뷰 id를 그대로 넘겨줌
    onDelete: (reviewId: number) => void;
    onReport: (reviewId: number) => void;
    onChangeComment?: (reviewId: number, comment: string) => void;
    // 상단 프로필 사진/닉네임 탭 시 다른 유저 마이페이지로 이동 (user_id 없으면 무시됨)
    onPressUser?: (user: ReviewUser) => void;
    useAbsoluteDate?: boolean;
    // 내 리뷰일 때 이모지 버튼 누르면 반응 목록을 보여줘야 함
    onOpenReactionList?: (reviewId: number) => void;
    // 마이페이지 등에서는 댓글을 조회만 하고 작성은 안 함 - 입력창 자체를 안 보여줌
    readOnlyComments?: boolean;
    // 댓글 알림 눌러서 들어온 경우, 댓글 모달도 자동으로 염
    autoOpenChat?: boolean;
    // 장소명 탭 시 장소 상세 페이지로 이동 (place_id, place_name 전달)
    onPressPlace?: (placeId: number, placeName: string) => void;
};

const verticalEllipsisIcon = require('../../assets/image/vertical_ellipis.png');
const closeIcon = require('../../assets/image/x.png');

const THUMBNAIL_WIDTH = 40;
const THUMBNAIL_GAP = 10;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
// 하단 리뷰 중앙 정렬을 위한 패딩
const THUMBNAIL_PADDING = (SCREEN_WIDTH - THUMBNAIL_WIDTH) / 2;

export default function ReviewPhoto({reviews, startIndex, visible, placeName, onClose, onDelete, onReport, onChangeComment, onPressUser, useAbsoluteDate, onOpenReactionList, readOnlyComments, autoOpenChat, onPressPlace}: Props) {
    const insets = useSafeAreaInsets();
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
    const {showPicker, emojiPop, togglePicker, closePicker, playSelectAnimation, syncEmoji} = useReviewPhotoReactions();
    // 리뷰별 이모지 선택 상태 (리뷰마다 따로 관리해야 다른 리뷰로 넘어가도 안 섞임)
    const [emojiSelections, setEmojiSelections] = useState<Record<number, string>>({});

    // image_url 있는 리뷰만 썸네일로, 원래 index 보존
    const thumbnailReviews = reviews
        .map((r, i) => ({...r, originalIndex: i}))  // originalIndex 필드를 추가 (filter할 때 없어지는 index위함)
        .filter(r => r.image_url);

    // 스와이프 닫기용 위치 값 (Animated)
    const translateY = useRef(new Animated.Value(0)).current;

    // 리뷰(사진)마다 서버에 저장된 내 리액션을 조회해서 초기 상태로 채움 - 한 번 조회한 리뷰는
    // 다시 조회 안 하는 캐시. visible이 false→true 될 때(뷰어를 다시 열 때)마다 비워서,
    // 화면 인스턴스가 재사용되는 경우(react-navigation의 navigate()가 스택에 이미 있는 PlaceDetail을
    // 재사용하는 경우)에도 이전 방문 때 캐시된 "반응 없음" 값이 계속 남아있지 않고 서버 최신값을 다시 받아오게 함
    const fetchedEmojiReviewIds = useRef<Set<number>>(new Set());

    // visible 켜질 때마다 startIndex로 초기화 + 위치 리셋
    useEffect(() => {
        if (visible) {
            setCurrentIndex(startIndex);
            translateY.setValue(0);
            fetchedEmojiReviewIds.current.clear();
        } else {
            setMenuOpen(false);
        }
    }, [visible, startIndex, translateY]);

    // 댓글 알림으로 들어온 경우, 댓글 모달도 자동으로 염 (닫히면 다시 열 수 있게 리셋)
    const autoOpenChatDoneRef = useRef(false);
    useEffect(() => {
        if (!visible) {
            autoOpenChatDoneRef.current = false;
            return;
        }
        if (autoOpenChat && !autoOpenChatDoneRef.current) {
            autoOpenChatDoneRef.current = true;
            modalRef.current?.present();
        }
    }, [visible, autoOpenChat]);

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
    // (fetchedEmojiReviewIds 선언은 위쪽 visible 초기화 effect 앞으로 옮김)
    useEffect(() => {
        // 뷰어가 닫혀 있을 땐 조회 안 함 - visible이 다시 켜질 때 위 effect가 캐시를 비우고 여기서 서버 최신값을 받아옴
        if (!visible) return;
        if (!review || fetchedEmojiReviewIds.current.has(review.id)) return;
        fetchedEmojiReviewIds.current.add(review.id);
        const reviewId = review.id;

        fetchEmojis(reviewId)
            .then(res => {
                const mine = res.reactions.find(r => r.is_mine);
                // 서버 값이 항상 우선 - 반응이 없으면 이전에 남아있던 값(다른 세션/재사용된 화면의 캐시)도 지움
                setEmojiSelections(prev => {
                    const next = {...prev};
                    if (mine) next[reviewId] = mine.emoji;
                    else delete next[reviewId];
                    return next;
                });
                // 데이터가 도착했을 때도 여전히 이 리뷰를 보고 있으면 애니메이션 없이 바로 반영
                if (reviews[currentIndexRef.current]?.id === reviewId) {
                    syncEmoji(!!mine);
                }
            })
            .catch(err => console.warn('이모지 반응 조회 실패:', err?.message));
    }, [currentIndex, visible]);

    // 리뷰(사진) 전환 시에만(선택/취소 애니메이션과는 별개로), 그 리뷰의 실제 선택 상태로 즉시 맞춤
    useEffect(() => {
        if (!review) return;
        syncEmoji(!!emojiSelections[review.id]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    // 선택/취소가 서버에 저장 안 됐을 때 화면을 원래 상태로 되돌림
    // (UI만 바뀐 채로 두면 다음에 다시 열었을 때 반응이 사라진 것처럼 보임)
    const rollbackEmoji = (reviewId: number, prevEmoji: string | null) => {
        setEmojiSelections(prev => {
            const next = {...prev};
            if (prevEmoji) next[reviewId] = prevEmoji;
            else delete next[reviewId];
            return next;
        });
        // 되돌리는 시점에도 같은 리뷰를 보고 있으면 메인 버튼 상태까지 같이 맞춤
        if (reviews[currentIndexRef.current]?.id === reviewId) syncEmoji(!!prevEmoji);
    };

    // 이모지 선택 (이미 남긴 반응이 있으면 그걸 지우고 새 걸로 교체)
    const handleSelectEmoji = async (emoji: string) => {
        if (!review) return;
        const reviewId = review.id;
        const prevEmoji = emojiSelections[reviewId] ?? null;
        if (prevEmoji === emoji) return; // 같은 이모지는 취소 경로에서 처리

        setEmojiSelections(prev => ({...prev, [reviewId]: emoji}));
        playSelectAnimation();

        try {
            // 반응은 리뷰당 하나라, 바꿀 때는 기존 걸 먼저 지워야 두 개로 남지 않음
            if (prevEmoji) await removeEmoji(reviewId, prevEmoji);
            await addEmoji(reviewId, emoji);
        } catch (err: any) {
            console.warn('이모지 반영 실패:', err?.message);
            rollbackEmoji(reviewId, prevEmoji);
        }
    };

    // 이모지 선택 취소 - 사라지는 애니메이션은 피커 안에서 이미 다 보여줬으니(ReviewPhotoEmojiPicker의
    // 자체 취소 애니메이션), 여기 메인 버튼에서 또 재생하면 220ms(피커) + 420ms(메인 버튼) 이중으로
    // 걸려서 그 사이에 피커를 닫으면 메인 버튼이 "지워지는 중" 애매한 상태로 보였음(아이콘도
    // "반응 남기기" 텍스트도 없는 것처럼). 애니메이션 없이 바로 상태만 정리
    // 취소는 서버가 지워준 걸 확인한 뒤에만 화면에서 지움 - 먼저 지웠다가 실패해서 되돌리면
    // "사라졌다 다시 나타나는" 깜빡임이 생겨서, 실패하면 아예 그대로 두는 쪽을 택함
    // (false를 돌려주면 피커가 사라지는 애니메이션까지 원래대로 되돌림)
    const handleCancelEmoji = async (): Promise<boolean> => {
        if (!review || !selectedEmoji) return false;
        const emoji = selectedEmoji;
        const reviewId = review.id;

        try {
            await removeEmoji(reviewId, emoji);
        } catch (err: any) {
            console.warn('이모지 삭제 실패:', err?.message);
            return false; // 피커가 이모지를 원래대로 되돌림
        }

        syncEmoji(false); // 메인 버튼 애니메이션 값 즉시 리셋 (애니메이션 없이)
        setEmojiSelections(prev => {
            const next = {...prev};
            delete next[reviewId];
            return next;
        });
        return true;
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
                    style={{transform: [{translateY}], paddingTop: insets.top}}
                    {...panResponder.panHandlers}>

                    {/* ── 상단: 사용자(아바타+닉네임+시간) + ⋮ + X (이미지 바깥, 검은 배경 위) ── */}
                    <View style={styles.topRow}>
                        <View style={styles.leftGroup}>
                            <Pressable
                                style={styles.userGroup}
                                disabled={!onPressUser || review.user.user_id == null}
                                onPress={() => onPressUser?.(review.user)}>
                                <ProfileAvatar
                                    profileUrl={review.user.profile_url}
                                    profileImageUrl={review.user.profile_image_url}
                                    style={styles.avatar}
                                />
                                <Text style={styles.nickname} numberOfLines={1}>
                                    {review.user.nickname}
                                </Text>
                            </Pressable>
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
                            source={{uri: review.thumbnail_url ?? review.image_url, priority: FastImage.priority.high}}
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
                        {/* place_name: 마이페이지/마이맵처럼 리뷰마다 장소가 다른 목록용, placeName: 장소상세처럼 장소가 고정인 경우용 */}
                        {(('place_name' in review ? review.place_name : undefined) ?? placeName) ? (() => {
                            const name = ('place_name' in review ? review.place_name : undefined) ?? placeName!;
                            const placeId = 'place_id' in review ? review.place_id : undefined;
                            const pressable = onPressPlace && placeId;
                            return (
                                <Pressable
                                    style={styles.placeGroup}
                                    onPress={pressable ? () => onPressPlace(placeId!, name) : undefined}
                                    disabled={!pressable}>
                                    <IconPlaceLocation size={22} color={colors.icon.inverse} />
                                    <Text style={styles.placeName} numberOfLines={1}>{name}</Text>
                                </Pressable>
                            );
                        })() : <View />}

                        <ReviewPhotoReactionButtons
                            onOpenChat={() => modalRef.current?.present()}
                            selectedEmoji={selectedEmoji}
                            emojiPop={emojiPop}
                            isOwner={isOwner}
                            commentCount={review.comment_count}
                            onPressEmojiButton={
                                isOwner
                                    ? () => onOpenReactionList?.(review.id)
                                    : togglePicker
                            }
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
                <ReviewPhotoEmojiPicker
                    visible={showPicker}
                    onClose={closePicker}
                    onSelect={handleSelectEmoji}
                    selectedEmoji={selectedEmoji}
                    onCancel={handleCancelEmoji}
                />
            </Pressable>
        </>

        {/* ⋮ 메뉴 / 삭제·신고 확인 (독립 — 사진 뷰어와 중첩되지 않게 형제로 분리) */}
        <ReviewMenuModal
            visible={menuOpen}
            isOwner={isOwner}
            onClose={() => setMenuOpen(false)}
            onDelete={() => review && onDelete(review.id)}
            onReport={() => review && onReport(review.id)}
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
        ...typography.b5,
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
        ...typography.b1,
        flexShrink: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },
    timeText: {
        color: colors.text.inverse,
        ...typography.c2,
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
