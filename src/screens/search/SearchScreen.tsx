import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Keyboard, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { CATEGORY_LABEL, RegionResponse } from '../../types/place';
import { Place } from '../../types/search';
import { fetchRegion } from '../../api/place';
import SearchHeader from '../../components/search/SearchHeader';
import RecentSearchList from '../../components/search/RecentSearchList';
import RecommendedSearchList from '../../components/search/RecommendedSearchList';
import PlaceCardList from '../../components/search/PlaceCardList';
import { useSearchPlaces } from '../../hooks/useSearchPlaces';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import SearchItemList from '../../components/search/SearchItemList';
import LocationButton from '../../components/search/LocationButton';
const currentLocationIcon = require('../../assets/image/place_pin.png');
import { useLocation } from '../../context/LocationContext';
import { getDistance, formatDistance } from '../../utils/distance';
import { typography } from '../../constants/typography';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
// 디폴트(최근,추천 검색어) / 검색어 타이핑 / 검색 완료 / 현위치로 검색
type Mode = 'default' | 'typing' | 'searched' | 'location'; 

export default function SearchScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp<AppStackParamList, 'Search'>>();
    const reviewPhotoUri = route.params?.reviewPhotoUri;
    const reviewCongestion = route.params?.reviewCongestion;
    const reviewTextParam = route.params?.reviewText;

    // 검색창 텍스트 state
    const [searchText, setSearchText] = useState('');
    const [mode, setMode] = useState<Mode>('default');
    // "현위치로 장소 찾기"를 누른 상태인지 (누른 뒤 이어서 검색해도 거리순 유지하려고)
    const [isLocationMode, setIsLocationMode] = useState(false);
    // 글자 한 자 칠 때마다 api 불러오면 부담
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 키보드 높이
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // 장소 검색 훅
    const { search, places, isLoading } = useSearchPlaces();
    // 현재 위치
    const { location } = useLocation();
    // 현재 위치 행정동 (시/구/동) 
    const [region, setRegion] = useState<RegionResponse | null>(null);
    const [isRegionLoading, setIsRegionLoading] = useState(false);
    // 카카오 API 호출돼서 이미 조회 중이면 재요청 막음 (연타 방지)
    const regionFetchingRef = useRef(false);

    const fetchCurrentRegion = useCallback(async (latitude: number, longitude: number) => {
        if (regionFetchingRef.current) return;
        regionFetchingRef.current = true;
        setIsRegionLoading(true);
        try {
            const data = await fetchRegion({latitude, longitude});
            setRegion(data);
        } catch (e) {
            console.warn('현재 위치 지역 조회 실패:', e);
            setRegion(null);
        } finally {
            regionFetchingRef.current = false;
            setIsRegionLoading(false);
        }
    }, []);

    // 최근 검색어 훅 → 화면 들어오면 자동으로 조회
    const { history, fetchHistory, saveHistory, deleteHistory, deleteAllHistory } = useSearchHistory();

    // 다른 화면(장소 상세 등) 갔다가 뒤로가기로 돌아올 때마다 최근 검색어 다시 불러옴
    // (SearchScreen이 그대로 남아있어서 history가 예전 값에 머물러있는 문제 방지)
    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory]),
    );

    // 검색어 자동 완성
    const { suggestions, search: searchAutocomplete } = useAutocomplete();

    // 뒤로가기
    const handleBack = () => navigation.goBack();

    // 검색창에 글자 한 자 칠 때마다
    const handleChangeText = (text: string) => {
        setSearchText(text);

        if (!text) {
            setMode('default');
            setIsLocationMode(false);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            return;
        }

        setMode('typing');

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchAutocomplete(text);
            // "현위치로 장소 찾기" 이후에 이어서 타이핑하는 거면 좌표를 같이 보내서 거리순 유지, 아니면 일반 검색
            if (isLocationMode && location) {
                search(text, { latitude: location.latitude, longitude: location.longitude });
            } else {
                search(text);
            }
        }, 300);
    };

    // 검색 실행
    const handleSubmit = useCallback(() => {
        setMode(isLocationMode ? 'location' : 'searched');
        if (isLocationMode && location) {
            search(searchText, { latitude: location.latitude, longitude: location.longitude });
        } else {
            search(searchText);
        }
        fetchHistory();
    }, [searchText, search, fetchHistory, location, isLocationMode]);

    // 최근/추천 검색어 클릭 → 검색 실행 (일반 검색이므로 위치 모드 해제)
    const handleSelectKeyword = useCallback((keyword: string) => {
        setSearchText(keyword);
        setMode('searched');
        setIsLocationMode(false);
        search(keyword);
        fetchHistory();
    }, [search, fetchHistory]);

    // 검색창 X → 텍스트 초기화 (gui상 아직 없음)
    const handleClear = () => {
        setSearchText('');
        setMode('default');
        setIsLocationMode(false);
    };

    // 특정 장소를 클릭하면 장소 상세페이지로 이동 (리뷰 모드면 ReviewWrite로)
    const handleSelectPlace = useCallback((place: Place) => {
        saveHistory(place.name);
        if (reviewPhotoUri) {
            navigation.navigate('ReviewStack', {
                screen: 'ReviewLocationConfirm',
                params: {
                    photoUri: reviewPhotoUri,
                    placeId: place.id,
                    placeName: place.name,
                    placeCategory: CATEGORY_LABEL[place.category] ?? place.category,
                    placeDistance: (location && place.latitude != null && place.longitude != null)
                        ? formatDistance(getDistance(location, {latitude: place.latitude, longitude: place.longitude}))
                        : '',
                    placeAddress: place.address,
                    latitude: place.latitude ?? undefined,
                    longitude: place.longitude ?? undefined,
                    congestion: reviewCongestion,
                    reviewText: reviewTextParam,
                },
            } as never);
        } else {
            navigation.navigate('PlaceDetail', { placeId: place.id, placeName: place.name });
        }
    }, [navigation, reviewPhotoUri, saveHistory]);

    // 현재 위치로 장소 찾기
    const handleLocationSearch = () => {
        if (!location) return;
        setMode('location');
        setIsLocationMode(true);
        search(searchText, { latitude: location.latitude, longitude: location.longitude });
        fetchCurrentRegion(location.latitude, location.longitude);
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* 뒤로가기 + 검색창 */}
            <SearchHeader
                value={searchText}
                onChangeText={handleChangeText}
                onBack={handleBack}
                onSubmit={handleSubmit}
                onClear={handleClear}
            />

            {/* 검색 API 응답 기다리는 중 - 결과 없음 아이콘 대신 로딩 표시 (타이핑 중엔 자동완성 목록을 가리면 안 되니 제외) */}
            {isLoading && mode !== 'typing' ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#999" />
                </View>
            ) : (mode === 'searched' || mode === 'location') && places.length === 0 ? (
                /* 검색이 끝났는데 진짜 결과가 없을 때만 해골 표시 */
                <View style={styles.emptyContainer}>
                    <Image
                        source={require('../../assets/icons/IconSkull.png')}
                        style={{ width: 120, height: 120 }}
                    />
                    <Text style={styles.emptyText}>검색 결과가 없어요</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* 최근 검색어 → 서버에서 받아온 데이터 */}
                    {mode === 'default' && (
                        <>
                            <RecentSearchList
                                history={history}
                                onSelect={handleSelectKeyword}
                                onDelete={deleteHistory}
                                onDeleteAll={deleteAllHistory}
                            />
                        </>
                    )}

                    {/* 자동완성 목록 → 글자 입력 중일 때만, 최대 3개까지만 표시 */}
                    {mode === 'typing' && suggestions.length > 0 && (
                        <SearchItemList
                            suggestions={suggestions.slice(0, 3)}
                            onSelect={handleSelectKeyword}
                        />
                    )}

                    {/* 검색 결과 (타이핑 중 / 검색 완료 / 위치 검색) */}
                    {mode !== 'default' && places.length > 0 && (
                        <>
                            {mode === 'location' && (
                                <View style={styles.locationChip}>
                                    <View style={styles.locationChipLabelRow}>
                                        <Image source={currentLocationIcon} style={styles.locationChipIcon} resizeMode="contain" />
                                        <Text style={styles.locationChipLabel}>현재 위치</Text>
                                    </View>
                                    <Text style={styles.locationChipName}>
                                        {isRegionLoading
                                            ? '위치 확인 중...'
                                            : region?.region_3depth_name ?? '위치 확인 불가'}
                                    </Text>
                                </View>
                            )}
                            <PlaceCardList places={places} onSelect={handleSelectPlace} location={location} />
                        </>
                    )}
                </ScrollView>
            )}

            {/* 현재 위치로 장소 찾기 */}
            {(mode !== 'location') && (
                <View style={[styles.locationButtonWrapper, keyboardHeight > 0 && {bottom: keyboardHeight + 12}]}>
                    <LocationButton onPress={handleLocationSearch} />
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    locationChip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#222',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    locationChipLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationChipIcon: {
        width: 14,
        height: 14,
    },
    locationChipLabel: {
        color: '#fff',
        ...typography.c1,
    },
    locationChipName: {
        color: '#fff',
        ...typography.c2,
    },
    locationButtonWrapper: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
});
