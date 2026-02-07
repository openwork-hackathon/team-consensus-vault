/**
 * Consensus Engine - Orchestrates 5 AI models to generate trading signals
 */

import {
  MODELS,
  ModelConfig,
  AnalystResponse,
  ConsensusResult,
  Signal,
  CONSENSUS_THRESHOLD,
  TIMEOUT_MS,
} from './models';

// Create the analyst prompt for each model
function createAnalystPrompt(query: string, config: ModelConfig): string {
  return `You are ${config.name}, a ${config.role} AI analyst for a crypto trading vault.

YOUR ROLE: ${config.roleDescription}

A user is asking about a potential trade. Analyze the situation from your specialized perspective.

USER QUERY: "${query}"

You MUST respond in the following JSON format ONLY (no markdown, no extra text):
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <number 0-100>,
  "reasoning": "<brief explanation in 2-3 sentences>"
}

Guidelines:
- BUY: You believe the trade should be executed, opportunity outweighs risk
- SELL: You believe the position should be exited or shorted
- HOLD: You're uncertain or believe waiting is the best strategy
- Confidence should reflect how certain you are (0=guessing, 100=absolute conviction)
- Reasoning should be specific to your role as ${config.role}

Respond with ONLY the JSON object, nothing else.`;
}

// Parse model response into structured format
function parseModelResponse(response: string, config: ModelConfig): Partial<AnalystResponse> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate signal
    const validSignals: Signal[] = ['BUY', 'SELL', 'HOLD'];
    const signal = (parsed.signal?.toUpperCase() as Signal) || 'HOLD';
    if (!validSignals.includes(signal)) {
      throw new Error(`Invalid signal: ${parsed.signal}`);
    }

    // Validate confidence
    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 50));

    return {
      signal,
      confidence,
      reasoning: String(parsed.reasoning || 'No reasoning provided'),
    };
  } catch (error) {
    console.error(`Failed to parse response from ${config.name}:`, error);
    return {
      signal: 'HOLD',
      confidence: 0,
      reasoning: 'Failed to parse model response',
      error: String(error),
    };
  }
}

// Call a single model with timeout
async function callModel(
  query: string,
  config: ModelConfig
): Promise<AnalystResponse> {
  const startTime = Date.now();
  const apiKey = process.env[config.envKey];

  if (!apiKey) {
    return {
      agentId: config.id,
      agentName: config.name,
      role: config.role,
      signal: 'HOLD',
      confidence: 0,
      reasoning: `API key not configured for ${config.name}`,
      timestamp: Date.now(),
      error: 'Missing API key',
    };
  }

  const prompt = createAnalystPrompt(query, config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let responseText: string;

    if (config.provider === 'google') {
      // Gemini API uses different format
      const response = await fetch(
        `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
          }),
          signal: controller.signal,
        }
      );
      const data = await response.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (config.provider === 'anthropic') {
      // Anthropic-compatible API
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      responseText = data?.content?.[0]?.text || '';
    } else {
      // OpenAI-compatible API (DeepSeek, Kimi, MiniMax)
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      responseText = data?.choices?.[0]?.message?.content || '';
    }

    clearTimeout(timeout);

    const parsed = parseModelResponse(responseText, config);

    return {
      agentId: config.id,
      agentName: config.name,
      role: config.role,
      signal: parsed.signal || 'HOLD',
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning || 'No response',
      timestamp: Date.now(),
      error: parsed.error,
    };
  } catch (error) {
    clearTimeout(timeout);
    const isTimeout = (error as Error).name === 'AbortError';

    return {
      agentId: config.id,
      agentName: config.name,
      role: config.role,
      signal: 'HOLD',
      confidence: 0,
      reasoning: isTimeout ? 'Request timed out' : 'Request failed',
      timestamp: Date.now(),
      error: String(error),
    };
  }
}

// Calculate consensus from all signals
function calculateConsensus(signals: AnalystResponse[]): {
  consensus: Signal | null;
  consensusCount: number;
  hasConsensus: boolean;
} {
  const validSignals = signals.filter(s => !s.error);

  if (validSignals.length === 0) {
    return { consensus: null, consensusCount: 0, hasConsensus: false };
  }

  // Count each signal type
  const counts: Record<Signal, number> = { BUY: 0, SELL: 0, HOLD: 0 };
  validSignals.forEach(s => {
    counts[s.signal]++;
  });

  // Find the most common signal
  const maxCount = Math.max(counts.BUY, counts.SELL, counts.HOLD);
  const consensusSignal: Signal = counts.BUY === maxCount ? 'BUY'
    : counts.SELL === maxCount ? 'SELL'
    : 'HOLD';

  return {
    consensus: maxCount >= CONSENSUS_THRESHOLD ? consensusSignal : null,
    consensusCount: maxCount,
    hasConsensus: maxCount >= CONSENSUS_THRESHOLD,
  };
}

// Main consensus query function
export async function queryConsensus(query: string): Promise<ConsensusResult> {
  const timestamp = Date.now();

  // Call all models in parallel
  const signals = await Promise.all(
    MODELS.map(config => callModel(query, config))
  );

  // Calculate consensus
  const { consensus, consensusCount, hasConsensus } = calculateConsensus(signals);

  // Calculate average confidence (only from valid responses)
  const validSignals = signals.filter(s => !s.error);
  const confidenceAverage = validSignals.length > 0
    ? Math.round(validSignals.reduce((sum, s) => sum + s.confidence, 0) / validSignals.length)
    : 0;

  return {
    query,
    timestamp,
    signals,
    consensus,
    consensusCount,
    totalResponses: signals.length,
    confidenceAverage,
    hasConsensus,
  };
}
