/**
 * Consensus Vault - Consensus Engine
 * Orchestrates 5 AI models in parallel for crypto analysis
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

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_BACKOFF_MULTIPLIER = 2;

// Performance tracking
interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

const metricsPerModel: Record<string, RequestMetrics> = {};

/**
 * Call a single AI model with the analysis prompt
 * Includes automatic retry with exponential backoff
 */
async function callModel(
  config: ModelConfig,
  asset: string,
  context?: string,
  retryCount = 0
): Promise<ModelResponse> {
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    throw new Error(
      `Missing API key for ${config.name} (${config.id}). ` +
      `Please set environment variable: ${config.apiKeyEnv}`
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

  const userPrompt = `Analyze ${asset} for a trading signal. ${context || 'Provide your expert analysis based on current market conditions.'}`;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

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

      data = await response.json();
      const geminiData = data as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        const errorMsg = geminiData.error?.message || `HTTP ${response.status}`;
        throw new Error(`${config.name} API error: ${errorMsg} (analyzing ${asset})`);
      }

      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseModelResponse(text);
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

      data = await response.json();
      const anthropicData = data as {
        content?: Array<{ text?: string }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        const errorMsg = anthropicData.error?.message || `HTTP ${response.status}`;
        throw new Error(`${config.name} API error: ${errorMsg} (analyzing ${asset})`);
      }

      const text = anthropicData.content?.[0]?.text || '';
      return parseModelResponse(text);
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

      data = await response.json();
      const openaiData = data as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        const errorMsg = openaiData.error?.message || `HTTP ${response.status}`;
        throw new Error(`${config.name} API error: ${errorMsg} (analyzing ${asset})`);
      }

      const text = openaiData.choices?.[0]?.message?.content || '';
      return parseModelResponse(text);
    }
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF_MULTIPLIER, retryCount);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[${config.id}] Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms (${errorMsg})`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return callModel(config, asset, context, retryCount + 1);
    }

    // Max retries exceeded, throw the error
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse the model's text response into structured format
 */
function parseModelResponse(text: string): ModelResponse {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from model');
  }

  // Try to extract JSON from the response (supports both direct JSON and markdown code blocks)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response. Expected format: {"signal": "buy|sell|hold", "confidence": 0-100, "reasoning": "..."}');
  }

  const jsonText = jsonMatch[1] || jsonMatch[0];

  try {
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.signal) {
      throw new Error('Missing required field: signal');
    }

    // Validate and normalize the signal
    const signal = String(parsed.signal).toLowerCase().trim();
    if (!['buy', 'sell', 'hold'].includes(signal)) {
      throw new Error(`Invalid signal: "${signal}". Must be one of: buy, sell, hold`);
    }

    // Validate and normalize confidence
    const rawConfidence = parsed.confidence;
    if (rawConfidence === undefined || rawConfidence === null) {
      throw new Error('Missing required field: confidence');
    }

    const confidence = Math.min(100, Math.max(0, Number(rawConfidence)));
    if (isNaN(confidence)) {
      throw new Error(`Invalid confidence value: ${rawConfidence}. Must be a number between 0-100`);
    }

    // Normalize reasoning
    const reasoning = parsed.reasoning ? String(parsed.reasoning).trim() : 'No reasoning provided';
    if (reasoning === 'No reasoning provided') {
      console.warn('Warning: Model did not provide reasoning');
    }

    return {
      signal: signal as 'buy' | 'sell' | 'hold',
      confidence,
      reasoning,
    };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown parsing error';
    throw new Error(`Failed to parse model response: ${errorMsg}`);
  }
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
 * Get analysis from a single model, with error handling and timing
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
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Track failed request
    updateMetrics(config.id, false, responseTime);

    console.error(`[${config.id}] Error:`, message);
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
