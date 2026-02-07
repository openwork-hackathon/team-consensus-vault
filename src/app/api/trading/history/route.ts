/**
 * API Route: Trading History
 * GET /api/trading/history
 * Returns all trades and portfolio metrics
 */

import { NextResponse } from 'next/server';
import { getTradingHistory } from '@/lib/paper-trading-engine';

export async function GET() {
  try {
    const history = await getTradingHistory();

    return NextResponse.json({
      success: true,
      ...history,
    });
  } catch (error) {
    console.error('Error fetching trading history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
