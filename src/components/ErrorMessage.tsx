'use client';

import { motion } from 'framer-motion';
import { UserFacingError } from '@/lib/types';

interface ErrorMessageProps {
  error: UserFacingError | string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
}

export default function ErrorMessage({ 
  error, 
  onRetry, 
  isRetrying = false,
  compact = false 
}: ErrorMessageProps) {
  const userError = typeof error === 'string' 
    ? {
        type: 'unknown',
        message: error,
        severity: 'warning' as const,
        recoveryGuidance: '',
        retryable: !!onRetry,
      }
    : error;

  const severityColors = {
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
    critical: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  };

  const icon = userError.severity === 'critical' ? '🚨' : '⚠️';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${severityColors[userError.severity]}`}
      >
        <span className="text-sm">{icon}</span>
        <p className="text-xs flex-1">{userError.message}</p>
        {onRetry && userError.retryable && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="text-xs font-medium underline hover:no-underline disabled:opacity-50"
            aria-label="Retry operation"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 space-y-3 ${severityColors[userError.severity]}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header with icon and message */}
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{userError.message}</p>
          {userError.type && (
            <p className="text-xs opacity-70 mt-0.5">
              Error type: {userError.type}
            </p>
          )}
        </div>
      </div>

      {/* Recovery guidance */}
      {userError.recoveryGuidance && (
        <div className="flex items-start gap-2 pl-7">
          <span className="text-sm">💡</span>
          <p className="text-xs flex-1">{userError.recoveryGuidance}</p>
        </div>
      )}

      {/* Estimated wait time */}
      {userError.estimatedWaitTime && (
        <div className="flex items-start gap-2 pl-7">
          <span className="text-sm">⏱️</span>
          <p className="text-xs flex-1">
            Estimated wait: {Math.round(userError.estimatedWaitTime / 1000)} seconds
          </p>
        </div>
      )}

      {/* Retry button */}
      {onRetry && userError.retryable && (
        <div className="pl-7 pt-2">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="px-4 py-2 bg-current text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            aria-label="Retry failed operation"
          >
            {isRetrying ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
                Retrying...
              </>
            ) : (
              <>
                <span>🔄</span>
                Try Again
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
