import { NextRequest } from 'next/server';
import { runConsensusAnalysis } from '@/lib/consensus-engine';
import { AnalystResult } from '@/lib/models';

// Use mock data when API keys aren't available (development mode)
const USE_MOCK = process.env.NODE_ENV === 'development' && !process.env.DEEPSEEK_API_KEY;

/**
 * SSE endpoint for streaming consensus analysis
 * GET /api/consensus?asset=BTC&context=optional context
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset') || 'BTC';
  const context = searchParams.get('context') || undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection message
      sendEvent({ type: 'connected', asset });

      try {
        if (USE_MOCK) {
          // Mock mode for development without API keys
          await streamMockAnalysis(sendEvent, request.signal);
        } else {
          // Real API calls
          await streamRealAnalysis(asset, context, sendEvent, request.signal);
        }
      } catch (error) {
        console.error('Consensus stream error:', error);
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
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
        clearInterval(keepAliveInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
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
  const { analysts, consensus } = await runConsensusAnalysis(
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
  try {
    const body = await request.json();
    const { asset = 'BTC', context } = body;

    if (USE_MOCK) {
      // Return mock data
      return Response.json({
        asset,
        analysts: [
          { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong technical setup.' },
          { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 78, reasoning: 'Whales accumulating.' },
          { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 82, reasoning: 'Positive social sentiment.' },
          { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 91, reasoning: 'Strong on-chain metrics.' },
          { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 65, reasoning: 'Moderate risk profile.' },
        ],
        consensus: {
          signal: 'buy',
          consensusLevel: 78,
          recommendation: 'BUY',
        },
      });
    }

    const { analysts, consensus } = await runConsensusAnalysis(asset, context);

    return Response.json({
      asset,
      analysts,
      consensus,
    });
  } catch (error) {
    console.error('Consensus API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
