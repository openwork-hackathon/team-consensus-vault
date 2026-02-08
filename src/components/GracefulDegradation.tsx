'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface GracefulDegradationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  retry?: () => void;
  serviceName?: string;
}

interface FallbackState {
  mode: 'loading' | 'error' | 'degraded' | 'offline';
  message: string;
}

export function GracefulDegradation({
  children,
  fallback,
  isLoading = false,
  error = null,
  retry,
  serviceName = 'AI Service',
}: GracefulDegradationProps) {
  const [fallbackState, setFallbackState] = useState<FallbackState>({
    mode: 'loading',
    message: '',
  });

  useEffect(() => {
    if (isLoading) {
      setFallbackState({
        mode: 'loading',
        message: `Connecting to ${serviceName}...`,
      });
    } else if (error) {
      // Determine the appropriate fallback mode based on error
      const isNetworkError = error.message.includes('fetch') ||
                            error.message.includes('network') ||
                            error.message.includes('timeout');

      const isRateLimited = error.message.includes('429');

      if (isNetworkError) {
        setFallbackState({
          mode: 'offline',
          message: `${serviceName} is currently unavailable. Using cached data.`,
        });
      } else if (isRateLimited) {
        setFallbackState({
          mode: 'degraded',
          message: `${serviceName} is rate limited. Some features may be limited.`,
        });
      } else {
        setFallbackState({
          mode: 'error',
          message: `${serviceName} encountered an error.`,
        });
      }
    } else {
      setFallbackState({
        mode: 'loading',
        message: '',
      });
    }
  }, [isLoading, error, serviceName]);

  // If no error and not loading, render children normally
  if (!isLoading && !error) {
    return <>{children}</>;
  }

  // Use custom fallback if provided
  if (fallback && (isLoading || error)) {
    return <>{fallback}</>;
  }

  // Render appropriate fallback UI based on state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      {fallbackState.mode === 'loading' && (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">{fallbackState.message}</span>
        </div>
      )}

      {fallbackState.mode === 'offline' && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Service Unavailable</p>
            <p className="text-xs text-muted-foreground mb-2">{fallbackState.message}</p>
            {retry && (
              <button
                onClick={retry}
                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {fallbackState.mode === 'degraded' && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm">ℹ️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Limited Service</p>
            <p className="text-xs text-muted-foreground">{fallbackState.message}</p>
          </div>
        </div>
      )}

      {fallbackState.mode === 'error' && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm">✕</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Error</p>
            <p className="text-xs text-muted-foreground mb-2">{fallbackState.message}</p>
            {retry && (
              <button
                onClick={retry}
                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Component for AI analyst card degradation
export function AnalystCardFallback({ analystName }: { analystName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-xl p-4 opacity-60"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
          <span className="text-lg">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold text-sm">{analystName}</h3>
          <p className="text-xs text-muted-foreground">Unavailable</p>
        </div>
      </div>
      <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground">
        Unable to fetch analysis. Service may be temporarily unavailable.
      </div>
    </motion.div>
  );
}

// Component for consensus meter degradation
export function ConsensusMeterFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="font-semibold mb-2">Consensus Unavailable</h3>
        <p className="text-sm text-muted-foreground">
          Unable to calculate consensus. Some AI analysts may be unavailable.
        </p>
      </div>
    </motion.div>
  );
}

// Component for trade signal degradation
export function TradeSignalFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📈</span>
        </div>
        <h3 className="font-semibold mb-2">Signal Unavailable</h3>
        <p className="text-sm text-muted-foreground">
          Unable to generate trade signal. Please check back in a moment.
        </p>
      </div>
    </motion.div>
  );
}

// Hook to manage graceful degradation state
export function useGracefulDegradation(serviceName: string) {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: Error | null;
    retryCount: number;
  }>({
    isLoading: false,
    error: null,
    retryCount: 0,
  });

  const executeWithFallback = async <T,>(
    fn: () => Promise<T>,
    fallbackValue: T,
    maxRetries = 3
  ): Promise<T> => {
    setState({ isLoading: true, error: null, retryCount: state.retryCount });

    try {
      const result = await fn();
      setState({ isLoading: false, error: null, retryCount: 0 });
      return result;
    } catch (error) {
      const err = error as Error;

      if (state.retryCount < maxRetries) {
        setState(prev => ({ isLoading: false, error: err, retryCount: prev.retryCount + 1 }));
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 1000 * state.retryCount));
        return executeWithFallback(fn, fallbackValue, maxRetries);
      }

      setState({ isLoading: false, error: err, retryCount: state.retryCount });
      return fallbackValue;
    }
  };

  const retry = () => {
    setState({ isLoading: true, error: null, retryCount: 0 });
  };

  return {
    isLoading: state.isLoading,
    error: state.error,
    retryCount: state.retryCount,
    executeWithFallback,
    retry,
  };
}
