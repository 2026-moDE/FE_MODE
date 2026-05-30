import { useState, useCallback } from 'react';
// ────────────────────── 백엔드 연동 시 활성화 ──────────────────────
// import { Alert } from 'react-native';
import { Place } from '../types/place';
import { searchPlaces } from '../api/search';
// ⚠️ 테스트용 목 데이터 import (백엔드 연동 완료 후 삭제)
import { getSearchPlacesMock } from '../mocks/placesMock';

export function useSearchPlaces() {
    const [places, setPlaces] = useState<Place[]>([]);   // 검색 결과
    const [isLoading, setIsLoading] = useState(false);   // 로딩 중 여부
    const [error, setError] = useState<string | null>(null); // 에러 메시지
    const [hasSearched, setHasSearched] = useState(false); // 검색 실행 여부 // places에 아무것도 없을 때 해골 띄우기 위함

    const search = useCallback(async (keyword: string) => {
        if (keyword.trim() === '') return; // 빈 값이면 실행 안 함

        setHasSearched(true); // 검색 실행됐다고 표시
        setIsLoading(true);   // 로딩 시작
        setError(null);       // 이전 에러 초기화

        try {
            const data = await searchPlaces(keyword); // API 호출
            console.log('검색 응답:', JSON.stringify(data));
            setPlaces(data.places ?? []);             // 결과 저장
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
            setIsLoading(false); // 로딩 끝
        }
    }, []);

    return { places, isLoading, error, hasSearched, search };
}
