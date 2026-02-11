/**
 * Prediction Market State Management
 * 
 * In-memory state management for prediction market rounds and betting pools.
 * This module provides functions to manage the current round state and pool.
 * 
 * Note: This is designed for demo/hackathon use. For production, this should
 * be replaced with a persistent database (PostgreSQL, Redis, etc.).
 */

import { 
  RoundState, 
  RoundPhase, 
  Bet, 
  BettingPool,
  PredictionMarketConfig,
  calculateBettingPool
} from './types';

// ============================================================================
// IN-MEMORY STATE
// ============================================================================

/** Current active round (null if no round is active) */
let currentRound: RoundState | null = null;

/** Current betting pool for the active round */
let currentPool: {
  bets: Bet[];
  totalUp: number;
  totalDown: number;
} = {
  bets: [],
  totalUp: 0,
  totalDown: 0,
};

/** Track which users have placed bets (prevents duplicate bets) */
const userBets: Map<string, Bet> = new Map();

// ============================================================================
// ROUND STATE MANAGEMENT
// ============================================================================

/**
 * Get the current active round
 * @returns The current round or null if no round is active
 */
export function getCurrentRound(): RoundState | null {
  return currentRound;
}

/**
 * Set the current active round
 * Resets the pool if the round ID changes
 * @param round - The round to set as current, or null to clear
 */
export function setCurrentRound(round: RoundState | null): void {
  // Reset pool if starting a new round
  if (round && (!currentRound || currentRound.id !== round.id)) {
    resetPool();
  }
  currentRound = round;
}

/**
 * Update the phase of the current round
 * @param phase - The new phase to set
 * @returns true if updated successfully, false if no round is active
 */
export function updateRoundPhase(phase: RoundPhase): boolean {
  if (!currentRound) {
    return false;
  }
  currentRound.phase = phase;
  return true;
}

// ============================================================================
// POOL STATE MANAGEMENT
// ============================================================================

/**
 * Get the current betting pool
 * @returns The current pool state
 */
export function getCurrentPool(): typeof currentPool {
  return currentPool;
}

/**
 * Update the betting pool with new totals
 * @param updates - Partial pool updates to apply
 * @returns The updated pool state
 */
export function updateBettingPool(updates: Partial<typeof currentPool>): typeof currentPool {
  currentPool = {
    ...currentPool,
    ...updates,
  };
  return currentPool;
}

/**
 * Reset the betting pool to empty state
 */
export function resetPool(): void {
  currentPool = {
    bets: [],
    totalUp: 0,
    totalDown: 0,
  };
  userBets.clear();
}

/**
 * Place a bet in the current pool
 * @param userAddress - The address of the user placing the bet
 * @param amount - The bet amount
 * @param direction - 'up' (long) or 'down' (short)
 * @returns The created bet object
 * @throws Error if bet validation fails
 */
export function placeBet(
  userAddress: string, 
  amount: number, 
  direction: 'up' | 'down'
): Bet {
  // Validate bet
  const validation = validateBet(userAddress, amount, direction);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const bet: Bet = {
    id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    roundId: currentRound?.id || 'unknown',
    userAddress: userAddress.toLowerCase(),
    amount,
    direction: direction === 'up' ? 'long' : 'short',
    timestamp: new Date().toISOString(),
    status: 'confirmed',
  };

  currentPool.bets.push(bet);
  userBets.set(userAddress.toLowerCase(), bet);

  if (direction === 'up') {
    currentPool.totalUp += amount;
  } else {
    currentPool.totalDown += amount;
  }

  return bet;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface BetValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a bet before placing it
 * @param userAddress - The user's wallet address
 * @param amount - The bet amount
 * @param direction - 'up' or 'down'
 * @returns Validation result with error message if invalid
 */
export function validateBet(
  userAddress: string,
  amount: number,
  direction: 'up' | 'down'
): BetValidationResult {
  // Check if betting window is open
  if (!currentRound || currentRound.phase !== RoundPhase.BETTING_WINDOW) {
    return {
      isValid: false,
      error: 'Betting window is not open',
    };
  }

  // Validate address
  if (!userAddress || typeof userAddress !== 'string') {
    return {
      isValid: false,
      error: 'Invalid address',
    };
  }

  if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return {
      isValid: false,
      error: 'Invalid address format',
    };
  }

  // Validate amount
  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      isValid: false,
      error: 'Invalid amount',
    };
  }

  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0',
    };
  }

  if (amount < PredictionMarketConfig.MIN_BET) {
    return {
      isValid: false,
      error: `Minimum bet is ${PredictionMarketConfig.MIN_BET}`,
    };
  }

  // Validate direction
  if (direction !== 'up' && direction !== 'down') {
    return {
      isValid: false,
      error: 'Side must be "up" or "down"',
    };
  }

  // Check for duplicate bets
  if (userBets.has(userAddress.toLowerCase())) {
    return {
      isValid: false,
      error: 'You have already placed a bet in this round',
    };
  }

  return { isValid: true };
}

// ============================================================================
// USER BET QUERIES
// ============================================================================

/**
 * Check if a user has placed a bet in the current round
 * @param userAddress - The user's wallet address
 * @returns true if the user has placed a bet
 */
export function hasUserBet(userAddress: string): boolean {
  return userBets.has(userAddress.toLowerCase());
}

/**
 * Get the total bet amount for a user
 * @param userAddress - The user's wallet address
 * @returns The total bet amount (0 if no bet placed)
 */
export function getUserTotalBet(userAddress: string): number {
  const bet = userBets.get(userAddress.toLowerCase());
  return bet?.amount || 0;
}

/**
 * Get all bets placed by a user
 * @param userAddress - The user's wallet address
 * @returns Array of bets placed by the user
 */
export function getUserBets(userAddress: string): Bet[] {
  const bet = userBets.get(userAddress.toLowerCase());
  return bet ? [bet] : [];
}

// ============================================================================
// ODDS CALCULATION
// ============================================================================

export interface OddsResult {
  up: number;
  down: number;
}

/**
 * Calculate current odds based on the pool
 * @returns Object with up and down odds
 */
export function getCurrentOdds(): OddsResult {
  const totalPool = currentPool.totalUp + currentPool.totalDown;
  
  if (totalPool === 0) {
    return { up: 0, down: 0 };
  }

  const upOdds = currentPool.totalUp > 0 ? totalPool / currentPool.totalUp : 0;
  const downOdds = currentPool.totalDown > 0 ? totalPool / currentPool.totalDown : 0;

  return {
    up: Math.round(upOdds * 100) / 100,
    down: Math.round(downOdds * 100) / 100,
  };
}

// ============================================================================
// POOL STATISTICS
// ============================================================================

/**
 * Get comprehensive pool statistics
 * @returns BettingPool object with all statistics
 */
export function getPoolStats(): BettingPool {
  return calculateBettingPool(currentPool.bets);
}

// ============================================================================
// PHASE HELPERS
// ============================================================================

/**
 * Check if the current phase allows betting
 * @returns true if betting is allowed
 */
export function isBettingPhase(): boolean {
  return currentRound?.phase === RoundPhase.BETTING_WINDOW;
}

/**
 * Check if a round is currently active
 * @returns true if a round is active and not settled
 */
export function isRoundActive(): boolean {
  if (!currentRound) return false;
  return [
    RoundPhase.SCANNING,
    RoundPhase.ENTRY_SIGNAL,
    RoundPhase.BETTING_WINDOW,
    RoundPhase.POSITION_OPEN,
    RoundPhase.EXIT_SIGNAL,
  ].includes(currentRound.phase);
}

/**
 * Check if the current round is completed
 * @returns true if the round is in SETTLEMENT phase
 */
export function isRoundCompleted(): boolean {
  return currentRound?.phase === RoundPhase.SETTLEMENT;
}

// ============================================================================
// DEBUG HELPERS
// ============================================================================

/**
 * Get full state dump for debugging
 * @returns Complete state snapshot
 */
export function getStateDump(): {
  currentRound: RoundState | null;
  pool: typeof currentPool;
  userCount: number;
  odds: OddsResult;
} {
  return {
    currentRound,
    pool: currentPool,
    userCount: userBets.size,
    odds: getCurrentOdds(),
  };
}

/**
 * Reset all state (useful for testing)
 */
export function resetAllState(): void {
  currentRound = null;
  resetPool();
}
