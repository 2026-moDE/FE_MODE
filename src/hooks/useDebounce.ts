import { useEffect, useState } from 'react';

/**
 * 값이 빠르게 바뀔 때 마지막 변경 후 일정 시간 동안 변화가 없으면 반영하는 훅.
 *
 * 사용 예시:
 *   const debouncedCamera = useDebounce(camera, 500);
 *   → camera가 500ms 동안 변하지 않으면 debouncedCamera 업데이트
 *
 * @param value   - 추적할 값
 * @param delay   - 디바운스 시간 (ms), 기본 500ms
 * @returns 디바운스된 값
 */

//  나중에 검색 디바운스도 이거 활용? 지금은 우선 냅두기
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // value가 바뀌면 타이머 시작
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // value가 또 바뀌면 이전 타이머 취소 → 다시 시작
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
