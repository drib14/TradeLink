// useApi hook — tries API first, falls back to seed data when backend is unreachable
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  fallbackData: T,
  options: { immediate?: boolean } = {}
): UseApiResult<T> {
  const { immediate = true } = options;
  const [data, setData] = useState<T>(fallbackData);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setIsOffline(false);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const isNetworkError = err?.statusCode === 0 || err?.message?.includes('offline') || err?.message?.includes('unreachable');
        setIsOffline(isNetworkError);
        setError(err?.message || 'Failed to fetch data');
        // Keep fallback data when offline
        if (isNetworkError) {
          setData(fallbackData);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, fallbackData]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      refetch();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, refetch]);

  return { data, isLoading, error, isOffline, refetch };
}

// Standalone offline check
export async function isBackendReachable(): Promise<boolean> {
  try {
    // Match the centralized API client: use the same-origin /api route so
    // local requests pass through Vite's proxy instead of bypassing it.
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    const baseUrl = configuredBaseUrl
      ? configuredBaseUrl.replace(/\/+$/, '')
      : '/api';
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
