import type { AxiosInstance } from 'axios';
import type { LogFn } from '../types';

/**
 * 요청 로깅 + 요청 시작 시간 기록
 */
export const setupRequestLogger = (instance: AxiosInstance, log: LogFn) => {
  instance.interceptors.request.use((config) => {
    config._requestStartTime = Date.now();
    log(`${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
};

/**
 * 응답 성공 시 소요 시간 로깅
 */
export const setupResponseLogger = (instance: AxiosInstance, log: LogFn) => {
  instance.interceptors.response.use((response) => {
    if (response.config._requestStartTime) {
      const duration = Date.now() - response.config._requestStartTime;
      log(`${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }
    return response;
  });
};
