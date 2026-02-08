/**
 * API Route: Close Paper Trade
 * POST /api/trading/close
 * Closes an open paper trade and calculates P&L
 *
 * CVAULT-118: Response Optimization
 * - Response time logging for performance monitoring
 * - No-cache headers (POST endpoint that modifies state)
 * - Diagnostic headers for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { closeTrade } from '@/lib/paper-trading-engine';
import { getNoCacheHeaders } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { tradeId, asset = 'BTC/USD' } = body;

    if (!tradeId) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        {
          success: false,
          error: 'tradeId is required',
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );

      // Add no-cache headers
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    const trade = await closeTrade(tradeId, asset);
    const responseTime = Date.now() - startTime;

    const response = NextResponse.json({
      success: true,
      trade,
      responseTimeMs: responseTime,
    });

    // Add no-cache headers (POST endpoint that modifies state)
    const noCacheHeaders = getNoCacheHeaders();
    Object.entries(noCacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Cache-Status', 'BYPASS'); // State-modifying endpoint

    return response;
  } catch (error) {
    console.error('Error closing trade:', error);
    const responseTime = Date.now() - startTime;

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: responseTime,
      },
      { status: 500 }
    );

    // Ensure errors are not cached
    const noCacheHeaders = getNoCacheHeaders();
    Object.entries(noCacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}
