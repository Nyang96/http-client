import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { HttpClientConfig, ErrorContext } from '../types';

/**
 * 에러 후처리 인터셉터
 * - 최종 실패한 요청에 대해 onError 콜백 실행
 * - 에러 저장, 알림, 모니터링 등 프로젝트별 처리를 위임
 */
export const setupErrorInterceptor = (
  instance: AxiosInstance,
  config: HttpClientConfig,
  clientType: 'public' | 'private'
) => {
  if (!config.onError) return;

  instance.interceptors.response.use(null, async (error: AxiosError) => {
    const request = error.config as InternalAxiosRequestConfig;

    const context: ErrorContext = {
      url: request?.url,
      method: request?.method,
      status: error.response?.status,
      duration: request?._requestStartTime
        ? Date.now() - request._requestStartTime
        : null,
      retryCount: request?._retryCount ?? 0,
      clientType,
    };

    await config.onError!(error, context);
    return Promise.reject(error);
  });
};
