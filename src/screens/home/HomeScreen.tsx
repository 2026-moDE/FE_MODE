import React, {useRef, useEffect, useState, useCallback, useMemo} from "react";
import {View, Text, StyleSheet, ActivityIndicator, useWindowDimensions, InteractionManager, Platform} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NaverMapViewRef } from "@mj-studio/react-native-naver-map";
import MapView from "../../components/map/MapView";
import HomeHeader, {trimInset} from "../../components/home/HomeHeader";
import LiveBubble from "../../components/home/LiveBubble";
import ClusterBubble from "../../components/home/ClusterBubble";
import { useNavigation, CompositeNavigationProp, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppStackParamList, TabParamList } from "../../types/navigation";
import { useLocationPermission } from "../../hooks/useLocationPermission";
import { useLocation } from "../../context/LocationContext";
import { fetchNearbyPlaces, fetchPlaceDetail, fetchCurrentReviews, fetchArchivedReviews, fetchTrendingPlaces } from "../../api/place";
import { fetchHasUnreadNotification } from "../../api/notification";
import { NearbyPlace, PlaceDetail, TrendingPlace, CurrentReview } from "../../types/place";
import { FriendReview, fetchFriendReviews } from "../../api/friend";
import ReviewPhoto from "../../components/placeDetail/ReviewPhoto";
import { colors } from '../../constants/colors';
import IconCurrentLocation from "../../assets/icons/IconCurrentLocation";
import HomeMiniCard from "../../components/home/HomeMiniCard";
import BubbleFilterToggle, {type BubbleFilter} from "../../components/home/BubbleFilterToggle";
import QuickReviewButton from "../../components/home/QuickReviewButton";
import HomeBottomSheet from "../../components/home/HomeBottomSheet";
import { getDistance, formatDistance } from "../../utils/distance";
import Supercluster from "supercluster";
import BottomSheet from "@gorhom/bottom-sheet";
import Animated, {useSharedValue, useAnimatedStyle, interpolate} from "react-native-reanimated";


// 탭 안에 있지만 스택 화면(Search)으로도 이동해야 해서 두 타입을 합침
type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    NativeStackNavigationProp<AppStackParamList>
>;

export default function HomeScreen(){
    const navigation = useNavigation<NavigationProp>();
    const isFocused = useIsFocused();
    const mapRef = useRef<NaverMapViewRef>(null);
    const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 바텀시트 위치 저장하기 위함
    // 바텀시트 초기 값인 30%와 맞춰야 됨 (snapPoints 0번째 = 30%)
    const sheetIndexRef = useRef(0);
    // 바텀시트 조작 용도 ref
    const sheetRef = useRef<BottomSheet>(null);
    const {height: windowHeight} = useWindowDimensions();
    const insets = useSafeAreaInsets(); // 상태바/하단 인셋

    // 바텀시트가 완전히 닫힐 때 버튼이 하단 내비게이션 바 위에서 멈추게 하기 위한 값
    // CustomTabBar.tsx의 레이아웃(컨테이너 높이 64 + marginBottom 계산식)과 맞춰야 함
    const navBarFootprint = (insets.bottom > 0 ? insets.bottom : 36) + 64;

    // 바텀시트 상단 Y좌표
    // 초기값을 0(화면 맨 위)으로 두면 실제 바텀시트가 마운트돼서 진짜 위치를 보고하기 전까지
    // "시트가 다 올라온 상태"로 잘못 계산돼서 지도가 잠깐 완전히 딤 처리됨 -
    // 실제 초기 위치(70% 지점)로 맞춰서 그 플래시를 없앰
    const sheetPosition = useSharedValue(windowHeight * 0.7);
    // 30% 스냅일 때 시트 상단 Y의 초기 추정 값
    const pos30 = useSharedValue(windowHeight * 0.7);
    // 바텀시트가 70%일 때 지도 위로 올리는 값
    const N = windowHeight*0.2 // 30%->70%는 40차이인데 그 정도의 절반 정도로

    // 다른 화면으로 이동할 때 지도 딤을 강제로 끄는 값 - isFocused는 화면 전환 완료(blur 이벤트)를 기다려야 해서
    // 전환이 중간에 멈추면 안 꺼짐. 그래서 navigate 호출 직전에 직접 0으로 내림 (포커스 이벤트 안 기다림)
    const dimVisible = useSharedValue(1);
    // Home을 벗어나는 navigate는 전부 이걸 거쳐서 dimVisible을 같이 꺼줌 - 새 진입점 생겨도 놓치지 않게
    // navigate가 오버로드 시그니처라 스프레드 인자를 그대로 타입 추론할 수 없어서 any로 우회
    const goTo = useCallback((...args: any[]) => {
        dimVisible.value = 0;
        (navigation.navigate as (...a: any[]) => void)(...args);
    }, [navigation]);

    // 선택된 클러스터링 버블의 장소 목록 - null이면 기본 바텀시트(친구 리뷰/트렌딩), 값 있으면 클러스터 목록 바텀시트
    const [clusterPlaces, setClusterPlaces] = useState<NearbyPlace[] | null>(null);

    const floatingAnchorStyle = useAnimatedStyle(() => {
        // 기본 바텀시트(clusterPlaces===null)면 위쪽 제한 없이 시트를 그대로 따라 70%까지 올라감.
        // 클러스터 목록 바텀시트면 예전처럼 30% 위치에서 멈춰서(=시트 뒤에 가려짐) 70%로 올라가도 안 보임.
        const upperClampedY = clusterPlaces === null
            ? sheetPosition.value
            : Math.max(sheetPosition.value, pos30.value);
        // 하단 내비게이션 바 위 지점(windowHeight - navBarFootprint)보다 더는 안 내려가게 아래쪽으로도 클램프
        // -> 시트를 끝까지 내려 닫아도 버튼은 내비게이션 바 위에서 멈춤
        return {
            transform: [{translateY: Math.min(upperClampedY, windowHeight - navBarFootprint)}],
        };
    });

    // 기본 바텀시트가 70%로 올라간 만큼 지도를 딤 처리 (드래그 중에도 매 프레임 UI 스레드에서 계산 - JS 리렌더 없이 부드럽게)
    const mapDimStyle = useAnimatedStyle(() => {
        const openY = windowHeight * 0.3; // 70% 스냅일 때 시트 상단 Y 추정치
        return {opacity: interpolate(sheetPosition.value, [openY, pos30.value], [1, 0], 'clamp') * dimVisible.value};
    });

    // 바텀시트가 snapPoints에 따라 바뀔 때마다 실행
    const handleSheetChange = useCallback((index: number, position: number) => {
        if (index === 0) pos30.value = position;

        const preIndex= sheetIndexRef.current; // 덮어쓰기 전, 예전 값 저장
        sheetIndexRef.current = index;

        if(preIndex===0 && index===1){
            mapRef.current?.animateCameraBy({x: 0, y: -N, duration: 300});
        }
        // 70%에서 벗어나면(30%든 완전히 닫힘이든) 카메라 복귀 - 빠르게 훅 내리면 30%를 안 거치고 곧장 닫힘으로 갈 수 있어서 index===0 대신 index!==1로 체크
        else if(preIndex===1 && index!==1){
            mapRef.current?.animateCameraBy({x: 0, y: N, duration: 300});
        }
    }, [pos30, N]);

    // 커스텀 훅에서 권한 요청 함수 가져오기
    const { requestPermission } = useLocationPermission();

    // 현재 위치
    const { location } = useLocation();

    // 주변 장소 목록
    const [places, setPlaces] = useState<NearbyPlace[]>([]);

    // 지도 버블 필터 - '전체'는 과거 리뷰만 있는 장소까지, '최근'은 실시간 리뷰가 달린 장소만
    const [bubbleFilter, setBubbleFilter] = useState<BubbleFilter>('all');

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
    // 로딩 자체가 실패한(깨진) 썸네일 URL 목록 - 마커에 아예 안 넘겨서 네이티브 크래시 방지
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

    // 지도 초기화 완료 여부 (초기화 전 마커 렌더 방지)
    const [mapReady, setMapReady] = useState(false);

    // 클러스터링 zoom
    const [zoom, setZoom] = useState(14);

    // 클러스터링 bounds
    const [bounds, setBounds] = useState<[number, number, number, number]>([126.97, 37.56, 126.99, 37.58]);

    // 안 읽은 알림 여부 (알림 벨 빨간 점)
    const [hasUnreadNotification, setHasUnreadNotification] = useState(false);

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

    // 장소 미니 카드 닫을 때 (지도 탭 등) - 클러스터 목록도 같이 닫아서 기본 바텀시트로 되돌림
    const handleCloseCard = useCallback(()=>{
        setSelectedPlace(null);
        setPlaceDetail(null);
        setReviewItems([]);
        setClusterPlaces(null);
    },[]);

    // 클러스터 버블 클릭 시 → 미니카드 떠있으면 닫고, 해당 클러스터가 분리되는 줌으로 카메라 이동
    const handleClusterPress = useCallback((clusterId: number, latitude: number, longitude: number) => {
        handleCloseCard(); // 미니카드 열려있으면 닫아서 바텀시트가 다시 보이게
        const clickzoom = supercluster.getClusterExpansionZoom(clusterId);
        mapRef.current?.animateCameraTo({latitude,longitude,zoom:clickzoom});
        if(sheetIndexRef.current===-1){
            sheetRef.current?.snapToIndex(0);
        }
        const clusterLeaves = supercluster.getLeaves(clusterId,Infinity).map(
            f=>f.properties.place as NearbyPlace);
            setClusterPlaces(clusterLeaves);
    }, [supercluster, handleCloseCard]);

    // clusters가 바뀔 때만 마커 elements 새로 생성 (HomeScreen 리렌더 시 깜빡임 방지)
    const clusterMarkers = useMemo(() => {
        if (!mapReady) return null;
        return clusters.map(cluster => {
            const [lng, lat] = cluster.geometry.coordinates;
            if (cluster.properties.cluster) {
                const leaf = supercluster.getLeaves(cluster.properties.cluster_id, 1)[0]?.properties.place;
                const rawThumbnailUrl = leaf?.thumbnail_small_url ?? leaf?.thumbnail_url;
                // 로딩 실패한(깨진) 이미지는 아예 없는 것처럼 취급 - 네이티브 마커에 절대 안 넘김
                const thumbnailUrl = rawThumbnailUrl && !failedUrls.has(rawThumbnailUrl) ? rawThumbnailUrl : undefined;
                return (
                    <ClusterBubble
                        key={`cluster-${cluster.properties.cluster_id}`}
                        latitude={lat}
                        longitude={lng}
                        count={cluster.properties.point_count}
                        thumbnailUrl={thumbnailUrl}
                        // 프리로더로 디코딩까지 끝난 이미지만 마커에 그려서 네이티브 비트맵 크래시 방지
                        isReady={!!thumbnailUrl && readyUrls.has(thumbnailUrl)}
                        onPress={() => handleClusterPress(cluster.properties.cluster_id, lat, lng)}
                    />
                );
            }
            const place = cluster.properties.place;
            const rawPlaceThumbnailUrl = place.thumbnail_small_url ?? place.thumbnail_url;
            const placeThumbnailFailed = !!rawPlaceThumbnailUrl && failedUrls.has(rawPlaceThumbnailUrl);
            // 실패한 썸네일이면 LiveBubble에는 사진 없는 장소처럼 보이도록 필드를 비워서 전달
            const safePlace = placeThumbnailFailed
                ? {...place, thumbnail_url: '', thumbnail_small_url: null}
                : place;
            return (
                <LiveBubble
                    key={`place-${place.id}`}
                    place={safePlace}
                    isReady={!placeThumbnailFailed && !!rawPlaceThumbnailUrl && readyUrls.has(rawPlaceThumbnailUrl)}
                    onPress={handlePlacePress}
                />
            );
        });
    }, [mapReady, clusters, supercluster, handlePlacePress, handleClusterPress, readyUrls, failedUrls]);

    // 컴포넌트가 처음 마운트될 때 위치 권한 요청
    useEffect(() => {
        requestPermission();
    }, []);


    // 홈 탭 다시 누르면 닫힌 바텀시트를 30% 단계로 다시 올리고, 기본 바텀시트로 되돌림
    useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress', () => {
            sheetRef.current?.snapToIndex(0);
            setClusterPlaces(null);
        });
        return unsubscribe;
    }, [navigation]);

    // 주변 장소 조회 함수
    const loadNearbyPlaces = useCallback(() => {
        if (!location) return;

        const baseParams = {
            latitude: location.latitude,
            longitude: location.longitude,
            visibility: 'all' as const,   // 전체공개 리뷰만 버블 표시
        };

        // '최근'이면 실시간 리뷰만, '전체'면 과거(archived)까지 같이 조회해서 합침
        // 한쪽이 실패해도 나머지는 살리려고 개별 catch
        const includeArchived = bubbleFilter === 'all';

        Promise.all([
            fetchNearbyPlaces({...baseParams, filter: 'current'})
                .catch(error => {
                    console.warn('주변 장소(current) 조회 실패:', error?.message);
                    return {places: [] as NearbyPlace[]};
                }),
            includeArchived
                ? fetchNearbyPlaces({...baseParams, filter: 'archived'})
                    .catch(error => {
                        console.warn('주변 장소(archived) 조회 실패:', error?.message);
                        return {places: [] as NearbyPlace[]};
                    })
                : Promise.resolve({places: [] as NearbyPlace[]}),
        ])
            .then(([currentRes, archivedRes]) => {
                // current를 앞에 둬야 같은 장소가 양쪽에 있을 때 실시간 쪽 썸네일이 남음
                const merged = [...(currentRes.places ?? []), ...(archivedRes.places ?? [])];
                if (merged.length > 0) {
                    const unique = merged.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
                    const newUrls = new Set(unique.map(p => p.thumbnail_small_url ?? p.thumbnail_url).filter(Boolean) as string[]);
                    setPlaces(unique);
                    // 기존에 로드된 URL은 유지, 새 URL만 preloader가 채움
                    setReadyUrls(prev => new Set([...prev].filter(url => newUrls.has(url))));
                }
            })
            .finally(() => {
                setPlacesLoaded(true);   // 성공/실패 무관 최초 조회 끝났음 표시
            });
    }, [location, bubbleFilter]);

    // 필터를 바꾸면 이전 필터의 버블이 남아있지 않게 먼저 비움
    // (조회 결과가 비어도 이전 목록을 유지하는 로직이 있어서, 여기서 직접 지워줘야 함)
    const handleChangeBubbleFilter = useCallback((next: BubbleFilter) => {
        if (next === bubbleFilter) return;
        setPlaces([]);
        setPlacesLoaded(false);
        handleCloseCard();   // 필터에서 빠지는 장소의 미니카드가 떠 있을 수 있음
        setBubbleFilter(next);
    }, [bubbleFilter, handleCloseCard]);

    // 위치 들어오면 최초 조회
    useEffect(() => {
        loadNearbyPlaces();
    }, [loadNearbyPlaces]);

    // 최근에 리뷰가 많이 달린 장소 (기본 바텀시트용)
    const [trendingPlaces, setTrendingPlaces] = useState<TrendingPlace[]>([]);
    useEffect(() => {
        if (!location) return;

        fetchTrendingPlaces({latitude: location.latitude, longitude: location.longitude})
            .then(res => setTrendingPlaces(res.places))
            .catch(error => console.warn('트렌딩 장소 조회 실패:', error?.message));
    }, [location]);

    // 친구가 최근에 작성한 리뷰 (기본 바텀시트용) - 위치 필요 없이 로그인만 되면 조회 가능
    const [friendReviews, setFriendReviews] = useState<FriendReview[]>([]);
    useEffect(() => {
        fetchFriendReviews()
            .then(reviews => {
                // TEMP TEST: 프로필 사진 미설정 유저 목데이터 - 확인 후 제거
                const mockNoProfile: FriendReview = {
                    id: -1,
                    place_id: reviews[0]?.place_id ?? 0,
                    place_name: '테스트 장소',
                    congestion_level: 'RELAXED',
                    comment: '프로필 사진 없는 유저 테스트',
                    image_url: reviews[0]?.image_url ?? '',
                    thumbnail_url: reviews[0]?.thumbnail_url ?? '',
                    thumbnail_small_url: reviews[0]?.thumbnail_small_url ?? '',
                    user: {user_id: -1, nickname: '테스트유저', profile_url: ''},
                    created_at: new Date().toISOString(),
                    comment_count: 0,
                };
                setFriendReviews([mockNoProfile, ...reviews]);
            })
            .catch(error => console.warn('친구 리뷰 조회 실패:', error?.message));
    }, []);

    // 친구가 최근에 작성한 리뷰 뷰어에서 넘기는 인덱스 - 사람/장소 안 가리고 friendReviews 배열 순서 그대로 왔다갔다
    const [friendReviewViewerIndex, setFriendReviewViewerIndex] = useState<number | null>(null);

    // 미니카드 또는 친구 리뷰 뷰어 떠있을 때 하단 탭바 숨김 (둘 다 닫으면 복구)
    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: (placeDetail || friendReviewViewerIndex !== null) ? { display: 'none' } : undefined,
        });
    }, [navigation, placeDetail, friendReviewViewerIndex]);

    // FriendReview를 CurrentReview로 변환. ReviewPhoto는 FriendReview 모르고 CurrentReview 앎
    const friendReviewPhotos: CurrentReview[] = useMemo(() => friendReviews.map(r => ({
        id: r.id,
        image_url: r.image_url,
        thumbnail_url: r.thumbnail_url,
        thumbnail_small_url: r.thumbnail_small_url,
        congestion_level: r.congestion_level,
        comment: r.comment,
        is_mine: false, // 친구 리뷰는 항상 남의 글이라 
        visibility: 'PUBLIC' as const,
        is_friend: true,
        user: {
            user_id: r.user.user_id,
            nickname: r.user.nickname,
            profile_image_url: r.user.profile_url, // 원본 이미지
            profile_url: r.user.profile_url, // 리사이즈된 이미지
        },
        created_at: r.created_at,
        comment_count: r.comment_count,
        place_name: r.place_name,
        place_id: r.place_id,
    })), [friendReviews]);

    // 화면 포커스 시 재조회 (리뷰 작성 후 썸네일 업데이트) - 다른 화면 갔다 돌아오면 기본 바텀시트로
    useFocusEffect(
        useCallback(() => {
            loadNearbyPlaces();
            setSelectedPlace(null);
            setPlaceDetail(null);
            setReviewItems([]);
            setClusterPlaces(null);
            dimVisible.value = 1;
        }, [loadNearbyPlaces])
    );

    // 화면 포커스 시 안 읽은 알림 여부 조회
    useFocusEffect(
        useCallback(() => {
            fetchHasUnreadNotification()
                .then(setHasUnreadNotification)
                .catch(err => console.warn('알림 조회 실패:', err?.message));
        }, [])
    );

    // 검색창 클릭 시 → SearchScreen으로 이동
    const handleSearchFocus = useCallback(() => {
        goTo('Search');
    }, [goTo]);

    // 지금 바로 리뷰 쓰기 버튼 → 리뷰 카메라
    const handleQuickReview = useCallback(() => {
        goTo('ReviewStack', {screen: 'ReviewCamera'});
    }, [goTo]);

    // 카드 본체 / 사진 클릭 시 → 장소 상세 (사진은 그 사진의 타입에 따라 탭 결정)
    const handleCardPress = useCallback((imageIndex?: number) => {
        if (!placeDetail) return;
        // imageIndex 받으면 해당 사진 타입으로, 아니면 기본 (current)
        const initialTab = imageIndex !== undefined ? reviewItems[imageIndex]?.type : undefined;
        goTo('PlaceDetail', {
            placeId: placeDetail.id,
            placeName: placeDetail.name,
            initialTab,
            // PlaceDetail은 화면이 재사용되면서 params가 병합되기 때문에, 특정 리뷰를 안 겨냥할 땐
            // 이전 알림 진입에서 남은 reviewId/notificationAction을 명시적으로 지워줘야 함
            reviewId: undefined,
            notificationAction: undefined,
        });
    }, [placeDetail, reviewItems, goTo]);


    // 클러스터 바텀시트 목록에서 장소 클릭 시 → 미니카드 없이 바로 상세 페이지로 이동
    const handleClusterItemPress = useCallback((place: NearbyPlace) => {
        goTo('PlaceDetail', {
            placeId: place.id,
            placeName: place.name,
            reviewId: undefined,
            notificationAction: undefined,
        });
    }, [goTo]);

    // 기본 바텀시트에서 친구 리뷰 사진 클릭 시 → 장소 상세로 이동하지 않고, 목록 순서 그대로 뷰어에서 왔다갔다
    const handleOpenReview = useCallback((reviewId: number) => {
        const index = friendReviews.findIndex(r => r.id === reviewId);
        if (index >= 0) setFriendReviewViewerIndex(index);
    }, [friendReviews]);

    const handleBellPress = () => {
        setHasUnreadNotification(false);
        goTo('Notification');
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
                onTapMap={(coord)=>{ // coord는 탭 지점 위도,경도 담은 객체인데 우린 안 씀
                    handleCloseCard();
                    if(sheetIndexRef.current===1) sheetRef.current?.snapToIndex(0);
                }}
                onCameraChanged={(params) => {
                    if (params.reason === 'Gesture' && sheetIndexRef.current === 1){
                            sheetRef.current?.snapToIndex(0);}
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
                    // iOS는 Follow를 켜면 SDK가 현위치 마커 아이콘을 기본값으로 덮어써서
                    // 커스텀 마커가 사라짐 - 안드로이드에서만 SDK 추적을 씀
                    // (iOS는 MapView가 locationOverlay.position에 실시간 위치를 직접 먹임)
                    if (Platform.OS !== 'android') return;
                    setTimeout(() => {
                        mapRef.current?.setLocationTrackingMode('Follow');
                    }, 300);
                }}
                onOptionChanged={(params) => {
                    console.log('[Map] onOptionChanged:', params.locationTrackingMode);
                }}>

                {clusterMarkers}
            </MapView>

            {/* 기본 바텀시트가 70%로 열리면 뒤 지도 딤 처리 - 클러스터 목록일 땐 지도가 중요하니 안 함
                다른 화면(PlaceDetail 등)으로 이동해도 Home은 안 사라지고 시트가 70%인 채로 남아있어서,
                포커스 없을 때도 계속 그려지면 새로 뜬 화면 위로 이 딤이 비쳐 보이는 문제가 있었음 - 포커스일 때만 렌더 */}
            {clusterPlaces === null && isFocused && (
                <Animated.View style={[styles.mapDim, mapDimStyle]} pointerEvents="none" />
            )}

            {/* 지도 상단 헤더: 로고 + 검색 아이콘 + 알림 벨 */}
            <HomeHeader
                insetTop={insets.top}
                onPressSearch={handleSearchFocus}
                onPressBell={handleBellPress}
                hasUnreadNotification={hasUnreadNotification}
            />

            {/* 버블 필터 (전체/최근) - 로고 아래. 미니카드가 떠 있을 땐 숨김 */}
            {!placeDetail && (
                <View style={[styles.bubbleFilterWrapper, {top: trimInset(insets.top) + 76}]} pointerEvents="box-none">
                    <BubbleFilterToggle value={bubbleFilter} onChange={handleChangeBubbleFilter} />
                </View>
            )}

            {/* 썸네일 프리로더: decode 완료 후에만 마커 렌더 - LiveBubble이 실제로 쓰는 필드(thumbnail_small_url 우선)랑 맞춤 */}
            {places.map(place => {
                const bubbleUrl = place.thumbnail_small_url ?? place.thumbnail_url;
                return bubbleUrl && !readyUrls.has(bubbleUrl) && !failedUrls.has(bubbleUrl) ? (
                <FastImage
                    key={place.id}
                    source={{uri: bubbleUrl, priority: FastImage.priority.high}}
                    style={styles.preloader}
                    resizeMode={FastImage.resizeMode.cover}
                    onLoad={() => setReadyUrls(prev => new Set([...prev, bubbleUrl]))}
                    // 로딩 실패한 이미지는 ready가 아니라 failed로 분리 - 마커에 절대 안 넘어가게
                    onError={() => setFailedUrls(prev => new Set([...prev, bubbleUrl]))}
                />
                ) : null;
            })}

            {/* 현위치 버튼 + 리뷰 쓰기 버튼: 바텀시트 상단을 따라 이동하되, 내비게이션 바 위 지점에서 더 안 내려가게 클램프됨 (미니카드 땐 숨김) */}
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
                            // 안드로이드에서만 자동 애니메이션
                            // (iOS는 Follow를 켜면 커스텀 현위치 마커가 SDK 기본 아이콘으로 덮어써짐)
                            if (Platform.OS === 'android') {
                                setTimeout(() => {
                                    mapRef.current?.setLocationTrackingMode('Follow');
                                }, 850);
                            }
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
                        onPress={handleCardPress}
                    />
                </View>
            )}

            {/* 주변 리뷰 바텀시트 (미니카드 떠있을 땐 숨김) */}
            {!placeDetail && (
                <HomeBottomSheet
                    ref={sheetRef}
                    places={places}
                    loading={!placesLoaded}
                    clusterPlaces={clusterPlaces}
                    onPressPlace={handleClusterItemPress}
                    friendReviews={friendReviews}
                    trendingPlaces={trendingPlaces}
                    onPressFriendReview={item => handleOpenReview(item.id)}
                    onPressTrendingMore={place => {
                        // BottomSheetScrollView 안의 제스처가 덜 정리된 채로 화면 전환이 겹치면
                        // 전환이 깨져서 흰 화면에 멈추는 문제가 있어서, 제스처/터치 정리 후로 미룸
                        // (딤은 goTo가 바로 꺼주니 지연 없이 즉시 처리됨)
                        dimVisible.value = 0;
                        InteractionManager.runAfterInteractions(() => {
                            goTo('PlaceDetail', {
                                placeId: place.id,
                                placeName: place.name,
                                reviewId: undefined,
                                notificationAction: undefined,
                            });
                        });
                    }}
                    animatedPosition={sheetPosition} // 매 프레임마다
                    onChange={handleSheetChange} // 스냅 단계 도달했을 때만
                />
            )}

            {/* 친구가 최근에 작성한 리뷰 뷰어 - 따로 PlaceDetail로 이동 안해서 REviewPhoto 화면 만듦 */}
            <ReviewPhoto
                reviews={friendReviewPhotos}
                startIndex={friendReviewViewerIndex ?? 0}
                visible={friendReviewViewerIndex !== null}
                onClose={() => setFriendReviewViewerIndex(null)}
                onPressUser={user => {
                    if (user.user_id == null) return;
                    setFriendReviewViewerIndex(null); // 이거 없으면 마이페이지에서 뒤로 가기해서 홈으로 돌아오면, 아직 리뷰 뷰어가 보임
                    goTo('UserMyPage', {userId: user.user_id});
                }}
                onOpenReactionList={() => {}} // 반응 목록은 내 리뷰 아니니 조회할 수 없음
                onDelete={() => {}} // 삭제하기는 내 리뷰 아니니 할 수 없음
                onReport={reviewId => {
                    setFriendReviewViewerIndex(null);
                    goTo('ReviewReport', {reviewId});
                }}
                onPressPlace={(placeId, pName) => {
                    setFriendReviewViewerIndex(null);
                    InteractionManager.runAfterInteractions(() => {
                        goTo('PlaceDetail', {
                            placeId,
                            placeName: pName,
                            reviewId: undefined,
                            notificationAction: undefined,
                        });
                    });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapDim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background.dimDarker,
    },
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
    // 버블 크기(60x60)랑 똑같이 맞춰야 캐시가 실제 버블 로딩 때도 재사용됨 (크기 다르면 다시 로딩함)
    preloader: { width: 60, height: 60, position: 'absolute', opacity: 0 },
    bubbleFilterWrapper: {
        position: 'absolute',
        left: 24,          // HomeHeader의 paddingHorizontal(padding['2xl'])과 맞춤
        right: 24,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#000000',
    },
    loadingText: {
        fontSize: 14,
        color: '#ffffff',
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
