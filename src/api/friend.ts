import {apiClient} from './client';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type Friend = {
  user_id: number;
  nickname: string;
  profile_image_url: string | null;
};

type FriendsResponse = {
  friends: Friend[];
};

// 친구 목록 조회 api (ACCEPTED 상태)
export async function fetchFriends(): Promise<Friend[]> {
  console.log('[친구 목록 조회 요청]');

  const response = await apiClient.get<ApiResponse<FriendsResponse>>('/api/friends');

  console.log('[친구 목록 조회 응답]', response.data);

  return response.data.data.friends;
}

// 친구 취소 api
export async function deleteFriend(userId: number): Promise<void> {
  console.log('[친구 취소 요청]', {userId});

  const response = await apiClient.delete<ApiResponse<null>>(`/api/friends/${userId}`);

  console.log('[친구 취소 응답]', response.data);
}

// 친구 요청 거절 api
export async function rejectFriendRequest(userId: number): Promise<void> {
  console.log('[친구 요청 거절 요청]', {userId});

  const response = await apiClient.patch<ApiResponse<null>>(
    `/api/friends/requests/${userId}/reject`,
  );

  console.log('[친구 요청 거절 응답]', response.data);
}

// 친구 요청 수락 api (수락 시 양방향 친구 관계 성립)
export async function acceptFriendRequest(userId: number): Promise<void> {
  console.log('[친구 요청 수락 요청]', {userId});

  const response = await apiClient.patch<ApiResponse<null>>(
    `/api/friends/requests/${userId}/accept`,
  );

  console.log('[친구 요청 수락 응답]', response.data);
}

// 친구 요청 전송 api
export async function sendFriendRequest(userId: number): Promise<void> {
  console.log('[친구 요청 전송 요청]', {userId});

  const response = await apiClient.post<ApiResponse<null>>(`/api/friends/request/${userId}`);

  console.log('[친구 요청 전송 응답]', response.data);
}

export type FriendRequest = {
  user_id: number;
  nickname: string;
  profile_image_url: string | null;
  created_at: string;
};

// 받은 친구 요청 목록 조회 api (PENDING 상태만 반환)
export async function fetchFriendRequests(): Promise<FriendRequest[]> {
  console.log('[받은 친구 요청 목록 조회 요청]');

  const response = await apiClient.get<ApiResponse<FriendRequest[]>>('/api/friends/requests');

  console.log('[받은 친구 요청 목록 조회 응답]', response.data);

  return response.data.data;
}

export type FriendStatus = 'NONE' | 'PENDING' | 'ACCEPTED';

export type SearchedUser = {
  user_id: number;
  nickname: string;
  profile_image_url: string | null;
  friend_status: FriendStatus;
};

// 닉네임으로 유저 검색 api
export async function searchUsers(nickname: string): Promise<SearchedUser[]> {
  console.log('[유저 검색 요청]', {nickname});

  const response = await apiClient.get<ApiResponse<SearchedUser[]>>('/api/friends/search', {
    params: {nickname},
  });

  console.log('[유저 검색 응답]', response.data);

  return response.data.data;
}
