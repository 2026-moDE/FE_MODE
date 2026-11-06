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

    const handlePressPlace = () => {
        rangeSheetRef.current?.present();
    };

    // 우선 해둠
    const handlePressCard = (_review: CurrentReview) => {
        // TODO
    };

    const handleLongPressCard = (review: CurrentReview) => {
        setPreviewReview(review);
    };

    const handlePressDetail = (review: CurrentReview) => {
        setPreviewReview(null);
        if (review.place_id && review.place_name) {
            navigation.navigate('PlaceDetail', {
                placeId: review.place_id,
                placeName: review.place_name,
            });
        }
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
