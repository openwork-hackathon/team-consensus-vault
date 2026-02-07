/**
 * DeepSeek Momentum Hunter API Endpoint
 * Dedicated endpoint for technical analysis and price momentum detection
 *
 * GET /api/momentum-hunter?asset=BTC&context=...
 * POST /api/momentum-hunter with { asset, context? }
 */

import { NextRequest } from 'next/server';
import { getAnalystOpinion } from '@/lib/consensus-engine';

// Timeout for DeepSeek API calls (30 seconds)
const DEEPSEEK_TIMEOUT = 30000;

/**
 * GET endpoint for DeepSeek Momentum Hunter analysis
 * Query params: asset (required), context (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset');
    const context = searchParams.get('context');

    if (!asset) {
      return Response.json(
        { error: 'Missing required parameter: asset' },
        { status: 400 }
      );
    }

    // Build context for DeepSeek Momentum Hunter
    const fullContext = context || 'Analyze price momentum, trend signals, and technical indicators for this asset.';

    // Call DeepSeek analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('deepseek', asset, fullContext);
    } finally {
      clearTimeout(timeoutId);
    }

    const { result, responseTime } = analysisResult;

    // Check for errors
    if (result.error) {
      return Response.json(
        {
          error: result.error,
          asset,
          analyst: 'deepseek',
        },
        { status: 500 }
      );
    }

    // Return structured response matching task requirements
    return Response.json({
      asset,
      analyst: {
        id: result.id,
        name: result.name,
        role: 'Momentum Hunter - Technical Analysis & Trend Detection',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale as per task spec
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Momentum Hunter API error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'deepseek',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for DeepSeek Momentum Hunter analysis
 * Body: { asset: string, context?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, context } = body;

    if (!asset || typeof asset !== 'string') {
      return Response.json(
        { error: 'Missing or invalid required field: asset' },
        { status: 400 }
      );
    }

    // Build context for DeepSeek Momentum Hunter
    const fullContext = context || 'Analyze price momentum, trend signals, and technical indicators for this asset.';

    // Call DeepSeek analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('deepseek', asset, fullContext);
    } finally {
      clearTimeout(timeoutId);
    }

    const { result, responseTime } = analysisResult;

    // Check for errors
    if (result.error) {
      return Response.json(
        {
          error: result.error,
          asset,
          analyst: 'deepseek',
        },
        { status: 500 }
      );
    }

    // Return structured response matching task requirements
    return Response.json({
      asset,
      analyst: {
        id: result.id,
        name: result.name,
        role: 'Momentum Hunter - Technical Analysis & Trend Detection',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale as per task spec
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Momentum Hunter API error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'deepseek',
      },
      { status: 500 }
    );
  }
}
