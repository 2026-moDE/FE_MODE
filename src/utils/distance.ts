import {Location} from '../types/location';

/**
 * 두 좌표 사이의 거리를 m로 계산
 *
 * 하버사인 공식 (머라노...)
 * → 지구 곡률을 고려. 비교적 정확한 거리 계산
 *
 * 사용 예시:
 *   const meters = getDistance(myLocation, place);
 *   → 350 (현위치에서 장소까지 350m)
 *
 * @param from - 시작 좌표 (위도/경도)
 * @param to   - 끝 좌표 (위도/경도)
 * @returns 거리 (m, 정수로 반올림)
 */

// 모름... 이거 나중에 분석
export function getDistance(from: Location, to: Location): number {
    const R = 6371000; // 지구 반지름 (m)

    // 도(degree) → 라디안(radian) 변환
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(from.latitude)) *
            Math.cos(toRad(to.latitude)) *
            Math.sin(dLon / 2) ** 2;

    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(distance);
}

/**
 * 거리(m)를 표시용 문자열로 변환
 *
 * 사용 예시:
 *   formatDistance(210)  → "210m"
 *   formatDistance(1500) → "1.5km"
 *
 * @param meters - 거리 (미터)
 * @returns 표시용 문자열
 */

export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
}
