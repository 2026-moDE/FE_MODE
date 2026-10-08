/**
 * 장소 검색 커스텀 훅
 *
 * 검색 API(searchPlaces) 호출과 그에 딸린 상태(결과 목록, 로딩, 에러)를
 * 한 묶음으로 관리한다. 화면에서는 search()만 부르면 되고,
 * 결과는 places로 자동 반영된다.
 *
 * 사용 예시:
 *   const {search, places} = useSearchPlaces();
 *   search('성수동');                              // 키워드 검색 (백엔드가 정렬한 순서 그대로)
 *   search('', {latitude: 37.5, longitude: 127})  // 현위치 기반 검색 (백엔드가 카카오에 sort=distance로 요청해서 거리순으로 옴)
 *
 * 쓰는 곳: SearchScreen (타이핑 자동검색, 검색 실행, 현위치로 찾기)
 */
import { useState, useCallback } from 'react';
import { Place } from '../types/search';
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
