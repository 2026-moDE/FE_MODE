import {apiClient} from './client';
import {
  NotificationsResponse,
  SubscriptionsResponse,
} from '../types/notifications';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export async function fetchNotifications(
  cursor?: number,
  limit?: number,
): Promise<NotificationsResponse> {
  console.log('[알림 목록 조회 요청]', {cursor, limit});

  const response = await apiClient.get<ApiResponse<NotificationsResponse>>(
    '/api/users/me/notifications',
    {
      params: {cursor, limit},
    },
  );

  console.log('[알림 목록 조회 응답]', response.data);

  return response.data.data;
}

export async function fetchSubscriptions(): Promise<SubscriptionsResponse> {
  console.log('[구독 장소 목록 조회 요청]');

  const response = await apiClient.get<ApiResponse<SubscriptionsResponse>>(
    '/api/users/me/subscriptions',
  );

  console.log('[구독 장소 목록 조회 응답]', response.data);

  return response.data.data;
}