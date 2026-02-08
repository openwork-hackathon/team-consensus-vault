/**
 * API Route: Execute Paper Trade
 * POST /api/trading/execute
 * Executes a paper trade based on current consensus
 *
 * CVAULT-118: Response Optimization
 * - Response time logging for performance monitoring
 * - No-cache headers (POST endpoint that modifies state)
 * - Diagnostic headers for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { executePaperTrade, shouldExecuteTrade } from '@/lib/paper-trading-engine';
import { runDetailedConsensusAnalysis } from '@/lib/consensus-engine';
import { getNoCacheHeaders } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { asset = 'BTC/USD' } = body;

    // Get current consensus
    const consensusData = await runDetailedConsensusAnalysis(asset);

    // Check if consensus is strong enough to trade
    if (!shouldExecuteTrade(consensusData)) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        {
          success: false,
          message: 'Consensus threshold not met for trade execution',
          consensusData,
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );

      // Add no-cache headers (POST endpoint that queries state)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Execute the trade
    const trade = await executePaperTrade(consensusData, asset);
    const responseTime = Date.now() - startTime;

    const response = NextResponse.json({
      success: true,
      trade,
      consensusData,
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
    console.error('Error executing paper trade:', error);

    // Provide user-friendly error messages
    let userMessage = 'Unable to execute trade. Please try again.';
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('API') || error.message.includes('key')) {
        userMessage = 'Service temporarily unavailable. Please try again later.';
      }
    }

    const responseTime = Date.now() - startTime;
    const response = NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
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
