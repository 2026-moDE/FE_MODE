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
