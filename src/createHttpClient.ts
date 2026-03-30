import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { HttpClientConfig, HttpClientInstance } from './types';
import { resolveLogger } from './utils/resolveLogger';
import { setupRequestLogger, setupResponseLogger } from './interceptors/logger';
import { setupAuthRequestInterceptor } from './interceptors/authRequest';
import { setupRefreshInterceptor } from './interceptors/refresh';
import { setupRetryInterceptor } from './interceptors/retry';
import { setupErrorInterceptor } from './interceptors/errorHandler';

// axios 확장 — 재시도/로깅용 커스텀 필드
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _alreadyRetried?: boolean;
    _retryCount?: number;
    _requestStartTime?: number;
  }
}

/**
 * HTTP 클라이언트 팩토리
 *
 * 인터셉터 등록 순서 (순서가 동작에 영향):
 * [request]  로깅 → 인증(private만) → 전송
 * [response] 로깅 → 리프레시(private만) → 재시도 → 에러 후처리
 */
export const createHttpClient = (config: HttpClientConfig): HttpClientInstance => {
  const log = resolveLogger(config.debug);

  // ── public client ──
  const publicClient = createBaseInstance(config);
  setupRequestLogger(publicClient, log);
  setupResponseLogger(publicClient, log);
  if (config.retry) {
    setupRetryInterceptor(publicClient, config.retry, log);
  }
  setupErrorInterceptor(publicClient, config, 'public');

  // ── private client (auth 설정이 있을 때만) ──
  let privateClient: AxiosInstance | null = null;

  if (config.auth) {
    privateClient = createBaseInstance(config);
    setupRequestLogger(privateClient, log);
    setupAuthRequestInterceptor(privateClient, config.auth);
    setupResponseLogger(privateClient, log);
    setupRefreshInterceptor(privateClient, config, log);
    if (config.retry) {
      setupRetryInterceptor(privateClient, config.retry, log);
    }
    setupErrorInterceptor(privateClient, config, 'private');
  }

  return { publicClient, privateClient };
};

// ── 기본 인스턴스 생성 ──

const createBaseInstance = (config: HttpClientConfig): AxiosInstance => {
  return axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 30000,
    withCredentials: config.withCredentials ?? false,
    headers: {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    },
  });
};
