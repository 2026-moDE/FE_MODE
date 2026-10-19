import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../types/navigation';
import {PlaceDetail, CurrentReview, ArchivedReview} from '../../types/place';
import {useLocation} from '../../context/LocationContext';
import {formatDistance} from '../../utils/distance';
import Header from '../../components/common/Header';
import PlaceDetailInfo from '../../components/placeDetail/PlaceDetailInfo';
import {ReviewTabKey} from '../../components/placeDetail/ReviewTabs';
import ReviewCard from '../../components/placeDetail/ReviewCard';
import ArchivedReviewStack from '../../components/placeDetail/ArchivedReviewStack';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import {typography} from '../../constants/typography';
import ReviewPhoto from '../../components/placeDetail/ReviewPhoto';
import ReviewReactionsModal from '../../components/mypage/ReviewReactionsModal';
import {
    fetchPlaceDetail,
    fetchLocationVerify,
    fetchCurrentReviews,
    fetchArchivedReviews,
    subscribe,
    unsubscribe,
} from '../../api/place';
import { deleteReview, changeReview, fetchEmojis, EmojiReaction } from '../../api/review';
import {useOnBlockChange} from '../../store/blockEvents';
import QuickReviewButton from '../../components/home/QuickReviewButton';
import SpeechBubbleHint from '../../components/placeDetail/SpeechBubbleHint';


type Props = NativeStackScreenProps<AppStackParamList, 'PlaceDetail'>;

// "사진 클릭 시 과거 후기 확인이 가능해요" 말풍선 (과거 리뷰 1개 이상일 때) —  총 5번까지만
const PHOTO_HINT_STORAGE_KEY = '@place_detail_photo_hint_shown_count';
const PHOTO_HINT_MAX_COUNT = 5;

// "첫번째 리뷰를 작성해보세요!" 말풍선 (과거/현재 합친 리뷰 0개인 빈 상태) — 총 5번까지만
const EMPTY_HINT_STORAGE_KEY = '@place_detail_empty_hint_shown_count';
const EMPTY_HINT_MAX_COUNT = 5;

// "사진 클릭 시 실시간 후기 확인이 가능해요" 말풍선 (과거 리뷰 없이 실시간 리뷰 1개 이상일 때) — 총 5번까지만
const LIVE_HINT_STORAGE_KEY = '@place_detail_live_hint_shown_count';
const LIVE_HINT_MAX_COUNT = 5;

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function PlaceDetailScreen({route, navigation}: Props) {
    const {placeId, placeName, initialTab, reviewId, notificationAction} = route.params;

    // 투명 상태바때문에 ui 올라오는 거 방지
    const insets = useSafeAreaInsets();

    // 현위치 (거리 계산용)
    const {location} = useLocation();

    // 장소 상세 정보
    const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);

    // 거리 (미터 단위)
    const [distance, setDistance] = useState<number | null>(null);

    // 활성 탭 (실시간 / 과거) - 미니카드에서 클릭한 사진 타입에 따라 초기값 결정
    const [activeTab, setActiveTab] = useState<ReviewTabKey>(initialTab ?? 'current');

    // 리뷰 목록 (탭별로 따로 관리 → 탭 전환 시 다른 탭 데이터가 잠깐 보이는 것 방지)
    const [currentReviews, setCurrentReviews] = useState<CurrentReview[]>([]);
    const [archivedReviews, setArchivedReviews] = useState<ArchivedReview[]>([]);
    const reviews = activeTab === 'current' ? currentReviews : archivedReviews;
    // 리뷰 삭제나 수정시 호출시킴
    const setReviews = useCallback(
        (updater: (prev: (CurrentReview | ArchivedReview)[]) => (CurrentReview | ArchivedReview)[]) => {
            if (activeTab === 'current') {
                setCurrentReviews(prev => updater(prev) as CurrentReview[]);
            } else {
                setArchivedReviews(prev => updater(prev) as ArchivedReview[]);
            }
        },
        [activeTab],
    );

    // 리뷰 사진 index
    const [imageIndex, setImageIndex] = useState< number | null>(null);

    // 내 리뷰 이모지 반응 목록 (마이페이지 ReviewReactionsModal 재사용)
    const reactionsSheetRef = useRef<BottomSheetModal>(null);
    // 뒤로가기 제스처/하드웨어 버튼처럼 handleBack을 안 거치는 경로도 있어서 언마운트 시에도 한 번 더 닫아줌
    useEffect(() => {
        return () => reactionsSheetRef.current?.dismiss();
    }, []);
    const [reactions, setReactions] = useState<EmojiReaction[]>([]);
    const [isReactionsLoading, setIsReactionsLoading] = useState(false);
    const openReactions = useCallback(async (reviewId: number) => {
        reactionsSheetRef.current?.present();
        setIsReactionsLoading(true);
        try {
            const res = await fetchEmojis(reviewId);
            setReactions(res.reactions);
        } catch (error) {
            console.error('이모지 반응 조회 실패:', error);
            setReactions([]);
        } finally {
            setIsReactionsLoading(false);
        }
    }, []);

    // 화면 진입 시 상세 정보 가져오기
    useEffect(() => {
        fetchPlaceDetail(placeId)
            .then(detail => setPlaceDetail(detail))
            .catch(error => console.error('장소 상세 조회 실패:', error));
    }, [placeId]);

    // 위치 들어오면 위치 인증 API로 거리 계산
    useEffect(() => {
        if (!location) return;

        fetchLocationVerify(placeId, location)
            .then(result => setDistance(result.distance))
            .catch(error => console.error('위치 인증 실패:', error));
    }, [placeId, location]);

    // 차단/해제되면 이 장소 리뷰 목록에도 그 사용자 리뷰가 남아 있어서 같은 조회를 다시 돈다
    const [blockReloadKey, setBlockReloadKey] = useState(0);
    useOnBlockChange(() => setBlockReloadKey(prev => prev + 1));

    // 실시간 / 과거 리뷰 가져옴 - 알림에서 특정 리뷰로 들어온 경우, 그리드가 잠깐 보였다가 모달이 뜨는 걸 막기 위해 둘 다 끝났는지 추적
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    useEffect(() => {
        setReviewsLoaded(false);
        Promise.all([
            fetchCurrentReviews(placeId, {limit: 20})
                .then(data => setCurrentReviews(data.reviews))
                .catch(error => console.error('리뷰 조회 실패:', error)),
            fetchArchivedReviews(placeId, {limit: 20})
                .then(data => setArchivedReviews(data.reviews))
                .catch(error => console.error('리뷰 조회 실패:', error)),
        ]).then(() => setReviewsLoaded(true));
    }, [placeId, blockReloadKey]);

    // 알림에서 특정 리뷰로 들어온 경우, 리뷰 상세 페이지가 아닌 해당 리뷰로
    const openedFromNotificationRef = useRef(false);
    // notificationTargetResolved는 "알림이 가리키는 리뷰를 찾는 작업에 대한 결론이 났는가"
    // true면 "다 끝났다"(찾았거나, 없어서 포기했거나, 애초에 알림으로 들어온 게 아니거나), false면 "아직 진행 중"
    // (reviewsLoaded만 보면, reviewsLoaded=true 되는 시점과 실제 imageIndex가 세팅되는 시점이 한 프레임 어긋나서 그 사이에 그리드가 잠깐 보이는 문제가 있었음)
    const [notificationTargetResolved, setNotificationTargetResolved] = useState(false);

    // 같은 화면 인스턴스가 재사용되면서 다른 알림을 또 눌러 reviewId가 바뀐 경우, 위 상태들을 초기화
    // reviewId가 없으면(알림 없이 정상적으로 들어온 경우) → !reviewId는 true → notificationTargetResolved는 처음부터 true. ("애초에 찾을 게 없으니 결론 난 거나 마찬가지")
    // reviewId가 있으면(알림을 눌러서 들어온 경우) → !reviewId는 false → notificationTargetResolved는 false로 시작. ("아직 못 찾음")
    useEffect(() => {
        openedFromNotificationRef.current = false;
        setNotificationTargetResolved(!reviewId);
    }, [reviewId]);

    useEffect(() => {
        // openedFromNotificationRef.current조건 없으면, 사용자가 리뷰 사진창을 닫아도 실시간이나 과거 리뷰 수정이나 삭제 후 자동으로 열림
        if (!reviewId || openedFromNotificationRef.current) return;

        const currentIdx = currentReviews.findIndex(r => r.id === reviewId);
        if (currentIdx >= 0) {
            openedFromNotificationRef.current = true;
            setActiveTab('current');
            setImageIndex(currentIdx);
            if (notificationAction === 'reactions') openReactions(reviewId);
            setNotificationTargetResolved(true);
            return;
        }

        const archivedIdx = archivedReviews.findIndex(r => r.id === reviewId);
        if (archivedIdx >= 0) {
            openedFromNotificationRef.current = true;
            setActiveTab('archived');
            setImageIndex(archivedIdx);
            if (notificationAction === 'reactions') openReactions(reviewId);
            setNotificationTargetResolved(true);
            return;
        }

        // 둘 다 로딩 끝났는데도 못 찾았으면 포기하고 그리드를 보여줌
        if (reviewsLoaded) setNotificationTargetResolved(true);
    }, [reviewId, currentReviews, archivedReviews, reviewsLoaded, notificationAction, openReactions]);

    // 거리 텍스트 (계산된 경우만)
    const distanceText =
        distance !== null ? `내 위치에서 ${formatDistance(distance)}` : undefined;

    // 실시간 탭 + 과거 리뷰가 있을 때만 "과거 리뷰 확인하기" ui
    const hasArchiveTile = activeTab === 'current' && archivedReviews.length > 0;

    // isWaitingForNotificationTarget은 "지금 알림이 가리키는 리뷰를 찾는 중이라, 그리드를 숨겨야 하는 상황인가"
    // -> 장소 상세 그리드가 잠깐 보였다가 리뷰 사진 모달로 넘어가는 게 아니라, 곧바로 모달이 뜨드록
    // "알림으로 들어왔고 + 아직 결론 안 남" 이 한 가지 경우만 true
    const isWaitingForNotificationTarget = !!reviewId && !notificationTargetResolved;

    // 그리드에 뿌릴 데이터 (타일 추가 + 홀수면 null로 빈 자리 추가 → 마지막 카드 커지는 거 방지)
    // 아래 힌트 노출 조건(isEmpty)에서 먼저 써야 해서 원래 위치(그리드 바로 위)보다 앞으로 옮김
    const displayReviews = useMemo<(((CurrentReview | ArchivedReview) | null) | 'archive-entry')[]>(() => {
        const list: (((CurrentReview | ArchivedReview) | null) | 'archive-entry')[] =
            hasArchiveTile ? ['archive-entry', ...reviews] : [...reviews];
        return list.length % 2 === 1 ? [...list, null] : list;
    }, [reviews, hasArchiveTile]);

    // "사진 클릭 시 과거 후기 확인이 가능해요" 말풍선 노출 횟수 관련 (ReviewPhotoConfirmScreen의 블러 안내 말풍선과 동일하게 3초간)
    // 앱 설치 이후 장소 상관없이 장소 상세 화면 방문 총 5번까지만 노출

    // hint1 보여주고 있는지 여부
    const [showArchiveHint, setShowArchiveHint] = useState(false);
    // 3초 뒤 자동으로 숨기기 위해 걸어둔 타이머의 ID를 저장하는 ref. 나중에 취소할 때 씀
    const archiveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // AsyncStorage 확인 결과("5번 안 넘었으니 보여줘도 됨" true / "다 썼음" false)
    const hintAllowedRef = useRef<boolean | null>(null); // null = 아직 AsyncStorage 확인 전
    useEffect(() => {
        if (!hasArchiveTile) return;

        let cancelled = false; // 요청 작업이 유효할 때

        (async () => {
            if (hintAllowedRef.current === null) {
                const countStr = await AsyncStorage.getItem(PHOTO_HINT_STORAGE_KEY);
                const count = countStr ? Number(countStr) : 0;
                hintAllowedRef.current = count < PHOTO_HINT_MAX_COUNT;
                if (hintAllowedRef.current) {
                    await AsyncStorage.setItem(PHOTO_HINT_STORAGE_KEY, String(count + 1)); // 문자열만 저장 가능
                }
            }
            // 실시간 화면 페이지에 있다가 hintAllowedRef받아오는 동안 다른 페이지로 갈 경우 대비
            if (cancelled || !hintAllowedRef.current) return;

            setShowArchiveHint(true);
            archiveHintTimerRef.current = setTimeout(() => setShowArchiveHint(false), 3000);
        })();

        return () => {
            cancelled = true; // 작업 무효 시킴
            if (archiveHintTimerRef.current) clearTimeout(archiveHintTimerRef.current);
        };
    }, [hasArchiveTile]);

    // "사진 클릭 시 과거 후기 확인이 가능해요" 말풍선 UI(위치) 관련
    // "과거 리뷰 확인하기" label의 화면상 실제 위치를 재서, 그 바로 50px 아래 + 화면 전체 폭 기준
    // 가운데(가로)에 말풍선을 절대 위치로 띄움. label은 그리드 1번째 칸 안에 있어서 카드 폭에 갇혀있지만,
    // 말풍선은 카드 폭과 무관하게 화면 전체 기준으로 가운데 있어야 해서 좌표를 직접 씀.
    const archiveLabelRef = useRef<Text>(null);
    const [archiveHintTop, setArchiveHintTop] = useState<number | null>(null);
    useEffect(() => {
        if (!showArchiveHint) {
            setArchiveHintTop(null);
            return;
        }
        // label이 이번 렌더에서 막 마운트된 직후라 한 프레임 뒤에 재야 정확함
        // requestAnimationFrame가 콜백함수
        const raf = requestAnimationFrame(() => {
            archiveLabelRef.current?.measureInWindow((_x, y, _width, height) => {
                setArchiveHintTop(y + height + 50);
            });
        });
        return () => cancelAnimationFrame(raf);
    }, [showArchiveHint]);

    // "첫번째 리뷰를 작성해보세요!" 말풍선 - 실시간 탭 그리드가 비어있어도 과거 리뷰가 있으면 안 뜸.
    // (그리드 자체의 "첫 리뷰를 남겨주세요!" 문구는 지금 보고 있는 탭 기준(isEmpty)이라 여기와 다름)

    //hint2를 지금 보여주고 있는지 여부
    const [showEmptyHint, setShowEmptyHint] = useState(false);
    // 3초 뒤 자동으로 숨기기 위해 걸어둔 타이머의 ID를 저장하는 ref. 나중에 취소할 때 씀
    const emptyHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // AsyncStorage 확인 결과("5번 안 넘었으니 보여줘도 됨" true / "다 썼음" false)
    const emptyHintAllowedRef = useRef<boolean | null>(null);
    // isEmpty는 장소 상세 화면 안의 문구 판별 위함
    const isEmpty = !isWaitingForNotificationTarget && displayReviews.length === 0;
    // isTotallyEmpty는 말풍선 판별 위함
    // reviewsLoaded 없이 배열 길이만 보면, 아직 로딩 중이라 currentReviews/archivedReviews가
    // 초기값(빈 배열)인 순간까지 "진짜 0개"로 착각해서 실시간 리뷰가 있는 곳에서도
    // 데이터 도착 직전에 hint2가 잘못 켜지는 문제가 있었음
    const isTotallyEmpty = reviewsLoaded && !isWaitingForNotificationTarget && currentReviews.length === 0 && archivedReviews.length === 0;
    useEffect(() => {
        if (!isTotallyEmpty) return;

        let cancelled = false;

        (async () => {
            if (emptyHintAllowedRef.current === null) {
                const countStr = await AsyncStorage.getItem(EMPTY_HINT_STORAGE_KEY);
                const count = countStr ? Number(countStr) : 0;
                emptyHintAllowedRef.current = count < EMPTY_HINT_MAX_COUNT;
                if (emptyHintAllowedRef.current) {
                    await AsyncStorage.setItem(EMPTY_HINT_STORAGE_KEY, String(count + 1));
                }
            }
            if (cancelled || !emptyHintAllowedRef.current) return;

            setShowEmptyHint(true);
            emptyHintTimerRef.current = setTimeout(() => setShowEmptyHint(false), 3000);
        })();

        return () => {
            cancelled = true;
            if (emptyHintTimerRef.current) clearTimeout(emptyHintTimerRef.current);
        };
    }, [isTotallyEmpty]);

    // "사진 클릭 시 실시간 후기 확인이 가능해요" 말풍선 
    const [showLiveHint, setShowLiveHint] = useState(false);
    const liveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const liveHintAllowedRef = useRef<boolean | null>(null);
    // 실시간 리뷰가 1개 이상일 때만. 과거 리뷰 힌트와 같은 자리에 겹칠 수 있어 그게 떠있는 동안은 같이 안 띄움
    const hasLiveReview = !hasArchiveTile && activeTab === 'current' && currentReviews.length >= 1;
    useEffect(() => {
        if (!hasLiveReview) return;

        let cancelled = false;

        (async () => {
            if (liveHintAllowedRef.current === null) {
                const countStr = await AsyncStorage.getItem(LIVE_HINT_STORAGE_KEY);
                const count = countStr ? Number(countStr) : 0;
                liveHintAllowedRef.current = count < LIVE_HINT_MAX_COUNT;
                if (liveHintAllowedRef.current) {
                    await AsyncStorage.setItem(LIVE_HINT_STORAGE_KEY, String(count + 1));
                }
            }
            if (cancelled || !liveHintAllowedRef.current) return;

            setShowLiveHint(true);
            liveHintTimerRef.current = setTimeout(() => setShowLiveHint(false), 3000);
        })();

        return () => {
            cancelled = true;
            if (liveHintTimerRef.current) clearTimeout(liveHintTimerRef.current);
        };
    }, [hasLiveReview]);

    // 뒤로가기 (과거 리뷰 화면이면 실시간 화면으로만 복귀, 그게 아니면 이전 화면으로)
    const handleBack = useCallback(() => {
        if (activeTab === 'archived') {
            setActiveTab('current');
            return;
        }
        // 반응 모달은 네비게이션 스택과 별개 레이어(포탈)라, 열려있는 채로 뒤로가면
        // 백드롭이 안 닫힌 채 남아서 다음에 이 장소 들어올 때마다 화면이 뿌옇게 덮여 보임
        reactionsSheetRef.current?.dismiss();
        navigation.goBack();
    }, [navigation, activeTab]);

    // 리뷰 바로 쓰기 버튼 - 현재 장소를 미리 실어 보냄
    const handleQuickReview = useCallback(() => {
        navigation.navigate('ReviewStack', {
            screen: 'ReviewCamera',
            params: {placeId, placeName},
        });
    }, [navigation, placeId, placeName]);

    // 알림 토글
    const handleToggleSubscribe = useCallback(async () => {
        if (!placeDetail) return;

        const previous = placeDetail;
        // 즉시 UI 반영
        setPlaceDetail({
            ...placeDetail,
            is_subscribed: !placeDetail.is_subscribed,
        });

        try {
            if (previous.is_subscribed) {
                await unsubscribe(previous.id);
            } else {
                await subscribe(previous.id);
            }
        } catch (error) {
            console.error('구독 토글 실패:', error);
            // 실패 시 롤백
            setPlaceDetail(previous);
        }
    }, [placeDetail]);

    // 장소 정보 없을 때 (예외 처리)
    if (!placeDetail) {
        return (
            <View style={[styles.container, {paddingTop: insets.top}]}>
                <Header title={placeName} onBack={handleBack} />
                <View style={styles.emptyWrapper}>
                    <Text style={styles.emptyText}>장소 정보를 불러올 수 없습니다</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* 장소 정보 (뒤로가기 + 장소명 + 알림 아이콘 + 주소 + 혼잡도) */}
            <View style={styles.infoWrapper}>
                <PlaceDetailInfo
                    place={placeDetail}
                    distance={distanceText}
                    onBack={handleBack}
                    onToggleSubscribe={handleToggleSubscribe}
                />
            </View>

            {isWaitingForNotificationTarget ? (
                // 알림에서 들어온 경우 그리드 대신 로딩만 보여주고, 로딩 끝나면 위 useEffect가 바로 리뷰 사진 모달을 띄움
                <View style={styles.notificationLoadingWrapper}>
                    <ActivityIndicator size="large" color={colors.brand.primary} />
                </View>
            ) : (
            <>
            {/* 과거 리뷰 화면일 때만 섹션 타이틀 노출 */}
            {activeTab === 'archived' && (
                <Text style={styles.archivedSectionTitle}>과거 리뷰</Text>
            )}

            {/* 리뷰 그리드 */}
            <FlatList
                data={displayReviews}
                style={styles.gridList}
                keyExtractor={(item, index) =>
                    item === 'archive-entry' ? 'archive-entry' : item ? String(item.id) : `placeholder-${index}`
                }
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContent}
                renderItem={({item, index}) => {
                    // "과거 리뷰 확인하기" 타일
                    if (item === 'archive-entry') {
                        return (
                            <ArchivedReviewStack
                                reviews={archivedReviews.slice(0, 3)}
                                onPress={() => setActiveTab('archived')}
                                labelRef={archiveLabelRef}
                            />
                        );
                    }
                    // 빈 자리 (홀수 마지막 칸) - 공간만 차지하고 안 보임
                    if (item === null) {
                        return <View style={{flex: 1}} />;
                    }
                    // 과거 리뷰가 있다면 ui가 0번 칸을 차지하는 만큼 실제 리뷰 배열(reviews)에서의 인덱스는 하나 밀림
                    const reviewIndex = hasArchiveTile ? index - 1 : index;
                    return (
                        <ReviewCard
                            review={item}
                            onPress={() => setImageIndex(reviewIndex)}
                            onPressUser={user => {
                                if (user.user_id == null) return;
                                navigation.navigate('UserMyPage', {userId: user.user_id});
                            }}
                            isArchived={activeTab === 'archived'}
                        />
                    );
                }}
            />
            </>
            )}

            {/* 리뷰가 하나도 없을 때 - 헤더 포함 화면 전체 정중앙에 고정 */}
            {isEmpty && (
                <View style={styles.emptyWrapper} pointerEvents="none">
                    <Text style={styles.emptyText}>아직 리뷰가 작성되지 않았어요</Text>
                </View>
            )}

            {/* 리뷰 사진 풀스크린 뷰어  */}
            <ReviewPhoto
                reviews={reviews}
                startIndex={imageIndex ?? 0}
                visible={imageIndex !== null}
                placeName={placeDetail.name}
                autoOpenChat={notificationAction === 'chat'}
                onOpenReactionList={openReactions}
                onClose={() => setImageIndex(null)}
                onPressUser={user => {
                    if (user.user_id == null) return;
                    navigation.navigate('UserMyPage', {userId: user.user_id});
                }}
                onDelete={async reviewId => {
                    try {
                        await deleteReview(reviewId);
                        setReviews(prev => prev.filter(r => r.id !== reviewId));
                        setImageIndex(null);
                    } catch (error) {
                        console.error('리뷰 삭제 실패:', error);
                    }
                }}

                onReport={reviewId => {
                    navigation.navigate('ReviewReport', {reviewId});
                    setImageIndex(null);
                }}

                onChangeComment={async(reviewId, comment )=>{
                    try{
                        await changeReview(reviewId,{comment});
                        setReviews(prev=>prev.map(r=> r.id===reviewId ? {...r,comment} : r))
                    } catch(e){
                        console.error('리뷰 수정 실패:', e);
                    }
                }}
            />

            {/* 리뷰 바로 쓰기 버튼 (사진 클릭시 숨김) */}
            {imageIndex === null && (
                <View style={styles.quickReviewRow} pointerEvents="box-none">
                    {/* 리뷰가 하나도 없을 때만: 버튼 바로 위, 버튼 폭 기준 가운데 (버튼과 같은 컬럼 안에 순서대로 놓여서 자동 정렬) */}
                    {showEmptyHint && (
                        <View style={styles.emptyHintWrapper}>
                            <SpeechBubbleHint text="첫번째 리뷰를 작성해보세요!" />
                        </View>
                    )}
                    <QuickReviewButton onPress={handleQuickReview} />
                </View>
            )}

            {/* 내 리뷰 이모지 반응 목록 */}
            <ReviewReactionsModal ref={reactionsSheetRef} reactions={reactions} isLoading={isReactionsLoading} />

            {/* 과거 리뷰 안내 말풍선 - label 실제 화면 위치(archiveHintTop) 기준으로 화면 전체 폭 가운데에 절대 위치 */}
            {showArchiveHint && archiveHintTop !== null && (
                <View style={[styles.archiveHintOverlay, {top: archiveHintTop}]} pointerEvents="none">
                    <SpeechBubbleHint text="사진 클릭 시 과거 후기 확인이 가능해요" direction="up" tailOffsetX={-90} />
                </View>
            )}

            {/* 실시간 후기 안내 말풍선 - 화면 전체 높이 기준 정중앙(hasLiveReview 자체가 !hasArchiveTile을 포함해서 hint1과 겹칠 일이 없음) */}
            {showLiveHint && (
                <View style={[styles.archiveHintOverlay, {top: SCREEN_HEIGHT / 2 - insets.top}]} pointerEvents="none">
                    <SpeechBubbleHint text="사진 클릭 시 실시간 후기 확인이 가능해요" direction="up" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.dark,
    },
    darkOverlay: {
        // 리뷰 사진 클릭했을 때 뒷 화면 전체를 덮는 검정 레이어
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(20, 20, 20, 0.98)',
    },
    emptyWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationLoadingWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: colors.text.subtle,
        ...typography.b3,
    },
    gridList: {
        flex: 1,
    },
    gridContent: {
        flexGrow: 1,
        padding: spacing.lg,
        gap: spacing.md,
    },
    gridRow: {
        gap: spacing.md,                          
    },
    archivedSectionTitle: {
        ...typography.b3,
        color: colors.text.inverse,
        paddingHorizontal: spacing.lg,
    },
    // 말풍선 컨테이너
    infoWrapper: {
        position: 'relative',
    },
    // hint1 전용 - label을 measureInWindow로 잰 y좌표(top)를 그대로 씀. 화면 전체 폭 기준 가운데.
    archiveHintOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    quickReviewRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 30,
        alignItems: 'center',
    },
    // 빈 상태 힌트 - quickReviewRow가 이미 alignItems:'center'인 컬럼이라, 버튼보다 먼저 렌더하면
    // 자동으로 버튼 바로 위, 버튼과 같은 가로 중심에 놓임 (좌표 계산 필요 없음)
    emptyHintWrapper: {
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
});
