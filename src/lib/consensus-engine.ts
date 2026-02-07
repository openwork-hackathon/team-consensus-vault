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

/**
 * Call a single AI model with the analysis prompt
 */
async function callModel(
  config: ModelConfig,
  asset: string,
  context?: string
): Promise<ModelResponse> {
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
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
        throw new Error(geminiData.error?.message || `Gemini API error: ${response.status}`);
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
        throw new Error(anthropicData.error?.message || `API error: ${response.status}`);
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
        throw new Error(openaiData.error?.message || `API error: ${response.status}`);
      }

      const text = openaiData.choices?.[0]?.message?.content || '';
      return parseModelResponse(text);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse the model's text response into structured format
 */
function parseModelResponse(text: string): ModelResponse {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    const signal = String(parsed.signal || 'hold').toLowerCase();
    if (!['buy', 'sell', 'hold'].includes(signal)) {
      throw new Error(`Invalid signal: ${signal}`);
    }

    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 50));
    const reasoning = String(parsed.reasoning || 'No reasoning provided');

    return {
      signal: signal as 'buy' | 'sell' | 'hold',
      confidence,
      reasoning,
    };
  } catch (e) {
    throw new Error(`Failed to parse response: ${e}`);
  }
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
