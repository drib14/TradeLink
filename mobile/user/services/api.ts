import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// In Android emulator localhost is 10.0.2.2, for iOS simulator or web it's localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST;

const ACCESS_TOKEN_KEY = 'tradelink_mobile_access_token';
const REFRESH_TOKEN_KEY = 'tradelink_mobile_refresh_token';

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

// Secure storage helpers with web fallback
async function secureSet(key: string, value: string | null) {
  try {
    if (Platform.OS === 'web') {
      if (value) {
        await AsyncStorage.setItem(key, value);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } else {
      if (value) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    }
  } catch {
    // Fallback to AsyncStorage if SecureStore fails
    if (value) {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    }
    const val = await SecureStore.getItemAsync(key);
    return val || (await AsyncStorage.getItem(key));
  } catch {
    return await AsyncStorage.getItem(key).catch(() => null);
  }
}

export async function setMobileTokens(accessToken: string | null, refreshToken?: string | null) {
  cachedAccessToken = accessToken;
  await secureSet(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken !== undefined) {
    cachedRefreshToken = refreshToken;
    await secureSet(REFRESH_TOKEN_KEY, refreshToken);
  }
}

// Backward compatibility alias
export async function setMobileAccessToken(token: string | null) {
  return setMobileTokens(token);
}

export async function getMobileAccessToken(): Promise<string | null> {
  if (cachedAccessToken) return cachedAccessToken;
  cachedAccessToken = await secureGet(ACCESS_TOKEN_KEY);
  return cachedAccessToken;
}

export async function getMobileRefreshToken(): Promise<string | null> {
  if (cachedRefreshToken) return cachedRefreshToken;
  cachedRefreshToken = await secureGet(REFRESH_TOKEN_KEY);
  return cachedRefreshToken;
}

export async function clearMobileTokens() {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  await secureSet(ACCESS_TOKEN_KEY, null);
  await secureSet(REFRESH_TOKEN_KEY, null);
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MobileApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

export async function mobileRequest<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  isRetry = false
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
    const json = await res.json().catch(() => ({}));

    // Handle 401 Unauthorized with automatic refresh token rotation
    if (res.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
      const refreshToken = await getMobileRefreshToken();
      if (!refreshToken) {
        await clearMobileTokens();
        throw {
          status: 'error',
          message: 'Your session has expired. Please log in again.',
          statusCode: 401,
        };
      }

      if (isRefreshing) {
        return new Promise<MobileApiResponse<T>>((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(mobileRequest<T>(method, endpoint, body, true)),
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshJson = await refreshRes.json().catch(() => ({}));

        if (!refreshRes.ok || !refreshJson.data?.accessToken) {
          throw new Error('Refresh token invalid or expired');
        }

        const newAccessToken = refreshJson.data.accessToken;
        const newRefreshToken = refreshJson.data.refreshToken || refreshToken;

        await setMobileTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        return await mobileRequest<T>(method, endpoint, body, true);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await clearMobileTokens();
        throw {
          status: 'error',
          message: 'Your session has expired. Please log in again.',
          statusCode: 401,
        };
      } finally {
        isRefreshing = false;
      }
    }

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
