import React, {useRef, useEffect, useState, useCallback} from "react";
import {View, StyleSheet} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import MapView from "../../components/map/MapView";
import SearchBar from "../../components/search/SearchBar";
import LiveBubble from "../../components/home/LiveBubble";
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppStackParamList, TabParamList } from "../../types/navigation";
import { useLocationPermission } from "../../hooks/useLocationPermission";
import { useLocation } from "../../context/LocationContext";
import { fetchNearbyPlaces, fetchPlaceDetail, fetchCurrentReviews } from "../../api/place";
import { NearbyPlace, PlaceDetail } from "../../types/place";
import IconLogo from "../../assets/icons/IconLogo";
import { colors } from '../../constants/colors';
import IconMapBell from "../../assets/icons/IconMapBell";
import IconCurrentLocation from "../../assets/icons/IconCurrentLocation";
import HomeMiniCard from "../../components/home/HomeMiniCard";
import { getDistance, formatDistance } from "../../utils/distance";


// 탭 안에 있지만 스택 화면(Search)으로도 이동해야 해서 두 타입을 합침
type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    NativeStackNavigationProp<AppStackParamList>
>;

export default function HomeScreen(){
    const navigation = useNavigation<NavigationProp>();
    const mapRef = useRef<NaverMapViewRef>(null);
    const insets = useSafeAreaInsets(); // 상태바 높이

    // 검색창에 입력된 텍스트 state (홈에서는 불필요 - 클릭 시 SearchScreen으로 이동)
    // const [searchText, setSearchText] = useState('');

    // 커스텀 훅에서 권한 요청 함수 가져오기
    const { requestPermission } = useLocationPermission();

    // 현재 위치
    const { location } = useLocation();

    // 주변 장소 목록
    const [places, setPlaces] = useState<NearbyPlace[]>([]);

    // 선택된 장소 목록
    const[selectedPlace, setSelectedPlace] = useState<NearbyPlace| null>(null);

    // 장소 미니 카드 정보
    const [placeDetail, setPlaceDetail] = useState<PlaceDetail| null>(null);

    // 미니 카드에 표시할 리뷰 이미지 URL 목록
    const [reviewImages, setReviewImages] = useState<string[]>([]);

    // 컴포넌트가 처음 마운트될 때 위치 권한 요청
    useEffect(() => {
        requestPermission();
    }, []);

    // 위치 들어오면 주변 장소 조회
    useEffect(() => {
        if (!location) return;

        fetchNearbyPlaces({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 1500,
        })
            .then(res => setPlaces(res.places))
            .catch(error => console.error('주변 장소 조회 실패:', error));
    }, [location]);

    // 검색창 클릭 시 → SearchScreen으로 이동
    const handleSearchFocus = useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    // 장소 버블 클릭 시 → 장소 미니 카드
    const handlePlacePress = useCallback(async (place: NearbyPlace) => {
        setSelectedPlace(place);

        try {
            // 상세 + 현재 리뷰 동시 호출
            const [detail, reviews] = await Promise.all([
                fetchPlaceDetail(place.id),
                fetchCurrentReviews(place.id, {limit: 5}),
            ]);
            setPlaceDetail(detail);
            // 현재 리뷰에서 이미지 URL만 추출해서 카드에 표시
            setReviewImages(reviews.reviews.map(r => r.image_url));
        } catch (error) {
            console.error('장소 상세/리뷰 조회 실패:', error);
        }
    }, []);

    // 장소 미니 카드 닫을 때
    const handleCloseCard = useCallback(()=>{
        setSelectedPlace(null);
        setPlaceDetail(null);
        setReviewImages([]);
    },[]);

    // 거리 텍스트 계산 (내 위치 + 선택된 장소 둘 다 있을 때만)
    const distanceText = location && selectedPlace
        ? `내 위치에서 ${formatDistance(getDistance(location, selectedPlace))}`
        : undefined;


    return(
        <View style={styles.container}>

            <MapView
                ref={mapRef}
                isShowLocationButton={false}   // 기본 위치 버튼 숨김 (커스텀 버튼 사용)
                onTapMap={handleCloseCard}
                onInitialized={() => {
                    console.log('[Map] onInitialized');
                    setTimeout(() => {
                        console.log('[Map] setLocationTrackingMode Follow');
                        mapRef.current?.setLocationTrackingMode('Follow');
                    }, 300);
                }}
                onOptionChanged={(params) => {
                    console.log('[Map] onOptionChanged:', params.locationTrackingMode);
                }}>

                {/* 근처 라이브 버블 표시 */}
                {places.map(place => (
                    <LiveBubble
                        key={place.id}
                        place={place}
                        onPress={handlePlacePress}
                    />
                ))}
            </MapView>

            {/* 커스텀 현위치 버튼 */}
            <IconCurrentLocation
                style={styles.locationButton}
                onPress={() => {
                    mapRef.current?.setLocationTrackingMode('Follow');
                }}
            />

            {/* 지도 검색창 + 알림 버튼 */}
            <View style={[styles.searchBarWrapper, { top: insets.top + 10 }]}>
                <SearchBar
                    value={''}
                    logoIcon={<IconLogo width={40} height={22} color={colors.icon.basic}/>}
                    onChangeText={() => {}}
                    onFocus={handleSearchFocus}
                />
                <IconMapBell size={18} color={colors.icon.basic} />
            </View>


            {placeDetail && (
                <View style={styles.cardWrapper}>
                    <HomeMiniCard
                        place={placeDetail}
                        distance={distanceText}
                        images={reviewImages}
                    />
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBarWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',       // 검색창 + 벨 가로 배치
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,                     // Gap/gap-lg
        paddingHorizontal: 16,
    },
    locationButton: {
        position: 'absolute',
        right: 16,
        bottom: 120,                // 탭바 위에 위치
    },
    cardWrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    },
});
