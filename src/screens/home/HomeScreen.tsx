import React, {useRef, useEffect, useState, useCallback} from "react";
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
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
// 테스트용 
import { getNearbyPlacesMock, placeDetailsMock, getCurrentReviewsMock } from "../../mocks/placesMock";
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

    // 위치 들어오면 주변 장소 조회 (위치 없으면 그냥 대기)
    useEffect(() => {
        if (!location) return;   // 위치 잡힐 때까지 대기만

        // ⚠️ 테스트용 - mock 강제 사용 (백엔드 API 응답이 불완전해서)
        // 백엔드 정상 연동 후엔 아래 mock 줄 지우고 try/catch 블록 활성화
        console.log('[HomeScreen] mock 데이터로 라이브 버블 표시');
        setPlaces(getNearbyPlacesMock(location));
        return;

        // ────────────────────── 실제 API 호출 (백엔드 연동 완료 후 활성화) ──────────────────────
        // fetchNearbyPlaces({
        //     latitude: location.latitude,
        //     longitude: location.longitude,
        //     radius: 1500,
        // })
        //     .then(res => {
        //         if (res.places && res.places.length > 0) {
        //             setPlaces(res.places);
        //         } else {
        //             console.warn('주변 장소 API 빈 배열 → 목 데이터 사용');
        //             setPlaces(getNearbyPlacesMock(location));
        //         }
        //     })
        //     .catch(error => {
        //         console.warn('주변 장소 API 실패 → 목 데이터 사용:', error?.message);
        //         setPlaces(getNearbyPlacesMock(location));
        //     });
    }, [location]);

    // 검색창 클릭 시 → SearchScreen으로 이동
    const handleSearchFocus = useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    // 장소 버블 클릭 시 → 장소 미니 카드
    const handlePlacePress = useCallback(async (place: NearbyPlace) => {
        setSelectedPlace(place);

        // ⚠️ 테스트용 - mock에 매칭되는 장소면 mock 우선 사용 (백엔드 연동 완료 후 이 블록 삭제)
        const mockDetail = placeDetailsMock[place.id];
        if (mockDetail) {
            console.log('[handlePlacePress] mock 매칭됨 → mock 사용:', place.id);
            const mockReviews = getCurrentReviewsMock(place.id);
            setPlaceDetail(mockDetail);
            setReviewImages(mockReviews.reviews.map(r => r.image_url));
            return;
        }

        try {
            // 상세 + 현재 리뷰 동시 호출
            const [detail, reviews] = await Promise.all([
                fetchPlaceDetail(place.id),
                fetchCurrentReviews(place.id, {limit: 5}),
            ]);
            setPlaceDetail(detail);
            // 현재 리뷰에서 이미지 URL만 추출해서 카드에 표시
            setReviewImages(reviews.reviews.map(r => r.image_url));
        } catch (error: any) {
            console.warn('장소 상세/리뷰 API 실패:', error?.message);
        }
    }, []);

    const handleCardPress = useCallback(()=>{
        if(!placeDetail) return;
        navigation.navigate('PlaceDetail',
            {placeId: placeDetail.id, placeName: placeDetail.name});
    },[placeDetail,navigation])

    // 장소 미니 카드 닫을 때
    const handleCloseCard = useCallback(()=>{
        setSelectedPlace(null);
        setPlaceDetail(null);
        setReviewImages([]);
    },[]);

    // 알림 토글 (벨 아이콘 클릭)
    const handleToggleSubscribe = useCallback(() => {
        if (!placeDetail) return;

        // 일단 로컬 state만 토글 (즉시 UI 반영)
        setPlaceDetail({
            ...placeDetail,
            is_subscribed: !placeDetail.is_subscribed,
        });

        // ──────────────────────  API 호출  ──────────────────────
        // try {
        //     if (placeDetail.is_subscribed) {
        //         await unsubscribe(placeDetail.id);
        //     } else {
        //         await subscribe(placeDetail.id);
        //     }
        // } catch (error) {
        //     console.error('구독 토글 실패:', error);
        //     // 실패 시 롤백
        //     setPlaceDetail(placeDetail);
        // }
    }, [placeDetail]);

    // 거리 텍스트 계산 (내 위치 + 선택된 장소 둘 다 있을 때만)
    const distanceText = location && selectedPlace
        ? `내 위치에서 ${formatDistance(getDistance(location, selectedPlace))}`
        : undefined;

    // 위치 잡힐 때까지 로딩 화면 (시청 초기 카메라 안 뜨도록)
    if (!location) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.brand.primary} />
                <Text style={styles.loadingText}>위치를 찾는 중...</Text>
            </View>
        );
    }

    return(
        <View style={styles.container}>

            <MapView
                ref={mapRef}
                initialCamera={{latitude: location.latitude, longitude: location.longitude, zoom: 16}}
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
                        onToggleSubscribe={handleToggleSubscribe}
                        onPress={handleCardPress}
                    />
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
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
