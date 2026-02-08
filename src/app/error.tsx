'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  // Determine error type for user-friendly messaging
  const isNetworkError = error?.message?.includes('fetch') || 
                         error?.message?.includes('network') ||
                         error?.message?.includes('ECONNREFUSED');
  
  const isServerError = error?.message?.includes('500') ||
                        error?.message?.includes('502') ||
                        error?.message?.includes('503');

  const errorTitle = isNetworkError ? 'Connection Error' : 
                     isServerError ? 'Server Error' : 
                     'Something went wrong';

  const errorMessage = isNetworkError 
    ? 'Unable to connect to the server. Please check your internet connection and try again.'
    : isServerError
    ? 'Our servers are experiencing issues. Please try again in a moment.'
    : 'The application encountered an unexpected error. Don\'t worry, your data is safe.';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-xl"
        role="alert"
        aria-live="polite"
      >
        {/* Error Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-bearish/20 rounded-full flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">
              {isNetworkError ? '📡' : isServerError ? '🖥️' : '⚠️'}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{errorTitle}</h1>
        </div>

        {/* Error Message */}
        <p className="text-muted-foreground mb-6">
          {errorMessage}
        </p>

        {/* Error ID for support reference (only show digest, not raw error) */}
        {error.digest && (
          <div className="bg-background border border-border rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-1">Error Reference</p>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.digest}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Please provide this ID if contacting support.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-manipulation flex items-center justify-center gap-2 min-h-[44px]"
            aria-label="Try to recover from the error"
          >
            <span aria-hidden="true">↻</span>
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors touch-manipulation flex items-center justify-center gap-2 min-h-[44px]"
            aria-label="Go back to home page"
          >
            <span aria-hidden="true">🏠</span>
            <span>Go Home</span>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground text-center">
            If this problem persists, try:
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li className="flex items-center gap-2">
              <span aria-hidden="true">•</span>
              <span>Refreshing the page</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">•</span>
              <span>Checking your internet connection</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">•</span>
              <span>Clearing your browser cache</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
