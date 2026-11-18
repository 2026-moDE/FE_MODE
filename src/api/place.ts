import {apiClient} from './client';
import {NearbyPlaceResponse, PlaceDetail, LocationVerifyResponse, CurrentReviewsResponse, ArchivedReviewsResponse, CongestionResponse, SubscribeResponse, TrendingPlacesResponse, PlaceCategory, CongestionLevel} from '../types/place';
import { Location } from '../types/location';
import { RegionResponse } from '../types/place';

// 개인화 추천 api
export type RecommendedPlace = {
    id: number;
    name: string;
    category: PlaceCategory;
    congestion_level: CongestionLevel;
    thumbnail_url: string | null;
    thumbnail_small_url: string | null;
    address: string;
};

export type RecommendPlacesResponse = {
    is_personalized: boolean;
    preferred_category: string | null;
    message: string;
    places: RecommendedPlace[];
};

type FetchRecommendPlacesParams = {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
};

type RecommendPlacesApiResponse = {
    success: boolean;
    message: string;
    data: RecommendPlacesResponse;
};

export async function fetchRecommendPlaces(
    params: FetchRecommendPlacesParams,
): Promise<RecommendPlacesResponse> {
    const response = await apiClient.get<RecommendPlacesApiResponse>(
        '/api/places/recommend',
        {params},
    );
    return response.data.data;
}

type FetchNearbyPlacesParams = {
  latitude: number;
  longitude: number;
  radius?: number;                                // 반경
  query?: string;                                 // 카테고리
  filter?: 'all' | 'current' | 'archived';        // 리뷰 기준 필터 (기본 all)
  visibility?: 'all'; // | 'friends' 친구 공개 임시 비활성화
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

type FetchTrendingPlacesParams = {
  latitude: number;
  longitude: number;
  limit?: number;                                 // 기본값 5
};

// 주변 반경 내 72시간 이내 리뷰가 많이 달린 장소 목록 조회 api (홈 바텀시트용) → GET /api/places/trending
export async function fetchTrendingPlaces(
  params: FetchTrendingPlacesParams,
): Promise<TrendingPlacesResponse> {
  const response = await apiClient.get<{success: boolean; message: string | null; data: TrendingPlacesResponse}>(
    '/api/places/hot',
    {params},
  );
  return response.data.data;
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

// 현재 위치 주소 (시/구/동)
export async function fetchRegion(params:{latitude:number, longitude: number}):Promise<RegionResponse>{
  const response = await apiClient.get<ApiResponse<RegionResponse>>(`/api/places/region`, {params});
  return response.data.data;
}