/**
 * Consensus SSE Streaming Endpoint
 * GET /api/consensus/stream?query=...
 *
 * Streams real-time updates as each AI analyst responds
 */

import { NextRequest } from 'next/server';
import { MODELS } from '@/lib/models';
import type { ModelConfig, AnalystResponse, Signal } from '@/lib/models';

export const runtime = 'edge';
export const maxDuration = 60;

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

function parseModelResponse(response: string, config: ModelConfig): Partial<AnalystResponse> {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validSignals: Signal[] = ['BUY', 'SELL', 'HOLD'];
    const signal = (parsed.signal?.toUpperCase() as Signal) || 'HOLD';

    if (!validSignals.includes(signal)) {
      throw new Error(`Invalid signal: ${parsed.signal}`);
    }

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

async function callModel(
  query: string,
  config: ModelConfig
): Promise<AnalystResponse> {
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
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    let responseText: string;

    if (config.provider === 'google') {
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return new Response('Query parameter is required', { status: 400 });
  }

  if (query.length < 5 || query.length > 500) {
    return new Response('Query must be 5-500 characters', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'start', query, timestamp: Date.now() })}\n\n`)
        );

        // Query each model and stream results as they complete
        const promises = MODELS.map(async (config) => {
          const result = await callModel(query, config);

          // Send the individual analyst response
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'analyst', data: result })}\n\n`)
          );

          return result;
        });

        // Wait for all to complete
        const allResults = await Promise.all(promises);

        // Calculate final consensus
        const validSignals = allResults.filter(s => !s.error);
        const counts: Record<Signal, number> = { BUY: 0, SELL: 0, HOLD: 0 };
        validSignals.forEach(s => counts[s.signal]++);

        const maxCount = Math.max(counts.BUY, counts.SELL, counts.HOLD);
        const consensusSignal: Signal = counts.BUY === maxCount ? 'BUY'
          : counts.SELL === maxCount ? 'SELL'
          : 'HOLD';

        const confidenceAverage = validSignals.length > 0
          ? Math.round(validSignals.reduce((sum, s) => sum + s.confidence, 0) / validSignals.length)
          : 0;

        // Send final consensus event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            data: {
              consensus: maxCount >= 4 ? consensusSignal : null,
              consensusCount: maxCount,
              totalResponses: allResults.length,
              confidenceAverage,
              hasConsensus: maxCount >= 4,
              timestamp: Date.now(),
            }
          })}\n\n`)
        );

        controller.close();
      } catch (error) {
        console.error('SSE streaming error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
