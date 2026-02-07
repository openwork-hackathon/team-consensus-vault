/**
 * Consensus API Endpoint
 * POST /api/consensus
 *
 * Queries all 5 AI analysts and returns consensus signal
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryConsensus } from '@/lib/consensus';

export const maxDuration = 60; // 60 seconds max for edge function

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.length < 5) {
      return NextResponse.json(
        { error: 'Query must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Query all models for consensus
    const result = await queryConsensus(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Consensus API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Consensus Vault API',
    endpoints: {
      'POST /api/consensus': {
        description: 'Query 5 AI analysts for consensus on a trading decision',
        body: { query: 'string (5-500 chars)' },
        response: {
          query: 'string',
          timestamp: 'number',
          signals: 'AnalystResponse[]',
          consensus: 'BUY | SELL | HOLD | null',
          consensusCount: 'number',
          totalResponses: 'number',
          confidenceAverage: 'number',
          hasConsensus: 'boolean',
        },
      },
    },
  });
}
