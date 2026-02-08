'use client';

import { useCallback } from 'react';
import { ToastData } from '@/components/ToastContainer';

interface UseApiErrorOptions {
  showToast?: (message: string, type: ToastData['type']) => void;
  onError?: (error: Error) => void;
}

interface ApiErrorHandling {
  handleError: (error: Error, context?: string) => void;
  handleNetworkError: (context?: string) => void;
  handleServerError: (statusCode?: number, context?: string) => void;
  handleRateLimit: (context?: string) => void;
  isRetryable: (error: Error) => boolean;
}

export function useApiError(options: UseApiErrorOptions = {}): ApiErrorHandling {
  const { showToast, onError } = options;

  const handleNetworkError = useCallback((context?: string) => {
    const message = context
      ? `Network error while ${context}. Please check your connection.`
      : 'Network error. Please check your connection.';
    showToast?.(message, 'error');
  }, [showToast]);

  const handleServerError = useCallback((statusCode?: number, context?: string) => {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please sign in.',
      403: 'You do not have permission to access this resource.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please wait a moment.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service under maintenance.',
    };

    const message = statusCode
      ? messages[statusCode] || `Server error (${statusCode}). Please try again.`
      : 'Server error. Please try again later.';

    showToast?.(message, 'error');
  }, [showToast]);

  const handleRateLimit = useCallback((context?: string) => {
    const message = context
      ? `Rate limited while ${context}. Please wait a moment.`
      : 'Too many requests. Please wait a moment.';
    showToast?.(message, 'warning');
  }, [showToast]);

  const handleError = useCallback((error: Error, context?: string) => {
    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }

    // Log error for debugging
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

    // Determine error type and show appropriate toast
    if (error.message.includes('fetch') || error.message.includes('network')) {
      handleNetworkError(context);
    } else if (error.message.includes('429')) {
      handleRateLimit(context);
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      handleServerError(undefined, context);
    } else {
      // Generic error
      showToast?.(
        error.message || 'An unexpected error occurred',
        'error'
      );
    }
  }, [showToast, onError, handleNetworkError, handleServerError, handleRateLimit]);

  const isRetryable = useCallback((error: Error): boolean => {
    const retryablePatterns = [
      /fetch/i,
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /502/i,
      /503/i,
      /504/i,
      /429/i,
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }, []);

  return {
    handleError,
    handleNetworkError,
    handleServerError,
    handleRateLimit,
    isRetryable,
  };
}

// Hook for handling API calls with automatic error handling
export function useApiCall<T = any>(
  options: UseApiErrorOptions = {}
) {
  const { handleError } = useApiError(options);

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError]);

  return { execute };
}
