import {apiClient} from './client';
import {NearbyPlaceResponse} from '../types/place';

type FetchNearbyPlacesParams = {
  latitude: number;
  longitude: number;
  radius?: number;  // 기본값 1500 (서버 기본값)
  query?: string;   // 카테고리 (기본: 음식점)
};

// 현위치 기준 주변 장소 조회 API → GET /api/places
export async function fetchNearbyPlaces(
  params: FetchNearbyPlacesParams,
): Promise<NearbyPlaceResponse> {
  const response = await apiClient.get<NearbyPlaceResponse>('/api/places', {
    params,
  });
  return response.data;
}
