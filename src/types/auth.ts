export type SocialLoginProvider = 'KAKAO' | 'NAVER' | 'GOOGLE' | 'APPLE';

export type SocialLoginRequest = {
  provider: SocialLoginProvider;
  access_token: string;
  fcm_token?: string;
};

export type User = {
  id: number;
  nickname: string;
  profile_image_url: string;
};

export type SocialLoginData = {
  access_token: string;
  refresh_token: string;
  is_new_user: boolean;
  user: User;
};

export type SocialLoginResponse = {
  success: boolean;
  message: string;
  data: SocialLoginData;
};