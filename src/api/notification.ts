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

// 알림 목록 조회 api
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

// 구독 장소 목록 조회 api
export async function fetchSubscriptions(): Promise<SubscriptionsResponse> {
  console.log('[구독 장소 목록 조회 요청]');

  const response = await apiClient.get<ApiResponse<SubscriptionsResponse>>(
    '/api/users/me/subscriptions',
  );

  console.log('[구독 장소 목록 조회 응답]', response.data);

  return response.data.data;
}

// 미읽음 알림 여부 조회 api (홈 알림 벨 뱃지 표시용)
export async function fetchHasUnreadNotification(): Promise<boolean> {
  const response = await apiClient.get<ApiResponse<{has_unread: boolean}>>(
    '/api/users/me/notifications/unread',
  );

  return response.data.data.has_unread;
}

// 알림 읽음 처리 api (알림 클릭 시 호출)
export async function readNotification(id: number): Promise<void> {
  console.log('[알림 읽음 처리 요청]', {id});

  await apiClient.patch<ApiResponse<null>>(`/api/notifications/${id}/read`);

  console.log('[알림 읽음 처리 완료]', {id});
}