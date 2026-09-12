import {apiClient} from './client';
import type {CongestionLevel} from '../types/place';

export type MyProfile = {
  id: number;
  nickname: string;
  email: string | null;
  profile_image_url: string | null;
  profile_url?: string | null;
  review_count: number;
  place_count: number;
  subscription_count: number;
  friend_count?: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type MyReview = {
  id: number;
  place: {
    id: number;
    name: string;
    address: string;
  };
  image_url: string | null;
  thumbnail_url?: string | null;
  thumbnail_small_url?: string | null;
  congestion_level: CongestionLevel;
  comment: string | null;
  created_at: string;
  visibility: 'PUBLIC' | 'FRIENDS';
};

export type MyReviewsResponse = {
  reviews: MyReview[];
  next_cursor: number | null;
};

type GetMyReviewsParams = {
  cursor?: number;
  limit?: number;
  year?: number;
  month?: number;
};

export type UpdateProfileRequest = {
  nickname?: string;
  profile_image_url?: string | null;
};

export type UpdateProfileResponse = {
  nickname: string;
  profile_image_url: string | null;
};

export const getMyReviews = async (
  params?: GetMyReviewsParams,
): Promise<MyReviewsResponse> => {
  const response = await apiClient.get<ApiResponse<MyReviewsResponse>>(
    '/api/users/me/reviews',
    {
      params,
    },
  );

  return response.data.data;
};

export const getMyProfile = async (): Promise<MyProfile> => {
  const response = await apiClient.get<ApiResponse<MyProfile>>('/api/users/me');

  return response.data.data;
};

export const updateMyProfile = async (
  body: UpdateProfileRequest,
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.patch<ApiResponse<UpdateProfileResponse>>(
    '/api/users/me',
    body,
  );

  return response.data.data;
};