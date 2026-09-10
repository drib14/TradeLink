// Admin Portal API Client
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
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
