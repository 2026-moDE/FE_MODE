import { useState, useCallback } from 'react';
import { Suggestion } from '../types/autocomplete';
import { fetchAutocomplete } from '../api/search';

export function useAutocomplete() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (
        keyword: string,
        locationOptions?: { latitude: number; longitude: number },
    ) => {
        if (keyword.trim() === '') {
            setSuggestions([]);  // 입력값 없으면 목록 비움
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchAutocomplete(keyword, locationOptions);
            setSuggestions(data.suggestions);
        } catch (e) {
            setError('자동완성 조회에 실패했습니다.');
            setSuggestions([]); // 이전 목록들 지움
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { suggestions, isLoading, error, search };
}
