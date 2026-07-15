import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Place, CATEGORY_LABEL } from '../../types/place';
import SearchHeader from '../../components/search/SearchHeader';
import RecentSearchList from '../../components/search/RecentSearchList';
import RecommendedSearchList from '../../components/search/RecommendedSearchList';
import PlaceCardList from '../../components/search/PlaceCardList';
import { useSearchPlaces } from '../../hooks/useSearchPlaces';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import SearchItemList from '../../components/search/SearchItemList';
import LocationButton from '../../components/search/LocationButton';
import { useLocation } from '../../context/LocationContext';
import { getDistance, formatDistance } from '../../utils/distance';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
// 디폴트(최근,추천 검색어) / 검색어 타이핑 / 검색 완료 / 현위치로 검색
type Mode = 'default' | 'typing' | 'searched' | 'location'; 

export default function SearchScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp<AppStackParamList, 'Search'>>();
    const reviewPhotoUri = route.params?.reviewPhotoUri;

    // 검색창 텍스트 state
    const [searchText, setSearchText] = useState('');
    const [mode, setMode] = useState<Mode>('default');
    // 글자 한 자 칠 때마다 api 불러오면 부담
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 장소 검색 훅
    const { search, places } = useSearchPlaces();
    // 현재 위치
    const { location } = useLocation();

    // 최근 검색어 훅 → 화면 들어오면 자동으로 조회
    const { history, fetchHistory, saveHistory, deleteHistory } = useSearchHistory();

    // 검색어 자동 완성
    const { suggestions, search: searchAutocomplete } = useAutocomplete();

    // 임시 추천 검색어 (나중에 API 연결)
    const recommendedItems = [
        { id: 1, keyword: '성수동', type: 'normal' as const },
        { id: 2, keyword: '망원동', type: 'normal' as const },
        { id: 3, keyword: '가나디 팝업', type: 'hot' as const },
        { id: 4, keyword: '말빵', type: 'hot' as const },
        { id: 5, keyword: '군자', type: 'normal' as const },
        { id: 6, keyword: '서촌', type: 'normal' as const },
        { id: 7, keyword: '콩국수', type: 'normal' as const },
    ];

    // 뒤로가기
    const handleBack = () => navigation.goBack();

    // 검색창에 글자 한 자 칠 때마다
    const handleChangeText = (text: string) => {
        setSearchText(text);

        if (!text) {
            setMode('default');
            if (debounceRef.current) clearTimeout(debounceRef.current);
            return;
        }

        setMode('typing');

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchAutocomplete(text);
            search(text, location ? { latitude: location.latitude, longitude: location.longitude } : undefined);
        }, 300);
    };

    // 검색 실행
    const handleSubmit = useCallback(() => {
        setMode('searched');
        search(searchText, location ? { latitude: location.latitude, longitude: location.longitude } : undefined);
        fetchHistory();
    }, [searchText, search, fetchHistory, location]);

    // 최근/추천 검색어 클릭 → 검색 실행
    const handleSelectKeyword = useCallback((keyword: string) => {
        setSearchText(keyword);
        setMode('searched');
        search(keyword, location ? { latitude: location.latitude, longitude: location.longitude } : undefined);
        fetchHistory();
    }, [search, fetchHistory, location]);

    // 검색창 X → 텍스트 초기화 (gui상 아직 없음)
    const handleClear = () => {
        setSearchText('');
        setMode('default');
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
        search(searchText, {
            latitude: location.latitude,
            longitude: location.longitude,
        });
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

            {/* 검색 결과 없을 때 해골 표시 */}
            {mode === 'searched' && places.length === 0 ? (
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
                    {/* 추천 검색어 (얘도 확정 아니고) */}
                    {mode === 'default' && (
                        <>
                            <RecentSearchList
                                history={history}
                                onSelect={handleSelectKeyword}
                                onDelete={deleteHistory}
                            />
                            <RecommendedSearchList
                                items={recommendedItems}
                                onSelect={handleSelectKeyword}
                            />
                        </>
                    )}

                    {/* 자동완성 목록 → 글자 입력 중일 때만 표시 */}
                    {mode === 'typing' && suggestions.length > 0 && (
                        <SearchItemList
                            suggestions={suggestions}
                            onSelect={handleSelectKeyword}
                        />
                    )}

                    {/* 검색 결과 (타이핑 중 / 검색 완료 / 위치 검색) */}
                    {mode !== 'default' && places.length > 0 && (
                        <>
                            {mode === 'location' && (
                                <View style={styles.locationChip}>
                                    <Text style={styles.locationChipLabel}>⊙ 현재 위치</Text>
                                    <Text style={styles.locationChipName}>자양동</Text>
                                </View>
                            )}
                            <PlaceCardList places={places} onSelect={handleSelectPlace} />
                        </>
                    )}
                </ScrollView>
            )}

            {/* 현재 위치로 장소 찾기*/}
            {(mode === 'default' || mode === 'typing') && (
                <View style={styles.locationButtonWrapper}>
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
    locationChipLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    locationChipName: {
        color: '#fff',
        fontSize: 14,
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
