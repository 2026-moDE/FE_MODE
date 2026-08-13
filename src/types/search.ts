import {PlaceCategory, CongestionLevel} from './place';

// ─────────────────── 장소 검색 api (GET /api/search) ───────────────────
export type Place = {
    id: number;
    name: string;
    address: string;
    category: PlaceCategory;
    latitude: number,
    longitude : number,
    congestion_level: CongestionLevel;
    thumbnail_url: string;
    thumbnail_small_url?: string | null;
};

export type PlaceResponse = {
    places: Place[];
};

// 최근 검색어 하나의 타입
export type SearchHistory = {
    id: number;
    keyword: string;
    created_at: string;
};

// 최근 검색어 API 응답 타입
export type SearchHistoryResponse = {
    history: SearchHistory[]; // history: [ {SearchHistory1}, {SearchHistory2}, ...]
};
