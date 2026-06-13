import React, {useRef, useEffect, useState, useCallback} from "react";
import {View, Text, Image, StyleSheet, ActivityIndicator} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import MapView from "../../components/map/MapView";
import SearchBar from "../../components/search/SearchBar";
import LiveBubble from "../../components/home/LiveBubble";
import { useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppStackParamList, TabParamList } from "../../types/navigation";
import { useLocationPermission } from "../../hooks/useLocationPermission";
import { useLocation } from "../../context/LocationContext";
import { fetchNearbyPlaces, fetchPlaceDetail, fetchCurrentReviews, fetchArchivedReviews, subscribe, unsubscribe } from "../../api/place";
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

    // 디코딩까지 완료된 썸네일 URL 목록 (버블 이미지 안정 표시용)
    const [readyUrls, setReadyUrls] = useState<Set<string>>(new Set());

    // 지도 초기화 완료 여부 (초기화 전 마커 렌더 방지)
    const [mapReady, setMapReady] = useState(false);

    // 컴포넌트가 처음 마운트될 때 위치 권한 요청
    useEffect(() => {
        requestPermission();
    }, []);

    // 미니카드 떠있을 때 하단 탭바 숨김 (카드 닫으면 복구)
    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: placeDetail ? { display: 'none' } : undefined,
        });
    }, [navigation, placeDetail]);

    // 주변 장소 조회 함수
    const loadNearbyPlaces = useCallback(() => {
        if (!location) return;

        fetchNearbyPlaces({
            latitude: location.latitude,
            longitude: location.longitude,
            filter: 'all',   // 전체 리뷰 버블 표시
        })
            .then(res => {
                if (res.places && res.places.length > 0) {
                    const unique = res.places.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
                    const newUrls = new Set(unique.map(p => p.thumbnail_url).filter(Boolean) as string[]);
                    setPlaces(unique);
                    // 기존에 로드된 URL은 유지, 새 URL만 preloader가 채움
                    setReadyUrls(prev => new Set([...prev].filter(url => newUrls.has(url))));
                }
            })
            .catch(error => {
                console.warn('주변 장소 API 실패:', error?.message);
            });
    }, [location]);

    // 위치 들어오면 최초 조회
    useEffect(() => {
        loadNearbyPlaces();
    }, [loadNearbyPlaces]);

    // 화면 포커스 시 재조회 (리뷰 작성 후 썸네일 업데이트)
    useFocusEffect(
        useCallback(() => {
            loadNearbyPlaces();
            setSelectedPlace(null);
            setPlaceDetail(null);
            setReviewImages([]);
        }, [loadNearbyPlaces])
    );

    // 검색창 클릭 시 → SearchScreen으로 이동
    const handleSearchFocus = useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    // 장소 버블 클릭 시 → 장소 미니 카드
    const handlePlacePress = useCallback(async (place: NearbyPlace) => {
        console.log('[handlePlacePress] 호출됨, place.id:', place.id);
        setSelectedPlace(place);
        setPlaceDetail(null);
        setReviewImages([]);

        // 상세 조회
        try {
            const detail = await fetchPlaceDetail(place.id);
            console.log('[fetchPlaceDetail] 응답:', JSON.stringify(detail));
            setPlaceDetail(detail);
        } catch (error: any) {
            console.warn('[fetchPlaceDetail] 실패:', error?.response?.status, error?.message);
        }

        // 리뷰 조회: current + archived 합쳐서 최신순 상위 5개
        try {
            const [currentRes, archivedRes] = await Promise.all([
                fetchCurrentReviews(place.id, {limit: 5}).catch(() => ({reviews: []} as any)),
                fetchArchivedReviews(place.id, {limit: 5}).catch(() => ({reviews: []} as any)),
            ]);
            const allReviews = [...(currentRes.reviews ?? []), ...(archivedRes.reviews ?? [])];
            const sortedByLatest = allReviews.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setReviewImages(sortedByLatest.slice(0, 5).map(r => r.image_url));
        } catch (error: any) {
            console.warn('[리뷰 조회] 실패:', error?.message);
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
    const handleToggleSubscribe = useCallback(async () => {
        if (!placeDetail) return;

        const previous = placeDetail;
        setPlaceDetail({
            ...placeDetail,
            is_subscribed: !placeDetail.is_subscribed,
        });

        // ──────────────────────  API 호출  ──────────────────────
        // try {
        //     if (previous.is_subscribed) {
        //         await unsubscribe(previous.id);
        //     } else {
        //         await subscribe(previous.id);
        //     }
        // } catch (error) {
        //     console.error('구독 토글 실패:', error);
        //     setPlaceDetail(previous);
        // }
    }, [placeDetail]);

    // 거리 텍스트 계산 (내 위치 + 선택된 장소 둘 다 있을 때만)
    const distanceText = location && selectedPlace && selectedPlace.latitude != null && selectedPlace.longitude != null
        ? `내 위치에서 ${formatDistance(getDistance(location, {latitude: selectedPlace.latitude, longitude: selectedPlace.longitude}))}`
        : undefined;

    // 위치 잡힐 때까지 로딩 화면 (초기 카메라 안 뜨도록)
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
                    setMapReady(true);
                    setTimeout(() => {
                        console.log('[Map] setLocationTrackingMode Follow');
                        mapRef.current?.setLocationTrackingMode('Follow');
                    }, 300);
                }}
                onOptionChanged={(params) => {
                    console.log('[Map] onOptionChanged:', params.locationTrackingMode);
                }}>

                {mapReady && places.map(place => (
                    <LiveBubble
                        key={`${place.id}-${readyUrls.has(place.thumbnail_url ?? '')}`}
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
            {/* ⚠️ 시연용 임시: 알림 버튼 숨김 (복구 시 아래 주석 풀고 위 SearchBar 단독 블록 제거) */}
            <View style={[styles.searchBarWrapper, { top: insets.top + 10 }]}>
                <SearchBar
                    value={''}
                    logoIcon={<IconLogo width={40} height={22} color={colors.icon.basic}/>}
                    onChangeText={() => {}}
                    onFocus={handleSearchFocus}
                    backgroundColor={colors.surface.white}
                    width={361} // 검색창 잠깐 폭 늘려둠
                />
                {/* 데모에서만 ui잠깐 없앰 */}
                {/* <IconMapBell size={18} color={colors.icon.basic} /> */}
            </View>

            {/* 썸네일 프리로더: decode 완료 후에만 마커 렌더 */}
            {places.map(place => place.thumbnail_url && !readyUrls.has(place.thumbnail_url) ? (
                <Image
                    key={place.id}
                    source={{uri: place.thumbnail_url}}
                    style={styles.preloader}
                    resizeMethod="resize"
                    onLoad={() => setTimeout(() => setReadyUrls(prev => new Set([...prev, place.thumbnail_url!])), 100)}
                    onError={() => setReadyUrls(prev => new Set([...prev, place.thumbnail_url!]))}
                />
            ) : null)}

            {placeDetail && (
                <View style={styles.cardWrapper}>
                    <HomeMiniCard
                        place={placeDetail}
                        distance={distanceText}
                        images={reviewImages}
                        // onToggleSubscribe={handleToggleSubscribe}  // 알림 API 미구현
                        onPress={handleCardPress}
                    />
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    preloader: { width: 1, height: 1, position: 'absolute', opacity: 0 },
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
        bottom: 30,                     // 탭바 숨겨져서 더 내림 (기존 100)
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
