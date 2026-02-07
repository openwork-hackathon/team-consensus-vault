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

    // Provide user-friendly error messages
    let userMessage = 'Unable to execute trade. Please try again.';
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('API') || error.message.includes('key')) {
        userMessage = 'Service temporarily unavailable. Please try again later.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
