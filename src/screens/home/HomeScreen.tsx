import React, {useRef, useEffect, useState, useCallback} from "react";
import {View, Image, StyleSheet} from 'react-native';
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
import { fetchNearbyPlaces, fetchPlaceDetail, fetchCurrentReviews } from "../../api/place";
import { NearbyPlace, PlaceDetail } from "../../types/place";
// 테스트용
// import { getNearbyPlacesMock, placeDetailsMock, getCurrentReviewsMock } from "../../mocks/placesMock";
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

    // 디코딩까지 완료된 썸네일 URL 목록 (버블 이미지 안정 표시용)
    const [readyUrls, setReadyUrls] = useState<Set<string>>(new Set());

    // 컴포넌트가 처음 마운트될 때 위치 권한 요청
    useEffect(() => {
        requestPermission();
    }, []);

    // 주변 장소 조회 함수
    const loadNearbyPlaces = useCallback(() => {
        if (!location) return;
        fetchNearbyPlaces({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 1500,
        })
            .then(res => {
                if (res.places && res.places.length > 0) {
                    setPlaces(res.places);
                    setReadyUrls(new Set()); // 새 장소 목록 → 이미지 다시 로드
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

        // 상세 조회 (카드 표시의 핵심)
        try {
            const detail = await fetchPlaceDetail(place.id);
            console.log('[fetchPlaceDetail] 응답:', JSON.stringify(detail));
            setPlaceDetail(detail);
        } catch (error: any) {
            console.warn('[fetchPlaceDetail] 실패:', error?.response?.status, error?.message);
        }

        // 리뷰 조회 (실패해도 카드는 보임)
        try {
            const reviews = await fetchCurrentReviews(place.id, {limit: 5});
            setReviewImages((reviews.reviews ?? []).map(r => r.image_url));
        } catch (error: any) {
            console.warn('[fetchCurrentReviews] 실패:', error?.response?.status, error?.message);
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

        // ────────────────────── 실제 API 호출 (백엔드 연동 시 활성화) ──────────────────────
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


    return(
        <View style={styles.container}>

            <MapView
                ref={mapRef}
                isShowLocationButton={false}
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

                {places.map(place => (
                    <LiveBubble
                        key={place.id}
                        place={place}
                        imageReady={!place.thumbnail_url || readyUrls.has(place.thumbnail_url)}
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


            {/* 썸네일 프리로더: MapView 밖에서 디코딩까지 완료 후 버블에 전달 */}
            {places.map(place => place.thumbnail_url && !readyUrls.has(place.thumbnail_url) ? (
                <Image
                    key={place.thumbnail_url}
                    source={{uri: place.thumbnail_url}}
                    style={styles.preloader}
                    onLoad={() => setReadyUrls(prev => new Set([...prev, place.thumbnail_url!]))}
                />
            ) : null)}

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
    preloader: { width: 1, height: 1, position: 'absolute', opacity: 0 },
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
