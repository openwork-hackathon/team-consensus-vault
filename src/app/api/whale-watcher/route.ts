/**
 * Kimi Whale Watcher API Endpoint
 * Dedicated endpoint for whale movement and accumulation pattern analysis
 *
 * GET /api/whale-watcher?asset=BTC&wallets=addr1,addr2
 * POST /api/whale-watcher with { asset, wallets?, context? }
 */

import { NextRequest } from 'next/server';
import { getAnalystOpinion } from '@/lib/consensus-engine';

// Timeout for Kimi API calls (30 seconds)
const KIMI_TIMEOUT = 30000;

/**
 * GET endpoint for Kimi Whale Watcher analysis
 * Query params: asset (required), wallets (optional), context (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset');
    const wallets = searchParams.get('wallets');
    const context = searchParams.get('context');

    if (!asset) {
      return Response.json(
        { error: 'Missing required parameter: asset' },
        { status: 400 }
      );
    }

    // Build context for Kimi
    let fullContext = context || 'Analyze whale behavior and large holder movements for this asset.';
    if (wallets) {
      fullContext += ` Focus on these wallet addresses: ${wallets}`;
    }

    // Call Kimi analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), KIMI_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('kimi', asset, fullContext);
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
          analyst: 'kimi',
        },
        { status: 500 }
      );
    }

    // Return structured response
    return Response.json({
      asset,
      analyst: {
        id: result.id,
        name: result.name,
        role: 'Whale Watcher - Large Holder Movements & Accumulation Patterns',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Whale Watcher API error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'kimi',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for Kimi Whale Watcher analysis
 * Body: { asset: string, wallets?: string[], context?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, wallets, context } = body;

    if (!asset || typeof asset !== 'string') {
      return Response.json(
        { error: 'Missing or invalid required field: asset' },
        { status: 400 }
      );
    }

    // Build context for Kimi
    let fullContext = context || 'Analyze whale behavior and large holder movements for this asset.';

    if (wallets) {
      if (Array.isArray(wallets)) {
        fullContext += ` Focus on these wallet addresses: ${wallets.join(', ')}`;
      } else if (typeof wallets === 'string') {
        fullContext += ` Focus on these wallet addresses: ${wallets}`;
      }
    }

    // Call Kimi analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), KIMI_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('kimi', asset, fullContext);
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
          analyst: 'kimi',
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
        role: 'Whale Watcher - Large Holder Movements & Accumulation Patterns',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale as per task spec
      reasoning: result.reasoning,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Whale Watcher API error:', error);

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
        analyst: 'kimi',
      },
      { status: 500 }
    );
  }
}
