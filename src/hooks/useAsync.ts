'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  retry: () => void;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const { onSuccess, onError, retryCount = 3, retryDelay = 1000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const argsRef = useRef<any[]>([]);
  const retryAttemptRef = useRef(0);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    argsRef.current = args;
    retryAttemptRef.current = 0;
    
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    const attemptExecution = async (): Promise<T | null> => {
      try {
        const result = await asyncFunction(...args);
        
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          onSuccess?.(result);
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        // Check if we should retry
        if (retryAttemptRef.current < retryCount) {
          retryAttemptRef.current++;
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, retryAttemptRef.current - 1);
          
          if (isMountedRef.current) {
            // Don't set error yet, we're retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptExecution();
          }
        }
        
        if (isMountedRef.current) {
          setError(error);
          setLoading(false);
          onError?.(error);
        }
        
        return null;
      }
    };

    return attemptExecution();
  }, [asyncFunction, onSuccess, onError, retryCount, retryDelay]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    retryAttemptRef.current = 0;
    argsRef.current = [];
  }, []);

  const retry = useCallback(() => {
    if (argsRef.current.length > 0) {
      retryAttemptRef.current = 0;
      execute(...argsRef.current);
    }
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
  };
}

// Hook for API calls with automatic retry
export function useApiCall<T = any>(
  url: string,
  options?: RequestInit & UseAsyncOptions
) {
  const { onSuccess, onError, retryCount, retryDelay, ...fetchOptions } = options || {};

  const fetchFn = useCallback(async () => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    return response.json() as Promise<T>;
  }, [url, fetchOptions]);

  return useAsync<T>(fetchFn, { onSuccess, onError, retryCount, retryDelay });
}

// Hook for polling data
export function usePolling<T = any>(
  asyncFunction: () => Promise<T>,
  interval: number = 5000,
  options: { onError?: (error: Error) => void; enabled?: boolean } = {}
) {
  const { onError, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (loading) return; // Prevent overlapping calls
    
    setLoading(true);
    try {
      const result = await asyncFunction();
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [asyncFunction, loading, onError]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Set up polling
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
}
