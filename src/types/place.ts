// ─────────────────── 공용 Union 타입 ───────────────────

// 장소 카테고리 (임의..?)
export type PlaceCategory = 'CAFE' | 'RESTAURANT' | 'BAR' | 'PARK' | 'SHOPPING' | 'ETC';

// 혼잡도 레벨
export type CongestionLevel = 'LOW' | 'MODERATE' | 'CROWDED';

// 요일
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

// 카테고리 한글 레이블 매핑
export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
    CAFE:       '카페',
    RESTAURANT: '음식점',
    BAR:        '술집',
    PARK:       '공원',
    SHOPPING:   '쇼핑',
    ETC:        '기타',
};

// ─────────────────── 장소 검색 api (GET /api/search) ───────────────────
export type Place = {
    id: number;
    name: string;
    address: string;
    category: PlaceCategory;
    congestion_level: CongestionLevel;
    thumbnail_url: string;
};

export type PlaceResponse = {
    places: Place[];
};

// ─────────────────── 장소 상세 조회 api (GET /api/places/:id) ───────────────────
export type PlaceDetail = {
    id: number;
    name: string;
    address: string;
    category: PlaceCategory;
    business_hours: string;
    is_subscribed: boolean;
    congestion_level: CongestionLevel;
    review_count: number;
};

// ─────────────────── 현위치 기준 주변 장소 api (GET /api/places) ───────────────────
export type NearbyPlace = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    congestion_level: CongestionLevel | null;
    thumbnail_url: string | null;
};

export type NearbyPlaceResponse = {
    places: NearbyPlace[];
};

// ─────────────────── 위치 인증 api (GET /api/places/:id/verify-location) ─────────────────── 
export type LocationVerifyResponse = {
    verified: boolean;    // 위치 인증 여부 (50m 이내인지)
    distance: number;     // 장소까지 거리
};

// 리뷰 작성자 (현재/과거 api 공용)
export type ReviewUser = {
    nickname: string;
    profile_image_url: string;
};

// ─────────────────── 현재 리뷰 목록 api (GET /api/places/:id/reviews/current) ─────────────────── 

export type CurrentReview = {
    id: number;
    image_url: string;
    congestion_level: CongestionLevel;
    comment: string;
    helpful_count: number;
    is_helpful: boolean;          
    user: ReviewUser;             
    created_at: string;
};

export type CurrentReviewsResponse = {
    reviews: CurrentReview[];
    next_cursor: number | null; 
};

// ─────────────────── 과거 리뷰 목록 api (GET /api/places/:id/reviews/archived) ─────────────────── 

export type ArchivedReview = {
    id: number;
    image_url: string;
    congestion_level: CongestionLevel;
    comment: string;
    helpful_count: number;
    user: ReviewUser;
    created_at: string;
};

export type ArchivedReviewsResponse = {
    reviews: ArchivedReview[];
    next_cursor: number | null;
};

// ─────────────────── 혼잡도 추이 api (GET /api/places/:id/congestion) ─────────────────── 
export type Congestion = {
    day_of_week: DayOfWeek;
    hour: number;                         
    congestion_level: CongestionLevel;
    review_count: number;
};

export type CongestionData = {
    trends: Congestion[];
};

export type CongestionResponse = {
    success: boolean;
    message: string;
    data: CongestionData;                
};

// ─────────────────── 알림 구독 설정 / 취소 (우선 하나로 통합) ─────────────────── 
export type SubscribeResponse = {
    is_subscribed: boolean;
};
