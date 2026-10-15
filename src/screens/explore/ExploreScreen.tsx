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
import {useLocation} from '../../context/LocationContext';
import {useExploreReviews} from '../../hooks/useExploreReviews';
import {fetchRegion} from '../../api/place';
import {typography} from '../../constants/typography';


export default function ExploreScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const {location} = useLocation();
    const {reviews: apiReviews, isLoading, error, refresh, loadMore} = useExploreReviews();

    const reviews = apiReviews;
    const [regionName, setRegionName] = useState<string | null>(null);
    const [previewReview, setPreviewReview] = useState<CurrentReview | null>(null);

    // 위치가 처음 잡히면 최초 로드 + 동 이름 조회
    const initialLoadDone = useRef(false);
    useEffect(() => {
        if (location && !initialLoadDone.current) {
            initialLoadDone.current = true;
            refresh({latitude: location.latitude, longitude: location.longitude});
            fetchRegion({latitude: location.latitude, longitude: location.longitude})
                .then(r => setRegionName(r.region_3depth_name))
                .catch(() => {});
        }
    }, [location, refresh]);

    const handlePressPlace = () => {
        navigation.navigate('Search', undefined);
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
        loadMore({latitude: location.latitude, longitude: location.longitude});
    };

    return (
        <View style={styles.container}>
            <ExploreHeader
                placeName={regionName ?? (location ? '현 위치 기준' : '위치 확인 중')}
                onPressPlace={handlePressPlace}
            />
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
