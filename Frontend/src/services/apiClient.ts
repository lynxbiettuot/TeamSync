// src/services/apiClient.ts
// HTTP client bảo mật: Access Token lưu thuần túy trong Memory (không dùng localStorage)
// Tự động đính kèm HttpOnly Refresh Token Cookie thông qua credentials: 'include'
// Tự động gửi Header Authorization: Bearer <accessToken>
// Tự động gọi POST /api/auth/refresh khi gặp lỗi 401 và retry request ban đầu

export const BASE_API_URL = 'http://localhost:8080';

// ===== IN-MEMORY TOKEN STORE =====
let inMemoryAccessToken: string | null = null;
let onAuthFailedCallback: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const tokenStorage = {
  get: (): string | null => inMemoryAccessToken,
  set: (token: string | null): void => {
    inMemoryAccessToken = token;
  },
  clear: (): void => {
    inMemoryAccessToken = null;
  },
  setOnAuthFailed: (callback: () => void): void => {
    onAuthFailedCallback = callback;
  },
};

export interface RequestOptions extends RequestInit {
  _isRetry?: boolean;
}

/**
 * Thực hiện refresh token (Singleton Promise để tránh gọi nhiều lần cùng lúc khi có nhiều request 401)
 */
async function silentRefreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Gửi kèm HttpOnly Refresh Token Cookie
      });

      if (!res.ok) {
        throw new Error('Refresh token expired or invalid');
      }

      const resData = await res.json();
      // Format có thể là { data: { accessToken: "..." } } hoặc { accessToken: "..." }
      const newAccessToken =
        resData?.data?.accessToken || resData?.accessToken || null;

      if (!newAccessToken) {
        throw new Error('New access token not found in response');
      }

      tokenStorage.set(newAccessToken);
      return newAccessToken;
    } catch (err) {
      tokenStorage.clear();
      if (onAuthFailedCallback) {
        onAuthFailedCallback();
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Custom fetch client tự động inject Bearer token và xử lý 401 auto-refresh
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Chuẩn bị headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Tự động gắn Authorization Header nếu có token trong memory
  const token = tokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Luôn gửi kèm cookies
  };

  const response = await fetch(url, fetchOptions);

  // Nếu gặp lỗi 401 và chưa từng retry, không phải các endpoint auth đặc biệt
  const isAuthEndpoint =
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/logout') ||
    url.includes('/api/auth/register');

  if (response.status === 401 && !options._isRetry && !isAuthEndpoint) {
    const newToken = await silentRefreshToken();
    if (newToken) {
      // Retry lại request ban đầu với token mới
      return apiClient<T>(endpoint, {
        ...options,
        _isRetry: true,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    // Refresh thất bại -> Quăng lỗi
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.message || errJson.error || errorMsg;
    } catch {
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMsg);
  }

  // Trả về dữ liệu nếu có body
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch {
    return {} as T;
  }
}

// Helper methods tiện ích
apiClient.get = <T = unknown>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

apiClient.put = <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

apiClient.delete = <T = unknown>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
