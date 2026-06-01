import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Place } from '../types/place';
import { searchPlaces } from '../api/search';

export function useSearchPlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const search = useCallback(async (keyword: string) => {
        if (keyword.trim() === '') return;

        setHasSearched(true);
        setIsLoading(true);
        setError(null);

        try {
            const data = await searchPlaces(keyword);
            console.log('검색 응답:', JSON.stringify(data));
            setPlaces(data.places ?? []);
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message || e?.message || '검색 중 오류가 발생했습니다.';
            setError(msg);
            Alert.alert('검색 오류', `[${status}] ${msg}`);
            setPlaces([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { places, isLoading, error, hasSearched, search };
}
