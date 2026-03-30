import { AxiosError } from 'axios';
import { AxiosInstance } from 'axios';

/**
 * HTTP 클라이언트 팩토리
 *
 * 인터셉터 등록 순서 (순서가 동작에 영향):
 * [request]  로깅 → 인증(private만) → 전송
 * [response] 로깅 → 리프레시(private만) → 재시도 → 에러 후처리
 */
export declare const createHttpClient: (config: HttpClientConfig) => HttpClientInstance;

export declare interface ErrorContext {
    url?: string;
    method?: string;
    status?: number;
    duration?: number | null;
    retryCount?: number;
    clientType: 'public' | 'private';
}

export declare interface HttpClientAuthConfig {
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
        statusCodes?: number[];
        messages?: string[];
    };
    /**
     * 위 조건으로 커버 안 되는 복잡한 케이스용
     * - 둘 다 설정하면 shouldRefresh가 우선
     */
    shouldRefresh?: (error: AxiosError) => boolean;
}

export declare interface HttpClientBaseConfig {
    baseURL: string;
    timeout?: number;
    defaultHeaders?: Record<string, string>;
    withCredentials?: boolean;
    /** 재시도 설정 — public/private 공통 적용 */
    retry?: RetryConfig;
    /** 디버그 로깅 — true면 console.log, 함수면 커스텀 로거 */
    debug?: boolean | LogFn;
}

export declare interface HttpClientConfig extends HttpClientBaseConfig {
    /** 인증 설정 — 있으면 privateClient 생성 */
    auth?: HttpClientAuthConfig;
    /** 에러 후처리 콜백 (에러 저장, 알림 등) */
    onError?: (error: AxiosError, context: ErrorContext) => void | Promise<void>;
}

export declare interface HttpClientInstance {
    publicClient: AxiosInstance;
    privateClient: AxiosInstance | null;
}

export declare type LogFn = (message: string, data?: any) => void;

export declare interface RetryConfig {
    statusCodes: number[];
    maxCount: number;
    backoff?: 'exponential' | 'linear';
}

export declare interface TokenPair {
    accessToken: string;
    refreshToken?: string;
}

export { }


declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _alreadyRetried?: boolean;
        _retryCount?: number;
        _requestStartTime?: number;
    }
}
