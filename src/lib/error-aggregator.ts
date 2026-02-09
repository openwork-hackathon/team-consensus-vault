/**
 * Error aggregation and deduplication utility
 *
 * Prevents overwhelming users with duplicate error notifications
 * by tracking, aggregating, and deduplicating errors across models.
 */

import type { UserFacingError } from './types';

interface ErrorOccurrence {
  error: UserFacingError;
  modelIds: string[];
  firstOccurrence: number;
  lastOccurrence: number;
  count: number;
}

export class ErrorAggregator {
  private errorMap: Map<string, ErrorOccurrence> = new Map();
  private readonly dedupWindow: number; // milliseconds

  constructor(dedupWindowMs: number = 5000) {
    this.dedupWindow = dedupWindowMs;
  }

  /**
   * Add an error to the aggregator
   * @returns true if this is a new/unique error, false if deduplicated
   */
  add(error: UserFacingError, modelId: string): boolean {
    const now = Date.now();
    const key = this.getErrorKey(error);

    const existing = this.errorMap.get(key);

    if (existing && (now - existing.lastOccurrence) < this.dedupWindow) {
      // Dedup: update existing error
      existing.modelIds.push(modelId);
      existing.lastOccurrence = now;
      existing.count++;
      return false;
    } else {
      // New error or outside dedup window
      this.errorMap.set(key, {
        error,
        modelIds: [modelId],
        firstOccurrence: now,
        lastOccurrence: now,
        count: 1,
      });

      // Cleanup old entries
      this.cleanup(now);
      return true;
    }
  }

  /**
   * Get aggregated error summary
   */
  getSummary(errorKey: string): ErrorOccurrence | undefined {
    return this.errorMap.get(errorKey);
  }

  /**
   * Get all current aggregated errors
   */
  getAllErrors(): ErrorOccurrence[] {
    return Array.from(this.errorMap.values());
  }

  /**
   * Create a user-friendly error key for deduplication
   */
  private getErrorKey(error: UserFacingError): string {
    // Group errors by type and severity for deduplication
    return `${error.type}_${error.severity}`;
  }

  /**
   * Clean up old error entries outside the dedup window
   */
  private cleanup(now: number) {
    for (const [key, occurrence] of this.errorMap.entries()) {
      if (now - occurrence.lastOccurrence > this.dedupWindow * 2) {
        this.errorMap.delete(key);
      }
    }
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errorMap.clear();
  }

  /**
   * Format aggregated error message
   */
  formatAggregatedMessage(errorKey: string): string | null {
    const occurrence = this.errorMap.get(errorKey);
    if (!occurrence) return null;

    const { error, modelIds, count } = occurrence;

    if (count === 1) {
      return error.message;
    } else if (modelIds.length === 1) {
      return `${error.message} (occurred ${count} times)`;
    } else {
      return `${error.message} (${modelIds.length} models affected)`;
    }
  }
}

/**
 * Singleton instance for global error aggregation
 */
export const globalErrorAggregator = new ErrorAggregator(5000);

/**
 * Check if error should trigger a toast notification
 * (based on type and retryability)
 */
export function shouldShowToastForError(error: UserFacingError): boolean {
  // Show toasts for transient, retryable errors
  const toastableTypes = [
    'rate_limit',
    'timeout',
    'network',
    'api_error',
  ];

  return error.retryable && toastableTypes.includes(error.type);
}

/**
 * Get toast type from error severity
 */
export function getToastTypeFromError(error: UserFacingError): 'error' | 'warning' | 'info' {
  if (error.severity === 'critical') {
    return 'error';
  }
  return 'warning';
}
