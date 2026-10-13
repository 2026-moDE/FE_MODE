import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {AppStackParamList} from '../../types/navigation';
import {CongestionArea, fetchCongestionAreas} from '../../api/congestion';
import {fetchRegion} from '../../api/place';
import {RegionResponse} from '../../types/place';
import SearchHeader from '../../components/search/SearchHeader';
import LocationButton from '../../components/search/LocationButton';
import {useLocation} from '../../context/LocationContext';
import {getDistance, formatDistance} from '../../utils/distance';
import {colors} from '../../constants/colors';
import {typography} from '../../constants/typography';
import {spacing, gap} from '../../constants/spacing';

const locationPinIcon = require('../../assets/image/location.png');
const currentLocationIcon = require('../../assets/image/place_pin.png');

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'CongestionAreaSearch'>;

export default function CongestionAreaSearchScreen() {
    const {bottom: bottomInset} = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<Route>();
    const {onSelectArea} = route.params;
    const {location} = useLocation();

    const [searchText, setSearchText] = useState('');
    const [allAreas, setAllAreas] = useState<CongestionArea[]>([]);
    const [displayAreas, setDisplayAreas] = useState<CongestionArea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocationMode, setIsLocationMode] = useState(false);
    const [region, setRegion] = useState<RegionResponse | null>(null);
    const [isRegionLoading, setIsRegionLoading] = useState(false);
    const regionFetchingRef = useRef(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    // 진입 시 전체 목록 로드
    useEffect(() => {
        setIsLoading(true);
        fetchCongestionAreas()
            .then(result => {
                setAllAreas(result);
                setDisplayAreas(result);
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    const fetchCurrentRegion = useCallback(async (latitude: number, longitude: number) => {
        if (regionFetchingRef.current) return;
        regionFetchingRef.current = true;
        setIsRegionLoading(true);
        try {
            const data = await fetchRegion({latitude, longitude});
            setRegion(data);
        } catch {
            setRegion(null);
        } finally {
            regionFetchingRef.current = false;
            setIsRegionLoading(false);
        }
    }, []);

    const handleChangeText = (text: string) => {
        setSearchText(text);
        setIsLocationMode(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!text) {
            setDisplayAreas(allAreas);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const result = await fetchCongestionAreas(text);
                setDisplayAreas(result);
            } catch {
                setDisplayAreas([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await fetchCongestionAreas(searchText || undefined);
            setDisplayAreas(result);
        } catch {
            setDisplayAreas([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchText]);

    const handleClear = () => {
        setSearchText('');
        setIsLocationMode(false);
        setDisplayAreas(allAreas);
    };

    const handleLocationPress = () => {
        if (!location) return;
        setIsLocationMode(true);
        setSearchText('');
        const sorted = [...allAreas].sort((a, b) =>
            getDistance(location, {latitude: a.latitude, longitude: a.longitude}) -
            getDistance(location, {latitude: b.latitude, longitude: b.longitude}),
        );
        setDisplayAreas(sorted);
        fetchCurrentRegion(location.latitude, location.longitude);
    };

    const handleSelect = (area: CongestionArea) => {
        Keyboard.dismiss();
        onSelectArea(area.id, area.area_name);
        navigation.goBack();
    };

    const showEmpty = !isLoading && displayAreas.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            <SearchHeader
                value={searchText}
                onChangeText={handleChangeText}
                onBack={() => navigation.goBack()}
                onSubmit={handleSubmit}
                onClear={handleClear}
            />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#999" />
                </View>
            ) : showEmpty ? (
                <View style={styles.center}>
                    <Image
                        source={require('../../assets/icons/IconSkull.png')}
                        style={{width: 120, height: 120}}
                    />
                    <Text style={styles.emptyText}>검색 결과가 없어요</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    {isLocationMode && (
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
                    {displayAreas.map(area => {
                        const distanceText = (isLocationMode && location)
                            ? formatDistance(getDistance(location, {latitude: area.latitude, longitude: area.longitude}))
                            : null;
                        return (
                            <TouchableOpacity
                                key={area.id}
                                style={styles.item}
                                onPress={() => handleSelect(area)}>
                                <Image source={locationPinIcon} style={styles.pinIcon} resizeMode="contain" />
                                <View style={styles.info}>
                                    <View style={styles.row}>
                                        <Text style={styles.areaName} numberOfLines={1}>{area.area_name}</Text>
                                        {distanceText && (
                                            <Text style={styles.distance}>{distanceText}</Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {!isLocationMode && (
                <View style={[
                    styles.locationButtonWrapper,
                    {bottom: keyboardHeight > 0 ? keyboardHeight + 12 : Math.max(bottomInset, 16) + 12},
                ]}>
                    <LocationButton onPress={handleLocationPress} />
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
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
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: gap.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    pinIcon: {
        width: 18,
        height: 18,
        marginTop: 4,
    },
    info: {
        flex: 1,
        gap: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    areaName: {
        ...typography.b3,
        color: colors.text.basic,
        flexShrink: 1,
        includeFontPadding: false,
    },
    distance: {
        ...typography.b6,
        color: colors.text.brandDarker,
        flexShrink: 0,
    },
    category: {
        ...typography.b6,
        color: colors.text.tertiary,
    },
    locationButtonWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
