/**
 * API Route: Execute Paper Trade
 * POST /api/trading/execute
 * Executes a paper trade based on current consensus
 */

import { NextRequest, NextResponse } from 'next/server';
import { executePaperTrade, shouldExecuteTrade } from '@/lib/paper-trading-engine';
import { runDetailedConsensusAnalysis } from '@/lib/consensus-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset = 'BTC/USD' } = body;

    // Get current consensus
    const consensusData = await runDetailedConsensusAnalysis(asset);

    // Check if consensus is strong enough to trade
    if (!shouldExecuteTrade(consensusData)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Consensus threshold not met for trade execution',
          consensusData,
        },
        { status: 400 }
      );
    }

    // Execute the trade
    const trade = await executePaperTrade(consensusData, asset);

    return NextResponse.json({
      success: true,
      trade,
      consensusData,
    });
  } catch (error) {
    console.error('Error executing paper trade:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
