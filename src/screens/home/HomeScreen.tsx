import React, {useRef, useEffect, useState, useCallback, useMemo} from "react";
import {View, Text, StyleSheet, ActivityIndicator, useWindowDimensions} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import MapView from "../../components/map/MapView";
import SearchBar from "../../components/search/SearchBar";
import LiveBubble from "../../components/home/LiveBubble";
import ClusterBubble from "../../components/home/ClusterBubble";
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
import QuickReviewButton from "../../components/home/QuickReviewButton";
import ReviewBottomSheet from "../../components/home/ReviewBottomSheet";
import { getDistance, formatDistance } from "../../utils/distance";
import Supercluster from "supercluster";
import BottomSheet from "@gorhom/bottom-sheet";
import Animated, {useSharedValue, useAnimatedStyle} from "react-native-reanimated";


// 탭 안에 있지만 스택 화면(Search)으로도 이동해야 해서 두 타입을 합침
type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    NativeStackNavigationProp<AppStackParamList>
>;

export default function HomeScreen(){
    const navigation = useNavigation<NavigationProp>();
    const mapRef = useRef<NaverMapViewRef>(null);
    const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sheetRef = useRef<BottomSheet>(null);
    const {height: windowHeight} = useWindowDimensions();
    // 바텀시트 상단 Y좌표
    const sheetPosition = useSharedValue(0);
    // 30% 스냅일 때 시트 상단 Y의 초기 추정 값
    const pos30 = useSharedValue(windowHeight * 0.7);
    const floatingAnchorStyle = useAnimatedStyle(() => ({
        // 시트가 30%보다 위로 올라가면 30% 위치에 고정, 내려가면 따라감
        // .value가 바뀌면 이 스타일도 자동 갱신.
        transform: [{translateY: Math.max(sheetPosition.value, pos30.value)}],
    }));

    // 30% 단계 도달했을 때의 시트 상단 Y를 고정 기준값으로
    const handleSheetChange = useCallback((index: number, position: number) => {
        if (index === 1) pos30.value = position;
    }, [pos30]);
    const insets = useSafeAreaInsets(); // 상태바 높이

    // 커스텀 훅에서 권한 요청 함수 가져오기
    const { requestPermission } = useLocationPermission();

    // 현재 위치
    const { location } = useLocation();

    // 주변 장소 목록
    const [places, setPlaces] = useState<NearbyPlace[]>([]);

    // 주변 장소 최초 조회 완료 여부 (로딩중 / 리뷰없음 구분용)
    const [placesLoaded, setPlacesLoaded] = useState(false);

    // 선택된 장소 목록
    const[selectedPlace, setSelectedPlace] = useState<NearbyPlace| null>(null);

    // 장소 미니 카드 정보
    const [placeDetail, setPlaceDetail] = useState<PlaceDetail| null>(null);

    // 미니 카드에 표시할 리뷰 이미지 (URL + 어느 탭 소속인지)
    const [reviewItems, setReviewItems] = useState<Array<{url: string; type: 'current' | 'archived'}>>([]);
    
    // 호환: URL만 추출해 미니카드에 전달
    const reviewImages = reviewItems.map(item => item.url);

    // 디코딩까지 완료된 썸네일 URL 목록 (버블 이미지 안정 표시용)
    const [readyUrls, setReadyUrls] = useState<Set<string>>(new Set());

    // 지도 초기화 완료 여부 (초기화 전 마커 렌더 방지)
    const [mapReady, setMapReady] = useState(false);

    // 클러스터링 zoom
    const [zoom, setZoom] = useState(14);

    // 클러스터링 bounds
    const [bounds, setBounds] = useState<[number, number, number, number]>([126.97, 37.56, 126.99, 37.58]);


    // 장소 버블 클릭 시 → 장소 미니 카드
    const handlePlacePress = useCallback(async (place: NearbyPlace) => {
        console.log('[handlePlacePress] 호출됨, place.id:', place.id);
        setSelectedPlace(place);
        setPlaceDetail(null); // 이전 장소 상세 지움
        setReviewItems([]); // 이전 장소 리뷰 지움

        // 상세 조회
        try {
            const detail = await fetchPlaceDetail(place.id);
            console.log('[fetchPlaceDetail] 응답:', JSON.stringify(detail));
            setPlaceDetail(detail);
        } catch (error: any) {
            console.warn('[fetchPlaceDetail] 실패:', error?.response?.status, error?.message);
        }

        // 리뷰 조회: current + archived 각각 타입 태그해서 최신순 상위 5개
        try {
            const [currentRes, archivedRes] = await Promise.all([
                fetchCurrentReviews(place.id, {limit: 5}).catch(() => ({reviews: []} as any)),
                fetchArchivedReviews(place.id, {limit: 5}).catch(() => ({reviews: []} as any)),
            ]);
            const currentTagged = (currentRes.reviews ?? []).map((r: any) => ({
                url: r.thumbnail_small_url ?? r.thumbnail_url ?? r.image_url,
                created_at: r.created_at,
                type: 'current' as const,
            }));
            const archivedTagged = (archivedRes.reviews ?? []).map((r: any) => ({
                url: r.thumbnail_small_url ?? r.thumbnail_url ?? r.image_url,
                created_at: r.created_at,
                type: 'archived' as const,
            }));
            const sortedByLatest = [...currentTagged, ...archivedTagged].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ); // 내림차순 -> 최신순

            //map반환값이 reviewItems로
            setReviewItems(sortedByLatest.slice(0, 5).map(({url, type}) => ({url, type})));
            
        } catch (error: any) {
            console.warn('[리뷰 조회] 실패:', error?.message);
        }
    }, []);

    // places 바뀔 때마다 supercluster 인스턴스 재생성
    const supercluster = useMemo(() => {
        const cluster = new Supercluster({ radius: 40, maxZoom: 13, minPoints: 3 });
        const filtered = places;
        cluster.load(filtered.map(p => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [p.longitude, p.latitude],
            },
            properties: { place: p },
        })));
        return cluster;
    }, [places, location, zoom]);

    // bounds/zoom 바뀔 때마다 클러스터 계산
    const clusters = useMemo(() => {
        return supercluster.getClusters(bounds, Math.floor(zoom));
    }, [supercluster, bounds, zoom]);

    // 클러스터 버블 클릭 시 → 해당 클러스터가 분리되는 줌으로 카메라 이동
    const handleClusterPress = useCallback((clusterId: number, latitude: number, longitude: number) => {
        const clickzoom = supercluster.getClusterExpansionZoom(clusterId);
        mapRef.current?.animateCameraTo({latitude,longitude,zoom:clickzoom});
    }, [supercluster]);

    // clusters가 바뀔 때만 마커 elements 새로 생성 (HomeScreen 리렌더 시 깜빡임 방지)
    const clusterMarkers = useMemo(() => {
        if (!mapReady) return null;
        return clusters.map(cluster => {
            const [lng, lat] = cluster.geometry.coordinates;
            if (cluster.properties.cluster) {
                return (
                    <ClusterBubble
                        key={`cluster-${cluster.properties.cluster_id}`}
                        latitude={lat}
                        longitude={lng}
                        count={cluster.properties.point_count}
                        thumbnailUrl={supercluster.getLeaves(cluster.properties.cluster_id, 1)[0]?.properties.place.thumbnail_url}
                        onPress={() => handleClusterPress(cluster.properties.cluster_id, lat, lng)}
                    />
                );
            }
            const place = cluster.properties.place;
            return (
                <LiveBubble
                    key={`place-${place.id}`}
                    place={place}
                    onPress={handlePlacePress}
                />
            );
        });
    }, [mapReady, clusters, supercluster, handlePlacePress, handleClusterPress]);

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

    // 홈 탭 다시 누르면 닫힌 바텀시트를 30% 단계로 다시 올림
    useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress', () => {
            sheetRef.current?.snapToIndex(1);
        });
        return unsubscribe;
    }, [navigation]);

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
            })
            .finally(() => {
                setPlacesLoaded(true);   // 성공/실패 무관 최초 조회 끝났음 표시
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
            setReviewItems([]);
        }, [loadNearbyPlaces])
    );

    // 검색창 클릭 시 → SearchScreen으로 이동
    const handleSearchFocus = useCallback(() => {
        navigation.navigate('Search');
    }, [navigation]);

    // 지금 바로 리뷰 쓰기 버튼 → 리뷰 카메라
    const handleQuickReview = useCallback(() => {
        navigation.navigate('ReviewStack', {screen: 'ReviewCamera'});
    }, [navigation]);

    // 카드 본체 / 사진 클릭 시 → 장소 상세 (사진은 그 사진의 타입에 따라 탭 결정)
    const handleCardPress = useCallback((imageIndex?: number) => {
        if (!placeDetail) return;
        // imageIndex 받으면 해당 사진 타입으로, 아니면 기본 (current)
        const initialTab = imageIndex !== undefined ? reviewItems[imageIndex]?.type : undefined;
        navigation.navigate('PlaceDetail', {
            placeId: placeDetail.id,
            placeName: placeDetail.name,
            initialTab,
        });
    }, [placeDetail, reviewItems, navigation]);

    // 장소 미니 카드 닫을 때
    const handleCloseCard = useCallback(()=>{
        setSelectedPlace(null);
        setPlaceDetail(null);
        setReviewItems([]);
    },[]);

    // 알림 토글 (벨 아이콘 클릭)
    const handleToggleSubscribe = useCallback(async () => {
        if (!placeDetail) return;

        const previous = placeDetail;
        setPlaceDetail({
            ...placeDetail,
            is_subscribed: !placeDetail.is_subscribed,
        });

        //──────────────────────  API 호출  ──────────────────────
        try {
            if (previous.is_subscribed) {
                await unsubscribe(previous.id);
            } else {
                await subscribe(previous.id);
            }
        } catch (error) {
            console.error('구독 토글 실패:', error);
            setPlaceDetail(previous);
        }
    }, [placeDetail]);

    const handleBellPress = () => {
        navigation.navigate('Notification');
    };

    // 거리 텍스트 계산 (내 위치 + 선택된 장소 둘 다 있을 때만)
    const distanceText = location && selectedPlace && selectedPlace.latitude != null && selectedPlace.longitude != null
        ? `내 위치에서 ${formatDistance(getDistance(location, {latitude: selectedPlace.latitude, longitude: selectedPlace.longitude}))}`
        : undefined;

    // 위치 잡힐 때까지 로딩 화면
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
                // showCircle={zoom >= 14} // 파란 원 반경
                initialCamera={{latitude: location.latitude, longitude: location.longitude, zoom: 16}}
                isShowLocationButton={false}   // 기본 위치 버튼 숨김 (커스텀 버튼 사용)
                onTapMap={handleCloseCard}
                onCameraChanged={(params) => {
                    if (cameraDebounceRef.current) clearTimeout(cameraDebounceRef.current);
                    cameraDebounceRef.current = setTimeout(() => {
                        const { latitude, longitude, latitudeDelta, longitudeDelta } = params.region;
                        const padLng = longitudeDelta * 0.3;
                        const padLat = latitudeDelta  * 0.3;
                        setZoom(params.zoom ?? 14);
                        setBounds([
                            Math.max(longitude - longitudeDelta / 2 - padLng, -180),
                            Math.max(latitude  - latitudeDelta  / 2 - padLat,  -90),
                            Math.min(longitude + longitudeDelta / 2 + padLng,  180),
                            Math.min(latitude  + latitudeDelta  / 2 + padLat,   90),
                        ]);
                    }, 150);
                }}
                onInitialized={() => {
                    setMapReady(true);
                    setTimeout(() => {
                        mapRef.current?.setLocationTrackingMode('Follow');
                    }, 300);
                }}
                onOptionChanged={(params) => {
                    console.log('[Map] onOptionChanged:', params.locationTrackingMode);
                }}>

                {clusterMarkers}
            </MapView>

            {/* 지도 검색창 + 알림 버튼 */}
            <View style={[styles.searchBarWrapper, { top: insets.top + 10 }]}>
                <SearchBar
                    value={''}
                    logoIcon={<IconLogo width={40} height={22} color={colors.icon.basic}/>}
                    onChangeText={() => {}}
                    onFocus={handleSearchFocus}
                    backgroundColor={colors.surface.white}
                    width={317}
                />
    
                { <IconMapBell
                    size={18}
                    color={colors.icon.basic}
                    onPress={handleBellPress}
                    /> }
            </View>

            {/* 썸네일 프리로더: decode 완료 후에만 마커 렌더 */}
            {places.map(place => place.thumbnail_url && !readyUrls.has(place.thumbnail_url) ? (
                <FastImage
                    key={place.id}
                    source={{uri: place.thumbnail_url, priority: FastImage.priority.high}}
                    style={styles.preloader}
                    resizeMode={FastImage.resizeMode.cover}
                    onLoad={() => setReadyUrls(prev => new Set([...prev, place.thumbnail_url!]))}
                    onError={() => setReadyUrls(prev => new Set([...prev, place.thumbnail_url!]))}
                />
            ) : null)}

            {/* 현위치 버튼 + 리뷰 쓰기 버튼: 바텀시트 상단에 붙어 시트 따라 이동 (미니카드 땐 숨김) */}
            {!placeDetail && (
                <Animated.View
                    style={[styles.floatingAnchor, floatingAnchorStyle]}
                    pointerEvents="box-none">
                    <IconCurrentLocation
                        style={styles.locationButton}
                        onPress={() => {
                            mapRef.current?.animateCameraTo({
                                latitude: location.latitude,
                                longitude: location.longitude,
                                easing: 'Fly',
                                duration: 800,
                            });
                            setTimeout(() => {
                                // 안드로이드에서만 자동 애니메이션
                                mapRef.current?.setLocationTrackingMode('Follow');
                            }, 850);
                        }}
                    />
                    <View style={styles.quickReviewRow} pointerEvents="box-none">
                        <QuickReviewButton onPress={handleQuickReview} />
                    </View>
                </Animated.View>
            )}

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

            {/* 주변 리뷰 바텀시트 (미니카드 떠있을 땐 숨김) */}
            {!placeDetail && (
                <ReviewBottomSheet
                    ref={sheetRef}
                    places={places}
                    loading={!placesLoaded}
                    onPressPlace={handlePlacePress}
                    animatedPosition={sheetPosition} // 매 프레임마다
                    onChange={handleSheetChange} // 스냅 단계 도달했을 때만
                />
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // 시트 상단 라인 (translateY로 시트를 따라 이동). height 0 → 자식들이 라인 위로 뜸
    floatingAnchor: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 0,
    },
    quickReviewRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 16,          // 시트 상단 바로 위 (가운데 정렬)
        alignItems: 'center',
    },
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
        bottom: 72,                 // 시트 상단 위, 리뷰 버튼보다 조금 더 위
    },
    cardWrapper: {
        position: 'absolute',
        bottom: 30,                     // 탭바 숨겨져서 더 내림 (기존 100)
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
