import React, {useEffect, useRef, useState} from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors} from '../../constants/colors';
import type {AppStackParamList} from '../../types/navigation';
import {CurrentReview} from '../../types/place';
import ExploreHeader from '../../components/explore/ExploreHeader';
import ExploreGrid from '../../components/explore/ExploreGrid';
import ExplorePreviewCard from '../../components/explore/ExplorePreviewCard';
import ExploreRangeSheet, {ExploreRangeSheetHandle} from '../../components/explore/ExploreRangeSheet';
import {useLocation} from '../../context/LocationContext';
import {useExploreReviews} from '../../hooks/useExploreReviews';
import {useOnBlockChange} from '../../store/blockEvents';
import {typography} from '../../constants/typography';


export default function ExploreScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const {location} = useLocation();
    const {reviews: apiReviews, isLoading, error, refresh, loadMore} = useExploreReviews();

    const reviews = apiReviews;
    const [previewReview, setPreviewReview] = useState<CurrentReview | null>(null);
    const [distanceKm, setDistanceKm] = useState(5);
    const rangeSheetRef = useRef<ExploreRangeSheetHandle>(null);

    // 위치 처음 잡히면 리뷰 최초 로드, 거리 변경 시 재로드
    const initialLoadDone = useRef(false);
    useEffect(() => {
        if (!location) {return;}
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
        }
        refresh({latitude: location.latitude, longitude: location.longitude, radiusKm: distanceKm});
    // distanceKm 변경 시 재로드 (location은 최초 이후 거의 안 바뀜)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, distanceKm]);

    // 차단/해제되면 이미 받아둔 그리드에 그 사용자 리뷰가 남아 있어서 처음부터 다시 받는다
    useOnBlockChange(() => {
        if (!location) {return;}
        setPreviewReview(null);
        refresh({latitude: location.latitude, longitude: location.longitude});
    });

    const handlePressPlace = () => {
        rangeSheetRef.current?.present();
    };

    // 리뷰 자체는 프리뷰 카드에서 이미 보여줬으니, '자세히 보기'는 그 리뷰가 달린
    // 장소 상세로 보낸다. reviewId를 넘기면 특정 리뷰 사진이 바로 열려버리므로 넘기지 않는다.
    const goToPlaceDetail = (review: CurrentReview) => {
        // place_id/place_name은 CurrentReview의 선택 필드다 (탐색 응답에서만 채워 넣는 값)
        if (!review.place_id || !review.place_name) {
            return;
        }

        navigation.navigate('PlaceDetail', {
            placeId: review.place_id,
            placeName: review.place_name,
        });
    };

    // 탐색에서 카드를 누르면 여기서 바로 리뷰를 펼쳐 본다 (ExplorePreviewCard가 상세 화면 역할).
    // 별도 화면으로 넘어가는 건 그 안의 '자세히 보기'를 눌렀을 때다.
    const handlePressCard = (review: CurrentReview) => {
        setPreviewReview(review);
    };

    const handleLongPressCard = (review: CurrentReview) => {
        setPreviewReview(review);
    };

    const handlePressDetail = (review: CurrentReview) => {
        setPreviewReview(null);
        goToPlaceDetail(review);
    };

    const handleEndReached = () => {
        if (!location) {return;}
        loadMore({latitude: location.latitude, longitude: location.longitude, radiusKm: distanceKm});
    };

    return (
        <View style={styles.container}>
            <ExploreHeader onPressPlace={handlePressPlace} />
            {isLoading && reviews.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.brand.primary} size="large" />
                </View>
            ) : error && reviews.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.message}>오류: {error}</Text>
                </View>
            ) : reviews.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.message}>주변 리뷰가 없어요</Text>
                </View>
            ) : (
                <ExploreGrid
                    reviews={reviews}
                    onPressCard={handlePressCard}
                    onLongPressCard={handleLongPressCard}
                    onEndReached={handleEndReached}
                />
            )}
            <ExplorePreviewCard
                review={previewReview}
                onClose={() => setPreviewReview(null)}
                onPressDetail={handlePressDetail}
            />
            <ExploreRangeSheet
                ref={rangeSheetRef}
                initialDistanceKm={distanceKm}
                onConfirm={km => setDistanceKm(km)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.dark,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        ...typography.b4,
        color: colors.text.disabled,
    },
});
