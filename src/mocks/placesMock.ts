// ⚠️ 테스트용 목 데이터 - 백엔드 연동 완료 후 삭제 ⚠️
import {NearbyPlace, PlaceDetail, CurrentReviewsResponse} from '../types/place';
import {Location} from '../types/location';

// 시청역 좌표 (고정 - 시뮬레이터에서도 확인 가능)
const CITY_HALL: Location = {
    latitude: 37.5600,
    longitude: 126.9823,
};

/**
 * 주변 장소 목록 목데이터 생성
 * - 현위치 주변에 6개 배치
 * - 시청역 주변에 6개 배치
 * (위도 0.001 ≈ 약 110m)
 */
export function getNearbyPlacesMock(baseLocation: Location): NearbyPlace[] {
    return [
        ...generatePlacesAround(baseLocation, 0),         // id 1~6 (현위치)
        ...generatePlacesAround(CITY_HALL, 100),          // id 101~106 (시청역)
    ];
}

/**
 * 특정 좌표 주변에 6개 장소 생성
 * @param base   - 기준 좌표
 * @param idBase - id 시작값 (현위치=0, 시청역=100)
 */
function generatePlacesAround(base: Location, idBase: number): NearbyPlace[] {
    const {latitude, longitude} = base;

    return [
        {
            id: idBase + 1,
            name: '리볼리 성수',
            latitude: latitude + 0.0005,
            longitude: longitude + 0.0005,
            congestion_level: 'CROWDED',
            thumbnail_url: `https://picsum.photos/seed/place${idBase + 1}/200`,
        },
        {
            id: idBase + 2,
            name: '카페 어딘가',
            latitude: latitude - 0.0005,
            longitude: longitude - 0.0005,
            congestion_level: 'MODERATE',
            thumbnail_url: `https://picsum.photos/seed/place${idBase + 2}/200`,
        },
        {
            id: idBase + 3,
            name: '베이커리 모잉',
            latitude: latitude + 0.001,
            longitude: longitude - 0.001,
            congestion_level: 'LOW',
            thumbnail_url: `https://picsum.photos/seed/place${idBase + 3}/200`,
        },
        {
            id: idBase + 4,
            name: '와인바 해질녘',
            latitude: latitude - 0.001,
            longitude: longitude + 0.001,
            congestion_level: 'CROWDED',
            thumbnail_url: `https://picsum.photos/seed/place${idBase + 4}/200`,
        },
        {
            id: idBase + 5,
            name: '브런치 더샵',
            latitude: latitude + 0.0015,
            longitude: longitude + 0.0015,
            congestion_level: 'MODERATE',
            thumbnail_url: `https://picsum.photos/seed/place${idBase + 5}/200`,
        },
        {
            id: idBase + 6,
            name: '책방 모잉문고',
            latitude: latitude - 0.0015,
            longitude: longitude - 0.0015,
            congestion_level: 'LOW',
            thumbnail_url: `https://picsum.photos/seed/place${idBase + 6}/200`,
        },
    ];
}

/**
 * 장소 상세 정보 목데이터 (id로 매핑)
 * - 1~6: 현위치 주변
 * - 101~106: 시청역 주변
 */
export const placeDetailsMock: Record<number, PlaceDetail> = {
    // ─────────────────── 현위치 주변 ───────────────────
    1: {
        id: 1,
        name: '리볼리 성수',
        address: '성수동2가 315-11',
        category: 'RESTAURANT',
        business_hours: '영업 중 · 20:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'CROWDED',
        review_count: 128,
    },
    2: {
        id: 2,
        name: '카페 어딘가',
        address: '중구 정동길 5',
        category: 'CAFE',
        business_hours: '영업 중 · 22:00에 영업 종료',
        is_subscribed: true,
        congestion_level: 'MODERATE',
        review_count: 45,
    },
    3: {
        id: 3,
        name: '베이커리 모잉',
        address: '중구 세종대로 110',
        category: 'CAFE',
        business_hours: '영업 중 · 21:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'LOW',
        review_count: 23,
    },
    4: {
        id: 4,
        name: '와인바 해질녘',
        address: '중구 무교로 32',
        category: 'BAR',
        business_hours: '영업 중 · 02:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'CROWDED',
        review_count: 89,
    },
    5: {
        id: 5,
        name: '브런치 더샵',
        address: '중구 을지로 16',
        category: 'RESTAURANT',
        business_hours: '영업 중 · 16:00에 영업 종료',
        is_subscribed: true,
        congestion_level: 'MODERATE',
        review_count: 67,
    },
    6: {
        id: 6,
        name: '책방 모잉문고',
        address: '중구 덕수궁길 15',
        category: 'SHOPPING',
        business_hours: '영업 중 · 21:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'LOW',
        review_count: 12,
    },
    // ─────────────────── 시청역 주변 ───────────────────
    101: {
        id: 101,
        name: '시청앞 이태리식당',
        address: '중구 세종대로 100',
        category: 'RESTAURANT',
        business_hours: '영업 중 · 22:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'CROWDED',
        review_count: 215,
    },
    102: {
        id: 102,
        name: '덕수궁 카페',
        address: '중구 세종대로 99',
        category: 'CAFE',
        business_hours: '영업 중 · 21:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'MODERATE',
        review_count: 88,
    },
    103: {
        id: 103,
        name: '광화문 베이커리',
        address: '중구 무교로 20',
        category: 'CAFE',
        business_hours: '영업 중 · 20:00에 영업 종료',
        is_subscribed: true,
        congestion_level: 'LOW',
        review_count: 34,
    },
    104: {
        id: 104,
        name: '시청역 와인바',
        address: '중구 을지로 5',
        category: 'BAR',
        business_hours: '영업 중 · 02:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'CROWDED',
        review_count: 156,
    },
    105: {
        id: 105,
        name: '서울광장 브런치',
        address: '중구 서소문로 14',
        category: 'RESTAURANT',
        business_hours: '영업 중 · 17:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'MODERATE',
        review_count: 72,
    },
    106: {
        id: 106,
        name: '정동공원 책방',
        address: '중구 정동길 30',
        category: 'SHOPPING',
        business_hours: '영업 중 · 21:00에 영업 종료',
        is_subscribed: false,
        congestion_level: 'LOW',
        review_count: 19,
    },
};

/**
 * 현재 리뷰 목록 목데이터 (id로 매핑)
 * 각 장소마다 리뷰 5개씩 (이미지 URL 포함)
 */
export function getCurrentReviewsMock(placeId: number): CurrentReviewsResponse {
    return {
        reviews: [
            {
                id: placeId * 100 + 1,
                image_url: `https://picsum.photos/seed/review${placeId}-1/300`,
                congestion_level: 'CROWDED',
                comment: '주말 점심이라 사람이 많아요',
                helpful_count: 12,
                is_helpful: false,
                user: {nickname: '김서울', profile_image_url: `https://picsum.photos/seed/user1/100`},
                created_at: '2026-05-19T13:00:00Z',
            },
            {
                id: placeId * 100 + 2,
                image_url: `https://picsum.photos/seed/review${placeId}-2/300`,
                congestion_level: 'MODERATE',
                comment: '오후엔 여유있어요',
                helpful_count: 5,
                is_helpful: true,
                user: {nickname: '이성수', profile_image_url: `https://picsum.photos/seed/user2/100`},
                created_at: '2026-05-19T15:30:00Z',
            },
            {
                id: placeId * 100 + 3,
                image_url: `https://picsum.photos/seed/review${placeId}-3/300`,
                congestion_level: 'LOW',
                comment: '아침엔 한산해요',
                helpful_count: 8,
                is_helpful: false,
                user: {nickname: '박정동', profile_image_url: `https://picsum.photos/seed/user3/100`},
                created_at: '2026-05-19T09:00:00Z',
            },
            {
                id: placeId * 100 + 4,
                image_url: `https://picsum.photos/seed/review${placeId}-4/300`,
                congestion_level: 'MODERATE',
                comment: '평일 저녁 추천',
                helpful_count: 3,
                is_helpful: false,
                user: {nickname: '최광화', profile_image_url: `https://picsum.photos/seed/user4/100`},
                created_at: '2026-05-19T19:00:00Z',
            },
            {
                id: placeId * 100 + 5,
                image_url: `https://picsum.photos/seed/review${placeId}-5/300`,
                congestion_level: 'CROWDED',
                comment: '인기 많은 시간대',
                helpful_count: 20,
                is_helpful: false,
                user: {nickname: '정덕수', profile_image_url: `https://picsum.photos/seed/user5/100`},
                created_at: '2026-05-19T12:00:00Z',
            },
        ],
        next_cursor: null,
    };
}
