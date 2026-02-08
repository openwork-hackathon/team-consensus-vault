/**
 * Prediction Market Shared State Module
 * 
 * Provides module-level state management for the prediction market feature.
 * This state is shared between the SSE streaming route and the bet API route.
 * 
 * Uses a singleton pattern with module-level variables since Next.js API routes
 * may share memory in development mode.
 * 
 * @module prediction-market/state
 */

import { RoundState, BettingPool, Bet, RoundPhase } from './types';

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

/**
 * Current prediction round state
 * Shared between SSE stream and bet route
 */
let currentRound: RoundState | null = null;

/**
 * Current betting pool state
 * Includes totalUp/totalDown and all placed bets
 */
let currentPool: {
  totalUp: number;
  totalDown: number;
  bets: Bet[];
} = {
  totalUp: 0,
  totalDown: 0,
  bets: [],
};

// ============================================================================
// ROUND STATE ACCESSORS
// ============================================================================

/**
 * Get the current round state
 * @returns Current round data or null if no round is active
 */
export function getCurrentRound(): RoundState | null {
  return currentRound;
}

/**
 * Set the current round state
 * @param round - The new round state to set
 */
export function setCurrentRound(round: RoundState | null): void {
  currentRound = round;
  
  // Reset pool when starting a new round
  if (round && round.id !== currentRound?.id) {
    currentPool = {
      totalUp: 0,
      totalDown: 0,
      bets: [],
    };
  }
}

/**
 * Update the current round's phase
 * @param phase - The new phase to transition to
 */
export function updateRoundPhase(phase: RoundPhase): void {
  if (currentRound) {
    currentRound.phase = phase;
  }
}

/**
 * Update the current round's betting pool
 * @param pool - The new betting pool state
 */
export function updateBettingPool(pool: BettingPool): void {
  if (currentRound) {
    currentRound.bettingPool = pool;
  }
}

// ============================================================================
// BETTING POOL ACCESSORS
// ============================================================================

/**
 * Get the current betting pool state
 * @returns Current pool state with totals and bets
 */
export function getCurrentPool(): {
  totalUp: number;
  totalDown: number;
  bets: Bet[];
} {
  return currentPool;
}

/**
 * Set the current betting pool state
 * @param pool - The new pool state
 */
export function setCurrentPool(pool: {
  totalUp: number;
  totalDown: number;
  bets: Bet[];
}): void {
  currentPool = pool;
}

/**
 * Add a bet to the current pool
 * @param bet - The bet to add
 */
export function addBetToPool(bet: Bet): void {
  currentPool.bets.push(bet);
  
  // Update totals based on bet direction
  if (bet.direction === 'long') {
    currentPool.totalUp += bet.amount;
  } else {
    currentPool.totalDown += bet.amount;
  }
  
  // Sync with round's betting pool if round exists
  if (currentRound) {
    currentRound.bettingPool = {
      totalLong: currentPool.totalUp,
      totalShort: currentPool.totalDown,
      totalPool: currentPool.totalUp + currentPool.totalDown,
      longBetCount: currentPool.bets.filter(b => b.direction === 'long').length,
      shortBetCount: currentPool.bets.filter(b => b.direction === 'short').length,
      totalBetCount: currentPool.bets.length,
      avgLongBet: currentPool.totalUp > 0 
        ? currentPool.totalUp / Math.max(1, currentPool.bets.filter(b => b.direction === 'long').length)
        : 0,
      avgShortBet: currentPool.totalDown > 0
        ? currentPool.totalDown / Math.max(1, currentPool.bets.filter(b => b.direction === 'short').length)
        : 0,
      longOdds: currentPool.totalUp > 0
        ? (currentPool.totalUp + currentPool.totalDown) / currentPool.totalUp
        : 0,
      shortOdds: currentPool.totalDown > 0
        ? (currentPool.totalUp + currentPool.totalDown) / currentPool.totalDown
        : 0,
    };
  }
}

/**
 * Get all bets for a specific user address
 * @param address - The user's wallet address
 * @returns Array of bets placed by the user
 */
export function getUserBets(address: string): Bet[] {
  return currentPool.bets.filter(bet => 
    bet.userAddress.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Check if a user has already bet in the current round
 * @param address - The user's wallet address
 * @returns True if the user has placed a bet
 */
export function hasUserBet(address: string): boolean {
  return currentPool.bets.some(bet => 
    bet.userAddress.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get the total amount bet by a user in the current round
 * @param address - The user's wallet address
 * @returns Total amount bet by the user
 */
export function getUserTotalBet(address: string): number {
  return currentPool.bets
    .filter(bet => bet.userAddress.toLowerCase() === address.toLowerCase())
    .reduce((sum, bet) => sum + bet.amount, 0);
}

/**
 * Calculate current odds for both sides
 * @returns Object with up and down odds
 */
export function getCurrentOdds(): {
  up: number;
  down: number;
} {
  const totalPool = currentPool.totalUp + currentPool.totalDown;
  
  return {
    up: currentPool.totalUp > 0 ? totalPool / currentPool.totalUp : 0,
    down: currentPool.totalDown > 0 ? totalPool / currentPool.totalDown : 0,
  };
}

/**
 * Reset the betting pool (typically when starting a new round)
 */
export function resetPool(): void {
  currentPool = {
    totalUp: 0,
    totalDown: 0,
    bets: [],
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate if a bet can be placed
 * @param address - User's wallet address
 * @param amount - Bet amount
 * @param side - Bet side ('up' or 'down')
 * @returns Object with isValid flag and error message if invalid
 */
export function validateBet(
  address: string,
  amount: number,
  side: 'up' | 'down'
): { isValid: boolean; error?: string } {
  // Validate address format (basic Ethereum address check)
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Invalid address' };
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }
  
  // Validate amount
  if (!amount || typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Invalid amount' };
  }
  
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  // Validate side
  if (side !== 'up' && side !== 'down') {
    return { isValid: false, error: 'Side must be "up" or "down"' };
  }
  
  // Check if round is in betting phase
  if (currentRound && currentRound.phase !== RoundPhase.BETTING_WINDOW) {
    return { isValid: false, error: 'Betting window is not open' };
  }
  
  // Check if user has already bet (optional - remove if multiple bets allowed)
  if (hasUserBet(address)) {
    return { isValid: false, error: 'You have already placed a bet in this round' };
  }
  
  return { isValid: true };
}

/**
 * Place a bet in the current pool
 * @param address - User's wallet address
 * @param amount - Bet amount
 * @param side - Bet side ('up' or 'down')
 * @returns The created bet object
 * @throws Error if bet validation fails
 */
export function placeBet(
  address: string,
  amount: number,
  side: 'up' | 'down'
): Bet {
  // Validate the bet
  const validation = validateBet(address, amount, side);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Create the bet
  const bet: Bet = {
    id: `bet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    roundId: currentRound?.id || 'unknown',
    userAddress: address,
    amount,
    direction: side === 'up' ? 'long' : 'short',
    timestamp: new Date().toISOString(),
    status: 'confirmed',
  };
  
  // Add to pool
  addBetToPool(bet);
  
  return bet;
}
