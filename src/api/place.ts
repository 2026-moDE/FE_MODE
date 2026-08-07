import {apiClient} from './client';
import {NearbyPlaceResponse, PlaceDetail, LocationVerifyResponse, CurrentReviewsResponse, ArchivedReviewsResponse, CongestionResponse, SubscribeResponse} from '../types/place';
import { Location } from '../types/location';

type FetchNearbyPlacesParams = {
  latitude: number;
  longitude: number;
  radius?: number;                                // 반경 
  query?: string;                                 // 카테고리
  filter?: 'all' | 'current' | 'archived';        // 리뷰 기준 필터 (기본 all)
  visibility?: 'all' | 'friends';
};

// 현위치 기준 주변 장소 조회 api → GET /api/places/nearby
export async function fetchNearbyPlaces(
  params: FetchNearbyPlacesParams,
): Promise<NearbyPlaceResponse> {
  const response = await apiClient.get<NearbyPlaceResponse>('/api/places/nearby', {
    params,
  });
  return response.data;
}

// 장소 상세 조회 api → GET /api/places/{id}
export async function fetchPlaceDetail(id: number): Promise<PlaceDetail> {
  const response = await apiClient.get<{success: boolean; message: string | null; data: PlaceDetail}>(`/api/places/${id}`);
  return response.data.data;
}

type ApiResponse<T> = { success: boolean; message: string | null; data: T };

// 현재 위치 인증 api
export async function fetchLocationVerify(id:number, location:Location): Promise<LocationVerifyResponse>{
  const response = await apiClient.get<ApiResponse<LocationVerifyResponse>>(`/api/places/${id}/verify-location`,{params:location});
  return response.data.data;
}

// 리뷰 공용 파라미터
type FetchReviewParams = {
  cursor?: number;
  limit?: number ;
}

// 현재 리뷰 목록
export async function fetchCurrentReviews(id:number,params?:FetchReviewParams):Promise<CurrentReviewsResponse>{
  const response = await apiClient.get<ApiResponse<CurrentReviewsResponse>>(`/api/places/${id}/reviews/current`,{params});
  return response.data.data;
}

// 과거 리뷰 목록
export async function fetchArchivedReviews(id:number,params?:FetchReviewParams):Promise<ArchivedReviewsResponse>{
  const response = await apiClient.get<ApiResponse<ArchivedReviewsResponse>>(`/api/places/${id}/reviews/archived`,{params});
  return response.data.data;
}

// 혼잡도 추이
export async function fetchCongestion(id:number):Promise<CongestionResponse>{
  const response = await apiClient.get<ApiResponse<CongestionResponse>>(`/api/places/${id}/congestion-trend`);
  return response.data.data;
}

// 알림 구독 설정
export async function subscribe(id:number):Promise<SubscribeResponse>{
  console.log('[장소 구독 요청]', id);
  
  const response = await apiClient.post<ApiResponse<SubscribeResponse>>(`/api/places/${id}/subscribe`);
  console.log('[장소 구독 응답]', response.data);

  return response.data.data;
}

// 알림 구독 취소
export async function unsubscribe(id:number):Promise<SubscribeResponse>{
  console.log('[장소 구독 취소 요청]', id);

  const response = await apiClient.delete<ApiResponse<SubscribeResponse>>(`/api/places/${id}/subscribe`);
  console.log('[장소 구독 취소 응답]', response.data);
  return response.data.data;
}