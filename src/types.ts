import type { AxiosError } from 'axios';

// ── 공통 설정 ──

export interface HttpClientBaseConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  withCredentials?: boolean;

  /** 재시도 설정 — public/private 공통 적용 */
  retry?: RetryConfig;

  /** 디버그 로깅 — true면 console.log, 함수면 커스텀 로거 */
  debug?: boolean | LogFn;
}

export interface RetryConfig {
  statusCodes: number[];
  maxCount: number;
  backoff?: 'exponential' | 'linear';
}

// ── 인증 설정 ──

export interface HttpClientAuthConfig {
  getAccessToken: () => string | null | Promise<string | null>;
  getRefreshToken: () => string | null | Promise<string | null>;

  /**
   * 리프레시 요청 구현
   * - 프로젝트마다 헤더/바디 방식이 다르므로 외부에서 정의
   */
  refreshRequest: (refreshToken: string, baseURL: string) => Promise<TokenPair>;

  /** 토큰 갱신 성공 후 저장 처리 */
  onTokenRefreshed: (tokens: TokenPair) => void | Promise<void>;

  /** 리프레시 최종 실패 시 (로그아웃 등) */
  onAuthFailure: () => void | Promise<void>;

  /** 리프레시 판단 조건 */
  refreshCondition?: {
    statusCodes?: number[];   // 기본값: [401, 426]
    messages?: string[];      // 기본값: ['TOKEN_EXPIRED']
  };

  /**
   * 위 조건으로 커버 안 되는 복잡한 케이스용
   * - 둘 다 설정하면 shouldRefresh가 우선
   */
  shouldRefresh?: (error: AxiosError) => boolean;
}

// ── 전체 설정 ──

export interface HttpClientConfig extends HttpClientBaseConfig {
  /** 인증 설정 — 있으면 privateClient 생성 */
  auth?: HttpClientAuthConfig;

  /** 에러 후처리 콜백 (에러 저장, 알림 등) */
  onError?: (error: AxiosError, context: ErrorContext) => void | Promise<void>;
}

// ── 반환 타입 ──

export interface HttpClientInstance {
  publicClient: import('axios').AxiosInstance;
  privateClient: import('axios').AxiosInstance | null;
}

// ── 공통 타입 ──

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface ErrorContext {
  url?: string;
  method?: string;
  status?: number;
  duration?: number | null;
  retryCount?: number;
  clientType: 'public' | 'private';
}

export type LogFn = (message: string, data?: any) => void;
