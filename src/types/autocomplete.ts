// 자동완성 요소
export type Suggestion = {
    id: number;
    name: string;
    address: string;
    category: string;
};

// 자동완성 응답 타입
type SuggestionData = {
    suggestions: Suggestion[];
};

export type AutocompleteResponse = {
    success: boolean; // 우선 api명세서 있어서 넣어둿는데 어디에 쓰는 거묘
    message: string; //
    data: SuggestionData;
};
