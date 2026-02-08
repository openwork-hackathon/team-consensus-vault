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
    <html lang="en">
      <head>
        <title>Critical Error - Consensus Vault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        `}</style>
      </head>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-xl"
            role="alert"
            aria-live="assertive"
          >
            {/* Critical Error Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl" aria-hidden="true">🚨</span>
              </div>
              <h1 className="text-2xl font-bold">Critical Error</h1>
            </div>

            {/* Error Message */}
            <p className="text-muted-foreground mb-6">
              A critical error has occurred in the application. The development team has been notified.
            </p>

            {/* Error ID for support reference */}
            {error.digest && (
              <div className="bg-background border border-border rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">Error Reference</p>
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {error.digest}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Please provide this ID when contacting support.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={reset}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-manipulation flex items-center justify-center gap-2 min-h-[44px]"
                aria-label="Try to recover from the critical error"
              >
                <span aria-hidden="true">↻</span>
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors touch-manipulation flex items-center justify-center gap-2 min-h-[44px]"
                aria-label="Reload the entire application"
              >
                <span aria-hidden="true">🔄</span>
                <span>Reload Application</span>
              </button>
            </div>

            {/* Help Text */}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground text-center mb-2">
                If this problem persists, please:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Contact support with the Error Reference above</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Try accessing the application from a different browser</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true">•</span>
                  <span>Clear your browser cache and cookies</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
