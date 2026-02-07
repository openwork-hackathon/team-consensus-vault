/**
 * GLM On-Chain Oracle API Endpoint
 * Dedicated endpoint for on-chain metrics and TVL analysis
 *
 * GET /api/on-chain-oracle?asset=BTC&metrics=tvl,active_addresses
 * POST /api/on-chain-oracle with { asset, metrics?, context? }
 */

import { NextRequest } from 'next/server';
import { getAnalystOpinion } from '@/lib/consensus-engine';

// Timeout for GLM API calls (30 seconds)
const GLM_TIMEOUT = 30000;

/**
 * GET endpoint for GLM On-Chain Oracle analysis
 * Query params: asset (required), metrics (optional), context (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset');
    const metrics = searchParams.get('metrics');
    const context = searchParams.get('context');

    if (!asset) {
      return Response.json(
        { error: 'Missing required parameter: asset' },
        { status: 400 }
      );
    }

    // Build context for GLM
    let fullContext = context || 'Analyze on-chain metrics and protocol health for this asset.';
    if (metrics) {
      fullContext += ` Focus on these metrics: ${metrics}`;
    }

    // Call GLM analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GLM_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('glm', asset, fullContext);
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
          analyst: 'glm',
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
        role: 'On-Chain Oracle - On-Chain Metrics & TVL Analysis',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('On-Chain Oracle API error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'glm',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for GLM On-Chain Oracle analysis
 * Body: { asset: string, metrics?: string[], context?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, metrics, context } = body;

    if (!asset || typeof asset !== 'string') {
      return Response.json(
        { error: 'Missing or invalid required field: asset' },
        { status: 400 }
      );
    }

    // Build context for GLM
    let fullContext = context || 'Analyze on-chain metrics and protocol health for this asset.';

    if (metrics) {
      if (Array.isArray(metrics)) {
        fullContext += ` Focus on these metrics: ${metrics.join(', ')}`;
      } else if (typeof metrics === 'string') {
        fullContext += ` Focus on these metrics: ${metrics}`;
      }
    }

    // Call GLM analyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GLM_TIMEOUT);

    let analysisResult;
    try {
      analysisResult = await getAnalystOpinion('glm', asset, fullContext);
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
          analyst: 'glm',
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
        role: 'On-Chain Oracle - On-Chain Metrics & TVL Analysis',
      },
      signal: result.sentiment === 'bullish' ? 'bullish' : result.sentiment === 'bearish' ? 'bearish' : 'neutral',
      confidence: result.confidence / 100, // Convert to 0-1 scale as per task spec
      reasoning: result.reasoning,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('On-Chain Oracle API error:', error);

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
        analyst: 'glm',
      },
      { status: 500 }
    );
  }
}
