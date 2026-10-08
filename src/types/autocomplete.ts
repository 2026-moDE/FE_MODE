// 자동완성 요소
export type Suggestion = {
    id: number;
    name: string;
    address: string;
    category: string;
};

// 자동완성 응답 타입 (fetchAutocomplete에서 이미 response.data.data로 한 번 벗겨서 반환함)
export type AutocompleteResponse = {
    suggestions: Suggestion[];
};
