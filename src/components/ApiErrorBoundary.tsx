'use client';

import { Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiErrorFallback } from './ErrorFallback';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('ApiErrorBoundary caught an error:', error, errorInfo);

    // Check if error is retryable
    const isRetryable = this.isRetryableError(error);
    if (!isRetryable) {
      console.error('Non-retryable error occurred:', error.message);
    }
  }

  isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /fetch/i,
      /network/i,
      /timeout/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /502/i,
      /503/i,
      /504/i,
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: null });
    } else {
      console.error('Max retries reached for ApiErrorBoundary');
    }
  };

  handleReset = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default API error UI
      return (
        <ApiErrorFallback
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use in client components
export function useApiErrorHandler() {
  const handleApiError = (error: Error, context?: string) => {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

    // Determine error type for appropriate handling
    const isNetworkError = error.message.includes('fetch') ||
                          error.message.includes('network') ||
                          error.message.includes('ECONNREFUSED');

    const isServerError = error.message.includes('500') ||
                         error.message.includes('502') ||
                         error.message.includes('503');

    return {
      isNetworkError,
      isServerError,
      isRetryable: isNetworkError || isServerError,
      canRecover: !error.message.includes('400') && !error.message.includes('401'),
    };
  };

  return { handleApiError };
}
