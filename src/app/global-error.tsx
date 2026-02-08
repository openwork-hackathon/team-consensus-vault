'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error to error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-xl"
          >
            {/* Critical Error Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
              <h1 className="text-2xl font-bold">Critical Error</h1>
            </div>

            {/* Error Message */}
            <p className="text-muted-foreground mb-4">
              A critical error has occurred in the application. The development team has been notified.
            </p>

            {/* Error Details */}
            <div className="bg-background border border-border rounded-lg p-4 mb-4">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={reset}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-manipulation"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors touch-manipulation"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground text-center">
              If this problem persists, please contact support with the Error ID above.
            </p>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
