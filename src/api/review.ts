import {apiClient} from './client';
import {getPresignedUrl} from './imageUpload';

type ApiResponse<T> = {success: boolean; message: string | null; data: T};

export type CongestionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// 리뷰 상세 조회 응답
export type ReviewDetail = {
  id: number;
  place_id: number;
  place_name: string;
  image_url: string;
  thumbnail_url: string;
  thumbnail_small_url: string;
  congestion_level: CongestionLevel;
  comment: string;
  is_mine: boolean;
  visibility: 'PUBLIC' | 'FRIENDS';
  is_friend: boolean;
  user: {
    user_id: number;
    nickname: string;
    profile_image_url: string;
    profile_url: string;
  };
  created_at: string;
};

export type CreateReviewRequest = {
  place_id: number;
  image_url: string;
  congestion_level: CongestionLevel;
  visibility: 'PUBLIC' | 'FRIENDS';
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

export type EmojiReaction = {
  emoji : string;
  is_mine : boolean;
  user: {
    nickname: string;
    profile_image_url: string | null;
    profile_url: string | null;
  };
}

type EmojiReactionsResponse = {
  reactions: EmojiReaction[];
}

// 댓글 (작성/답글 공용)
export type Comment = {
  id: number;
  review_id: number;
  parent_id: number | null;   // 답글이면 부모 댓글 ID, 댓글이면 null
  content: string;
  is_secret: boolean;
  created_at: string;
};

// 댓글 목록 조회 type
export type ReviewComment = {
  id: number;
  parent_id: number | null;
  content: string | null;   // 비밀 댓글이고 볼 권한 없으면 null
  is_secret: boolean;
  is_mine: boolean;
  is_deleted: boolean;
  user: {
    nickname: string;
    profile_image_url: string;
    profile_url: string;
  };
  created_at: string;
  replies: ReviewComment[];
};

type CommentsResponse = {
  comments: ReviewComment[];
  next_cursor: number | null;
};

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

// 리뷰 상세 조회 api
export async function fetchReviewDetail(id: number): Promise<ReviewDetail> {
  const response = await apiClient.get<ApiResponse<ReviewDetail>>(`/api/reviews/${id}`);
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

// 댓글 작성 api
export async function createComment(
  id: number,
  body: {content: string; is_secret?: boolean},
): Promise<Comment> {
  const response = await apiClient.post<ApiResponse<Comment>>(`/api/reviews/${id}/comments`, body);
  return response.data.data;
}

// 댓글 목록 조회 api
export async function fetchComments(
  id: number,
  params?: {cursor?: number; limit?: number},
): Promise<CommentsResponse> {
  const response = await apiClient.get<ApiResponse<CommentsResponse>>(`/api/reviews/${id}/comments`, {params});
  return response.data.data;
}

// 댓글 삭제 api
export async function deleteComment(id: number, commentId: number) {
  const response = await apiClient.delete(`/api/reviews/${id}/comments/${commentId}`);
  return response.data;
}

// 답글 작성 api
export async function createReply(
  id: number,
  commentId: number,
  body: {content: string},
): Promise<Comment> {
  const response = await apiClient.post<ApiResponse<Comment>>(`/api/reviews/${id}/comments/${commentId}/replies`, body);
  return response.data.data;
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