import {apiClient} from './client';
import {MyProfile, MyReviewsResponse} from './mypage';
import {FriendStatus} from './friend';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type UserProfile = Omit<MyProfile, 'email'> & {
  friend_status: FriendStatus;
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
): Promise<MyReviewsResponse> {
  console.log('[다른 유저 리뷰 목록 조회 요청]', {userId, params});

  const response = await apiClient.get<ApiResponse<MyReviewsResponse>>(
    `/api/users/${userId}/reviews`,
    {params},
  );

  console.log('[다른 유저 리뷰 목록 조회 응답]', response.data);

  return response.data.data;
}
