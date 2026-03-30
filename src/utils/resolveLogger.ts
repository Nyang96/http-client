import type { LogFn } from '../types';

/**
 * debug 옵션을 통일된 LogFn으로 정규화
 * - false/undefined → 무시
 * - true → console.log
 * - 함수 → 그대로 사용
 */
export const resolveLogger = (debug?: boolean | LogFn): LogFn => {
  if (!debug) return () => {};
  if (typeof debug === 'function') return debug;
  return (message: string, data?: any) => {
    data ? console.log(message, data) : console.log(message);
  };
};
