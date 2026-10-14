import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {AppStackParamList} from '../../types/navigation';
import {fetchMagazineDetail, MagazineItem} from '../../api/magazine';
import {addEmoji, fetchEmojis, removeEmoji} from '../../api/review';
import {useLocation} from '../../context/LocationContext';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {gap, spacing} from '../../constants/spacing';
import {radius} from '../../constants/radius';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import IconPlaceLocation from '../../assets/icons/IconPlaceLocation';
import {formatRelativeTime} from '../../utils/date';
import {
    ReviewPhotoEmojiPicker,
    useReviewPhotoReactions,
} from '../../components/placeDetail/ReviewPhotoReactions';

const chatIcon = require('../../assets/image/placeDeail_comment.png');
const emojiIcon = require('../../assets/image/placeDetail_emoji.png');
const emojiIconFill = require('../../assets/image/placeDetail_emojiFill.png');
import ReviewChatModal from '../../components/placeDetail/ReviewChatModal';

const {width: SCREEN_W} = Dimensions.get('window');
const CARD_W = 293;
const CARD_H = 522;
const CARD_GAP = 16;
const LEFT_PAD = 15;
const SNAP_INTERVAL = CARD_W + CARD_GAP;
const DOT_SIZE = 6;

type RoutePropType = RouteProp<AppStackParamList, 'MagazineDetail'>;

export default function MagazineDetailScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const route = useRoute<RoutePropType>();
    const {magazineId, magazineTitle} = route.params;
    const {location} = useLocation();
    const insets = useSafeAreaInsets();

    const [items, setItems] = useState<MagazineItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [emojiSelections, setEmojiSelections] = useState<Record<number, string>>({});
    const fetchedEmojiIds = useRef<Set<number>>(new Set());
    const currentIndexRef = useRef(0);
    const itemsRef = useRef<MagazineItem[]>([]);
    const modalRef = useRef<BottomSheetModal>(null);
    const {showPicker, emojiPop, togglePicker, closePicker, playSelectAnimation, syncEmoji} =
        useReviewPhotoReactions();

    useEffect(() => {
        fetchMagazineDetail(magazineId, {
            latitude: location?.latitude,
            longitude: location?.longitude,
        })
            .then(data => {
                setItems(data.items);
                itemsRef.current = data.items;
            })
            .catch(err => console.warn('매거진 상세 조회 실패:', err?.message));
    }, [magazineId, location]);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // 리뷰 전환 시 이모지 동기화 + 서버 조회 (한 번만)
    useEffect(() => {
        const item = items[currentIndex];
        if (!item) return;
        syncEmoji(!!emojiSelections[item.review_id]);
        if (fetchedEmojiIds.current.has(item.review_id)) return;
        fetchedEmojiIds.current.add(item.review_id);
        fetchEmojis(item.review_id)
            .then(res => {
                const mine = res.reactions.find(r => r.is_mine);
                setEmojiSelections(prev => {
                    const next = {...prev};
                    if (mine) next[item.review_id] = mine.emoji;
                    else delete next[item.review_id];
                    return next;
                });
                if (itemsRef.current[currentIndexRef.current]?.review_id === item.review_id) {
                    syncEmoji(!!mine);
                }
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, items]);

    const currentItem = items[currentIndex];
    const selectedEmoji = currentItem ? (emojiSelections[currentItem.review_id] ?? null) : null;

    const handleSelectEmoji = async (emoji: string) => {
        if (!currentItem) return;
        const reviewId = currentItem.review_id;
        const prev = emojiSelections[reviewId] ?? null;
        if (prev === emoji) return;
        setEmojiSelections(p => ({...p, [reviewId]: emoji}));
        playSelectAnimation();
        try {
            if (prev) await removeEmoji(reviewId, prev);
            await addEmoji(reviewId, emoji);
        } catch (err: any) {
            console.warn('이모지 반영 실패:', err?.message);
            setEmojiSelections(p => {
                const n = {...p};
                if (prev) n[reviewId] = prev; else delete n[reviewId];
                return n;
            });
            if (itemsRef.current[currentIndexRef.current]?.review_id === reviewId) syncEmoji(!!prev);
        }
    };

    const handleCancelEmoji = async (): Promise<boolean> => {
        if (!currentItem || !selectedEmoji) return false;
        const reviewId = currentItem.review_id;
        try { await removeEmoji(reviewId, selectedEmoji); } catch { return false; }
        syncEmoji(false);
        setEmojiSelections(p => { const n = {...p}; delete n[reviewId]; return n; });
        return true;
    };

    const handleScrollEnd = useCallback((e: {nativeEvent: {contentOffset: {x: number}}}) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
        setCurrentIndex(Math.max(0, Math.min(idx, itemsRef.current.length - 1)));
    }, []);

    const handleOpenChat = useCallback((item: MagazineItem) => {
        // 해당 아이템을 current로 만든 뒤 모달 오픈
        const idx = itemsRef.current.findIndex(r => r.review_id === item.review_id);
        if (idx >= 0) setCurrentIndex(idx);
        modalRef.current?.present();
    }, []);

    const handlePressEmoji = useCallback((item: MagazineItem) => {
        const idx = itemsRef.current.findIndex(r => r.review_id === item.review_id);
        if (idx >= 0) setCurrentIndex(idx);
        togglePicker();
    }, [togglePicker]);

    const renderItem = useCallback(({item}: {item: MagazineItem}) => {
        const itemSelectedEmoji = emojiSelections[item.review_id] ?? null;
        return (
            <View style={styles.itemContainer}>
                {/* 유저 정보 */}
                <View style={styles.userRow}>
                    <Pressable onPress={() => navigation.navigate('UserMyPage', {userId: item.user.user_id})} hitSlop={6}>
                        <ProfileAvatar
                            profileUrl={item.user.profile_image_url}
                            profileImageUrl={item.user.profile_image_url}
                            style={styles.avatar}
                        />
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate('UserMyPage', {userId: item.user.user_id})} hitSlop={6}>
                        <Text style={styles.nickname} numberOfLines={1}>{item.user.nickname}</Text>
                    </Pressable>
                    <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
                </View>

                {/* 사진 카드 */}
                <View style={styles.card}>
                    <FastImage
                        source={{uri: item.thumbnail_url ?? item.image_url, priority: FastImage.priority.high}}
                        style={styles.cardImage}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                    {!!item.comment && (
                        <View style={styles.commentWrap}>
                            <Text style={styles.commentText}>{item.comment}</Text>
                        </View>
                    )}
                </View>

                {/* 장소명 + 반응 버튼 */}
                <View style={styles.cardBottomRow}>
                    <Pressable style={styles.placeGroup} onPress={() => navigation.navigate('PlaceDetail', {placeId: item.place.id, placeName: item.place.name})} hitSlop={6}>
                        <IconPlaceLocation size={20} color={colors.icon.inverse} />
                        <Text style={styles.placeName} numberOfLines={1}>{item.place.name}</Text>
                    </Pressable>
                    <View style={styles.reactionButtons}>
                        <Pressable hitSlop={10} onPress={() => handleOpenChat(item)}>
                            <FastImage source={chatIcon} style={styles.reactionIcon} resizeMode={FastImage.resizeMode.contain} />
                        </Pressable>
                        <Pressable hitSlop={10} onPress={() => handlePressEmoji(item)}>
                            {itemSelectedEmoji
                                ? <Animated.Text style={[styles.selectedEmoji, {opacity: emojiPop, transform: [{translateY: emojiPop.interpolate({inputRange: [0, 1], outputRange: [40, 0]})}]}]}>{itemSelectedEmoji}</Animated.Text>
                                : <FastImage source={emojiIcon} style={styles.reactionIcon} resizeMode={FastImage.resizeMode.contain} />
                            }
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }, [emojiSelections, emojiPop, handleOpenChat, handlePressEmoji]);

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
                    <IconArrowLeft size={21} color={colors.icon.inverse} />
                </Pressable>
                <View style={styles.titleWrap}>
                    <Text style={styles.headerTitle} numberOfLines={1}>지금 볼 만한 리뷰</Text>
                </View>
                <View style={styles.backButton} />
            </View>

            {/* 말풍선 */}
            <View style={styles.bubbleWrap}>
                <View style={styles.bubble}>
                    <Text style={styles.bubbleText} numberOfLines={1}>{magazineTitle}</Text>
                </View>
                <View style={styles.bubbleDotLarge} />
                <View style={styles.bubbleDotSmall} />
            </View>

            {/* 가로 스크롤 카드 리스트 */}
            <FlatList
                style={styles.flatList}
                data={items}
                horizontal
                keyExtractor={item => String(item.review_id)}
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                contentContainerStyle={styles.listContent}
                getItemLayout={(_, index) => ({
                    length: SNAP_INTERVAL,
                    offset: SNAP_INTERVAL * index,
                    index,
                })}
                onMomentumScrollEnd={handleScrollEnd}
                renderItem={renderItem}
            />

            {/* 페이지 점 */}
            {items.length > 1 && (
                <View style={[styles.dotsRow, {paddingBottom: insets.bottom + spacing.md}]}>
                    {items.map((_, i) => (
                        <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
                    ))}
                </View>
            )}

            {/* 이모지 피커 */}
            <ReviewPhotoEmojiPicker
                visible={showPicker}
                onClose={closePicker}
                onSelect={handleSelectEmoji}
                selectedEmoji={selectedEmoji}
                onCancel={handleCancelEmoji}
            />

            {/* 댓글 바텀시트 */}
            <ReviewChatModal
                ref={modalRef}
                reviewId={currentItem?.review_id}
                reviewVisibility="PUBLIC"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.dark,
    },

    // 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
    },
    backButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.inverse,
        textAlign: 'center',
    },

    // 말풍선
    bubbleWrap: {
        paddingLeft: LEFT_PAD,
        marginTop: spacing['2xl'],
        marginBottom: spacing.md,
    },
    bubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.icon.brand,
        borderRadius: 999,
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.s,
    },
    bubbleText: {
        ...typography.c1,
        color: colors.text.basic,
    },
    bubbleDotLarge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.icon.brand,
        marginLeft: spacing.lg,
        marginTop: -7,
    },
    bubbleDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.icon.brand,
        marginLeft: spacing['3xl'],
        marginTop: 3,
    },

    // 리스트
    flatList: {
        flexGrow: 0,
    },
    listContent: {
        paddingLeft: LEFT_PAD,
        paddingRight: LEFT_PAD - CARD_GAP,
    },

    // 아이템 (유저행 + 카드)
    itemContainer: {
        width: CARD_W,
        marginRight: CARD_GAP,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: gap.md,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.surface.muted,
    },
    nickname: {
        ...typography.b5,
        color: colors.text.inverse,
        flexShrink: 1,
    },
    timeText: {
        ...typography.c2,
        color: colors.text.disabled,
    },

    // 카드
    card: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface.subtle,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    commentWrap: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    commentText: {
        ...typography.b1,
        color: colors.text.inverse,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 4,
    },

    // 카드별 하단 (장소명 + 반응)
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: gap.md,
        marginBottom: gap['2xl'],
    },
    placeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.xs,
        flexShrink: 1,
    },
    placeName: {
        ...typography.b5,
        color: colors.text.inverse,
        flexShrink: 1,
    },
    reactionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.lg,
    },
    reactionIcon: {
        width: 20,
        height: 20,
    },
    selectedEmoji: {
        fontSize: 20,
        lineHeight: 20,
        width: 20,
        textAlign: 'center',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap.sm,
        alignSelf: 'center',
        paddingVertical: spacing.xs,
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: colors.text.disabled,
    },
    dotActive: {
        backgroundColor: colors.text.inverse,
        width: DOT_SIZE + 2,
        height: DOT_SIZE + 2,
        borderRadius: (DOT_SIZE + 2) / 2,
    },
});
