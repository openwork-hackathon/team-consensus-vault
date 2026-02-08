import { NextRequest, NextResponse } from 'next/server';
import { runConsensusAnalysis } from '@/lib/consensus-engine';
import { AnalystResult, ANALYST_MODELS, ModelConfig, ModelResponse } from '@/lib/models';
import { 
  checkRateLimit, 
  createRateLimitResponse, 
  addRateLimitHeaders,
  CONSENSUS_RATE_LIMIT 
} from '@/lib/rate-limit';
import { createApiLogger } from '@/lib/api-logger';

// Use mock data when API keys aren't available (development mode)
const USE_MOCK = process.env.NODE_ENV === 'development' && !process.env.DEEPSEEK_API_KEY;

/**
 * SSE endpoint for streaming consensus analysis
 * GET /api/consensus?asset=BTC&context=optional context
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger(request);
  
  try {
    logger.logRequest();
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(request, CONSENSUS_RATE_LIMIT);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
      return createRateLimitResponse(
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset
      );
    }

    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'BTC';
    const context = searchParams.get('context') || undefined;

    logger.info('Starting SSE consensus stream', { 
      asset, 
      hasContext: !!context,
      useMock: USE_MOCK,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Send initial connection message
        sendEvent({ 
          type: 'connected', 
          asset,
          requestId: logger.getRequestId(),
        });

        try {
          if (USE_MOCK) {
            logger.info('Using mock data for development');
            await streamMockAnalysis(sendEvent, request.signal);
          } else {
            // Real API calls
            await streamRealAnalysis(asset, context, sendEvent, request.signal, logger);
          }
        } catch (error) {
          logger.logError(error instanceof Error ? error : new Error(String(error)), {
            endpoint: 'consensus',
            method: 'GET',
            streamType: 'SSE',
          });
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            requestId: logger.getRequestId(),
          });
        }

        // Set up keepalive
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          } catch {
            clearInterval(keepAliveInterval);
          }
        }, 30000);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          logger.info('SSE stream aborted by client');
          clearInterval(keepAliveInterval);
          controller.close();
        });
      },
    });

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Request-ID': logger.getRequestId(),
      },
    });

    // Log response start (streaming responses are logged differently)
    logger.info('SSE stream started', {
      asset,
      requestId: logger.getRequestId(),
      responseType: 'stream',
    });

    return response;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: 'consensus',
      method: 'GET',
      stage: 'initialization',
    });
    
    // Return error response for non-streaming errors
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: logger.getRequestId(),
      },
      { status: 500 }
    );
  }
}

/**
 * Stream real API analysis results
 */
async function streamRealAnalysis(
  asset: string,
  context: string | undefined,
  sendEvent: (data: object) => void,
  signal: AbortSignal
) {
  const results: AnalystResult[] = [];

  // Use the consensus engine with progress callback
  const { analysts, consensus, responseTimes } = await runConsensusAnalysis(
    asset,
    context,
    (result) => {
      // Stream each result as it comes in
      if (!signal.aborted) {
        sendEvent({
          id: result.id,
          sentiment: result.sentiment,
          confidence: result.confidence,
          reasoning: result.reasoning,
          error: result.error,
        });
        results.push(result);
      }
    }
  );

  // Send final consensus
  if (!signal.aborted) {
    sendEvent({
      type: 'consensus',
      consensusLevel: consensus.consensusLevel,
      recommendation: consensus.recommendation,
      signal: consensus.signal,
    });

    sendEvent({ type: 'complete' });
  }
}

/**
 * Mock streaming for development
 */
async function streamMockAnalysis(
  sendEvent: (data: object) => void,
  signal: AbortSignal
) {
  const mockAnalysts = [
    {
      id: 'deepseek',
      sentiment: 'bullish',
      confidence: 85,
      reasoning:
        'Technical indicators show strong upward momentum. RSI cooling from overbought levels, MACD golden cross confirmed.',
      delay: 1500,
    },
    {
      id: 'kimi',
      sentiment: 'bullish',
      confidence: 78,
      reasoning:
        'Large holders accumulating aggressively. Exchange outflows at 3-month highs indicate strong conviction.',
      delay: 2200,
    },
    {
      id: 'minimax',
      sentiment: 'bullish',
      confidence: 82,
      reasoning:
        'Social sentiment extremely positive. Crypto Twitter engagement up 40%, Fear & Greed entering greed territory.',
      delay: 1800,
    },
    {
      id: 'glm',
      sentiment: 'bullish',
      confidence: 91,
      reasoning:
        'On-chain metrics strong. Active addresses up 25%, TVL growing across major DeFi protocols.',
      delay: 2500,
    },
    {
      id: 'gemini',
      sentiment: 'neutral',
      confidence: 65,
      reasoning:
        'Risk/reward adequate but not exceptional. Elevated funding rates and regulatory uncertainty warrant caution.',
      delay: 3000,
    },
  ];

  // Stream mock analyst updates with delays
  for (const analyst of mockAnalysts) {
    if (signal.aborted) break;
    await new Promise((resolve) => setTimeout(resolve, analyst.delay));
    if (signal.aborted) break;
    sendEvent({
      id: analyst.id,
      sentiment: analyst.sentiment,
      confidence: analyst.confidence,
      reasoning: analyst.reasoning,
    });
  }

  // Calculate mock consensus (4/5 bullish = 80% agreement)
  if (!signal.aborted) {
    sendEvent({
      type: 'consensus',
      consensusLevel: 78,
      recommendation: 'BUY',
      signal: 'buy',
    });

    sendEvent({ type: 'complete' });
  }
}

/**
 * POST endpoint for non-streaming consensus analysis
 * Returns all results at once
 */
export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit(request, CONSENSUS_RATE_LIMIT);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    );
  }

  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Missing or invalid query parameter' },
        { status: 400 }
      );
    }

    if (USE_MOCK) {
      // Return mock data for development
      return Response.json({
        consensus: 'Based on analysis from 5 AI models, the consensus suggests a bullish outlook with high confidence.',
        individual_responses: [
          { model: 'deepseek', response: 'Strong technical setup with bullish momentum.', status: 'success' },
          { model: 'kimi', response: 'Whales accumulating aggressively.', status: 'success' },
          { model: 'minimax', response: 'Positive social sentiment detected.', status: 'success' },
          { model: 'glm', response: 'Strong on-chain metrics indicate growth.', status: 'success' },
          { model: 'gemini', response: 'Moderate risk profile, proceed with caution.', status: 'success' },
        ],
        metadata: {
          total_time_ms: 2500,
          models_succeeded: 5,
        },
      });
    }

    // Call all 5 models in parallel with individual timeout handling
    const modelResults = await Promise.allSettled(
      ANALYST_MODELS.map(async (config) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const result = await callModelWithQuery(config, query, controller.signal);
          clearTimeout(timeoutId);
          return {
            model: config.id,
            response: result.reasoning,
            status: 'success' as const,
          };
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') {
            return {
              model: config.id,
              response: 'Request timed out after 30 seconds',
              status: 'timeout' as const,
            };
          }
          return {
            model: config.id,
            response: error instanceof Error ? error.message : 'Unknown error',
            status: 'error' as const,
          };
        }
      })
    );

    // Extract individual responses and calculate success count
    const individual_responses = modelResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          model: ANALYST_MODELS[index].id,
          response: 'Promise rejected unexpectedly',
          status: 'error' as const,
        };
      }
    });

    const models_succeeded = individual_responses.filter(
      (r) => r.status === 'success'
    ).length;

    // Generate consensus from successful responses
    const successfulResponses = individual_responses
      .filter((r) => r.status === 'success')
      .map((r) => r.response);

    const consensus =
      models_succeeded >= 3
        ? generateConsensus(successfulResponses, query)
        : 'Unable to generate consensus - insufficient successful responses from models.';

    const total_time_ms = Date.now() - startTime;

    const response = Response.json({
      consensus,
      individual_responses,
      metadata: {
        total_time_ms,
        models_succeeded,
      },
    });

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));

    return response;
  } catch (error) {
    console.error('Consensus API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Call a model with a generic query (not crypto-specific)
 */
async function callModelWithQuery(
  config: ModelConfig,
  query: string,
  signal: AbortSignal
): Promise<ModelResponse> {
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  // Generic system prompt for general queries
  const systemPrompt = `You are ${config.name}, an AI assistant specialized in ${config.role.toLowerCase()}.
Provide clear, concise analysis from your area of expertise. Respond with only a valid JSON object in this format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your analysis in 1-2 sentences"}`;

  try {
    let response: Response;
    let data: unknown;

    if (config.provider === 'google') {
      // Gemini API
      response = await fetch(
        `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt + '\n\n' + query }],
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
        throw new Error(
          geminiData.error?.message || `Gemini API error: ${response.status}`
        );
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
        signal,
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: query }],
        }),
      });

      data = await response.json();
      const anthropicData = data as {
        content?: Array<{ text?: string }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(
          anthropicData.error?.message || `API error: ${response.status}`
        );
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
        signal,
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
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
        throw new Error(
          openaiData.error?.message || `API error: ${response.status}`
        );
      }

      const text = openaiData.choices?.[0]?.message?.content || '';
      return parseModelResponse(text);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw error;
  }
}

/**
 * Parse model response - extract reasoning from JSON
 */
function parseModelResponse(text: string): ModelResponse {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // If no JSON, use the text as-is
    return {
      signal: 'hold',
      confidence: 50,
      reasoning: text.substring(0, 200),
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      signal: (parsed.signal || 'hold') as 'buy' | 'sell' | 'hold',
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
      reasoning: String(parsed.reasoning || text.substring(0, 200)),
    };
  } catch (e) {
    return {
      signal: 'hold',
      confidence: 50,
      reasoning: text.substring(0, 200),
    };
  }
}

/**
 * Generate a simple consensus summary from multiple responses
 */
function generateConsensus(responses: string[], query: string): string {
  if (responses.length === 0) {
    return 'No responses available to generate consensus.';
  }

  // Simple consensus: combine all responses with a summary
  const combinedInsights = responses.join(' ');

  // For now, return a basic merge. A more sophisticated implementation could:
  // 1. Use sentiment analysis
  // 2. Identify common themes
  // 3. Weight by confidence scores
  // 4. Use another AI model to synthesize

  return `Based on ${responses.length} model responses: ${combinedInsights.substring(0, 500)}${combinedInsights.length > 500 ? '...' : ''}`;
}
