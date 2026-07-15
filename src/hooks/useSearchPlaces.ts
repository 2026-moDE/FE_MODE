import { useState, useCallback } from 'react';
import { Place } from '../types/place';
import { searchPlaces } from '../api/search';

export function useSearchPlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const search = useCallback(async (
        keyword: string,
        locationOptions?: { latitude: number; longitude: number },
    ) => {
        if (keyword.trim() === '' && !locationOptions) return;

        setHasSearched(true);
        setIsLoading(true);
        setError(null);

        try {
            const data = await searchPlaces(keyword, locationOptions);
            console.log('검색 응답:', JSON.stringify(data));
            const unique = (data.places ?? []).filter(
              (p, i, arr) => arr.findIndex(x => x.id === p.id) === i,
            );
            setPlaces(unique);
        } catch (e: any) {
            console.warn('검색 API 실패:', e?.response?.status, e?.message);
            setPlaces([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { places, isLoading, error, hasSearched, search };
}
