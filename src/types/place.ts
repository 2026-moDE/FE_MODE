// 카테고리 타입
export type PlaceCategory = 'CAFE' | 'RESTAURANT' | 'BAR' | 'PARK' | 'SHOPPING';

// 카테고리 한글 레이블 매핑
export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
    CAFE:       '카페',
    RESTAURANT: '음식점',
    BAR:        '술집',
    PARK:       '공원',
    SHOPPING:   '쇼핑',
};

// 서버에서 받아오는 장소 데이터 타입
export type Place = {
    id: number;
    name: string;
    address: string;
    category: PlaceCategory;
    congestion_level: string;
    thumbnail_url: string;
};

// 검색 API 응답 타입
export type PlaceResponse = {
    places: Place[];
};

// 장소 상세 조회 API 응답 타입 (GET /api/places/:id)
export type PlaceDetail = {
    id: number;
    name: string;
    address: string;
    category: PlaceCategory;
    business_hours: string;
    is_subscribed: boolean;
    congestion_level: string;
    review_count: number;
};

// HomeMiniCard 컴포넌트 Props 타입
export type HomeMiniCardProps = {
    place: PlaceDetail;
    distance?: string;
    images?: string[];
};

// 현위치 기준 주변 장소 조회 API 응답 타입 (GET /api/places)
export type NearbyPlace = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    congestion_level: string;
    thumbnail_url: string;
};

export type NearbyPlaceResponse = {
    places: NearbyPlace[];
};

