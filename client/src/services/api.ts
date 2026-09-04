// Centralized HTTP client for TradeLink API
// Handles auth token injection, refresh, and error normalization
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3001/api`;
    }
    // In production deployment (e.g., Vercel), fall back to relative /api to use reverse-proxy rewrites
    return '/api';
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

interface ApiError {
  status: 'error';
  message: string;
  statusCode: number;
}

// Token storage
let accessToken: string | null = localStorage.getItem('tradelink_access_token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('tradelink_access_token', token);
  } else {
    localStorage.removeItem('tradelink_access_token');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Refresh token flow
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const newToken = json.data?.accessToken;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

// Core request function
async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  options: { skipAuth?: boolean; retryOnUnauth?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, retryOnUnauth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  // Build URL with query params for GET
  let url = `${API_BASE_URL}${endpoint}`;
  if (body && method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    config.body = undefined;
  }

  try {
    const res = await fetch(url, config);

    // Handle 401 — attempt token refresh
    if (res.status === 401 && retryOnUnauth && !skipAuth) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await attemptTokenRefresh();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          // Retry original request with new token
          return request<T>(method, endpoint, body, { ...options, retryOnUnauth: false });
        } else {
          // Refresh failed — clear token, user must re-login
          setAccessToken(null);
          throw { status: 'error', message: 'Session expired. Please log in again.', statusCode: 401 } as ApiError;
        }
      } else {
        // Another refresh is in progress — wait for it
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            request<T>(method, endpoint, body, { ...options, retryOnUnauth: false })
              .then(resolve)
              .catch(reject);
          });
        });
      }
    }

    const json = await res.json();

    if (!res.ok) {
      throw {
        status: 'error',
        message: json.message || `Request failed with status ${res.status}`,
        statusCode: res.status,
      } as ApiError;
    }

    return json as ApiResponse<T>;
  } catch (err: any) {
    // Network error — server unreachable
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw {
        status: 'error',
        message: 'Server unreachable. Running in offline mode.',
        statusCode: 0,
      } as ApiError;
    }
    throw err;
  }
}

// Public API methods
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, options?: { skipAuth?: boolean }) =>
    request<T>('GET', endpoint, params, options),

  post: <T = any>(endpoint: string, body?: any, options?: { skipAuth?: boolean }) =>
    request<T>('POST', endpoint, body, options),

  put: <T = any>(endpoint: string, body?: any, options?: { skipAuth?: boolean }) =>
    request<T>('PUT', endpoint, body, options),

  patch: <T = any>(endpoint: string, body?: any, options?: { skipAuth?: boolean }) =>
    request<T>('PATCH', endpoint, body, options),

  delete: <T = any>(endpoint: string, options?: { skipAuth?: boolean }) =>
    request<T>('DELETE', endpoint, undefined, options),
};

// Upload helper (multipart/form-data, streamed to Cloudflare R2 / storage service)
export async function uploadFile(
  file: File,
  folder: 'listings' | 'avatars' | 'id-photos' | 'chat' = 'listings'
): Promise<{ url: string; key?: string; filename: string; size?: number; storage?: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  const json = await res.json();
  if (!res.ok) {
    throw { status: 'error', message: json.message || 'Upload failed', statusCode: res.status };
  }

  return json.data;
}

export type { ApiResponse, ApiError };
