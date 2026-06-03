import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../types/navigation';
import {PlaceDetail, CurrentReview, ArchivedReview} from '../../types/place';
import {useLocation} from '../../context/LocationContext';
import {formatDistance} from '../../utils/distance';
import PlaceDetailHeader from '../../components/placeDetail/PlaceDetailHeader';
import PlaceDetailInfo from '../../components/placeDetail/PlaceDetailInfo';
import ReviewTabs, {ReviewTabKey} from '../../components/placeDetail/ReviewTabs';
import ReviewCard from '../../components/placeDetail/ReviewCard';
import {colors} from '../../constants/colors';
import {spacing} from '../../constants/spacing';
import ReviewPhoto from '../../components/placeDetail/ReviewPhoto';
import {
    fetchPlaceDetail,
    fetchLocationVerify,
    fetchCurrentReviews,
    fetchArchivedReviews,
    subscribe,
    unsubscribe,
} from '../../api/place';

type Props = NativeStackScreenProps<AppStackParamList, 'PlaceDetail'>;

export default function PlaceDetailScreen({route, navigation}: Props) {
    const {placeId, placeName} = route.params;

    // 투명 상태바때문에 ui 올라오는 거 방지
    const insets = useSafeAreaInsets();

    // 현위치 (거리 계산용)
    const {location} = useLocation();

    // 장소 상세 정보
    const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);

    // 거리 (미터 단위)
    const [distance, setDistance] = useState<number | null>(null);

    // 활성 탭 (실시간 / 과거)
    const [activeTab, setActiveTab] = useState<ReviewTabKey>('current');

    // 리뷰 목록 (탭에 따라 다른 데이터)
    const [reviews, setReviews] = useState<(CurrentReview | ArchivedReview)[]>([]);

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

    // 탭 바뀔 때마다 해당 리뷰 가져오기
    useEffect(() => {
        const apiCall =
            activeTab === 'current'
                ? fetchCurrentReviews(placeId, {limit: 20})
                : fetchArchivedReviews(placeId, {limit: 20});

        apiCall
            .then(data => setReviews(data.reviews))
            .catch(error => console.error('리뷰 조회 실패:', error));
    }, [placeId, activeTab]);

    // 거리 텍스트 (계산된 경우만)
    const distanceText =
        distance !== null ? `내 위치에서 ${formatDistance(distance)}` : undefined;

    // 리뷰 짝수로 맞추기 (홀수면 null로 빈 자리 추가 → 마지막 카드 커지는 거 방지)
    const displayReviews = useMemo<((CurrentReview | ArchivedReview) | null)[]>(() => {
        return reviews.length % 2 === 1 ? [...reviews, null] : reviews;
    }, [reviews]);

    // 뒤로가기
    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // 알림 토글
    const handleToggleSubscribe = useCallback(async () => {
        if (!placeDetail) return;

        const previous = placeDetail;
        // 즉시 UI 반영 (낙관적 업데이트)
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
                <PlaceDetailHeader title={placeName} onBack={handleBack} />
                <View style={styles.emptyWrapper}>
                    <Text style={styles.emptyText}>장소 정보를 불러올 수 없습니다</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* 헤더 */}
            <PlaceDetailHeader title="리뷰 확인" onBack={handleBack} />

            {/* 장소 정보 */}
            <PlaceDetailInfo
                place={placeDetail}
                distance={distanceText}
                // onToggleSubscribe={handleToggleSubscribe}  // 알림 API 미구현
            />

            {/* 실시간 / 과거 탭 */}
            <ReviewTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* 리뷰 그리드 */}
            <FlatList
                data={displayReviews}
                keyExtractor={(item, index) => item ? String(item.id) : `placeholder-${index}`}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContent}
                renderItem={({item, index}) => {
                    // 빈 자리 (홀수 마지막 칸) - 공간만 차지하고 안 보임
                    if (item === null) {
                        return <View style={{flex: 1}} />;
                    }
                    return (
                        <ReviewCard
                            review={item}
                            onPress={() => setImageIndex(index)}
                        />
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyWrapper}>
                        <Text style={styles.emptyText}>리뷰가 없습니다</Text>
                    </View>
                }
            />

            {/* 검정 오버레이 - 리뷰 사진 클릭 시 화면 전체(상태바 빼고) 덮음 */}
            {imageIndex !== null && (
                <View style={styles.darkOverlay} pointerEvents="none" />
            )}

            {/* 사진 (Modal로 오버레이 위에 사진/텍스트 표시) */}
            <ReviewPhoto
                reviews={reviews}
                startIndex={imageIndex ?? 0}
                visible={imageIndex !== null}
                onClose={() => setImageIndex(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.white,
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
        padding: spacing.lg,                      // 16
        gap: spacing.md,                          // 12 (행)
    },
    gridRow: {
        gap: spacing.md,                          // 12 (열)
    },
});
