import axios from 'axios';
import {apiClient} from './client';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type BlockedUser = {
  user_id: number;
  nickname: string;
  profile_image_url: string | null;
  // UTC(Z). 화면에 쓸 때는 utils/date의 formatKstDate로 KST로 바꿔야 한다
  blocked_at: string;
};

type BlockedUsersResponse = {
  blocks: BlockedUser[];
};

// 사용자 차단 api (중복 차단은 서버가 멱등 처리해서 200)
export async function blockUser(userId: number): Promise<void> {
  console.log('[사용자 차단 요청]', {userId});

  const response = await apiClient.post<ApiResponse<null>>(`/api/users/${userId}/block`);

  console.log('[사용자 차단 응답]', response.data);
}

// 사용자 차단 해제 api (이미 해제된 상태도 서버가 멱등 처리해서 200)
export async function unblockUser(userId: number): Promise<void> {
  console.log('[사용자 차단 해제 요청]', {userId});

  const response = await apiClient.delete<ApiResponse<null>>(`/api/users/${userId}/block`);

  console.log('[사용자 차단 해제 응답]', response.data);
}

// 내가 차단한 사용자 목록 조회 api (최근 차단순, 페이지네이션 없음)
export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  console.log('[차단 목록 조회 요청]');

  const response = await apiClient.get<ApiResponse<BlockedUsersResponse>>(
    '/api/users/me/blocks',
  );

  console.log('[차단 목록 조회 응답]', response.data);

  return response.data.data.blocks;
}

// 차단 관계가 있으면 서버가 403을 준다. 다만 403은 "친구가 아니라서 막힘"에도 쓰이므로
// (예: 친구 아닌 유저의 조각 목록) 차단 안내로 바꿔도 되는 요청에서만 이걸 본다
export function isBlockedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}
