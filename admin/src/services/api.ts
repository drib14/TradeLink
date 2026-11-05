// Admin Portal API Client
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3001/api`;
    }
    // In live production: target the live TradeLink backend
    return 'https://tradelink-backend.vercel.app/api';
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

// Token storage (Strictly in-memory for security against XSS; persistence via HttpOnly cookie)
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

export async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(`${API_BASE_URL}/admin-auth/refresh-token`, {
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
    sessionStorage.setItem('tradelink_admin_csrf_token', token);
  } catch {}
}

export function getCsrfToken(): string | null {
  if (memoryCsrfToken) return memoryCsrfToken;
  try {
    const saved = sessionStorage.getItem('tradelink_admin_csrf_token');
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

if (typeof window !== 'undefined') {
  ensureCsrfToken().catch(() => {});
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
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
  } else if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);
  const respCsrf = res.headers.get('x-csrf-token') || res.headers.get('x-xsrf-token');
  if (respCsrf) {
    setCsrfToken(respCsrf);
  }

  const json = await res.json();

  if (!res.ok) {
    throw {
      status: 'error',
      message: json.message || `Request failed with status ${res.status}`,
      statusCode: res.status,
    };
  }

  return json as ApiResponse<T>;
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => request<T>('GET', endpoint, params),
  post: <T = any>(endpoint: string, body?: any) => request<T>('POST', endpoint, body),
  put: <T = any>(endpoint: string, body?: any) => request<T>('PUT', endpoint, body),
  patch: <T = any>(endpoint: string, body?: any) => request<T>('PATCH', endpoint, body),
  delete: <T = any>(endpoint: string) => request<T>('DELETE', endpoint),
};
