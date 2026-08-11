import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { SearchHistory } from '../types/search';
import {
    fetchSearchHistory,
    saveSearchHistory,
    deleteSearchHistory,
    deleteAllSearchHistory,
} from '../api/search';

export function useSearchHistory() {
    const [history, setHistory] = useState<SearchHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 최근 검색어 조회 → 화면 들어오면 자동 실행
    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchSearchHistory();
            setHistory(data?.history ?? []);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || '최근 검색어를 불러오지 못했습니다.';
            setError(msg);
            Alert.alert('검색기록 오류', msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 검색어 저장 (장소 선택 시 호출)
    const saveHistory = useCallback(async (keyword: string) => {
        try {
            await saveSearchHistory(keyword);
        } catch (e) {
            console.warn('검색어 저장 실패:', e);
        }
    }, []);

    // 검색어 삭제
    const deleteHistory = useCallback(async (keyword: string) => {
        try {
            await deleteSearchHistory(keyword);
            // 삭제된 항목을 즉시 화면에서 지움 (바로 반응하는 느낌)
            setHistory(prev => prev.filter(item => item.keyword !== keyword));
            // 서버 목록을 다시 불러와서, 5개 제한으로 안 보이던 다음 항목이 바로 채워지게 함
            fetchHistory();
        } catch (e) {
            setError('검색어 삭제에 실패했습니다.');
        }
    }, [fetchHistory]);

    // 전체 삭제
    const deleteAllHistory = useCallback(async () => {
        try {
            await deleteAllSearchHistory(); // 서버에서 전체 삭제
            setHistory([]);                 // 화면에서 전체 삭제
        } catch (e) {
            setError('전체 검색어 삭제에 실패했습니다.');
        }
    }, []);

    // SearchScreen 들어오면 자동으로 최근 검색어 불러옴
    useEffect(() => {
        fetchHistory();
    }, []);

    return { history, isLoading, error, fetchHistory, saveHistory, deleteHistory, deleteAllHistory };
}
