/**
 * Consensus Vault - Consensus Engine
 * Orchestrates 5 AI models in parallel for crypto analysis
 *
 * Features:
 * - Parallel execution of 5 AI models (DeepSeek, Kimi, MiniMax, Gemini, GLM)
 * - Automatic retry with exponential backoff (up to 3 retries)
 * - Rate limiting to prevent API throttling (1 req/sec per model)
 * - Timeout handling with configurable timeouts per model
 * - Performance metrics tracking (success rate, avg response time)
 * - Detailed error messages with context
 * - Robust JSON parsing with validation
 * - Resilient Promise.allSettled for parallel execution
 */

import {
  ANALYST_MODELS,
  FALLBACK_ORDER,
  ModelConfig,
  ModelResponse,
  AnalystResult,
  signalToSentiment,
  calculateConsensus,
  calculateConsensusDetailed,
  ConsensusResponse,
} from './models';
import type { UserFacingError, ProgressUpdate } from './types';
import { proxyFetch, isProxyConfigured, ProxyError, ProxyErrorType, isRetryableProxyError } from './proxy-fetch';
import { withAICaching, consensusDeduplicator, getPerformanceMetrics as getAIPerformanceMetrics, AI_CACHE_TTL } from './ai-cache';
import { recordTiming, recordCacheEvent } from './performance-metrics';

// Rate limiting - track last request time per model
const lastRequestTime: Record<string, number> = {};
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests per model

// Configurable timeout and retry settings
export const TIMEOUT_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds default
  MAX_TIMEOUT: 60000, // 60 seconds maximum
  MIN_TIMEOUT: 5000, // 5 seconds minimum
  RETRY_ATTEMPTS: 2, // Number of retries on failure
  RETRY_DELAY: 1000, // Delay between retries in ms
};

// Retry configuration with exponential backoff
const MAX_RETRIES = 2; // Reduced from 3 — fallbacks handle persistent failures
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_BACKOFF_MULTIPLIER = 2;

// Gemini API key rotation — supports GEMINI_API_KEYS (comma-separated) for pool rotation
let geminiKeyIndex = 0;

function getGeminiApiKey(): string {
  const pool = process.env.GEMINI_API_KEYS;
  if (pool) {
    const keys = pool.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) {
      return keys[geminiKeyIndex % keys.length];
    }
  }
  return process.env.GEMINI_API_KEY || '';
}

function rotateGeminiKey(): void {
  geminiKeyIndex++;
  const pool = process.env.GEMINI_API_KEYS;
  if (pool) {
    const keys = pool.split(',').filter(Boolean);
    console.log(`[gemini] Rotated to key index ${geminiKeyIndex % keys.length} of ${keys.length}`);
  }
}

// Enhanced error types for better error handling
export enum ConsensusErrorType {
  TIMEOUT = 'TIMEOUT',
  API_ERROR = 'API_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROXY_CONNECTION_ERROR = 'PROXY_CONNECTION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  QUOTA_WARNING = 'QUOTA_WARNING',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  CONTEXT_WINDOW_EXCEEDED = 'CONTEXT_WINDOW_EXCEEDED',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  MODEL_OVERLOADED = 'MODEL_OVERLOADED',
}

// Enhanced error with correlation ID for debugging
export class ConsensusError extends Error {
  public readonly correlationId: string;
  public readonly timestamp: Date;
  
  constructor(
    message: string,
    public type: ConsensusErrorType,
    public modelId?: string,
    public originalError?: unknown,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'ConsensusError';
    this.correlationId = generateCorrelationId();
    this.timestamp = new Date();
  }
}

// Generate unique correlation ID for request tracing
function generateCorrelationId(): string {
  return `cv-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Structured logger for consensus engine
class ConsensusLogger {
  private static instance: ConsensusLogger;
  private logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    correlationId?: string;
    metadata?: Record<string, any>;
  }> = [];

  static getInstance(): ConsensusLogger {
    if (!ConsensusLogger.instance) {
      ConsensusLogger.instance = new ConsensusLogger();
    }
    return ConsensusLogger.instance;
  }

  info(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.log('info', message, correlationId, metadata);
  }

  warn(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.log('warn', message, correlationId, metadata);
  }

  error(message: string, correlationId?: string, metadata?: Record<string, any>) {
    this.log('error', message, correlationId, metadata);
  }

  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ) {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      correlationId,
      metadata,
    };

    this.logs.push(logEntry);

    // Console output for development
    const timestamp = logEntry.timestamp.toISOString();
    const corrId = correlationId ? `[${correlationId}]` : '';
    console.log(`[${timestamp}] ${level.toUpperCase()} ${corrId} ${message}`, metadata || '');

    // Integration point for external logging services (Sentry, etc.)
    this.sendToExternalServices(level, message, correlationId, metadata);
  }

  private sendToExternalServices(
    level: 'info' | 'warn' | 'error',
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ) {
    // Sentry integration point
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const sentry = (window as any).Sentry;
      const extra = {
        correlationId,
        modelId: metadata?.modelId,
        timestamp: new Date().toISOString(),
        ...metadata,
      };

      if (level === 'error') {
        sentry.captureException(new Error(message), { extra });
      } else {
        sentry.captureMessage(message, level as any, { extra });
      }
    }

    // Additional logging services can be integrated here
    // e.g., LogRocket, Datadog, etc.
  }

  getLogs(correlationId?: string) {
    if (!correlationId) return this.logs;
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  clear() {
    this.logs = [];
  }
}

export const logger = ConsensusLogger.getInstance();

/**
 * Create user-facing error messages with recovery guidance
 *
 * Transforms internal ConsensusError objects into user-friendly messages
 * with actionable recovery steps and appropriate severity levels.
 * Includes retry countdown information for retryable errors.
 *
 * @param error - The internal ConsensusError to transform
 * @returns A UserFacingError with friendly message and recovery guidance
 *
 * @example
 * ```ts
 * const internalError = new ConsensusError('Rate limit', ConsensusErrorType.RATE_LIMIT, 'deepseek');
 * const userError = createUserFacingError(internalError);
 * // userError.message: "Rate limit exceeded - please wait before trying again"
 * // userError.retryable: true
 * // userError.estimatedWaitTime: 60000
 * // userError.retryCountdown: 60 (seconds)
 * // userError.retryAvailableAt: Date object
 * ```
 */
export function createUserFacingError(error: ConsensusError): UserFacingError {
  const { type, message, modelId, originalError } = error;

  switch (type) {
    case ConsensusErrorType.RATE_LIMIT:
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded - please wait before trying again',
        severity: 'warning',
        recoveryGuidance: 'Too many requests in a short period. Wait 60 seconds, then click "Analyze Again" to retry. To prevent this, space out your requests by at least 10 seconds.',
        retryable: true,
        modelId,
        estimatedWaitTime: 60000, // 60 seconds for clarity
        retryCountdown: 60, // Initial countdown in seconds
        retryAvailableAt: new Date(Date.now() + 60000),
      };

    case ConsensusErrorType.TIMEOUT:
      return {
        type: 'timeout',
        message: 'Request timed out - the model is taking longer than expected',
        severity: 'warning',
        recoveryGuidance: 'This AI model is experiencing high load. Wait 60 seconds, then click "Analyze Again" to retry. If this persists, the analysis will use fallback models automatically.',
        retryable: true,
        modelId,
        estimatedWaitTime: 60000,
        retryCountdown: 60,
        retryAvailableAt: new Date(Date.now() + 60000),
      };

    case ConsensusErrorType.NETWORK_ERROR:
      return {
        type: 'network',
        message: 'Network connection issue - unable to reach AI service',
        severity: 'warning',
        recoveryGuidance: 'Temporary network issue detected. The AI models are temporarily unavailable due to proxy connection problems. This usually resolves within 2-5 minutes. Click "Analyze Again" to retry with a fresh connection.',
        retryable: true,
        modelId,
        estimatedWaitTime: 180000, // Increased from 120s to 180s for proxy issues
        isProxyError: true,
        retryCountdown: 180,
        retryAvailableAt: new Date(Date.now() + 180000),
      };

    case ConsensusErrorType.PROXY_CONNECTION_ERROR:
      return {
        type: 'proxy_connection',
        message: 'AI proxy service connection failed',
        severity: 'warning',
        recoveryGuidance: 'The AI proxy service is temporarily unavailable. This is a network infrastructure issue that typically resolves within 2-5 minutes. Click "Analyze Again" to retry with a fresh connection.',
        retryable: true,
        modelId,
        estimatedWaitTime: 300000, // 5 minutes for proxy issues
        isProxyError: true,
        retryCountdown: 300,
        retryAvailableAt: new Date(Date.now() + 300000),
      };

    case ConsensusErrorType.AUTHENTICATION_ERROR:
      return {
        type: 'authentication',
        message: 'Authentication failed - API key invalid or expired',
        severity: 'critical',
        recoveryGuidance: 'This model\'s API credentials are invalid or have expired. The system will automatically attempt to refresh authentication. If this persists for more than 10 minutes, please report this issue with reference ID: ' + error.correlationId,
        retryable: false,
        modelId,
      };

    case ConsensusErrorType.QUOTA_EXCEEDED:
      return {
        type: 'quota_exceeded',
        message: 'API quota exhausted - service temporarily unavailable',
        severity: 'critical',
        recoveryGuidance: 'This model has reached its usage quota for today. The system will automatically use alternative models. Service will resume when quota resets (typically midnight UTC). You can continue using other models in the meantime.',
        retryable: false,
        modelId,
      };

    case ConsensusErrorType.QUOTA_WARNING:
      return {
        type: 'quota_warning',
        message: 'Approaching API quota limit',
        severity: 'warning',
        recoveryGuidance: 'This model is nearing its usage quota. Service may be limited soon. Consider using the analysis sparingly or waiting for quota reset (typically midnight UTC).',
        retryable: true,
        modelId,
        retryCountdown: 30,
        retryAvailableAt: new Date(Date.now() + 30000),
      };

    case ConsensusErrorType.MISSING_API_KEY:
      return {
        type: 'configuration',
        message: 'API configuration missing - service unavailable',
        severity: 'critical',
        recoveryGuidance: 'This model is not properly configured on the server. The system will automatically use alternative models. This typically resolves within 24 hours as configurations are updated. Reference ID: ' + error.correlationId,
        retryable: false,
        modelId,
      };

    case ConsensusErrorType.PARSE_ERROR:
      return {
        type: 'parse_error',
        message: 'Received invalid response format from model',
        severity: 'warning',
        recoveryGuidance: 'The AI model returned a response in an unexpected format. This is usually temporary. Click "Analyze Again" to retry immediately. The system automatically retries 2 times before failing.',
        retryable: true,
        modelId,
        retryCountdown: 5,
        retryAvailableAt: new Date(Date.now() + 5000),
      };

    case ConsensusErrorType.API_ERROR:
      if (originalError && typeof originalError === 'object' && 'message' in originalError) {
        const errorMsg = (originalError as { message?: string }).message || '';
        if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
          return {
            type: 'quota_exceeded',
            message: 'API quota exceeded - service temporarily unavailable',
            severity: 'critical',
            recoveryGuidance: 'This model has exceeded its usage quota. The system will automatically use alternative models. Service typically resumes at midnight UTC. You can continue with other models.',
            retryable: false,
            modelId,
          };
        }
      }
      return {
        type: 'api_error',
        message: 'Model service temporarily unavailable',
        severity: 'warning',
        recoveryGuidance: 'The AI service is experiencing issues. Wait 3-5 minutes, then click "Analyze Again". The system will automatically retry with backup models if available.',
        retryable: true,
        modelId,
        estimatedWaitTime: 240000, // 4 minutes
      };

    case ConsensusErrorType.INVALID_RESPONSE:
      return {
        type: 'invalid_response',
        message: 'Received empty or incomplete response from model',
        severity: 'warning',
        recoveryGuidance: 'The AI model returned an incomplete response. Click "Analyze Again" to retry. If this happens repeatedly, the system will automatically switch to a backup model.',
        retryable: true,
        modelId,
      };

    case ConsensusErrorType.VALIDATION_ERROR:
      return {
        type: 'validation_error',
        message: 'Data validation failed - received invalid analysis data',
        severity: 'warning',
        recoveryGuidance: 'The AI model returned data that failed quality checks. Click "Analyze Again" to retry. The system automatically validates all responses for accuracy and completeness.',
        retryable: true,
        modelId,
      };

    case ConsensusErrorType.CONFIGURATION_ERROR:
      return {
        type: 'configuration_error',
        message: 'Service configuration issue detected',
        severity: 'critical',
        recoveryGuidance: 'A server configuration problem was detected. The system will automatically use alternative models. This typically resolves within 24 hours. Reference ID: ' + error.correlationId,
        retryable: false,
        modelId,
      };

    case ConsensusErrorType.CACHE_ERROR:
      return {
        type: 'cache_error',
        message: 'Temporary data caching issue',
        severity: 'warning',
        recoveryGuidance: 'Problem accessing cached responses. This doesn\'t affect functionality but may slow down repeat requests. The system will retry automatically. Your request will complete normally.',
        retryable: true,
        modelId,
      };

    case ConsensusErrorType.GATEWAY_ERROR:
      const httpStatus = error.metadata?.httpStatus;
      if (httpStatus === 502) {
        return {
          type: 'gateway_error',
          message: 'Bad Gateway - AI service temporarily unavailable',
          severity: 'warning',
          recoveryGuidance: 'The AI service gateway is experiencing issues. Wait 3-5 minutes, then click "Analyze Again". The system will automatically retry with backup infrastructure.',
          retryable: true,
          modelId,
          estimatedWaitTime: 240000, // 4 minutes
        };
      } else if (httpStatus === 503) {
        return {
          type: 'gateway_error',
          message: 'Service Unavailable - AI service temporarily overloaded',
          severity: 'warning',
          recoveryGuidance: 'The AI service is experiencing high demand. Wait 5 minutes, then click "Analyze Again". The system will automatically distribute load across available backup models.',
          retryable: true,
          modelId,
          estimatedWaitTime: 300000, // 5 minutes
        };
      } else if (httpStatus === 504) {
        return {
          type: 'timeout',
          message: 'Gateway Timeout - AI service took too long to respond',
          severity: 'warning',
          recoveryGuidance: 'The AI service gateway timed out due to high load. Wait 2 minutes, then click "Analyze Again". The system automatically retries with optimized timeouts.',
          retryable: true,
          modelId,
          estimatedWaitTime: 120000, // 2 minutes
        };
      }
      return {
        type: 'gateway_error',
        message: 'Gateway error - AI service temporarily unavailable',
        severity: 'warning',
        recoveryGuidance: 'The AI service gateway is experiencing issues. Wait 3-5 minutes, then click "Analyze Again". The system will automatically retry with backup infrastructure.',
        retryable: true,
        modelId,
        estimatedWaitTime: 240000, // 4 minutes
      };

    case ConsensusErrorType.CONTENT_FILTERED:
      return {
        type: 'content_filtered',
        message: 'Analysis request was filtered by content policy',
        severity: 'warning',
        recoveryGuidance: 'The AI model flagged this request as potentially violating content policies. This can happen with certain asset symbols or context. Try again with a different asset or simplify your context. If this persists, the system will use alternative models.',
        retryable: true,
        modelId,
        estimatedWaitTime: 30000, // 30 seconds
      };

    case ConsensusErrorType.CONTEXT_WINDOW_EXCEEDED:
      return {
        type: 'context_window_exceeded',
        message: 'Analysis context too long for this model',
        severity: 'warning',
        recoveryGuidance: 'The provided context exceeded the model\'s processing limits. Try shortening your context to under 500 characters. The system will automatically retry with optimized parameters.',
        retryable: true,
        modelId,
        estimatedWaitTime: 15000, // 15 seconds
      };

    case ConsensusErrorType.MALFORMED_REQUEST:
      return {
        type: 'malformed_request',
        message: 'Invalid request format sent to AI model',
        severity: 'warning',
        recoveryGuidance: 'The request format was rejected by the AI service. This is usually temporary. Click "Analyze Again" to retry with corrected parameters. The system automatically validates and corrects request formatting.',
        retryable: true,
        modelId,
        estimatedWaitTime: 10000, // 10 seconds
      };

    case ConsensusErrorType.MODEL_OVERLOADED:
      return {
        type: 'model_overloaded',
        message: 'AI model is currently overloaded',
        severity: 'warning',
        recoveryGuidance: 'This AI model is experiencing exceptionally high demand. Wait 2-3 minutes, then click "Analyze Again". The system will automatically route to less busy backup models.',
        retryable: true,
        modelId,
        estimatedWaitTime: 180000, // 3 minutes
      };

    default:
      return {
        type: 'unknown_error',
        message: 'An unexpected error occurred',
        severity: 'warning',
        recoveryGuidance: 'An unexpected issue occurred. Click "Analyze Again" to retry. If this happens repeatedly, please report the issue with reference ID: ' + error.correlationId,
        retryable: true,
        modelId,
      };
  }
}

/**
 * Create progress update for slow models
 *
 * Generates progress tracking information for models that are taking longer
 * than expected to respond. Threshold for "slow" is 15 seconds.
 *
 * @param modelId - The model being tracked
 * @param elapsedTime - Milliseconds elapsed since request started
 * @param message - Optional custom status message
 * @returns A ProgressUpdate object with status and timing information
 *
 * @example
 * ```ts
 * const progress = createProgressUpdate('kimi', 18000);
 * // progress.status: 'slow'
 * // progress.message: 'Taking longer than expected...'
 * // progress.elapsedTime: 18000
 * ```
 */
function createProgressUpdate(modelId: string, elapsedTime: number, message?: string): ProgressUpdate {
  const isSlow = elapsedTime > 15000; // 15 seconds

  // Use actual model performance metrics for better estimate
  const metrics = metricsPerModel[modelId];
  const avgResponseTime = metrics?.averageResponseTime || 10000; // Default 10s if no history

  // Calculate remaining time based on historical average, but don't go negative
  const estimatedRemaining = Math.max(0, avgResponseTime - elapsedTime);

  return {
    modelId,
    status: isSlow ? 'slow' : 'processing',
    message: message || (isSlow ? 'Taking longer than expected...' : 'Processing...'),
    elapsedTime,
    estimatedRemainingTime: estimatedRemaining,
  };
}

/**
 * Aggregate multiple errors into a clear, actionable summary
 *
 * When multiple models fail, this creates a consolidated error message that:
 * - Categorizes errors by type (network, auth, rate limit, etc.)
 * - Provides the most relevant recovery guidance
 * - Indicates if any retryable vs non-retryable failures
 * - Includes estimated wait time if applicable
 * - Provides model-specific guidance for partially successful analyses
 *
 * @param errors - Array of UserFacingError objects from failed models
 * @param totalModels - Total number of models attempted (for partial success context)
 * @param successfulModels - Number of models that succeeded (optional, for context)
 * @returns A single aggregated UserFacingError with combined guidance
 *
 * @example
 * ```ts
 * const errors = [
 *   { type: 'rate_limit', severity: 'warning', ... },
 *   { type: 'timeout', severity: 'warning', ... },
 * ];
 * const summary = aggregateErrors(errors, 5, 3);
 * // summary.message: "Multiple models failed: 2 rate limited"
 * // summary.recoveryGuidance: "Wait 60 seconds, then retry..."
 * ```
 */
export function aggregateErrors(errors: UserFacingError[], totalModels: number = 5, successfulModels: number = 0): UserFacingError {
  if (errors.length === 0) {
    return {
      type: 'unknown_error',
      message: 'No error details available',
      severity: 'warning',
      recoveryGuidance: 'An unknown error occurred. Please try again.',
      retryable: true,
    };
  }

  if (errors.length === 1) {
    const singleError = errors[0];
    // If we have partial success context, enhance the message
    if (successfulModels > 0) {
      return {
        ...singleError,
        message: `${singleError.message} (${successfulModels}/${totalModels} models successful)`,
        recoveryGuidance: `${singleError.recoveryGuidance} Note: ${successfulModels} model${successfulModels !== 1 ? 's' : ''} provided analysis successfully.`,
      };
    }
    return singleError;
  }

  // Categorize errors by type
  const errorCounts: Record<string, number> = {};
  const errorTypes = new Set<string>();
  let hasRetryable = false;
  let hasCritical = false;
  let maxWaitTime = 0;
  const affectedModels: string[] = [];

  errors.forEach(error => {
    errorTypes.add(error.type);
    errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;

    if (error.retryable) hasRetryable = true;
    if (error.severity === 'critical') hasCritical = true;
    if (error.estimatedWaitTime && error.estimatedWaitTime > maxWaitTime) {
      maxWaitTime = error.estimatedWaitTime;
    }
    if (error.modelId) affectedModels.push(error.modelId);
  });

  // Generate categorized summary
  const categorySummary: string[] = [];
  if (errorCounts.rate_limit) {
    categorySummary.push(`${errorCounts.rate_limit} rate limited`);
  }
  if (errorCounts.timeout) {
    categorySummary.push(`${errorCounts.timeout} timed out`);
  }
  if (errorCounts.network || errorCounts.gateway_error) {
    const networkCount = (errorCounts.network || 0) + (errorCounts.gateway_error || 0);
    categorySummary.push(`${networkCount} network issues`);
  }
  if (errorCounts.authentication || errorCounts.configuration) {
    const authCount = (errorCounts.authentication || 0) + (errorCounts.configuration || 0);
    categorySummary.push(`${authCount} configuration issues`);
  }
  if (errorCounts.quota_exceeded) {
    categorySummary.push(`${errorCounts.quota_exceeded} quota exceeded`);
  }

  const summaryText = categorySummary.length > 0
    ? categorySummary.join(', ')
    : `${errors.length} models failed`;

  // Determine primary recovery guidance based on error types
  let recoveryGuidance: string;

  if (errorCounts.rate_limit && errorCounts.rate_limit >= errors.length / 2) {
    // Majority are rate limit errors
    recoveryGuidance = `Multiple models hit rate limits. Wait ${Math.ceil(maxWaitTime / 1000)} seconds, then click "Analyze Again" to retry. Space out future requests by at least 10-15 seconds to avoid this.`;
  } else if (errorCounts.timeout && errorCounts.timeout >= errors.length / 2) {
    // Majority are timeouts
    recoveryGuidance = `Multiple models timed out due to high demand. Wait ${Math.ceil(maxWaitTime / 1000)} seconds, then click "Analyze Again". The system will automatically use faster backup models.`;
  } else if (hasCritical) {
    // Has critical errors (auth, config, quota)
    recoveryGuidance = `Some models have configuration or quota issues and are temporarily unavailable. The system will automatically use available backup models. Click "Analyze Again" to retry with working models only.`;
  } else {
    // Mixed errors
    recoveryGuidance = `Multiple models failed due to various issues. Wait ${maxWaitTime > 0 ? Math.ceil(maxWaitTime / 1000) : 60} seconds, then click "Analyze Again". The system will automatically retry and use backup models where needed.`;
  }

  // Enhance message with partial success context
  let enhancedMessage = `Multiple models failed: ${summaryText}`;
  if (successfulModels > 0) {
    enhancedMessage += ` (${successfulModels}/${totalModels} models successful)`;
  }

  // Enhance recovery guidance with partial success context
  let enhancedRecoveryGuidance = recoveryGuidance;
  if (successfulModels > 0) {
    enhancedRecoveryGuidance += ` Note: ${successfulModels} model${successfulModels !== 1 ? 's' : ''} provided analysis successfully, so you still have valuable insights.`;
  }

  return {
    type: 'multiple_failures',
    message: enhancedMessage,
    severity: hasCritical ? 'critical' : 'warning',
    recoveryGuidance: enhancedRecoveryGuidance,
    retryable: hasRetryable,
    estimatedWaitTime: maxWaitTime > 0 ? maxWaitTime : undefined,
  };
}

// Performance tracking
interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

const metricsPerModel: Record<string, RequestMetrics> = {};

// Circuit breaker pattern - track model failures
interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  isOpen: boolean;
  openUntil?: number;
}

const CIRCUIT_BREAKER_CONFIG = {
  FAILURE_THRESHOLD: 3, // Number of failures before opening circuit
  RESET_TIMEOUT: 10 * 60 * 1000, // 10 minutes in milliseconds
  HALF_OPEN_ATTEMPTS: 1, // Number of attempts to test in half-open state
};

const circuitBreakerStates: Record<string, CircuitBreakerState> = {};

// Error rate tracking for time windows (for smarter circuit breaker decisions)
interface ErrorRateEntry {
  timestamp: number;
  success: boolean;
  modelId: string;
  errorType?: ConsensusErrorType;
}

const ERROR_RATE_WINDOWS = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
};

// Circular buffer for error rate tracking (max 1000 entries per window)
const errorHistory: ErrorRateEntry[] = [];
const MAX_ERROR_HISTORY = 1000;

/**
 * Record an error or success for rate tracking
 */
function recordErrorRateEvent(success: boolean, modelId: string, errorType?: ConsensusErrorType): void {
  errorHistory.push({
    timestamp: Date.now(),
    success,
    modelId,
    errorType,
  });

  // Trim history if it gets too large
  if (errorHistory.length > MAX_ERROR_HISTORY) {
    errorHistory.shift();
  }
}

/**
 * Calculate error rate for a specific time window and model
 */
function getErrorRate(windowMs: number, modelId?: string): {
  totalRequests: number;
  errorCount: number;
  errorRate: number; // 0-1
  errorTypes: Record<string, number>;
} {
  const now = Date.now();
  const cutoff = now - windowMs;

  const filteredEntries = errorHistory.filter(entry => {
    const withinWindow = entry.timestamp >= cutoff;
    const matchesModel = !modelId || entry.modelId === modelId;
    return withinWindow && matchesModel;
  });

  const totalRequests = filteredEntries.length;
  const errorCount = filteredEntries.filter(e => !e.success).length;
  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

  // Count error types
  const errorTypes: Record<string, number> = {};
  filteredEntries
    .filter(e => !e.success && e.errorType)
    .forEach(e => {
      const type = e.errorType!;
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

  return {
    totalRequests,
    errorCount,
    errorRate,
    errorTypes,
  };
}

/**
 * Get error rates for all time windows
 */
export function getErrorRates(): {
  last5Minutes: ReturnType<typeof getErrorRate>;
  last15Minutes: ReturnType<typeof getErrorRate>;
  lastHour: ReturnType<typeof getErrorRate>;
} {
  return {
    last5Minutes: getErrorRate(ERROR_RATE_WINDOWS.SHORT),
    last15Minutes: getErrorRate(ERROR_RATE_WINDOWS.MEDIUM),
    lastHour: getErrorRate(ERROR_RATE_WINDOWS.LONG),
  };
}

/**
 * Get error rates for a specific model
 */
export function getModelErrorRates(modelId: string): {
  last5Minutes: ReturnType<typeof getErrorRate>;
  last15Minutes: ReturnType<typeof getErrorRate>;
  lastHour: ReturnType<typeof getErrorRate>;
} {
  return {
    last5Minutes: getErrorRate(ERROR_RATE_WINDOWS.SHORT, modelId),
    last15Minutes: getErrorRate(ERROR_RATE_WINDOWS.MEDIUM, modelId),
    lastHour: getErrorRate(ERROR_RATE_WINDOWS.LONG, modelId),
  };
}

/**
 * Check if circuit breaker is open for a model
 * @param modelId - The model to check
 * @returns true if circuit is open (model should not be called)
 */
function isCircuitOpen(modelId: string): boolean {
  const state = circuitBreakerStates[modelId];
  if (!state || !state.isOpen) return false;

  // Check if circuit should be reset (timeout elapsed)
  const now = Date.now();
  if (state.openUntil && now >= state.openUntil) {
    console.log(`[${modelId}] Circuit breaker reset after timeout`);
    state.isOpen = false;
    state.failureCount = 0;
    delete state.openUntil;
    return false;
  }

  return true;
}

/**
 * Record a failure for circuit breaker
 * @param modelId - The model that failed
 */
function recordCircuitBreakerFailure(modelId: string): void {
  if (!circuitBreakerStates[modelId]) {
    circuitBreakerStates[modelId] = {
      failureCount: 0,
      lastFailureTime: 0,
      isOpen: false,
    };
  }

  const state = circuitBreakerStates[modelId];
  state.failureCount++;
  state.lastFailureTime = Date.now();

  // Record error rate event
  recordErrorRateEvent(false, modelId);

  // Check error rate for smarter circuit breaker decisions
  const errorRate5Min = getErrorRate(ERROR_RATE_WINDOWS.SHORT, modelId);
  const errorRate15Min = getErrorRate(ERROR_RATE_WINDOWS.MEDIUM, modelId);

  // Open circuit if threshold exceeded OR if error rate is very high (>80% in 5min)
  const shouldOpenCircuit = state.failureCount >= CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD ||
                           (errorRate5Min.totalRequests >= 5 && errorRate5Min.errorRate > 0.8);

  if (shouldOpenCircuit && !state.isOpen) {
    state.isOpen = true;
    // Calculate reset timeout based on error rate
    let resetTimeout = CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT;
    if (errorRate15Min.errorRate > 0.7) {
      // Very high error rate - extend timeout
      resetTimeout = 15 * 60 * 1000; // 15 minutes
    } else if (errorRate5Min.errorRate > 0.5) {
      // Moderate error rate - slightly extend timeout
      resetTimeout = 12 * 60 * 1000; // 12 minutes
    }

    state.openUntil = Date.now() + resetTimeout;
    console.warn(
      `[${modelId}] Circuit breaker opened after ${state.failureCount} failures ` +
      `(5min error rate: ${(errorRate5Min.errorRate * 100).toFixed(1)}%, ` +
      `15min error rate: ${(errorRate15Min.errorRate * 100).toFixed(1)}%). ` +
      `Will reset in ${resetTimeout / 1000}s`
    );
  }
}

/**
 * Record a success for circuit breaker (resets failure count)
 * @param modelId - The model that succeeded
 */
function recordCircuitBreakerSuccess(modelId: string): void {
  if (!circuitBreakerStates[modelId]) return;

  const state = circuitBreakerStates[modelId];
  if (state.failureCount > 0) {
    console.log(`[${modelId}] Circuit breaker reset after successful call`);
  }
  state.failureCount = 0;
  state.isOpen = false;
  delete state.openUntil;

  // Record success for error rate tracking
  recordErrorRateEvent(true, modelId);
}

/**
 * Update performance metrics for a model
 */
function updateMetrics(modelId: string, success: boolean, responseTime: number) {
  if (!metricsPerModel[modelId]) {
    metricsPerModel[modelId] = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }

  const metrics = metricsPerModel[modelId];
  metrics.totalRequests++;

  if (success) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }

  // Update rolling average
  const totalSuccessTime = metrics.averageResponseTime * (metrics.successfulRequests - (success ? 1 : 0));
  metrics.averageResponseTime = success
    ? (totalSuccessTime + responseTime) / metrics.successfulRequests
    : metrics.averageResponseTime;
}

/**
 * Get performance metrics for all models
 */
export function getPerformanceMetrics(): Record<string, RequestMetrics> {
  return { ...metricsPerModel };
}

/**
 * Health check interface for monitoring system status
 */
export interface ModelHealthStatus {
  modelId: string;
  isHealthy: boolean;
  circuitBreakerStatus: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  openUntil?: Date;
  successRate: number;
  averageResponseTime: number;
  totalRequests: number;
}

/**
 * Get health status for all models including circuit breaker information
 * This is useful for monitoring dashboards and debugging
 */
export function getModelsHealthStatus(): ModelHealthStatus[] {
  return ANALYST_MODELS.map(config => {
    const metrics = metricsPerModel[config.id];
    const circuitState = circuitBreakerStates[config.id];

    // Calculate success rate
    const totalRequests = metrics?.totalRequests || 0;
    const successfulRequests = metrics?.successfulRequests || 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

    // Determine circuit breaker status
    let circuitBreakerStatus: 'closed' | 'open' | 'half-open' = 'closed';
    if (circuitState?.isOpen) {
      circuitBreakerStatus = 'open';
    } else if (circuitState?.failureCount > 0) {
      circuitBreakerStatus = 'half-open';
    }

    // Model is healthy if circuit is not open and success rate is reasonable
    const isHealthy = !circuitState?.isOpen && successRate >= 50;

    return {
      modelId: config.id,
      isHealthy,
      circuitBreakerStatus,
      failureCount: circuitState?.failureCount || 0,
      lastFailureTime: circuitState?.lastFailureTime ? new Date(circuitState.lastFailureTime) : undefined,
      openUntil: circuitState?.openUntil ? new Date(circuitState.openUntil) : undefined,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(metrics?.averageResponseTime || 0),
      totalRequests,
    };
  });
}

/**
 * Get overall system health summary
 */
export function getSystemHealthSummary() {
  const healthStatuses = getModelsHealthStatus();
  const healthyModels = healthStatuses.filter(h => h.isHealthy).length;
  const totalModels = healthStatuses.length;
  
  const openCircuits = healthStatuses.filter(h => h.circuitBreakerStatus === 'open').length;
  const halfOpenCircuits = healthStatuses.filter(h => h.circuitBreakerStatus === 'half-open').length;
  
  const overallHealth = {
    status: healthyModels === totalModels ? 'healthy' : 
            healthyModels >= totalModels * 0.6 ? 'degraded' : 'unhealthy',
    healthyModels,
    totalModels,
    healthyPercentage: Math.round((healthyModels / totalModels) * 100),
    openCircuits,
    halfOpenCircuits,
    timestamp: new Date(),
  };

  return {
    overall: overallHealth,
    models: healthStatuses,
  };
}

/**
 * Build enhanced prompt with better structure and context
 */
function buildEnhancedPrompt(asset: string, context?: string): string {
  const basePrompt = `Analyze ${asset.toUpperCase()} for a trading signal.`;

  if (context && context.trim()) {
    return `${basePrompt}

Additional Context: ${context}

Instructions:
1. Consider the provided context alongside your specialized expertise
2. Focus on actionable insights relevant to current market conditions
3. Be specific about key levels, metrics, or indicators
4. Provide a clear, concise reasoning for your signal

Remember: Respond ONLY with valid JSON in the exact format specified.`;
  }

  return `${basePrompt}

Instructions:
1. Analyze current market conditions for ${asset.toUpperCase()}
2. Apply your specialized analytical framework
3. Identify the most significant factors influencing the market
4. Provide clear, specific reasoning for your signal
5. Base confidence on the strength and alignment of your signals

Remember: Respond ONLY with valid JSON in the exact format specified.`;
}

/**
 * Call a single AI model with the analysis prompt
 *
 * Enhanced with:
 * - Circuit breaker pattern (stops calling consistently failing models)
 * - Retry logic with exponential backoff
 * - Rate limiting (1 req/sec per model)
 * - Timeout handling with configurable timeouts
 * - Provider-specific API formats (OpenAI, Anthropic, Google)
 *
 * @param config - Model configuration (endpoints, prompts, timeout)
 * @param asset - Crypto asset symbol to analyze
 * @param context - Optional user-provided context
 * @param retryCount - Current retry attempt (internal, starts at 0)
 * @returns Parsed model response with signal, confidence, reasoning
 * @throws {ConsensusError} - On API errors, timeouts, network issues, etc.
 *
 * @example
 * ```ts
 * const response = await callModel(ANALYST_MODELS[0], 'BTC');
 * // response: { signal: 'buy', confidence: 75, reasoning: '...' }
 * ```
 */
async function callModel(
  config: ModelConfig,
  asset: string,
  context?: string,
  retryCount = 0
): Promise<ModelResponse> {
  // Circuit breaker check - skip models that are consistently failing
  if (isCircuitOpen(config.id)) {
    throw new ConsensusError(
      `Circuit breaker open - model has failed ${CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD} times recently`,
      ConsensusErrorType.API_ERROR,
      config.id
    );
  }

  // When proxy is configured, skip local API key check (proxy has the keys)
  const usingProxy = isProxyConfigured();
  const apiKey = usingProxy
    ? 'proxy-managed'
    : (config.provider === 'google' ? getGeminiApiKey() : process.env[config.apiKeyEnv]);

  if (!apiKey) {
    throw new ConsensusError(
      `Missing API key: ${config.apiKeyEnv}`,
      ConsensusErrorType.MISSING_API_KEY,
      config.id
    );
  }

  // Rate limiting
  const now = Date.now();
  const lastTime = lastRequestTime[config.id] || 0;
  const waitTime = MIN_REQUEST_INTERVAL - (now - lastTime);
  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime[config.id] = Date.now();

  // Enhanced user prompt with better context and structure
  const userPrompt = buildEnhancedPrompt(asset, context);

  // Ensure timeout is within acceptable bounds
  const timeout = Math.min(
    Math.max(config.timeout, TIMEOUT_CONFIG.MIN_TIMEOUT),
    TIMEOUT_CONFIG.MAX_TIMEOUT
  );

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[${config.id}] Request timeout after ${timeout}ms`);
    controller.abort();
  }, timeout);

  try {
    let response: Response;
    let data: unknown;

    if (config.provider === 'google') {
      // Gemini API has a different format
      const geminiBody = {
        contents: [
          {
            parts: [
              { text: config.systemPrompt + '\n\n' + userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      };
      response = await proxyFetch('google', {
        baseUrl: config.baseUrl,
        model: config.model,
        apiKeyEnv: config.apiKeyEnv,
        body: geminiBody,
      }, controller.signal);

      if (!response.ok) {
        let geminiErrorData: { error?: { message?: string; code?: number } } = {};
        let responseText: string | null = null;
        try {
          data = await response.json();
          geminiErrorData = data as typeof geminiErrorData;
        } catch (parseError) {
          // Response body may not be valid JSON (e.g., HTML error page, plain text)
          try {
            responseText = await response.text();
          } catch {
            // Can't read response body at all
          }
        }

        // Check for rate limiting
        if (response.status === 429 || geminiErrorData.error?.code === 429) {
          throw new ConsensusError(
            'Rate limit exceeded',
            ConsensusErrorType.RATE_LIMIT,
            config.id,
            geminiErrorData.error
          );
        }

        // Handle specific HTTP status codes
        if (response.status === 401 || response.status === 403) {
          throw new ConsensusError(
            'Authentication failed - API key may be invalid or expired',
            ConsensusErrorType.AUTHENTICATION_ERROR,
            config.id,
            geminiErrorData.error
          );
        }

        if (response.status >= 500) {
          // Enhanced handling for gateway/server errors
          if (response.status === 502) {
            throw new ConsensusError(
              'Bad Gateway - AI service is temporarily unavailable due to server issues',
              ConsensusErrorType.GATEWAY_ERROR,
              config.id,
              geminiErrorData.error,
              { httpStatus: 502, service: 'gemini' }
            );
          } else if (response.status === 503) {
            throw new ConsensusError(
              'Service Unavailable - AI service is temporarily overloaded',
              ConsensusErrorType.GATEWAY_ERROR,
              config.id,
              geminiErrorData.error,
              { httpStatus: 503, service: 'gemini', likelyRecoveryTime: '2-5 minutes' }
            );
          } else if (response.status === 504) {
            throw new ConsensusError(
              'Gateway Timeout - AI service took too long to respond',
              ConsensusErrorType.TIMEOUT,
              config.id,
              geminiErrorData.error,
              { httpStatus: 504, service: 'gemini' }
            );
          } else {
            throw new ConsensusError(
              `Server error ${response.status} - service temporarily unavailable`,
              ConsensusErrorType.API_ERROR,
              config.id,
              geminiErrorData.error,
              { httpStatus: response.status, service: 'gemini' }
            );
          }
        }

        // Construct detailed error message
        const errorMsg = geminiErrorData.error?.message
          || (responseText ? `HTTP ${response.status}: ${responseText.substring(0, 200)}` : `Gemini API error: ${response.status}`);

        throw new ConsensusError(
          errorMsg,
          ConsensusErrorType.API_ERROR,
          config.id,
          geminiErrorData.error
        );
      }

      // Parse successful response
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new ConsensusError(
          'Failed to parse JSON response from Gemini API',
          ConsensusErrorType.PARSE_ERROR,
          config.id,
          jsonError
        );
      }
      const geminiData = data as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };

      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ConsensusError(
          'Empty response from Gemini API',
          ConsensusErrorType.INVALID_RESPONSE,
          config.id
        );
      }

      const result = parseModelResponse(text, config.id);
      // Success - record for circuit breaker
      recordCircuitBreakerSuccess(config.id);
      return result;
    } else if (config.provider === 'anthropic') {
      // Anthropic-compatible API (GLM, Kimi)
      const anthropicBody = {
        model: config.model,
        max_tokens: 500,
        system: config.systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      };
      response = await proxyFetch('anthropic', {
        baseUrl: config.baseUrl,
        path: '/messages',
        model: config.model,
        apiKeyEnv: config.apiKeyEnv,
        body: anthropicBody,
        extraHeaders: { 'anthropic-version': '2023-06-01' },
      }, controller.signal);

      if (!response.ok) {
        let anthropicErrorData: { error?: { message?: string; type?: string } } = {};
        let responseText: string | null = null;
        try {
          data = await response.json();
          anthropicErrorData = data as typeof anthropicErrorData;
        } catch (parseError) {
          // Response body may not be valid JSON (e.g., HTML error page, plain text)
          try {
            responseText = await response.text();
          } catch {
            // Can't read response body at all
          }
        }

        // Check for rate limiting
        if (response.status === 429 || anthropicErrorData.error?.type === 'rate_limit_error') {
          throw new ConsensusError(
            'Rate limit exceeded',
            ConsensusErrorType.RATE_LIMIT,
            config.id,
            anthropicErrorData.error
          );
        }

        // Handle specific HTTP status codes
        if (response.status === 401 || response.status === 403) {
          throw new ConsensusError(
            'Authentication failed - API key may be invalid or expired',
            ConsensusErrorType.AUTHENTICATION_ERROR,
            config.id,
            anthropicErrorData.error
          );
        }

        if (response.status >= 500) {
          // Enhanced handling for gateway/server errors
          if (response.status === 502) {
            throw new ConsensusError(
              'Bad Gateway - AI service is temporarily unavailable due to server issues',
              ConsensusErrorType.GATEWAY_ERROR,
              config.id,
              anthropicErrorData.error,
              { httpStatus: 502, service: config.id, endpoint: '/messages' }
            );
          } else if (response.status === 503) {
            throw new ConsensusError(
              'Service Unavailable - AI service is temporarily overloaded',
              ConsensusErrorType.GATEWAY_ERROR,
              config.id,
              anthropicErrorData.error,
              { httpStatus: 503, service: config.id, endpoint: '/messages', likelyRecoveryTime: '2-5 minutes' }
            );
          } else if (response.status === 504) {
            throw new ConsensusError(
              'Gateway Timeout - AI service took too long to respond',
              ConsensusErrorType.TIMEOUT,
              config.id,
              anthropicErrorData.error,
              { httpStatus: 504, service: config.id, endpoint: '/messages' }
            );
          } else {
            throw new ConsensusError(
              `Server error ${response.status} - service temporarily unavailable`,
              ConsensusErrorType.API_ERROR,
              config.id,
              anthropicErrorData.error,
              { httpStatus: response.status, service: config.id, endpoint: '/messages' }
            );
          }
        }

        // Construct detailed error message
        const errorMsg = anthropicErrorData.error?.message
          || (responseText ? `HTTP ${response.status}: ${responseText.substring(0, 200)}` : `API error: ${response.status} from ${config.baseUrl}/messages (model: ${config.model})`);

        throw new ConsensusError(
          errorMsg,
          ConsensusErrorType.API_ERROR,
          config.id,
          anthropicErrorData.error
        );
      }

      // Parse successful response
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new ConsensusError(
          'Failed to parse JSON response from Anthropic API',
          ConsensusErrorType.PARSE_ERROR,
          config.id,
          jsonError
        );
      }
      const anthropicData = data as {
        content?: Array<{ text?: string }>;
        error?: { message?: string };
      };

      const text = anthropicData.content?.[0]?.text;
      if (!text) {
        throw new ConsensusError(
          `Empty response from ${config.id} (${config.baseUrl}/messages, model: ${config.model})`,
          ConsensusErrorType.INVALID_RESPONSE,
          config.id
        );
      }

      const result = parseModelResponse(text, config.id);
      // Success - record for circuit breaker
      recordCircuitBreakerSuccess(config.id);
      return result;
    } else {
      // OpenAI-compatible API (DeepSeek, MiniMax)
      const openaiBody = {
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      };
      response = await proxyFetch('openai', {
        baseUrl: config.baseUrl,
        path: '/chat/completions',
        model: config.model,
        apiKeyEnv: config.apiKeyEnv,
        body: openaiBody,
      }, controller.signal);

      if (!response.ok) {
        let openaiErrorData: { error?: { message?: string; type?: string; code?: string } } = {};
        let responseText: string | null = null;
        try {
          data = await response.json();
          openaiErrorData = data as typeof openaiErrorData;
        } catch (parseError) {
          // Response body may not be valid JSON (e.g., HTML error page, plain text)
          try {
            responseText = await response.text();
          } catch {
            // Can't read response body at all
          }
        }

        // Check for rate limiting
        if (
          response.status === 429 ||
          openaiErrorData.error?.type === 'rate_limit_exceeded' ||
          openaiErrorData.error?.code === 'rate_limit_exceeded'
        ) {
          throw new ConsensusError(
            'Rate limit exceeded',
            ConsensusErrorType.RATE_LIMIT,
            config.id,
            openaiErrorData.error
          );
        }

        // Handle specific HTTP status codes
        if (response.status === 401 || response.status === 403) {
          throw new ConsensusError(
            'Authentication failed - API key may be invalid or expired',
            ConsensusErrorType.AUTHENTICATION_ERROR,
            config.id,
            openaiErrorData.error
          );
        }

        if (response.status >= 500) {
          // Enhanced handling for gateway/server errors
          if (response.status === 502) {
            throw new ConsensusError(
              'Bad Gateway - AI service is temporarily unavailable due to server issues',
              ConsensusErrorType.GATEWAY_ERROR,
              config.id,
              openaiErrorData.error,
              { httpStatus: 502, service: config.id, endpoint: '/chat/completions' }
            );
          } else if (response.status === 503) {
            throw new ConsensusError(
              'Service Unavailable - AI service is temporarily overloaded',
              ConsensusErrorType.GATEWAY_ERROR,
              config.id,
              openaiErrorData.error,
              { httpStatus: 503, service: config.id, endpoint: '/chat/completions', likelyRecoveryTime: '2-5 minutes' }
            );
          } else if (response.status === 504) {
            throw new ConsensusError(
              'Gateway Timeout - AI service took too long to respond',
              ConsensusErrorType.TIMEOUT,
              config.id,
              openaiErrorData.error,
              { httpStatus: 504, service: config.id, endpoint: '/chat/completions' }
            );
          } else {
            throw new ConsensusError(
              `Server error ${response.status} - service temporarily unavailable`,
              ConsensusErrorType.API_ERROR,
              config.id,
              openaiErrorData.error,
              { httpStatus: response.status, service: config.id, endpoint: '/chat/completions' }
            );
          }
        }

        // Construct detailed error message
        const errorMsg = openaiErrorData.error?.message
          || (responseText ? `HTTP ${response.status}: ${responseText.substring(0, 200)}` : `API error: ${response.status} from ${config.baseUrl}/chat/completions (model: ${config.model})`);

        throw new ConsensusError(
          errorMsg,
          ConsensusErrorType.API_ERROR,
          config.id,
          openaiErrorData.error
        );
      }

      // Parse successful response
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new ConsensusError(
          'Failed to parse JSON response from OpenAI-compatible API',
          ConsensusErrorType.PARSE_ERROR,
          config.id,
          jsonError
        );
      }
      const openaiData = data as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };

      const text = openaiData.choices?.[0]?.message?.content;
      if (!text) {
        throw new ConsensusError(
          `Empty response from ${config.id} (${config.baseUrl}/chat/completions, model: ${config.model})`,
          ConsensusErrorType.INVALID_RESPONSE,
          config.id
        );
      }

      const result = parseModelResponse(text, config.id);
      // Success - record for circuit breaker
      recordCircuitBreakerSuccess(config.id);
      return result;
    }
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ConsensusError(
        `Request timed out after ${timeout}ms`,
        ConsensusErrorType.TIMEOUT,
        config.id,
        error
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ConsensusError(
        'AI models temporarily unavailable. Please try again.',
        ConsensusErrorType.NETWORK_ERROR,
        config.id,
        error
      );
    }

    // Handle ProxyError from proxy-fetch
    if (error instanceof ProxyError) {
      // Map ProxyError types to ConsensusError types
      let consensusErrorType: ConsensusErrorType;
      
      switch (error.type) {
        case ProxyErrorType.CONNECTION_REFUSED:
        case ProxyErrorType.PROXY_DOWN:
        case ProxyErrorType.SERVER_ERROR:
          consensusErrorType = ConsensusErrorType.API_ERROR;
          break;
        case ProxyErrorType.CONNECTION_TIMEDOUT:
          consensusErrorType = ConsensusErrorType.TIMEOUT;
          break;
        case ProxyErrorType.RATE_LIMIT:
          consensusErrorType = ConsensusErrorType.RATE_LIMIT;
          break;
        default:
          consensusErrorType = ConsensusErrorType.NETWORK_ERROR;
      }

      throw new ConsensusError(
        error.message,
        consensusErrorType,
        config.id,
        error.originalError || error
      );
    }

    // Re-throw ConsensusErrors with retry logic
    if (error instanceof ConsensusError) {
      // Record failure for circuit breaker (before retry logic)
      recordCircuitBreakerFailure(config.id);

      // Rotate Gemini key on rate limit before retrying
      if (config.provider === 'google' && error.type === ConsensusErrorType.RATE_LIMIT) {
        rotateGeminiKey();
      }

      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        (error.type === ConsensusErrorType.NETWORK_ERROR ||
          error.type === ConsensusErrorType.TIMEOUT ||
          error.type === ConsensusErrorType.RATE_LIMIT)
      ) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF_MULTIPLIER, retryCount);
        console.warn(
          `[${config.id}] Retrying after ${error.type} (attempt ${retryCount + 1}/${MAX_RETRIES}, delay: ${delay}ms)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return callModel(config, asset, context, retryCount + 1);
      }
      throw error;
    }

    // Wrap unknown errors
    const wrappedError = new ConsensusError(
      error instanceof Error ? error.message : 'Unknown error',
      ConsensusErrorType.API_ERROR,
      config.id,
      error
    );
    // Record failure for circuit breaker
    recordCircuitBreakerFailure(config.id);
    throw wrappedError;
  } finally {
    clearTimeout(timeoutId);
    // Ensure AbortController is cleaned up to prevent memory leaks
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }
}

/**
 * Parse the model's text response into structured format
 *
 * Enhanced with better error handling and validation. Extracts JSON from
 * model responses (supports both direct JSON and markdown code blocks),
 * validates required fields, and normalizes signal/confidence values.
 *
 * @param text - The raw text response from the model
 * @param modelId - The model that generated the response (for error tracking)
 * @returns Parsed and validated ModelResponse object
 * @throws {ConsensusError} - On missing/invalid fields or malformed JSON
 *
 * @example
 * ```ts
 * const text = '{"signal": "buy", "confidence": 85, "reasoning": "Strong momentum"}';
 * const response = parseModelResponse(text, 'deepseek');
 * // response: { signal: 'buy', confidence: 85, reasoning: 'Strong momentum' }
 * ```
 */
function parseModelResponse(text: string, modelId: string): ModelResponse {
  if (!text || text.trim().length === 0) {
    throw new ConsensusError(
      'Empty response from model',
      ConsensusErrorType.PARSE_ERROR,
      modelId
    );
  }

  // Try to extract JSON from the response (supports both direct JSON and markdown code blocks)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new ConsensusError(
      'No JSON found in response. Expected format: {"signal": "buy|sell|hold", "confidence": 0-100, "reasoning": "..."}',
      ConsensusErrorType.PARSE_ERROR,
      modelId
    );
  }

  const jsonText = jsonMatch[1] || jsonMatch[0];

  try {
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.signal) {
      throw new ConsensusError(
        'Missing required field: signal',
        ConsensusErrorType.PARSE_ERROR,
        modelId
      );
    }

    // Validate and normalize the signal
    const signal = String(parsed.signal).toLowerCase().trim();
    if (!['buy', 'sell', 'hold'].includes(signal)) {
      throw new ConsensusError(
        `Invalid signal value: "${signal}". Must be "buy", "sell", or "hold"`,
        ConsensusErrorType.VALIDATION_ERROR,
        modelId
      );
    }

    // Validate and normalize confidence
    const rawConfidence = parsed.confidence;
    if (rawConfidence === undefined || rawConfidence === null) {
      throw new ConsensusError(
        'Missing required field: confidence',
        ConsensusErrorType.VALIDATION_ERROR,
        modelId
      );
    }

    const confidence = Math.min(100, Math.max(0, Number(rawConfidence) || 0));
    if (isNaN(confidence)) {
      throw new ConsensusError(
        `Invalid confidence value: "${rawConfidence}". Must be a number between 0-100`,
        ConsensusErrorType.VALIDATION_ERROR,
        modelId
      );
    }

    // Validate and normalize reasoning
    const reasoning = parsed.reasoning
      ? String(parsed.reasoning).trim()
      : 'No reasoning provided';

    if (reasoning.length < 10) {
      throw new ConsensusError(
        'Reasoning too short (minimum 10 characters)',
        ConsensusErrorType.VALIDATION_ERROR,
        modelId
      );
    }

    return {
      signal: signal as 'buy' | 'sell' | 'hold',
      confidence,
      reasoning,
    };
  } catch (e) {
    if (e instanceof ConsensusError) {
      throw e;
    }
    throw new ConsensusError(
      `Failed to parse JSON response: ${e instanceof Error ? e.message : 'Unknown error'}`,
      ConsensusErrorType.PARSE_ERROR,
      modelId,
      e
    );
  }
}

/**
 * Get analysis from a single model, with fallback to alternative models
 *
 * When the primary model fails (after retries), tries fallback models
 * using the same role prompt for continuity. Enhanced with progress
 * tracking and user-facing error messages.
 *
 * **Fallback Strategy:**
 * - Primary model fails → tries fallback models in FALLBACK_ORDER
 * - Keeps original role identity (e.g., "Technical Analyst via Gemini")
 * - Uses the same system prompt to maintain analytical perspective
 *
 * **Error Handling:**
 * - All errors are wrapped in UserFacingError objects
 * - Results include error field if all models fail
 * - Progress callbacks report status throughout execution
 *
 * @param modelId - The primary analyst model to use
 * @param asset - Crypto asset symbol to analyze
 * @param context - Optional user-provided context
 * @param onProgress - Optional callback for progress updates
 * @returns AnalystResult with response time, or error details if all models fail
 *
 * @example
 * ```ts
 * const { result, responseTime } = await getAnalystOpinion(
 *   'technical',
 *   'BTC',
 *   'Recent breakout above resistance',
 *   (progress) => console.log(progress.status)
 * );
 * ```
 */
export async function getAnalystOpinion(
  modelId: string,
  asset: string,
  context?: string,
  onProgress?: (progress: ProgressUpdate) => void
): Promise<{ result: AnalystResult; responseTime: number }> {
  const startTime = Date.now();
  const primaryConfig = ANALYST_MODELS.find((m) => m.id === modelId);

  if (!primaryConfig) {
    return {
      result: {
        id: modelId,
        name: 'Unknown',
        sentiment: 'neutral',
        confidence: 0,
        reasoning: '',
        error: `Unknown model: ${modelId}`,
      },
      responseTime: 0,
    };
  }

  // Progress tracking
  const sendProgress = (status: 'processing' | 'slow' | 'completed' | 'failed', message?: string) => {
    const elapsedTime = Date.now() - startTime;
    const progress = createProgressUpdate(modelId, elapsedTime, message);
    progress.status = status;
    onProgress?.(progress);
  };

  sendProgress('processing', 'Starting analysis...');

  // Try primary model first with caching
  try {
    sendProgress('processing', 'Analyzing market data...');
    
    // Use AI caching to avoid duplicate API calls
    const { result: response, cached, responseTimeMs } = await withAICaching(
      primaryConfig.id,
      asset,
      context,
      () => callModel(primaryConfig, asset, context),
      { ttlSeconds: AI_CACHE_TTL.MODEL_RESPONSE, trackPerformance: true }
    );
    
    const totalResponseTime = Date.now() - startTime;
    updateMetrics(primaryConfig.id, true, totalResponseTime);
    
    if (cached) {
      sendProgress('completed', 'Analysis complete (cached)');
    } else {
      sendProgress('completed', 'Analysis complete');
    }

    return {
      result: {
        id: primaryConfig.id,
        name: primaryConfig.name,
        sentiment: signalToSentiment(response.signal),
        confidence: response.confidence,
        reasoning: response.reasoning,
      },
      responseTime: totalResponseTime,
    };
  } catch (primaryError) {
    const primaryTime = Date.now() - startTime;
    updateMetrics(primaryConfig.id, false, primaryTime);

    const userError = primaryError instanceof ConsensusError 
      ? createUserFacingError(primaryError)
      : createUserFacingError(new ConsensusError(
          primaryError instanceof Error ? primaryError.message : 'Unknown error',
          ConsensusErrorType.API_ERROR,
          primaryConfig.id,
          primaryError
        ));

    const errorMsg = primaryError instanceof ConsensusError
      ? `${primaryError.type}: ${primaryError.message}`
      : primaryError instanceof Error ? primaryError.message : 'Unknown error';
    console.warn(`[${primaryConfig.id}] Primary failed: ${errorMsg}. Trying fallbacks...`);

    sendProgress('failed', `Primary model failed: ${userError.message}`);

    // Try fallback models with the SAME role prompt
    const fallbackIds = FALLBACK_ORDER[modelId] || [];
    for (const fallbackId of fallbackIds) {
      const fallbackProvider = ANALYST_MODELS.find((m) => m.id === fallbackId);
      if (!fallbackProvider) continue;

      // Check if fallback has an API key configured
      const fallbackKey = fallbackProvider.provider === 'google'
        ? getGeminiApiKey()
        : process.env[fallbackProvider.apiKeyEnv];
      if (!fallbackKey) continue;

      // Create config that uses fallback's provider but primary's role prompt
      const fallbackConfig: ModelConfig = {
        ...fallbackProvider,
        systemPrompt: primaryConfig.systemPrompt, // Keep the role identity
      };

      try {
        console.log(`[${primaryConfig.id}] Trying fallback: ${fallbackId}`);
        sendProgress('processing', `Trying fallback: ${fallbackProvider.name}...`);
        const response = await callModel(fallbackConfig, asset, context);
        const responseTime = Date.now() - startTime;
        updateMetrics(fallbackId, true, responseTime);
        sendProgress('completed', 'Fallback analysis complete');

        return {
          result: {
            id: primaryConfig.id, // Keep original role identity
            name: `${primaryConfig.name} (via ${fallbackProvider.name})`,
            sentiment: signalToSentiment(response.signal),
            confidence: response.confidence,
            reasoning: response.reasoning,
          },
          responseTime,
        };
      } catch (fallbackError) {
        const fbMsg = fallbackError instanceof ConsensusError
          ? fallbackError.type : 'error';
        console.warn(`[${primaryConfig.id}] Fallback ${fallbackId} failed: ${fbMsg}`);
        continue; // Try next fallback
      }
    }

    // All fallbacks exhausted
    const responseTime = Date.now() - startTime;
    console.error(`[${primaryConfig.id}] All fallbacks exhausted`);

    // Create final user-facing error with recovery guidance
    const finalUserError = createUserFacingError(new ConsensusError(
      'All models failed for this analyst role',
      ConsensusErrorType.API_ERROR,
      primaryConfig.id,
      primaryError
    ));

    return {
      result: {
        id: primaryConfig.id,
        name: primaryConfig.name,
        sentiment: 'neutral',
        confidence: 0,
        reasoning: '',
        error: `All models failed. Primary: ${errorMsg}`,
        userFacingError: finalUserError,
      },
      responseTime,
    };
  }
}

/**
 * Run all 5 analysts in parallel and aggregate results
 *
 * Enhanced with progress tracking and partial failure reporting. Uses
 * Promise.allSettled for resilience - continues even if some models fail.
 *
 * **Partial Failure Handling:**
 * - If ANY model succeeds, consensus calculation proceeds
 * - Failed models contribute neutral sentiment (0 confidence)
 * - Returns partialFailures object with summary of failed models
 *
 * **Progress Tracking:**
 * - onProgress: called when each analyst completes
 * - onModelProgress: called during each model's execution
 *
 * @param asset - Crypto asset symbol to analyze
 * @param context - Optional user-provided context
 * @param onProgress - Optional callback when each analyst completes
 * @param onModelProgress - Optional callback for model execution progress
 * @returns Aggregated consensus with all analyst results and timing data
 *
 * @example
 * ```ts
 * const { analysts, consensus, partialFailures } = await runConsensusAnalysis(
 *   'ETH',
 *   'Network upgrade approaching',
 *   (result) => console.log(`${result.name}: ${result.sentiment}`),
 *   (progress) => console.log(`${progress.modelId}: ${progress.status}`)
 * );
 * if (partialFailures) {
 *   console.log(`${partialFailures.failedCount} models failed`);
 * }
 * ```
 */
export async function runConsensusAnalysis(
  asset: string,
  context?: string,
  onProgress?: (result: AnalystResult) => void,
  onModelProgress?: (progress: ProgressUpdate) => void
): Promise<{
  analysts: AnalystResult[];
  consensus: ReturnType<typeof calculateConsensus>;
  responseTimes: Map<string, number>;
  partialFailures?: {
    failedModels: string[];
    failedCount: number;
    successCount: number;
    errorSummary: string;
    aggregatedError?: UserFacingError;
  };
}> {
  const responseTimes = new Map<string, number>();
  const failedModels: string[] = [];

  // Run all models in parallel using Promise.allSettled for resilience
  const promises = ANALYST_MODELS.map(async (config) => {
    const { result, responseTime } = await getAnalystOpinion(config.id, asset, context, onModelProgress);
    responseTimes.set(config.id, responseTime);

    // Track failures for partial failure reporting
    if (result.error) {
      failedModels.push(result.name);
    }

    // Report progress if callback provided
    if (onProgress) {
      onProgress(result);
    }

    return result;
  });

  const results = await Promise.allSettled(promises);

  // Extract results, handling any rejections
  const analysts: AnalystResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const config = ANALYST_MODELS[index];
      const errorResult = {
        id: config.id,
        name: config.name,
        sentiment: 'neutral' as const,
        confidence: 0,
        reasoning: '',
        error: result.reason?.message || 'Promise rejected',
      };
      failedModels.push(config.name);
      return errorResult;
    }
  });

  // Calculate consensus from all results
  const consensus = calculateConsensus(analysts);

  // Generate partial failure summary with aggregated error details
  let partialFailures;
  if (failedModels.length > 0) {
    const successCount = analysts.length - failedModels.length;
    const failedCount = failedModels.length;

    // Collect all user-facing errors for aggregation
    const userFacingErrors: UserFacingError[] = analysts
      .filter(a => a.error && a.userFacingError)
      .map(a => a.userFacingError!);

    // Aggregate errors if multiple failures with partial success context
    const aggregatedError = userFacingErrors.length > 0
      ? aggregateErrors(userFacingErrors, analysts.length, successCount)
      : undefined;

    partialFailures = {
      failedModels,
      failedCount,
      successCount,
      errorSummary: aggregatedError
        ? aggregatedError.message
        : `${failedCount} out of ${analysts.length} models failed. ${successCount} models provided successful analysis.`,
      aggregatedError, // Include the full aggregated error for frontend use
    };
  }

  return { analysts, consensus, responseTimes, partialFailures };
}

/**
 * Run all 5 analysts and return detailed consensus response
 * Implements strict 4/5 consensus logic with full tracking
 */
export async function runDetailedConsensusAnalysis(
  asset: string,
  context?: string,
  onModelProgress?: (progress: ProgressUpdate) => void
): Promise<ConsensusResponse> {
  const responseTimes = new Map<string, number>();

  // Run all models in parallel using Promise.allSettled for resilience
  const promises = ANALYST_MODELS.map(async (config) => {
    const { result, responseTime } = await getAnalystOpinion(config.id, asset, context, onModelProgress);
    responseTimes.set(config.id, responseTime);
    return result;
  });

  const results = await Promise.allSettled(promises);

  // Extract results, handling any rejections
  const analysts: AnalystResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const config = ANALYST_MODELS[index];
      return {
        id: config.id,
        name: config.name,
        sentiment: 'neutral' as const,
        confidence: 0,
        reasoning: '',
        error: result.reason?.message || 'Promise rejected',
      };
    }
  });

  // Calculate detailed consensus with 4/5 threshold
  return calculateConsensusDetailed(analysts, responseTimes);
}

/**
 * Stream results as they come in (for SSE)
 * Enhanced with progress updates
 */
export async function* streamConsensusAnalysis(
  asset: string,
  context?: string,
  onModelProgress?: (progress: ProgressUpdate) => void
): AsyncGenerator<AnalystResult | { type: 'consensus'; data: ReturnType<typeof calculateConsensus> } | { type: 'progress'; data: ProgressUpdate }> {
  const results: AnalystResult[] = [];

  // Create promises that yield as they complete
  const promises = ANALYST_MODELS.map(async (config) => {
    const { result } = await getAnalystOpinion(config.id, asset, context, onModelProgress);
    return result;
  });

  // Use Promise.race pattern to yield results as they complete
  const pending = [...promises];
  const completed: Set<number> = new Set();

  while (completed.size < ANALYST_MODELS.length) {
    const racePromises = pending.map((p, i) =>
      completed.has(i) ? new Promise<never>(() => {}) : p.then((result) => ({ index: i, result }))
    );

    const { index, result } = await Promise.race(racePromises);
    completed.add(index);
    results.push(result);

    yield result;
  }

  // Finally yield the consensus
  const consensus = calculateConsensus(results);
  yield { type: 'consensus', data: consensus };
}
