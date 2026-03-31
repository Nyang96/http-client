import type { AxiosInstance } from 'axios';
import type { ApiClientAuthConfig } from '../types';

/**
 * private 요청 인터셉터
 * - Authorization 헤더에 Bearer 토큰 주입
 */
export const setupAuthRequestInterceptor = (
  instance: AxiosInstance,
  auth: ApiClientAuthConfig
) => {
  instance.interceptors.request.use(async (config) => {
    const accessToken = await auth.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });
};
