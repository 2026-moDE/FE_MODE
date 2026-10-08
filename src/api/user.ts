import {apiClient} from './client';
import {MyReview} from './mypage';
import {FriendStatus} from './friend';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type UserProfile = {
  id: number;
  nickname: string;
  profile_image_url: string | null;
  profile_url: string | null;
  friend_count: number;
  review_count: number;
  is_friend: boolean;
  friend_status: FriendStatus;
};

// 타인 리뷰: created_at은 친구일 때만 공개(비친구는 null), is_recent(72시간 이내)는 친구일 때만 의미 있음
export type UserReview = Omit<MyReview, 'created_at'> & {
  created_at: string | null;
  is_recent: boolean;
};

export type UserReviewsResponse = {
  reviews: UserReview[];
  next_cursor: number | null;
};

type GetUserReviewsParams = {
  cursor?: number;
  limit?: number;
};

// 다른 유저 프로필 조회 api
export async function getUserProfile(userId: number): Promise<UserProfile> {
  console.log('[다른 유저 프로필 조회 요청]', {userId});

  const response = await apiClient.get<ApiResponse<UserProfile>>(`/api/users/${userId}`);

  console.log('[다른 유저 프로필 조회 응답]', response.data);

  return response.data.data;
}

// 다른 유저 리뷰 목록 조회 api
export async function getUserReviews(
  userId: number,
  params?: GetUserReviewsParams,
): Promise<UserReviewsResponse> {
  console.log('[다른 유저 리뷰 목록 조회 요청]', {userId, params});

  const response = await apiClient.get<ApiResponse<UserReviewsResponse>>(
    `/api/users/${userId}/reviews`,
    {params},
  );

  console.log('[다른 유저 리뷰 목록 조회 응답]', response.data);

  return response.data.data;
}
