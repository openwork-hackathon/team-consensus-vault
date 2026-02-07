/**
 * API Route: Close Paper Trade
 * POST /api/trading/close
 * Closes an open paper trade and calculates P&L
 */

import { NextRequest, NextResponse } from 'next/server';
import { closeTrade } from '@/lib/paper-trading-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tradeId, asset = 'BTC/USD' } = body;

    if (!tradeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'tradeId is required',
        },
        { status: 400 }
      );
    }

    const trade = await closeTrade(tradeId, asset);

    return NextResponse.json({
      success: true,
      trade,
    });
  } catch (error) {
    console.error('Error closing trade:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
