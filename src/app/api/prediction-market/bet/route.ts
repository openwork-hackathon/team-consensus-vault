/**
 * Prediction Market Bet API Route
 * POST /api/prediction-market/bet
 * 
 * Handles user bet placement in the prediction market.
 * Validates inputs, checks round phase, records bets, and returns updated odds.
 * 
 * Request body:
 * - address: string - User's wallet address (0x...)
 * - amount: number - Bet amount in USD (must be positive)
 * - side: 'up' | 'down' - Direction of bet (long or short)
 * 
 * Response:
 * - success: boolean - Whether the bet was placed
 * - bet: Bet - The created bet object
 * - odds: object - Current odds after placing the bet
 * - pool: object - Updated pool state
 * 
 * Error responses:
 * - 400: Invalid input or not in betting phase
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoundPhase } from '@/lib/prediction-market/types';
import { 
  getCurrentRound, 
  getCurrentPool, 
  placeBet as placeBetInPool,
  getCurrentOdds,
  validateBet
} from '@/lib/prediction-market/state';

export const dynamic = 'force-dynamic';

/**
 * POST handler for bet placement
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { address, amount, side } = body;

    // Validate required fields
    if (!address || amount === undefined || !side) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: address, amount, side' 
        },
        { status: 400 }
      );
    }

    // Validate address format
    if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid Ethereum address format. Expected 0x... format' 
        },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    // Validate side
    if (side !== 'up' && side !== 'down') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Side must be either "up" or "down"' 
        },
        { status: 400 }
      );
    }

    // Get current round and check if betting is open
    const currentRound = getCurrentRound();
    
    if (!currentRound) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No active prediction round' 
        },
        { status: 400 }
      );
    }

    // Check if round is in betting phase
    if (currentRound.phase !== RoundPhase.BETTING_WINDOW) {
      return NextResponse.json(
        { 
          success: false,
          error: `Betting window is not open. Current phase: ${currentRound.phase}` 
        },
        { status: 400 }
      );
    }

    // Check if betting window has expired
    if (currentRound.bettingWindowEnd) {
      const endTime = new Date(currentRound.bettingWindowEnd).getTime();
      const now = Date.now();
      if (now > endTime) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Betting window has closed' 
          },
          { status: 400 }
        );
      }
    }

    // Validate bet against business rules
    const validation = validateBet(address, numAmount, side);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error 
        },
        { status: 400 }
      );
    }

    // Place the bet
    const bet = placeBetInPool(address, numAmount, side);

    // Get updated pool state and odds
    const pool = getCurrentPool();
    const odds = getCurrentOdds();

    // Calculate potential payout
    const totalPool = pool.totalUp + pool.totalDown;
    const userPool = side === 'up' ? pool.totalUp : pool.totalDown;
    const potentialPayout = userPool > 0 
      ? (numAmount / userPool) * totalPool
      : numAmount;

    // Return success response with bet details and updated odds
    return NextResponse.json(
      {
        success: true,
        bet: {
          id: bet.id,
          roundId: bet.roundId,
          userAddress: bet.userAddress,
          amount: bet.amount,
          side: side,
          direction: bet.direction,
          timestamp: bet.timestamp,
          status: bet.status,
        },
        odds: {
          up: odds.up,
          down: odds.down,
        },
        pool: {
          totalUp: pool.totalUp,
          totalDown: pool.totalDown,
          totalPool: totalPool,
          totalBets: pool.bets.length,
        },
        potentialPayout: {
          gross: potentialPayout,
          net: potentialPayout * 0.98, // Assuming 2% platform fee
          profit: (potentialPayout * 0.98) - numAmount,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // Handle any unexpected errors
    console.error('[prediction-market-bet] Error placing bet:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to place bet',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to retrieve current pool state
 * Useful for clients to check betting status before placing a bet
 */
export async function GET() {
  try {
    const currentRound = getCurrentRound();
    const pool = getCurrentPool();
    const odds = getCurrentOdds();

    return NextResponse.json(
      {
        round: currentRound ? {
          id: currentRound.id,
          phase: currentRound.phase,
          asset: currentRound.asset,
          bettingWindowStart: currentRound.bettingWindowStart,
          bettingWindowEnd: currentRound.bettingWindowEnd,
        } : null,
        pool: {
          totalUp: pool.totalUp,
          totalDown: pool.totalDown,
          totalPool: pool.totalUp + pool.totalDown,
          totalBets: pool.bets.length,
        },
        odds: {
          up: odds.up,
          down: odds.down,
        },
        canBet: currentRound?.phase === RoundPhase.BETTING_WINDOW,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[prediction-market-bet] Error getting pool state:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve pool state'
      },
      { status: 500 }
    );
  }
}
