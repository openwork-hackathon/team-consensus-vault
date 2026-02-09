/**
 * API Route: Comprehensive Market Data
 * GET /api/market-data?asset=BTC&include=volume,metrics,talking_points
 * Returns comprehensive market data for personas to use in arguments
 * 
 * CVAULT-185: Real Market Data Integration
 * Provides structured market data that personas can reference in debates
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchMarketData, 
  formatMarketDataForPrompt, 
  getMarketTalkingPoints,
  getMarketMetrics,
  MarketData,
  fetchMultipleMarketData 
} from '@/lib/chatroom/market-data';
import { 
  withEdgeCache, 
  getCacheHeaders,
  logCacheEvent,
  CACHE_TTL,
  CACHE_TAGS 
} from '@/lib/cache';

// Use edge runtime for global caching
export const runtime = 'edge';

// Cached market data fetcher
const getCachedMarketData = withEdgeCache(
  async (asset: string) => {
    logCacheEvent('market-data', 'miss', { asset });
    return fetchMarketData(asset);
  },
  'market-data',
  CACHE_TTL.PRICE,
  [CACHE_TAGS.PRICE]
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const asset = searchParams.get('asset') || 'BTC';
    const include = searchParams.get('include') || 'all'; // volume,metrics,talking_points
    const format = searchParams.get('format') || 'json'; // json or prompt

    // Parse include parameter
    const includeFields = include.split(',').map((f: string) => f.trim());
    const shouldIncludeVolume = includeFields.includes('volume') || includeFields.includes('all');
    const shouldIncludeMetrics = includeFields.includes('metrics') || includeFields.includes('all');
    const shouldIncludeTalkingPoints = includeFields.includes('talking_points') || includeFields.includes('all');

    // Use cached market data fetcher
    const marketData = await getCachedMarketData(asset);
    const responseTime = Date.now() - startTime;

    let responseData: any;

    if (format === 'prompt') {
      // Return formatted prompt-ready data
      responseData = {
        asset,
        promptFormatted: formatMarketDataForPrompt(marketData, asset),
        talkingPoints: shouldIncludeTalkingPoints ? getMarketTalkingPoints(marketData) : undefined,
        timestamp: marketData.lastUpdated,
        cached: responseTime < 50
      };
    } else {
      // Return structured JSON data
      responseData = {
        asset,
        timestamp: marketData.lastUpdated,
        cached: responseTime < 50,
        price: {
          current: marketData.price,
          change24h: marketData.priceChange24h,
          changePercentage24h: marketData.priceChangePercentage24h,
          range24h: {
            high: marketData.high24h,
            low: marketData.low24h
          }
        },
        volume: shouldIncludeVolume ? {
          value24h: marketData.volume24h,
          change24h: marketData.volumeChange24h,
          toMarketCapRatio: marketData.volumeToMarketCapRatio
        } : undefined,
        market: {
          cap: marketData.marketCap,
          rank: 1, // Could be enhanced with actual rank
          volatility: marketData.volatility24h
        },
        extremes: {
          ath: {
            price: marketData.ath,
            changePercentage: marketData.athChangePercentage
          },
          atl: {
            price: marketData.atl,
            changePercentage: marketData.atlChangePercentage
          }
        },
        supply: {
          circulating: marketData.circulatingSupply,
          total: marketData.totalSupply,
          max: marketData.maxSupply
        },
        metrics: shouldIncludeMetrics ? getMarketMetrics(marketData) : undefined,
        talkingPoints: shouldIncludeTalkingPoints ? getMarketTalkingPoints(marketData) : undefined,
        responseTimeMs: responseTime
      };
    }

    const response = NextResponse.json(responseData);

    // Add cache headers
    const cacheHeaders = getCacheHeaders(CACHE_TTL.PRICE);
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    response.headers.set('X-Cache-Status', responseTime < 50 ? 'HIT' : 'MISS');
    response.headers.set('X-Asset', asset);
    response.headers.set('X-Format', format);

    logCacheEvent('market-data', responseTime < 50 ? 'hit' : 'miss', { 
      asset, 
      responseTimeMs: responseTime,
      format 
    });

    return response;
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        asset: request.nextUrl.searchParams.get('asset') || 'BTC',
      },
      { status: 500 }
    );

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }
}

/**
 * POST endpoint for batch market data requests
 * Useful for fetching multiple assets at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assets = body.assets || ['BTC'];
    const include = body.include || 'all';

    // Fetch multiple assets in parallel
    const marketData = await fetchMultipleMarketData(assets);
    
    // Apply same include filtering
    const includeFields = include.split(',').map((f: string) => f.trim());
    const shouldIncludeVolume = includeFields.includes('volume') || includeFields.includes('all');
    const shouldIncludeMetrics = includeFields.includes('metrics') || includeFields.includes('all');
    const shouldIncludeTalkingPoints = includeFields.includes('talking_points') || includeFields.includes('all');

    const responseData: Record<string, any> = {};
    
    for (const [asset, data] of Object.entries(marketData)) {
      responseData[asset] = {
        timestamp: data.lastUpdated,
        price: {
          current: data.price,
          change24h: data.priceChange24h,
          changePercentage24h: data.priceChangePercentage24h,
          range24h: {
            high: data.high24h,
            low: data.low24h
          }
        },
        volume: shouldIncludeVolume ? {
          value24h: data.volume24h,
          change24h: data.volumeChange24h,
          toMarketCapRatio: data.volumeToMarketCapRatio
        } : undefined,
        market: {
          cap: data.marketCap,
          volatility: data.volatility24h
        },
        extremes: {
          ath: {
            price: data.ath,
            changePercentage: data.athChangePercentage
          }
        },
        metrics: shouldIncludeMetrics ? getMarketMetrics(data) : undefined,
        talkingPoints: shouldIncludeTalkingPoints ? getMarketTalkingPoints(data) : undefined,
      };
    }

    const response = NextResponse.json({
      success: true,
      assets: responseData,
      timestamp: new Date().toISOString()
    });

    // Cache batch responses for shorter time
    const cacheHeaders = getCacheHeaders(CACHE_TTL.PRICE);
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Error in batch market data request:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}