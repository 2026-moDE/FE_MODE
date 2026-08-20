import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, FlatList, StyleSheet, Pressable} from 'react-native';
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
import {radius} from '../../constants/radius';
import {typography} from '../../constants/typography';
import ReviewPhoto from '../../components/placeDetail/ReviewPhoto';
import {
    fetchPlaceDetail,
    fetchLocationVerify,
    fetchCurrentReviews,
    fetchArchivedReviews,
    subscribe,
    unsubscribe,
} from '../../api/place';
import { deleteReview, changeReview } from '../../api/review';
import QuickReviewButton from '../../components/home/QuickReviewButton';


type Props = NativeStackScreenProps<AppStackParamList, 'PlaceDetail'>;

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

    // 실시간 / 과거 리뷰 가져옴
    useEffect(() => {
        fetchCurrentReviews(placeId, {limit: 20})
            .then(data => setCurrentReviews(data.reviews))
            .catch(error => console.error('리뷰 조회 실패:', error));
        fetchArchivedReviews(placeId, {limit: 20})
            .then(data => setArchivedReviews(data.reviews))
            .catch(error => console.error('리뷰 조회 실패:', error));
    }, [placeId]);

    // 알림에서 특정 리뷰로 들어온 경우, 리뷰 상세 페이지가 아닌 해당 리뷰로
    const openedFromNotificationRef = useRef(false);
    useEffect(() => {
        // openedFromNotificationRef.current조건 없으면, 사용자가 리뷰 사진창을 닫아도 실시간이나 과거 리뷰 수정이나 삭제 후 자동으로 열림
        if (!reviewId || openedFromNotificationRef.current) return;

        const currentIdx = currentReviews.findIndex(r => r.id === reviewId);
        if (currentIdx >= 0) {
            openedFromNotificationRef.current = true;
            setActiveTab('current');
            setImageIndex(currentIdx);
            return;
        }

        const archivedIdx = archivedReviews.findIndex(r => r.id === reviewId);
        if (archivedIdx >= 0) {
            openedFromNotificationRef.current = true;
            setActiveTab('archived');
            setImageIndex(archivedIdx);
        }
    }, [reviewId, currentReviews, archivedReviews]);

    // 거리 텍스트 (계산된 경우만)
    const distanceText =
        distance !== null ? `내 위치에서 ${formatDistance(distance)}` : undefined;

    // 실시간 탭 + 과거 리뷰가 있을 때만 그리드 첫 칸에 "과거 리뷰 확인하기" 타일 노출
    const hasArchiveTile = activeTab === 'current' && archivedReviews.length > 0;

    // 과거 리뷰 타일 안내 말풍선 (ReviewPhotoConfirmScreen의 블러 안내와 동일하게 3초간 노출)
    const [showArchiveHint, setShowArchiveHint] = useState(false);
    const archiveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!hasArchiveTile) return;

        setShowArchiveHint(true);
        archiveHintTimerRef.current = setTimeout(() => setShowArchiveHint(false), 3000);

        return () => {
            if (archiveHintTimerRef.current) clearTimeout(archiveHintTimerRef.current);
        };
    }, [hasArchiveTile]);

    // 그리드에 뿌릴 데이터 (타일 추가 + 홀수면 null로 빈 자리 추가 → 마지막 카드 커지는 거 방지)
    const displayReviews = useMemo<(((CurrentReview | ArchivedReview) | null) | 'archive-entry')[]>(() => {
        const list: (((CurrentReview | ArchivedReview) | null) | 'archive-entry')[] =
            hasArchiveTile ? ['archive-entry', ...reviews] : [...reviews];
        return list.length % 2 === 1 ? [...list, null] : list;
    }, [reviews, hasArchiveTile]);

    // 뒤로가기 (과거 리뷰 화면이면 실시간 화면으로만 복귀, 그게 아니면 이전 화면으로)
    const handleBack = useCallback(() => {
        if (activeTab === 'archived') {
            setActiveTab('current');
            return;
        }
        navigation.goBack();
    }, [navigation, activeTab]);

    // 리뷰 바로 쓰기 (조리개 버튼) - 현재 장소를 미리 실어 보냄
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
                    onToggleSubscribe={handleToggleSubscribe}  // 알림 API 미구현
                />

                {/* 실시간 탭 + 과거 리뷰 있을 때만: 과거 리뷰 타일 안내 말풍선 (자리 차지 안 하고 리뷰 위에 떠 있음) */}
                {showArchiveHint && (
                    <View style={styles.archiveHintWrapper}>
                        <View style={styles.archiveHintBubble}>
                            <Text style={styles.archiveHintText}>사진 클릭 시 자세한 후기 확인이 가능해요</Text>
                        </View>
                        <View style={styles.archiveHintTail} />
                    </View>
                )}
            </View>

            {/* 과거 리뷰 화면일 때만 섹션 타이틀 노출 */}
            {activeTab === 'archived' && (
                <Text style={styles.archivedSectionTitle}>과거 리뷰</Text>
            )}

            {/* 리뷰 그리드 */}
            <FlatList
                data={displayReviews}
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
                            />
                        );
                    }
                    // 빈 자리 (홀수 마지막 칸) - 공간만 차지하고 안 보임
                    if (item === null) {
                        return <View style={{flex: 1}} />;
                    }
                    // 타일이 0번 칸을 차지하는 만큼 실제 리뷰 배열(reviews)에서의 인덱스는 하나 밀림
                    const reviewIndex = hasArchiveTile ? index - 1 : index;
                    return (
                        <ReviewCard
                            review={item}
                            onPress={() => setImageIndex(reviewIndex)}
                            isArchived={activeTab === 'archived'}
                        />
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyWrapper}>
                        <Text style={styles.emptyText}>첫 리뷰를 남겨주세요!</Text>
                    </View>
                }
            />

            {/* 리뷰 사진 풀스크린 뷰어  */}
            <ReviewPhoto
                reviews={reviews}
                startIndex={imageIndex ?? 0}
                visible={imageIndex !== null}
                placeName={placeDetail.name}
                autoOpenChat={notificationAction === 'chat'}

                onClose={() => setImageIndex(null)}
                onDelete={async () => {
                    if (imageIndex === null) return;
                    try {
                        await deleteReview(reviews[imageIndex].id);
                        setReviews(prev => prev.filter((_, i) => i !== imageIndex));
                        setImageIndex(null);
                    } catch (error) {
                        console.error('리뷰 삭제 실패:', error);
                    }
                }}
                
                onReport={() => {
                    if (imageIndex === null) return;
                    const reviewId = reviews[imageIndex].id;
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
                    <QuickReviewButton onPress={handleQuickReview} />
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['3xl'],
    },
    emptyText: {
        color: colors.text.subtle,
        fontSize: 14,
    },
    gridContent: {
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
    // 과거 리뷰 타일 안내 말풍선 
    archiveHintWrapper: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: -spacing.lg,     
        alignItems: 'center',       
        zIndex: 10,
    },
    archiveHintBubble: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: colors.surface.brand,
    },
    archiveHintText: {
        ...typography.c1,
        color: colors.text.basic,
    },
    archiveHintTail: {
        marginTop: -1,          // 말풍선 박스와의 서브픽셀 틈 방지
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.surface.brand,
    },
    quickReviewRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 30,
        alignItems: 'center',
    },
});
