import {apiClient} from './client';
import {AutocompleteResponse} from '../types/autocomplete';
import {PlaceResponse, SearchHistoryResponse} from '../types/search';

type ApiResponse<T> = {success: boolean; message: string | null; data: T};

// 장소 검색 API → GET /api/places/search?keyword=... (keyword 없이 좌표만 보내도 됨)
export async function searchPlaces(
  keyword?: string,
  options?: { latitude?: number; longitude?: number },
): Promise<PlaceResponse> {
  const trimmedKeyword = keyword?.trim();

  const response = await apiClient.get<ApiResponse<PlaceResponse>>('/api/places/search', {
    params: {
      // 빈 문자열이면 keyword 자체를 안 보냄
      ...(trimmedKeyword && { keyword: trimmedKeyword }),
      ...(options?.latitude != null && { latitude: options.latitude }),
      ...(options?.longitude != null && { longitude: options.longitude }),
    },
  });
  return response.data.data;
}

// 최근 검색어 조회 API → GET /api/search/history
export async function fetchSearchHistory(): Promise<SearchHistoryResponse> {
  const response = await apiClient.get<ApiResponse<SearchHistoryResponse>>('/api/search/history');
  return response.data.data;
}

// 검색어 저장 API → POST /api/search/history?keyword=...
export async function saveSearchHistory(keyword: string): Promise<void> {
  await apiClient.post('/api/search/history', null, {
    params: { keyword },
  });
}

// 검색어 개별 삭제 API → DELETE /api/search/history?keyword=...
export async function deleteSearchHistory(keyword: string): Promise<void> {
  await apiClient.delete('/api/search/history', {
    params: { keyword },
  });
}

// 전체 검색어 삭제 API → DELETE /api/search/history/all
export async function deleteAllSearchHistory(): Promise<void> {
  await apiClient.delete('/api/search/history/all');
}

// 검색 자동완성 API → GET /api/search/autocomplete?keyword=...
export async function fetchAutocomplete(keyword: string): Promise<AutocompleteResponse> {
  const response = await apiClient.get<ApiResponse<AutocompleteResponse>>(
    '/api/search/autocomplete',
    {params: {keyword}},
  );
  return response.data.data;
}
