/**
 * Custom hook for error-aware toast notifications
 *
 * Integrates with error aggregator to prevent duplicate notifications
 * and provide context-aware toast messages for consensus engine errors.
 */

import { useState, useCallback, useRef } from 'react';
import type { ToastData } from '@/components/ToastContainer';
import type { UserFacingError } from '@/lib/types';
import {
  globalErrorAggregator,
  shouldShowToastForError,
  getToastTypeFromError,
} from '@/lib/error-aggregator';

export function useErrorToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdCounter = useRef(0);

  const addToast = useCallback((message: string, type: ToastData['type'], duration?: number) => {
    const id = `toast-${Date.now()}-${toastIdCounter.current++}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Add error toast with deduplication
   * Returns true if toast was shown, false if deduplicated
   */
  const addErrorToast = useCallback((error: UserFacingError, modelId?: string) => {
    const model = modelId || error.modelId || 'unknown';

    // Check if this error should trigger a toast
    if (!shouldShowToastForError(error)) {
      return false;
    }

    // Add to aggregator for deduplication
    const isNewError = globalErrorAggregator.add(error, model);

    if (!isNewError) {
      // This is a duplicate error - don't show another toast
      return false;
    }

    // Create toast with aggregated message
    const errorKey = `${error.type}_${error.severity}`;
    const aggregatedMessage = globalErrorAggregator.formatAggregatedMessage(errorKey) || error.message;

    const toastType = getToastTypeFromError(error);
    const duration = error.estimatedWaitTime
      ? Math.max(3000, Math.min(error.estimatedWaitTime, 10000))
      : 4000;

    addToast(aggregatedMessage, toastType, duration);
    return true;
  }, [addToast]);

  /**
   * Add success toast
   */
  const addSuccessToast = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  /**
   * Add info toast
   */
  const addInfoToast = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  /**
   * Add warning toast
   */
  const addWarningToast = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
    globalErrorAggregator.clear();
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    addErrorToast,
    addSuccessToast,
    addInfoToast,
    addWarningToast,
    clearToasts,
  };
}
