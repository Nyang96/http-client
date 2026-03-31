# @le/api-client

Axios 기반 API 클라이언트 패키지

- 토큰 자동 주입 / 리프레시 / 큐잉
- public / private 클라이언트 분리
- 재시도 (exponential / linear backoff)
- 프레임워크 무관 (Vue, React, Vanilla 등)

## 설치

```bash
npm install git+https://github.com/Nyang96/api-client.git#v0.1.0
```

## 사용법

```typescript
import { createHttpClient } from '@le/api-client';

const { publicClient, privateClient } = createHttpClient({
  baseURL: 'https://api.example.com',

  auth: {
    getAccessToken: () => sessionStorage.getItem('accessToken'),
    getRefreshToken: () => sessionStorage.getItem('refreshToken'),
    refreshRequest: async (refreshToken, baseURL) => {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    },
    onTokenRefreshed: (tokens) => {
      sessionStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) sessionStorage.setItem('refreshToken', tokens.refreshToken);
    },
    onAuthFailure: () => {
      sessionStorage.clear();
      window.location.href = '/login';
    },
  },

  retry: { statusCodes: [502, 503, 504], maxCount: 2 },
  debug: true,
});

// 토큰 불필요
publicClient.post('/auth/login', credentials);

// 토큰 자동 주입
privateClient!.get('/api/users');
```
