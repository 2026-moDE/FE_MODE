import {getAccessToken} from '../storage/tokenStorage';

const BASE_URL = 'http://moing.co.kr:8080';

export type OnboardingRequest = {
  nickname: string;
  terms_agreed: boolean;
  location_terms_agreed: boolean;
  privacy_agreed?: boolean;
  marketing_agreed?: boolean;
  profile_image_url?: string;
};

export const onboardingApi = async (body: OnboardingRequest) => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('ACCESS_TOKEN이 없습니다. 로그인 토큰 저장을 확인해주세요.');
  }

  const response = await fetch(`${BASE_URL}/api/auth/onboarding`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `온보딩 실패: ${response.status}`);
  }

  return data;
};