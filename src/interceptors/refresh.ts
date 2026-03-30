import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { HttpClientConfig, LogFn } from '../types';

/**
 * 토큰 리프레시 인터셉터
 *
 * 동작 흐름:
 * 1. 응답이 shouldRefresh 조건에 해당하면 리프레시 시작
 * 2. 이미 리프레시 중이면 pendingQueue에 대기
 * 3. 리프레시 성공 → 대기 큐 전부 해소 + 원본 요청 재시도
 * 4. 리프레시 실패 → 대기 큐 전부 reject + onAuthFailure 호출
 */
export const setupRefreshInterceptor = (
  instance: AxiosInstance,
  config: HttpClientConfig,
  log: LogFn
) => {
  const auth = config.auth!;

  let isRefreshing = false;
  let pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  const processQueue = (error: any = null, token: string | null = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
      error ? reject(error) : resolve(token!);
    });
    pendingQueue = [];
  };

  // 기본 판단: 401 | 426 | TOKEN_EXPIRED
  const shouldRefresh = auth.shouldRefresh ?? ((error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message;

    const codes = auth.refreshCondition?.statusCodes ?? [401, 426];
    const messages = auth.refreshCondition?.messages ?? ['TOKEN_EXPIRED'];

    return (
      (status != null && codes.includes(status)) ||
      (message != null && messages.includes(message))
    );
  });

  instance.interceptors.response.use(null, async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // 취소된 요청은 무시
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    // 리프레시 대상이 아니거나, 이미 재시도한 요청이면 통과
    if (
      !shouldRefresh(error) ||
      originalRequest?._alreadyRetried ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    // 이미 갱신 중 → 큐에 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(instance(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._alreadyRetried = true;
    isRefreshing = true;

    try {
      const refreshTokenValue = await auth.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const tokens = await auth.refreshRequest(refreshTokenValue, config.baseURL);
      await auth.onTokenRefreshed(tokens);

      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      processQueue(null, tokens.accessToken);

      log('Token refreshed, retrying request');
      return instance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      log('Token refresh failed');
      await auth.onAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  });
};
