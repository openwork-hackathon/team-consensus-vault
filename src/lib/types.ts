export type Sentiment = 'bullish' | 'bearish' | 'neutral';

// Error severity levels for UI styling
export type ErrorSeverity = 'warning' | 'critical';

// Enhanced error types for better user feedback
export interface UserFacingError {
  type: string;
  message: string;
  severity: ErrorSeverity;
  recoveryGuidance: string;
  retryable: boolean;
  modelId?: string;
  estimatedWaitTime?: number; // For rate limiting, timeouts, etc.
  isProxyError?: boolean; // Flag for proxy-related errors
}

// Progress update types for slow models
export interface ProgressUpdate {
  modelId: string;
  status: 'processing' | 'slow' | 'completed' | 'failed';
  message: string;
  elapsedTime: number; // milliseconds
  estimatedRemainingTime?: number; // milliseconds
}

export interface Analyst {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  avatar: string;
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
  isTyping: boolean;
  error?: string;
  // Enhanced error handling
  userFacingError?: UserFacingError;
  progress?: ProgressUpdate;
}

export interface ConsensusData {
  consensusLevel: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | null;
  threshold: number;
  analysts: Analyst[];
  // Enhanced consensus with partial failure info
  partialFailures?: {
    failedModels: string[];
    failedCount: number;
    successCount: number;
    errorSummary: string;
    aggregatedError?: UserFacingError; // Aggregated error details for display
  };
}
