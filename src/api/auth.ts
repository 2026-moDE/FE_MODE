import {apiClient} from './client';
import type {
  SocialLoginProvider,
  SocialLoginResponse,
} from '../types/auth';

export const socialLoginApi = async ({
  provider,
  accessToken,
  fcmToken,
}: {
  provider: SocialLoginProvider;
  accessToken: string;
  fcmToken?: string;
}) => {
  const response = await apiClient.post<SocialLoginResponse>(
    '/api/auth/social-login',
    {
      provider,
      access_token: accessToken,
      fcm_token: fcmToken,
    },
  );

  return response.data;
};