/**
 * API Route: Trading History
 * GET /api/trading/history
 * Returns all trades and portfolio metrics
 * 
 * CVAULT-118: Caching Strategy
 * - Short 5s cache TTL for trading history (data changes frequently with new trades)
 * - Uses Next.js unstable_cache for edge compatibility
 * - Dynamic content preserved - cache is short-lived to balance performance and freshness
 * - Cache invalidated automatically after TTL, no manual invalidation needed
 */

import { NextResponse } from 'next/server';
import { getTradingHistory } from '@/lib/paper-trading-engine';
import { 
  withEdgeCache, 
  getCacheHeaders,
  logCacheEvent,
  CACHE_TTL,
  CACHE_TAGS 
} from '@/lib/cache';

// Use edge runtime for global caching
export const runtime = 'edge';

// Cached trading history fetcher
const getCachedTradingHistory = withEdgeCache(
  async () => {
    logCacheEvent('trading-history', 'miss');
    return getTradingHistory();
  },
  'trading-history',
  CACHE_TTL.TRADING_HISTORY,
  [CACHE_TAGS.TRADING]
);

export async function GET() {
  const startTime = Date.now();
  
  try {
    const history = await getCachedTradingHistory();
    const responseTime = Date.now() - startTime;
    const isCached = responseTime < 50; // Likely cached if very fast

    const response = NextResponse.json({
      success: true,
      ...history,
      cached: isCached,
      responseTimeMs: responseTime,
    });

    // Add cache headers for CDN/Vercel Edge
    const cacheHeaders = getCacheHeaders(CACHE_TTL.TRADING_HISTORY);
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add cache status header
    response.headers.set('X-Cache-Status', isCached ? 'HIT' : 'MISS');

    logCacheEvent('trading-history', isCached ? 'hit' : 'miss', { responseTimeMs: responseTime });

    return response;
  } catch (error) {
    console.error('Error fetching trading history:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: 'Unable to load trading history. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );

    // Ensure errors are not cached
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }
}
