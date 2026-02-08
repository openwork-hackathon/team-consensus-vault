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
  ModelConfig,
  ModelResponse,
  AnalystResult,
  signalToSentiment,
  calculateConsensus,
  calculateConsensusDetailed,
  ConsensusResponse,
} from './models';

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
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_BACKOFF_MULTIPLIER = 2;

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
  const apiKey = process.env[config.apiKeyEnv];

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
        data = await response.json();
        const geminiData = data as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          error?: { message?: string; code?: number };
        };

        // Check for rate limiting
        if (response.status === 429 || geminiData.error?.code === 429) {
          throw new ConsensusError(
            'Rate limit exceeded',
            ConsensusErrorType.RATE_LIMIT,
            config.id,
            geminiData.error
          );
        }

        throw new ConsensusError(
          geminiData.error?.message || `Gemini API error: ${response.status}`,
          ConsensusErrorType.API_ERROR,
          config.id,
          geminiData.error
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
      // Anthropic-compatible API (GLM)
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
        data = await response.json();
        const anthropicData = data as {
          content?: Array<{ text?: string }>;
          error?: { message?: string; type?: string };
        };

        // Check for rate limiting
        if (response.status === 429 || anthropicData.error?.type === 'rate_limit_error') {
          throw new ConsensusError(
            'Rate limit exceeded',
            ConsensusErrorType.RATE_LIMIT,
            config.id,
            anthropicData.error
          );
        }

        throw new ConsensusError(
          anthropicData.error?.message || `API error: ${response.status}`,
          ConsensusErrorType.API_ERROR,
          config.id,
          anthropicData.error
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
          'Empty response from Anthropic API',
          ConsensusErrorType.INVALID_RESPONSE,
          config.id
        );
      }

      return parseModelResponse(text, config.id);
    } else {
      // OpenAI-compatible API (DeepSeek, Kimi, MiniMax)
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
        data = await response.json();
        const openaiData = data as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string; type?: string; code?: string };
        };

        // Check for rate limiting
        if (
          response.status === 429 ||
          openaiData.error?.type === 'rate_limit_exceeded' ||
          openaiData.error?.code === 'rate_limit_exceeded'
        ) {
          throw new ConsensusError(
            'Rate limit exceeded',
            ConsensusErrorType.RATE_LIMIT,
            config.id,
            openaiData.error
          );
        }

        throw new ConsensusError(
          openaiData.error?.message || `API error: ${response.status}`,
          ConsensusErrorType.API_ERROR,
          config.id,
          openaiData.error
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
          'Empty response from OpenAI API',
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
 * Get analysis from a single model, with enhanced error handling and timing
 */
export async function getAnalystOpinion(
  modelId: string,
  asset: string,
  context?: string
): Promise<{ result: AnalystResult; responseTime: number }> {
  const startTime = Date.now();
  const config = ANALYST_MODELS.find((m) => m.id === modelId);

  if (!config) {
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

  try {
    const response = await callModel(config, asset, context);
    const responseTime = Date.now() - startTime;

    // Track successful request
    updateMetrics(config.id, true, responseTime);

    return {
      result: {
        id: config.id,
        name: config.name,
        sentiment: signalToSentiment(response.signal),
        confidence: response.confidence,
        reasoning: response.reasoning,
      },
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Enhanced error logging with structured information
    if (error instanceof ConsensusError) {
      console.error(
        `[${config.id}] ${error.type}:`,
        error.message,
        error.originalError ? `(Original: ${error.originalError})` : ''
      );

      // Track failed request
      updateMetrics(config.id, false, responseTime);

      return {
        result: {
          id: config.id,
          name: config.name,
          sentiment: 'neutral',
          confidence: 0,
          reasoning: '',
          error: `${error.type}: ${error.message}`,
        },
        responseTime,
      };
    }

    // Fallback for non-ConsensusError exceptions
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Track failed request
    updateMetrics(config.id, false, responseTime);

    console.error(`[${config.id}] Unexpected error:`, message, error);

    return {
      result: {
        id: config.id,
        name: config.name,
        sentiment: 'neutral',
        confidence: 0,
        reasoning: '',
        error: message,
      },
      responseTime,
    };
  }
}

/**
 * Run all 5 analysts in parallel and aggregate results
 */
export async function runConsensusAnalysis(
  asset: string,
  context?: string,
  onProgress?: (result: AnalystResult) => void
): Promise<{
  analysts: AnalystResult[];
  consensus: ReturnType<typeof calculateConsensus>;
  responseTimes: Map<string, number>;
}> {
  const responseTimes = new Map<string, number>();

  // Run all models in parallel using Promise.allSettled for resilience
  const promises = ANALYST_MODELS.map(async (config) => {
    const { result, responseTime } = await getAnalystOpinion(config.id, asset, context);
    responseTimes.set(config.id, responseTime);

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

  // Calculate consensus from all results
  const consensus = calculateConsensus(analysts);

  return { analysts, consensus, responseTimes };
}

/**
 * Run all 5 analysts and return detailed consensus response
 * Implements strict 4/5 consensus logic with full tracking
 */
export async function runDetailedConsensusAnalysis(
  asset: string,
  context?: string
): Promise<ConsensusResponse> {
  const responseTimes = new Map<string, number>();

  // Run all models in parallel using Promise.allSettled for resilience
  const promises = ANALYST_MODELS.map(async (config) => {
    const { result, responseTime } = await getAnalystOpinion(config.id, asset, context);
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
 */
export async function* streamConsensusAnalysis(
  asset: string,
  context?: string
): AsyncGenerator<AnalystResult | { type: 'consensus'; data: ReturnType<typeof calculateConsensus> }> {
  const results: AnalystResult[] = [];

  // Create promises that yield as they complete
  const promises = ANALYST_MODELS.map(async (config) => {
    const { result } = await getAnalystOpinion(config.id, asset, context);
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
