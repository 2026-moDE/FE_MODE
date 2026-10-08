// ─────────────────── 공용 Union 타입 ───────────────────

// 장소 카테고리
export type PlaceCategory = 'CAFE' | 'RESTAURANT' | 'POPUP' | 'CONCERT' | 'ETC';

// 혼잡도 레벨
export type CongestionLevel = 'RELAXED' | 'MODERATE' | 'CROWDED' | 'VERY_CROWDED';

// 혼잡도 버블 색상
export type BubbleColor = 'GREEN' | 'YELLOW' | 'RED';

// 요일
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

// 카테고리 한글 레이블 매핑
export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
    CAFE:       '카페',
    RESTAURANT: '음식점',
    POPUP:      '팝업스토어',
    CONCERT:    '콘서트',
    ETC:        '기타',
};

// 혼잡도 한글 레이블 매핑 (서버는 congestion_level만 내려주고 문구는 FE에서 만듦)
export const CONGESTION_LABEL: Record<CongestionLevel, string> = {
    RELAXED:      '한산해요',
    MODERATE:     '적당해요',
    CROWDED:      '붐벼요',
    VERY_CROWDED: '매우 붐벼요',
};

// 혼잡도 → 버블 색상 매핑 (서버는 congestion_level만 내려주고 색은 FE에서 정함)
export const CONGESTION_BUBBLE_COLOR: Record<CongestionLevel, BubbleColor> = {
    RELAXED:      'GREEN',
    MODERATE:     'GREEN',
    CROWDED:      'YELLOW',
    VERY_CROWDED: 'RED',
};

// 버블 색상 → 실제 컬러값
export const BUBBLE_COLOR_HEX: Record<BubbleColor, string> = {
    GREEN:  '#84E588',
    YELLOW: '#FFD75E',
    RED:    '#FF685D',
};

// ─────────────────── 장소 상세 조회 api (GET /api/places/:id) ───────────────────
export type PlaceDetail = {
    id: number;
    name: string;
    address: string;
    category: PlaceCategory;
    business_hours: string | null;
    is_subscribed: boolean;
    // 서버 응답에 congestion_label / bubble_color는 없음 - 레벨로 CONGESTION_LABEL, CONGESTION_BUBBLE_COLOR 매핑해서 씀
    congestion_level: CongestionLevel | null;
    congestion_index: number | null;
    congestion_review_count: number;
    congestion_updated_at: string | null;
    review_count: number;
};

// ─────────────────── 현위치 기준 주변 장소 api (GET /api/places) ───────────────────
export type NearbyPlace = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    congestion_level: CongestionLevel;
    thumbnail_url: string;
    thumbnail_small_url?: string | null;
    category?: PlaceCategory;
    address?: string;
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
    user_id?: number;
    nickname: string;
    profile_image_url: string;
    profile_url?: string | null;
};

// ─────────────────── 현재 리뷰 목록 api (GET /api/places/:id/reviews/current) ─────────────────── 

export type CurrentReview = {
    id: number;
    image_url: string;
    thumbnail_url : string | null;
    thumbnail_small_url : string | null;
    congestion_level: CongestionLevel;
    comment: string;
    is_mine : boolean;
    visibility: 'PUBLIC' | 'FRIENDS';
    is_friend: boolean;
    user: ReviewUser;
    created_at: string;
    comment_count: number;
    // 마이페이지/마이맵처럼 여러 장소가 섞여 있는 목록에서 ReviewPhoto가 리뷰별로 장소명을 보여줄 때만 사용 (API 필드 아님)
    place_name?: string;
    place_id?: number;
};

export type CurrentReviewsResponse = {
    reviews: CurrentReview[];
    next_cursor: number | null; 
};

// ─────────────────── 과거 리뷰 목록 api (GET /api/places/:id/reviews/archived) ─────────────────── 

export type ArchivedReview = {
    id: number;
    image_url: string;
    thumbnail_url : string | null;
    thumbnail_small_url : string | null;
    congestion_level: CongestionLevel;
    comment: string;
    is_mine : boolean;
    visibility : 'PUBLIC' | 'FRIENDS';
    is_friend : boolean;
    user: ReviewUser;
    created_at: string;
    comment_count: number;
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

// 현재 위치 주소 (시/구/동) - 바다·해외 좌표 등은 null로 올 수 있음
export type RegionResponse = {
    region_1depth_name : string | null; // 시,도
    region_2depth_name : string | null; // 구, 군
    region_3depth_name : string | null; // 동
}

// ─────────────────── 인기 장소 (72h 이내 리뷰 2개 이상, GET /api/places/hot) ───────────────────
export type TrendingPlace = {
    id: number;
    name: string;
    category: PlaceCategory;
    congestion_level: CongestionLevel;
    // 72시간 이내 리뷰 수
    review_count: number;
    // 최신순 최대 4개. review_id가 없어서 사진별로 특정 리뷰로 이동은 불가 (장소 상세로만 이동 가능)
    review_images: {
        thumbnail_url: string;
        thumbnail_small_url: string;
    }[];
    latest_review: {
        comment: string;
        created_at: string;
    };
};

export type TrendingPlacesResponse = {
    places: TrendingPlace[];
};