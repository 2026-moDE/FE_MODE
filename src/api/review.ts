import {apiClient} from './client';
import {getPresignedUrl} from './imageUpload';

type ApiResponse<T> = {success: boolean; message: string | null; data: T};

export type CongestionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CreateReviewRequest = {
  place_id: number;
  image_url: string;
  congestion_level: CongestionLevel;
  quick_tag?: string;
  comment?: string;
  latitude: number;
  longitude: number;
};

type CreateReviewResponse = {
  success: boolean;
  message: string;
  data: {
    review: {
      id: number;
      created_at: string;
    };
  };
};


type VerifyLocationResponse = {
  success: boolean;
  message: string;
  data: {
    verified: boolean;
    distance: number;
  };
};

type EmojiReaction = {
  emoji : string;
  count : number;
  is_mine : boolean;
}

type EmojiReactionsResponse = {
  reactions: EmojiReaction[];
}

// 리뷰 이미지 업로드용 presigned URL 발급 (original/파일명)
export async function getReviewImagePresignedUrl(fileName: string) {
  return getPresignedUrl({
    file_name: `original/${fileName}`,
    content_type: 'image/jpeg',
  });
}

// 리뷰 작성
export async function createReview(body: CreateReviewRequest) {
  const response = await apiClient.post<CreateReviewResponse>(
    '/api/reviews',
    body,
  );

  return response.data.data.review;
}

// 위치 인증 확인
export async function verifyPlaceLocation(
  placeId: number,
  latitude: number,
  longitude: number,
) {
  const response = await apiClient.get<VerifyLocationResponse>(
    `/api/places/${placeId}/verify-location`,
    {
      params: {
        latitude,
        longitude,
      },
    },
  );

  return response.data.data;
}

// 리뷰 신고 api
export async function reportReview(
  id:number, 
  body : {reason:string; detail?:string;}){
  const response =  await apiClient.post(`/api/reviews/${id}/report`, body)
  return response.data;
}

// 리뷰 삭제 api
export async function deleteReview(id:number){
  const response = await apiClient.delete(`/api/reviews/${id}`)
  return response.data;
}

// 리뷰 텍스트 수정 api
export async function changeReview(
  id:number,
  body:{comment:string}){
  const response = await apiClient.patch(`/api/reviews/${id}`,body)
  return response.data;
}

// 리뷰 이모지 추가  api
export async function addEmoji(id:number, emoji:string){
  const response = await apiClient.post(`/api/reviews/${id}/reactions`,{emoji})
  return response.data;
}

// 리뷰 이모지 삭제 api
export async function removeEmoji(id:number, emoji:string){
  const response = await apiClient.delete(`/api/reviews/${id}/reactions`,{
    params: {emoji},
  })
  return response.data;
}
// 리뷰 이모지 반응 목록 조회 api
export async function fetchEmojis(id:number): Promise<EmojiReactionsResponse> {
  const response = await apiClient.get<ApiResponse<EmojiReactionsResponse>>(`/api/reviews/${id}/reactions`)
  return response.data.data;
}