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

// Error types for better error handling
export enum ConsensusErrorType {
  TIMEOUT = 'TIMEOUT',
  API_ERROR = 'API_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

export class ConsensusError extends Error {
  constructor(
    message: string,
    public type: ConsensusErrorType,
    public modelId?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ConsensusError';
  }
}

/**
 * Create user-facing error messages with recovery guidance
 */
function createUserFacingError(error: ConsensusError): UserFacingError {
  const { type, message, modelId, originalError } = error;
  
  switch (type) {
    case ConsensusErrorType.RATE_LIMIT:
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded - please wait before trying again',
        severity: 'warning',
        recoveryGuidance: 'Wait 30-60 seconds before submitting another request. Consider reducing query frequency.',
        retryable: true,
        modelId,
        estimatedWaitTime: 45000, // 45 seconds average
      };
      
    case ConsensusErrorType.TIMEOUT:
      return {
        type: 'timeout',
        message: 'Request timed out - the model is taking longer than expected',
        severity: 'warning',
        recoveryGuidance: 'The model may be experiencing high load. Try again in a few moments.',
        retryable: true,
        modelId,
      };
      
    case ConsensusErrorType.NETWORK_ERROR:
      return {
        type: 'network',
        message: 'Network connection issue - unable to reach the model',
        severity: 'warning',
        recoveryGuidance: 'Check your internet connection and try again. If the issue persists, the service may be temporarily unavailable.',
        retryable: true,
        modelId,
      };
      
    case ConsensusErrorType.MISSING_API_KEY:
      return {
        type: 'configuration',
        message: 'API configuration missing - service unavailable',
        severity: 'critical',
        recoveryGuidance: 'This is a server configuration issue. Please contact support or try again later.',
        retryable: false,
        modelId,
      };
      
    case ConsensusErrorType.PARSE_ERROR:
      return {
        type: 'parse_error',
        message: 'Received invalid response from model',
        severity: 'warning',
        recoveryGuidance: 'The model returned an unexpected response. This usually resolves automatically.',
        retryable: true,
        modelId,
      };
      
    case ConsensusErrorType.API_ERROR:
      if (originalError && typeof originalError === 'object' && 'message' in originalError) {
        const errorMsg = (originalError as { message?: string }).message || '';
        if (errorMsg.includes('quota') || errorMsg.includes('billing')) {
          return {
            type: 'quota_exceeded',
            message: 'API quota exceeded - service temporarily unavailable',
            severity: 'critical',
            recoveryGuidance: 'This is a temporary service limitation. Please try again later.',
            retryable: false,
            modelId,
          };
        }
      }
      return {
        type: 'api_error',
        message: 'Model service temporarily unavailable',
        severity: 'warning',
        recoveryGuidance: 'The model service is experiencing issues. Try again in a few minutes.',
        retryable: true,
        modelId,
      };
      
    case ConsensusErrorType.INVALID_RESPONSE:
      return {
        type: 'invalid_response',
        message: 'Received empty or malformed response from model',
        severity: 'warning',
        recoveryGuidance: 'The model service returned an unexpected response. This usually resolves automatically.',
        retryable: true,
        modelId,
      };
      
    default:
      return {
        type: 'unknown_error',
        message: 'An unexpected error occurred',
        severity: 'warning',
        recoveryGuidance: 'Please try again. If the issue persists, contact support.',
        retryable: true,
        modelId,
      };
  }
}

/**
 * Create progress update for slow models
 */
function createProgressUpdate(modelId: string, elapsedTime: number, message?: string): ProgressUpdate {
  const isSlow = elapsedTime > 15000; // 15 seconds
  const estimatedRemaining = elapsedTime * 0.5; // Rough estimate
  
  return {
    modelId,
    status: isSlow ? 'slow' : 'processing',
    message: message || (isSlow ? 'Taking longer than expected...' : 'Processing...'),
    elapsedTime,
    estimatedRemainingTime: estimatedRemaining,
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
 * Enhanced with retry logic, better error handling, and performance tracking
 */
async function callModel(
  config: ModelConfig,
  asset: string,
  context?: string,
  retryCount = 0
): Promise<ModelResponse> {
  // Use Gemini key pool for Google provider, standard env var for others
  const apiKey = config.provider === 'google'
    ? getGeminiApiKey()
    : process.env[config.apiKeyEnv];

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
      response = await fetch(
        `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
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
          }),
        }
      );

      if (!response.ok) {
        let geminiErrorData: { error?: { message?: string; code?: number } } = {};
        try {
          data = await response.json();
          geminiErrorData = data as typeof geminiErrorData;
        } catch {
          // Response body may not be valid JSON
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

        throw new ConsensusError(
          geminiErrorData.error?.message || `Gemini API error: ${response.status}`,
          ConsensusErrorType.API_ERROR,
          config.id,
          geminiErrorData.error
        );
      }

      data = await response.json();
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

      return parseModelResponse(text, config.id);
    } else if (config.provider === 'anthropic') {
      // Anthropic-compatible API (GLM, Kimi)
      response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          system: config.systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        let anthropicErrorData: { error?: { message?: string; type?: string } } = {};
        try {
          data = await response.json();
          anthropicErrorData = data as typeof anthropicErrorData;
        } catch {
          // Response body may not be valid JSON (e.g., HTML error page)
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

        throw new ConsensusError(
          anthropicErrorData.error?.message || `API error: ${response.status} from ${config.baseUrl}/messages (model: ${config.model})`,
          ConsensusErrorType.API_ERROR,
          config.id,
          anthropicErrorData.error
        );
      }

      data = await response.json();
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

      return parseModelResponse(text, config.id);
    } else {
      // OpenAI-compatible API (DeepSeek, MiniMax)
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        let openaiErrorData: { error?: { message?: string; type?: string; code?: string } } = {};
        try {
          data = await response.json();
          openaiErrorData = data as typeof openaiErrorData;
        } catch {
          // Response body may not be valid JSON (e.g., HTML error page)
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

        throw new ConsensusError(
          openaiErrorData.error?.message || `API error: ${response.status} from ${config.baseUrl}/chat/completions (model: ${config.model})`,
          ConsensusErrorType.API_ERROR,
          config.id,
          openaiErrorData.error
        );
      }

      data = await response.json();
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

      return parseModelResponse(text, config.id);
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
        'Network error during API call',
        ConsensusErrorType.NETWORK_ERROR,
        config.id,
        error
      );
    }

    // Re-throw ConsensusErrors with retry logic
    if (error instanceof ConsensusError) {
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
    throw new ConsensusError(
      error instanceof Error ? error.message : 'Unknown error',
      ConsensusErrorType.API_ERROR,
      config.id,
      error
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse the model's text response into structured format
 * Enhanced with better error handling and validation
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
        ConsensusErrorType.PARSE_ERROR,
        modelId
      );
    }

    // Validate and normalize confidence
    const rawConfidence = parsed.confidence;
    if (rawConfidence === undefined || rawConfidence === null) {
      throw new ConsensusError(
        'Missing required field: confidence',
        ConsensusErrorType.PARSE_ERROR,
        modelId
      );
    }

    const confidence = Math.min(100, Math.max(0, Number(rawConfidence) || 0));
    if (isNaN(confidence)) {
      throw new ConsensusError(
        `Invalid confidence value: "${rawConfidence}". Must be a number between 0-100`,
        ConsensusErrorType.PARSE_ERROR,
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
        ConsensusErrorType.PARSE_ERROR,
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
 * Get analysis from a single model, with fallback to alternative models.
 * When the primary model fails (after retries), tries fallback models
 * using the same role prompt for continuity.
 * Enhanced with progress tracking and user-facing error messages.
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

  // Try primary model first
  try {
    sendProgress('processing', 'Analyzing market data...');
    const response = await callModel(primaryConfig, asset, context);
    const responseTime = Date.now() - startTime;
    updateMetrics(primaryConfig.id, true, responseTime);
    sendProgress('completed', 'Analysis complete');

    return {
      result: {
        id: primaryConfig.id,
        name: primaryConfig.name,
        sentiment: signalToSentiment(response.signal),
        confidence: response.confidence,
        reasoning: response.reasoning,
      },
      responseTime,
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
 * Enhanced with progress tracking and partial failure reporting
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

  // Generate partial failure summary
  let partialFailures;
  if (failedModels.length > 0) {
    const successCount = analysts.length - failedModels.length;
    const failedCount = failedModels.length;
    
    partialFailures = {
      failedModels,
      failedCount,
      successCount,
      errorSummary: `${failedCount} out of ${analysts.length} models failed. ${successCount} models provided successful analysis.`,
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
