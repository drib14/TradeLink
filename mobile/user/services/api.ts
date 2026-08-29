import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In Android emulator localhost is 10.0.2.2, for iOS simulator or web it's localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST;

const AUTH_TOKEN_KEY = 'tradelink_mobile_token';

let cachedToken: string | null = null;

export async function setMobileAccessToken(token: string | null) {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function getMobileAccessToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MobileApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export async function mobileRequest<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any
): Promise<MobileApiResponse<T>> {
  const token = await getMobileAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    method,
    headers,
  };

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

  try {
    const res = await fetch(url, config);
    const json = await res.json();

    if (!res.ok) {
      throw {
        status: 'error',
        message: json.message || `Request failed with status ${res.status}`,
        statusCode: res.status,
      };
    }

    return json as MobileApiResponse<T>;
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw {
      status: 'error',
      message: err.message || 'Cannot connect to TradeLink backend server.',
      statusCode: 0,
    };
  }
}

export const mobileApi = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => mobileRequest<T>('GET', endpoint, params),
  post: <T = any>(endpoint: string, body?: any) => mobileRequest<T>('POST', endpoint, body),
  put: <T = any>(endpoint: string, body?: any) => mobileRequest<T>('PUT', endpoint, body),
  patch: <T = any>(endpoint: string, body?: any) => mobileRequest<T>('PATCH', endpoint, body),
  delete: <T = any>(endpoint: string) => mobileRequest<T>('DELETE', endpoint),
};
