/**
 * Gemini Risk Manager API Endpoint
 * Dedicated endpoint for risk assessment and portfolio exposure analysis
 *
 * GET /api/risk-manager?asset=BTC&context=...
 * POST /api/risk-manager with { asset, context? }
 */

import { NextRequest } from 'next/server';
import { getAnalystOpinion } from '@/lib/consensus-engine';

// Timeout for Gemini API calls (30 seconds)
const GEMINI_TIMEOUT = 30000;

/**
 * GET endpoint for Gemini Risk Manager analysis
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

    // Build context for Gemini Risk Manager
    const fullContext = context || 'Analyze risk factors, volatility, funding rates, and portfolio exposure considerations for this asset.';

    // Call Gemini analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('gemini', asset, fullContext);
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
          analyst: 'gemini',
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
        role: 'Risk Manager - Risk Assessment & Portfolio Exposure',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale as per task spec
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Risk Manager API error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'gemini',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for Gemini Risk Manager analysis
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

    // Build context for Gemini Risk Manager
    const fullContext = context || 'Analyze risk factors, volatility, funding rates, and portfolio exposure considerations for this asset.';

    // Call Gemini analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('gemini', asset, fullContext);
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
          analyst: 'gemini',
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
        role: 'Risk Manager - Risk Assessment & Portfolio Exposure',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale as per task spec
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Risk Manager API error:', error);

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
        analyst: 'gemini',
      },
      { status: 500 }
    );
  }
}
