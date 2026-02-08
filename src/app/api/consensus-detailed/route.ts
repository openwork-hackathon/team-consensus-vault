/**
 * API Route: Detailed Consensus Analysis
 * POST /api/consensus-detailed
 * GET /api/consensus-detailed?asset=BTC
 * 
 * CVAULT-118: Caching Strategy
 * - Implements request memoization for identical asset+context queries
 * - 60s TTL for AI consensus responses (expensive to compute, stable short-term)
 * - Rate limiting preserved to prevent API abuse
 * - Cache key includes asset and context hash for precise invalidation
 * - Dynamic content (real-time debate) is NOT cached - see /api/chatroom/stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDetailedConsensusAnalysis } from '@/lib/consensus-engine';
import { 
  checkRateLimit, 
  createRateLimitResponse, 
  CONSENSUS_RATE_LIMIT 
} from '@/lib/rate-limit';
import {
  consensusMemoizer,
  generateCacheKeySync,
  getNoCacheHeaders,
  logCacheEvent,
} from '@/lib/cache';

/**
 * POST /api/consensus-detailed
 *
 * Implements strict 4/5 consensus logic for trading signals
 *
 * Request body:
 * {
 *   "asset": "BTC",
 *   "context": "optional context string"
 * }
 *
 * Response:
 * {
 *   "consensus_status": "CONSENSUS_REACHED" | "NO_CONSENSUS" | "INSUFFICIENT_RESPONSES",
 *   "consensus_signal": "buy" | "sell" | "hold" | null,
 *   "individual_votes": [
 *     {
 *       "model_name": "deepseek",
 *       "signal": "buy" | "sell" | "hold" | null,
 *       "response_time_ms": 1234,
 *       "confidence": 85,
 *       "status": "success" | "timeout" | "error",
 *       "error": "optional error message"
 *     },
 *     ...
 *   ],
 *   "vote_counts": {
 *     "BUY": 4,
 *     "SELL": 0,
 *     "HOLD": 1
 *   },
 *   "timestamp": "2026-02-07T..."
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Check rate limit
  const rateLimitResult = await checkRateLimit(request, CONSENSUS_RATE_LIMIT);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    );
  }

  try {
    const body = await request.json();
    const { asset, context } = body;

    if (!asset || typeof asset !== 'string') {
      return Response.json(
        { error: 'Missing or invalid asset parameter' },
        { status: 400 }
      );
    }

    // Generate cache key from asset + context
    const cacheKey = generateCacheKeySync('consensus', { asset, context: context || '' });

    // Use memoization to prevent duplicate concurrent requests
    const consensusResponse = await consensusMemoizer.execute(cacheKey, () =>
      runDetailedConsensusAnalysis(asset, context)
    );

    // Ensure consensusResponse is an object
    if (!consensusResponse || typeof consensusResponse !== 'object') {
      return Response.json(
        { error: 'Invalid consensus response' },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;
    const isCached = responseTime < 100; // Likely cached if very fast

    const response = Response.json(
      { 
        ...consensusResponse, 
        cached: isCached,
        responseTimeMs: responseTime 
      }, 
      { status: 200 }
    );

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));
    
    // Add cache status header
    response.headers.set('X-Cache-Status', isCached ? 'HIT' : 'MISS');

    logCacheEvent('consensus-detailed', isCached ? 'hit' : 'miss', { 
      asset, 
      context: context ? 'yes' : 'no',
      responseTimeMs: responseTime 
    });

    return response;
  } catch (error) {
    console.error('Detailed consensus API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consensus-detailed?asset=BTC&context=optional
 * Same as POST but via query parameters for convenience
 * Includes request memoization for identical queries (CVAULT-118)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Check rate limit
  const rateLimitResult = await checkRateLimit(request, CONSENSUS_RATE_LIMIT);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset');
    const context = searchParams.get('context') || undefined;

    if (!asset) {
      return Response.json(
        { error: 'Missing asset parameter' },
        { status: 400 }
      );
    }

    // Generate cache key from asset + context
    const cacheKey = generateCacheKeySync('consensus', { asset, context: context || '' });

    // Use memoization to prevent duplicate concurrent requests
    const consensusResponse = await consensusMemoizer.execute(cacheKey, () =>
      runDetailedConsensusAnalysis(asset, context)
    );

    // Ensure consensusResponse is an object
    if (!consensusResponse || typeof consensusResponse !== 'object') {
      return Response.json(
        { error: 'Invalid consensus response' },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;
    const isCached = responseTime < 100; // Likely cached if very fast

    const response = Response.json(
      { 
        ...consensusResponse, 
        cached: isCached,
        responseTimeMs: responseTime 
      }, 
      { status: 200 }
    );

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));
    
    // Add cache status header
    response.headers.set('X-Cache-Status', isCached ? 'HIT' : 'MISS');

    logCacheEvent('consensus-detailed', isCached ? 'hit' : 'miss', { 
      asset, 
      context: context ? 'yes' : 'no',
      responseTimeMs: responseTime 
    });

    return response;
  } catch (error) {
    console.error('Detailed consensus API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
