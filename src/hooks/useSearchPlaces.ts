import { useState, useCallback } from 'react';
// ────────────────────── 백엔드 연동 시 활성화 ──────────────────────
// import { Alert } from 'react-native';
import { Place } from '../types/place';
import { searchPlaces } from '../api/search';
// ⚠️ 테스트용 목 데이터 import (백엔드 연동 완료 후 삭제)
import { getSearchPlacesMock } from '../mocks/placesMock';

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
            // 테스트용
            console.warn('검색 API 실패 → 목 데이터 사용:', e?.message);
            setPlaces(getSearchPlacesMock(keyword).places);

            // ────────────────────── 실제 에러 처리 ──────────────────────
            // const status = e?.response?.status;
            // const msg = e?.response?.data?.message || e?.message || '검색 중 오류가 발생했습니다.';
            // setError(msg);
            // Alert.alert('검색 오류', `[${status}] ${msg}`);
            // setPlaces([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { places, isLoading, error, hasSearched, search };
}
