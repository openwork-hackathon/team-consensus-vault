/**
 * Prediction Market Bet API Route
 * POST /api/prediction-market/bet
 * GET /api/prediction-market/bet
 * 
 * CVAULT-139: Caching Strategy
 * - POST: No-cache headers (state-modifying mutation)
 * - GET: Short 5s cache TTL for pool state (changes frequently during betting)
 * - Response time logging for all requests
 * 
 * POST Request body:
 * - address: string - User's wallet address (0x...)
 * - amount: number - Bet amount in USD (must be positive)
 * - side: 'up' | 'down' - Direction of bet (long or short)
 * 
 * Response:
 * - success: boolean - Whether the bet was placed
 * - bet: Bet - The created bet object
 * - odds: object - Current odds after placing the bet
 * - pool: object - Updated pool state
 * - responseTimeMs: number - Response time for performance monitoring
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
import { 
  getNoCacheHeaders, 
  getCacheHeaders, 
  CACHE_TTL,
  logCacheEvent 
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * POST handler for bet placement
 * CVAULT-139: POST mutation endpoint - no caching
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { address, amount, side } = body;

    // Validate required fields
    if (!address || amount === undefined || !side) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: address, amount, side',
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Validate address format
    if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Invalid Ethereum address format. Expected 0x... format',
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Amount must be a positive number',
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Validate side
    if (side !== 'up' && side !== 'down') {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Side must be either "up" or "down"',
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Get current round and check if betting is open
    const currentRound = getCurrentRound();
    
    if (!currentRound) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: 'No active prediction round',
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Check if round is in betting phase
    if (currentRound.phase !== RoundPhase.BETTING_WINDOW) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: `Betting window is not open. Current phase: ${currentRound.phase}`,
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Check if betting window has expired
    if (currentRound.bettingWindowEnd) {
      const endTime = new Date(currentRound.bettingWindowEnd).getTime();
      const now = Date.now();
      if (now > endTime) {
        const responseTime = Date.now() - startTime;
        const response = NextResponse.json(
          { 
            success: false,
            error: 'Betting window has closed',
            responseTimeMs: responseTime,
          },
          { status: 400 }
        );
        
        // Add no-cache headers (POST mutation - CVAULT-139)
        const noCacheHeaders = getNoCacheHeaders();
        Object.entries(noCacheHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        return response;
      }
    }

    // Validate bet against business rules
    const validation = validateBet(address, numAmount, side);
    if (!validation.isValid) {
      const responseTime = Date.now() - startTime;
      const response = NextResponse.json(
        { 
          success: false,
          error: validation.error,
          responseTimeMs: responseTime,
        },
        { status: 400 }
      );
      
      // Add no-cache headers (POST mutation - CVAULT-139)
      const noCacheHeaders = getNoCacheHeaders();
      Object.entries(noCacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Place the bet
    const bet = placeBetInPool(address, numAmount, side);
    const responseTime = Date.now() - startTime;

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
    const response = NextResponse.json(
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
        responseTimeMs: responseTime,
      },
      { status: 200 }
    );
    
    // Add no-cache headers (POST mutation - CVAULT-139)
    const noCacheHeaders = getNoCacheHeaders();
    Object.entries(noCacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Cache-Status', 'BYPASS'); // State-modifying endpoint
    
    return response;

  } catch (error) {
    // Handle any unexpected errors
    console.error('[prediction-market-bet] Error placing bet:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const responseTime = Date.now() - startTime;
    
    const response = NextResponse.json(
      { 
        success: false,
        error: 'Failed to place bet',
        details: errorMessage,
        responseTimeMs: responseTime,
      },
      { status: 500 }
    );
    
    // Add no-cache headers (POST mutation - CVAULT-139)
    const noCacheHeaders = getNoCacheHeaders();
    Object.entries(noCacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

/**
 * GET handler to retrieve current pool state
 * Useful for clients to check betting status before placing a bet
 * CVAULT-139: Short cache TTL (5s) for pool state - changes frequently during betting
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    const currentRound = getCurrentRound();
    const pool = getCurrentPool();
    const odds = getCurrentOdds();
    const responseTime = Date.now() - startTime;

    const response = NextResponse.json(
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
        responseTimeMs: responseTime,
      },
      { status: 200 }
    );
    
    // Add cache headers for pool state - short TTL since it changes frequently (CVAULT-139)
    const cacheHeaders = getCacheHeaders(CACHE_TTL.TRADING_HISTORY); // 5s TTL
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Cache-Status', 'MISS'); // Dynamic content, not truly cached
    
    logCacheEvent('prediction-market-bet', 'miss', { responseTimeMs: responseTime });
    
    return response;
  } catch (error) {
    console.error('[prediction-market-bet] Error getting pool state:', error);
    
    const response = NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve pool state'
      },
      { status: 500 }
    );
    
    // Ensure errors are not cached
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }
}
