'use client';

import { motion } from 'framer-motion';

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
  retry?: () => void;
  title?: string;
  message?: string;
  className?: string;
}

export default function ErrorFallback({
  error,
  reset,
  retry,
  title,
  message,
  className = '',
}: ErrorFallbackProps) {
  // Determine error type for appropriate messaging
  const isNetworkError = error?.message?.includes('fetch') || 
                         error?.message?.includes('network') ||
                         error?.message?.includes('ECONNREFUSED');
  
  const isServerError = error?.message?.includes('500') ||
                        error?.message?.includes('502') ||
                        error?.message?.includes('503');

  const displayTitle = title || (isNetworkError ? 'Connection Error' : isServerError ? 'Server Error' : 'Something went wrong');
  
  const displayMessage = message || (isNetworkError 
    ? 'Unable to connect to the server. Please check your internet connection and try again.'
    : isServerError
    ? 'Our servers are experiencing issues. Please try again in a moment.'
    : error?.message || 'An unexpected error occurred. Please try again.');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
    >
      {/* Error Icon */}
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">{isNetworkError ? '📡' : isServerError ? '🖥️' : '⚠️'}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {displayTitle}
      </h3>

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {displayMessage}
      </p>

      {/* Error details (collapsible in production) */}
      {error && process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-muted rounded-lg text-left max-w-md w-full">
          <p className="text-xs font-mono text-muted-foreground break-all">
            {error.stack || error.message}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        )}
        {reset && (
          <button
            onClick={reset}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Network error specific fallback
export function NetworkErrorFallback({ retry, className = '' }: { retry?: () => void; className?: string }) {
  return (
    <ErrorFallback
      title="Network Connection Lost"
      message="Unable to connect to the server. Please check your internet connection and try again."
      retry={retry}
      className={className}
    />
  );
}

// API error specific fallback
export function ApiErrorFallback({ 
  statusCode, 
  retry, 
  className = '' 
}: { 
  statusCode?: number; 
  retry?: () => void; 
  className?: string;
}) {
  const messages: Record<number, string> = {
    400: 'Bad request. Please check your input and try again.',
    401: 'Authentication required. Please sign in.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested resource was not found.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Internal server error. Please try again later.',
    502: 'Service temporarily unavailable. Please try again.',
    503: 'Service under maintenance. Please check back soon.',
  };

  return (
    <ErrorFallback
      title={statusCode ? `Error ${statusCode}` : 'API Error'}
      message={statusCode ? messages[statusCode] || 'An error occurred while fetching data.' : 'Failed to load data.'}
      retry={retry}
      className={className}
    />
  );
}

// Empty state fallback
export function EmptyStateFallback({
  title = 'No data available',
  message = 'There is no data to display at this time.',
  icon,
  action,
  className = '',
}: {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {action}
    </motion.div>
  );
}
