'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  error: Error | string | null;
  onRetry?: () => void | Promise<void>;
  title?: string;
  className?: string;
}

// Map common error patterns to user-friendly messages
function getFriendlyErrorMessage(error: Error | string): string {
  const errorMsg = typeof error === 'string' ? error : error.message;
  const lowerMsg = errorMsg.toLowerCase();

  // Network errors - connection failed
  if (lowerMsg.includes('fetch') || 
      lowerMsg.includes('network') || 
      lowerMsg.includes('econnreset') ||
      lowerMsg.includes('connection to server lost') ||
      lowerMsg.includes('failed to fetch')) {
    return 'Connection failed. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (lowerMsg.includes('timeout') || 
      lowerMsg.includes('aborted') ||
      lowerMsg.includes('request timed out')) {
    return 'Request timed out. The service is taking too long to respond. Please try again.';
  }

  // Server errors
  if (lowerMsg.includes('500') || 
      lowerMsg.includes('internal server error') ||
      lowerMsg.includes('something went wrong')) {
    return 'Server error occurred. Please try again in a few moments.';
  }

  // Authentication errors
  if (lowerMsg.includes('401') || 
      lowerMsg.includes('unauthorized') || 
      lowerMsg.includes('session expired')) {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  // Rate limiting
  if (lowerMsg.includes('429') || 
      lowerMsg.includes('rate limit') || 
      lowerMsg.includes('too many requests')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  // API quota errors
  if (lowerMsg.includes('quota') || 
      lowerMsg.includes('resource_exhausted') ||
      lowerMsg.includes('api quota exceeded')) {
    return 'API quota exceeded. Please try again later or contact support.';
  }

  // AI Model specific errors
  if (lowerMsg.includes('failed to parse') || lowerMsg.includes('parse model response')) {
    return 'AI model response could not be processed. Please try again.';
  }

  if (lowerMsg.includes('missing api key')) {
    return 'AI service is temporarily unavailable. Please try again later.';
  }

  // Validation errors
  if (lowerMsg.includes('invalid') || lowerMsg.includes('required')) {
    return errorMsg; // Return the specific validation error
  }

  // Wallet/Web3 errors
  if (lowerMsg.includes('user rejected') || lowerMsg.includes('user denied')) {
    return 'Transaction was cancelled. You rejected the request in your wallet.';
  }

  if (lowerMsg.includes('insufficient funds') || lowerMsg.includes('insufficient balance')) {
    return 'Insufficient funds in your wallet to complete this transaction.';
  }

  // Generic fallback
  return 'Something went wrong. Please try again.';
}

export function ErrorMessage({ error, onRetry, title = 'Error', className }: ErrorMessageProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!error) {
    return null;
  }

  const friendlyMessage = getFriendlyErrorMessage(error);

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      // Error will be handled by parent component
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-red-600 dark:text-red-400">{title}</CardTitle>
        </div>
        <CardDescription className="text-red-600 dark:text-red-400">
          {friendlyMessage}
        </CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant="outline"
            className="w-full"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
