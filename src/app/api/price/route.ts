/**
 * API Route: Current Price
 * GET /api/price?asset=BTC
 * Returns current price for an asset
 * 
 * CVAULT-118: Caching Strategy
 * - Uses Next.js unstable_cache with 30s revalidation for edge caching
 * - In-memory memoization prevents duplicate concurrent requests
 * - Cache-Control headers enable CDN/Vercel Edge caching
 * - Stale-while-revalidate pattern ensures fresh data with fast responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPrice } from '@/lib/price-service';
import { 
  withEdgeCache, 
  generateCacheKey, 
  getCacheHeaders,
  logCacheEvent,
  CACHE_TTL,
  CACHE_TAGS 
} from '@/lib/cache';

// Use edge runtime for global caching
export const runtime = 'edge';

// Cached price fetcher using Next.js unstable_cache
const getCachedPrice = withEdgeCache(
  async (asset: string) => {
    logCacheEvent('price', 'miss', { asset });
    return getCurrentPrice(asset);
  },
  'price',
  CACHE_TTL.PRICE,
  [CACHE_TAGS.PRICE]
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const asset = searchParams.get('asset') || 'BTC/USD';

    // Use cached price fetcher
    const price = await getCachedPrice(asset);
    const responseTime = Date.now() - startTime;
    const isCached = responseTime < 50; // Likely cached if very fast

    const response = NextResponse.json({
      success: true,
      asset,
      price,
      timestamp: new Date().toISOString(),
      cached: isCached,
      responseTimeMs: responseTime,
    });

    // Add cache headers for CDN/Vercel Edge
    const cacheHeaders = getCacheHeaders(CACHE_TTL.PRICE);
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add cache status header for debugging (CVAULT-139)
    response.headers.set('X-Cache-Status', isCached ? 'HIT' : 'MISS');

    logCacheEvent('price', isCached ? 'hit' : 'miss', { asset, responseTimeMs: responseTime });

    return response;
  } catch (error) {
    console.error('Error fetching price:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );

    // Ensure errors are not cached
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }
}
