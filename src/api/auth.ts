import type {
  SocialLoginProvider,
  SocialLoginResponse,
} from '../types/auth';
import {getAccessToken, getRefreshToken, saveTokens, clearTokens} from '../storage/tokenStorage';

const BASE_URL = 'http://moing.co.kr:8080';

// 소셜 로그인 API
export const socialLoginApi = async ({
  provider,
  accessToken,
  fcmToken,
}: {
  provider: SocialLoginProvider;
  accessToken: string;
  fcmToken?: string;
}) => {
  console.log('[소셜 로그인 요청]', {
    provider,
    accessToken,
    fcmToken,
  });
  
  const response = await fetch(`${BASE_URL}/api/auth/social-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      access_token: accessToken,
      fcm_token: fcmToken,
    }),
  });

  const data: SocialLoginResponse = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message || `소셜 로그인 실패: ${response.status}`,
    ) as Error & {response?: {status: number; data: SocialLoginResponse}};
    error.response = {status: response.status, data};
    throw error;
  }

  return data;
};

// 토큰 재발급 API
export const refreshAccessTokenApi = async () => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error('저장된 refresh_token이 없습니다.');
  }

  console.log('[토큰 재발급 요청]', {
    refresh_token: refreshToken,
  });

  const response = await fetch(`${BASE_URL}/api/auth/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  console.log('[토큰 재발급 응답]', data);

  if (!response.ok || data.success === false) {
    // refresh_token 자체가 무효(401)인 경우에만 로컬 토큰 삭제.
    // 그 외 일시적 오류(네트워크/5xx 등)로는 아직 유효할 refresh_token을 지우지 않는다.
    if (response.status === 401) {
      await clearTokens();
    }
    throw new Error(data.message || `토큰 재발급 실패: ${response.status}`);
  }

  const newAccessToken = data.data?.access_token ?? data.access_token;
  const newRefreshToken = data.data?.refresh_token ?? data.refresh_token;

  if (!newAccessToken) {
    throw new Error('응답에 access_token이 없습니다.');
  }

  // 서버가 refresh_token을 로테이션(재발급)해서 내려주는 경우를 대비해 함께 저장
  await saveTokens(newAccessToken, newRefreshToken);

  console.log('[토큰 재발급 성공] 새 access_token 저장 완료');

  return newAccessToken;
};

// 로그아웃 API
export const logoutApi = async () => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    console.log('[로그아웃] access_token 없음 → 로컬 토큰만 삭제');
    await clearTokens();
    return;
  }

  const response = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  console.log('[로그아웃 응답]', data);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || `로그아웃 실패: ${response.status}`);
  }

  await clearTokens();

  console.log('[로그아웃 성공] 토큰 삭제 완료');

  return data;
};

// 회원 탈퇴 API
export const withdrawApi = async () => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('access_token이 없습니다.');
  }

  const response = await fetch(`${BASE_URL}/api/auth/withdraw`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  console.log('[회원탈퇴 응답]', data);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || `회원탈퇴 실패: ${response.status}`);
  }

  await clearTokens();

  console.log('[회원탈퇴 성공] 토큰 삭제 완료');

  return data;
};