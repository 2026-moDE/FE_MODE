import axios, {InternalAxiosRequestConfig} from 'axios';
import {getAccessToken} from '../storage/tokenStorage';
import {refreshAccessTokenApi} from './auth';
import {notifySessionExpired} from '../context/AuthContext';

export const BASE_URL = 'https://api.moing.co.kr';

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: access_token 붙이기
apiClient.interceptors.request.use(
  async config => {
    const token = await getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 토큰 전문은 찍지 않는다 - 붙었는지만 확인
    console.log('[API 요청]', config.url, token ? '(인증 O)' : '(인증 X)');

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 실행되도록 진행 중인 요청을 공유
let refreshPromise: Promise<string> | null = null;

// 응답 인터셉터: 401이면 토큰 재발급 후 원래 요청 재시도
apiClient.interceptors.response.use(
  response => response,
  async error => {
    console.log('[API 에러 URL]', error.config?.url);
    console.log('[API 에러 status]', error.response?.status);
    console.log('[API 에러 data]', error.response?.data);

    const originalRequest = error.config as RetryRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        console.log('[토큰 만료] access_token 재발급 시도');

        if (!refreshPromise) {
          refreshPromise = refreshAccessTokenApi().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;

        console.log('[토큰 재발급 완료] 원래 요청 재시도');
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('[토큰 재발급 실패] 로그인 페이지로 이동');
        // refresh_token으로도 갱신이 안 되면 더 이상 재시도할 방법이 없으므로
        // 로그인 상태를 끊어서 RootNavigation이 로그인 화면으로 전환하게 한다.
        notifySessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);