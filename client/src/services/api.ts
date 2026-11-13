// Centralized HTTP client for TradeLink API
// Handles auth token injection, refresh, and error normalization
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Use the Vite dev-server proxy so browser requests stay same-origin.
      return '/api';
    }
    // Fallback in live browser context: relative /api or same-origin API
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

// Token storage (Strictly in-memory to prevent XSS credential theft; persistent sessions rely on HttpOnly refresh cookies)
let accessToken: string | null = null;

// Purge any legacy token from localStorage
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tradelink_access_token');
  }
} catch {}

export function setAccessToken(token: string | null) {
  accessToken = token;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tradelink_access_token');
    }
  } catch {}
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

export async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
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

let memoryCsrfToken: string | null = null;

export function setCsrfToken(token: string) {
  if (!token) return;
  memoryCsrfToken = token;
  try {
    sessionStorage.setItem('tradelink_csrf_token', token);
  } catch {}
}

export function getCsrfToken(): string | null {
  if (memoryCsrfToken) return memoryCsrfToken;
  try {
    const saved = sessionStorage.getItem('tradelink_csrf_token');
    if (saved) {
      memoryCsrfToken = saved;
      return saved;
    }
  } catch {}
  return getCookie('XSRF-TOKEN') || getCookie('CSRF-TOKEN');
}

// Proactively pre-fetch CSRF token if not cached
let csrfFetchPromise: Promise<string | null> | null = null;
export async function ensureCsrfToken(): Promise<string | null> {
  const current = getCsrfToken();
  if (current) return current;
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
      const headerToken = res.headers.get('x-csrf-token') || res.headers.get('x-xsrf-token');
      if (headerToken) {
        setCsrfToken(headerToken);
        return headerToken;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.csrfToken) {
          setCsrfToken(json.csrfToken);
          return json.csrfToken;
        }
      }
    } catch {}
    return null;
  })();

  const token = await csrfFetchPromise;
  csrfFetchPromise = null;
  return token;
}

// Pre-warm CSRF token on startup
if (typeof window !== 'undefined') {
  ensureCsrfToken().catch(() => {});
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Core request function with automatic retry for network glitches & Render cold-starts
async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  options: {
    skipAuth?: boolean;
    retryOnUnauth?: boolean;
    headers?: Record<string, string>;
    retries?: number;
  } = {}
): Promise<ApiResponse<T>> {
  const {
    skipAuth = false,
    retryOnUnauth = true,
    headers: customHeaders = {},
    retries = method === 'GET' ? 2 : 0
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Inject CSRF double-submit token on state-mutating requests
  const xsrfToken = getCsrfToken();
  if (xsrfToken && method !== 'GET') {
    headers['X-XSRF-TOKEN'] = xsrfToken;
    headers['X-CSRF-Token'] = xsrfToken;
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
    // 45-second timeout to accommodate Render free-tier cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    config.signal = controller.signal;

    const res = await fetch(url, config);
    clearTimeout(timeoutId);

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

    const respCsrf = res.headers.get('x-csrf-token') || res.headers.get('x-xsrf-token');
    if (respCsrf) {
      setCsrfToken(respCsrf);
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Body is not JSON (e.g. Vercel plain text / HTML error page for 413, 502, 504)
      if (res.status === 413) {
        throw {
          status: 'error',
          message: 'Upload payload too large (exceeds server limit). Please select a smaller photo or retry.',
          statusCode: 413,
        } as ApiError;
      }
      if (!res.ok) {
        let friendlyMessage = 'Something went wrong. Please try again.';
        if (res.status === 404) friendlyMessage = 'The requested item or page could not be found.';
        else if (res.status === 403) friendlyMessage = 'You do not have permission to do this.';
        else if (res.status === 401) friendlyMessage = 'Please log in to continue.';
        else if (res.status === 429) friendlyMessage = 'Too many attempts. Please wait a moment before trying again.';
        else if (res.status >= 500) friendlyMessage = 'The server is temporarily unavailable. Please try again in a moment.';

        throw {
          status: 'error',
          message: friendlyMessage,
          statusCode: res.status,
        } as ApiError;
      }
    }

    if (!res.ok) {
      if (res.status === 413) {
        throw {
          status: 'error',
          message: 'Upload payload too large (exceeds server limit). Please select a smaller photo or retry.',
          statusCode: 413,
        } as ApiError;
      }
      let defaultError = 'Something went wrong. Please try again.';
      if (res.status === 404) defaultError = 'The requested item or page could not be found.';
      else if (res.status === 403) defaultError = 'You do not have permission to do this.';
      else if (res.status === 401) defaultError = 'Please log in to continue.';
      else if (res.status === 429) defaultError = 'Too many attempts. Please wait a moment before trying again.';
      else if (res.status >= 500) defaultError = 'The server is temporarily unavailable. Please try again in a moment.';

      throw {
        status: 'error',
        message: json?.message || defaultError,
        statusCode: res.status,
      } as ApiError;
    }

    return json as ApiResponse<T>;
  } catch (err: any) {
    // If it's already an ApiError with a non-zero statusCode, pass it through directly
    if (err && typeof err.statusCode === 'number' && err.statusCode > 0) {
      throw err;
    }

    // If it is a genuine network error / abort / connection failure, retry if attempts remain
    const isNetworkError =
      (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) ||
      err?.name === 'AbortError' ||
      (typeof err?.message === 'string' && (err.message.includes('network') || err.message.includes('abort')));

    if (isNetworkError && retries > 0) {
      const delayMs = (3 - retries) * 1200;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return request<T>(method, endpoint, body, { ...options, retries: retries - 1 });
    }

    // Network error — server unreachable or booting up
    if (isNetworkError) {
      console.error('[API Network Error]', {
        url,
        method,
        error: err?.message || err,
        configuredBaseUrl: API_BASE_URL
      });
      throw {
        status: 'error',
        message: 'Unable to connect to TradeLink. Please check your internet connection and try again.',
        statusCode: 0,
      } as ApiError;
    }
    throw err;
  }
}

// Public API methods
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, options?: { skipAuth?: boolean; headers?: Record<string, string> }) =>
    request<T>('GET', endpoint, params, options),

  post: <T = any>(endpoint: string, body?: any, options?: { skipAuth?: boolean; headers?: Record<string, string> }) =>
    request<T>('POST', endpoint, body, options),

  put: <T = any>(endpoint: string, body?: any, options?: { skipAuth?: boolean; headers?: Record<string, string> }) =>
    request<T>('PUT', endpoint, body, options),

  patch: <T = any>(endpoint: string, body?: any, options?: { skipAuth?: boolean; headers?: Record<string, string> }) =>
    request<T>('PATCH', endpoint, body, options),

  delete: <T = any>(endpoint: string, options?: { skipAuth?: boolean; headers?: Record<string, string> }) =>
    request<T>('DELETE', endpoint, undefined, options),
};

// Upload helper (multipart/form-data, streamed to Cloudinary / storage service)
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

  const xsrfToken = getCsrfToken();
  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
    headers['X-CSRF-Token'] = xsrfToken;
  }

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include'
  });

  const json = await res.json();
  if (!res.ok) {
    throw { status: 'error', message: json.message || 'Upload failed', statusCode: res.status };
  }

  return json.data;
}

export type { ApiResponse, ApiError };

/**
 * Sanitizes external media URLs to prevent SSRF and untrusted third-party asset loading
 */
export function sanitizeMediaUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const trusted = [
    'https://res.cloudinary.com',
    'https://images.unsplash.com',
    'https://tradelink-backend.vercel.app',
    'data:image/'
  ];
  if (trusted.some((domain) => trimmed.startsWith(domain))) return trimmed;
  if (import.meta.env.DEV && (trimmed.startsWith('http://localhost:') || trimmed.startsWith('http://127.0.0.1:'))) {
    return trimmed;
  }
  return '';
}
