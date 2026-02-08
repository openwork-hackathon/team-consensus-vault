/**
 * Betting Pool Manager
 * 
 * Manages betting pools for the Consensus Vault prediction market.
 * Handles bet placement, odds calculation, and payout distribution.
 * 
 * @module prediction-market/betting-pool
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum bet amount required to place a bet */
export const MIN_BET = 100;

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Individual bet placed by a user
 */
export interface Bet {
  /** Wallet address of the bettor */
  address: string;
  
  /** Amount bet (in USD) */
  amount: number;
  
  /** Side of the bet: agree (price up) or disagree (price down) */
  side: 'agree' | 'disagree';
  
  /** Unix timestamp when the bet was placed */
  timestamp: number;
}

/**
 * Betting pool containing all bets for a round
 */
export interface BettingPool {
  /** Unique identifier for the round */
  roundId: string;
  
  /** Array of all bets placed in this round */
  bets: Bet[];
  
  /** Total amount bet on the agree side */
  agreeTotal: number;
  
  /** Total amount bet on the disagree side */
  disagreeTotal: number;
  
  /** Total amount in the pool (agree + disagree) */
  totalPool: number;
  
  /** Unix timestamp when the pool was created */
  createdAt: number;
}

/**
 * Calculated odds for each side of the betting pool
 */
export interface PoolOdds {
  /** Odds for agree side (totalPool / agreeTotal) - potential multiplier for agree winners */
  agreeOdds: number;
  
  /** Odds for disagree side (totalPool / disagreeTotal) - potential multiplier for disagree winners */
  disagreeOdds: number;
}

/**
 * Payout calculation for a winning bet
 */
export interface Payout {
  /** Wallet address of the winner */
  address: string;
  
  /** Original bet amount */
  originalBet: number;
  
  /** Profit earned from the bet: (theirBet / winningSideTotal) * losingSideTotal */
  profit: number;
  
  /** Total payout amount: originalBet + profit */
  total: number;
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

/** In-memory storage for all betting pools, keyed by roundId */
const poolStorage = new Map<string, BettingPool>();

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Initialize a new betting pool for a round
 * 
 * @param roundId - Unique identifier for the round
 * @returns The newly created BettingPool
 * 
 * @example
 * ```typescript
 * const pool = initPool('round-123');
 * console.log(pool.totalPool); // 0
 * ```
 */
export function initPool(roundId: string): BettingPool {
  const pool: BettingPool = {
    roundId,
    bets: [],
    agreeTotal: 0,
    disagreeTotal: 0,
    totalPool: 0,
    createdAt: Date.now(),
  };
  
  poolStorage.set(roundId, pool);
  return pool;
}

/**
 * Place a bet in an existing betting pool
 * 
 * @param roundId - Unique identifier for the round
 * @param address - Wallet address of the bettor
 * @param amount - Amount to bet (must be >= MIN_BET)
 * @param side - Side of the bet: 'agree' or 'disagree'
 * @returns The created Bet object
 * @throws Error if pool doesn't exist or amount is less than MIN_BET
 * 
 * @example
 * ```typescript
 * const bet = placeBet('round-123', '0x123...', 500, 'agree');
 * console.log(bet.amount); // 500
 * ```
 */
export function placeBet(
  roundId: string,
  address: string,
  amount: number,
  side: 'agree' | 'disagree'
): Bet {
  const pool = poolStorage.get(roundId);
  
  if (!pool) {
    throw new Error(`Pool not found for roundId: ${roundId}`);
  }
  
  if (amount < MIN_BET) {
    throw new Error(`Bet amount ${amount} is less than minimum bet ${MIN_BET}`);
  }
  
  const bet: Bet = {
    address,
    amount,
    side,
    timestamp: Date.now(),
  };
  
  pool.bets.push(bet);
  
  if (side === 'agree') {
    pool.agreeTotal += amount;
  } else {
    pool.disagreeTotal += amount;
  }
  
  pool.totalPool += amount;
  
  return bet;
}

/**
 * Calculate current odds for both sides of the betting pool
 * 
 * Odds represent the potential multiplier for winners.
 * If agree side wins, each agree bettor receives: betAmount * agreeOdds
 * If disagree side wins, each disagree bettor receives: betAmount * disagreeOdds
 * 
 * @param pool - The betting pool to calculate odds for
 * @returns PoolOdds with agreeOdds and disagreeOdds
 * 
 * @example
 * ```typescript
 * const pool = getPool('round-123');
 * const odds = calculateOdds(pool!);
 * console.log(odds.agreeOdds); // e.g., 1.5 (50% profit)
 * ```
 */
export function calculateOdds(pool: BettingPool): PoolOdds {
  const { totalPool, agreeTotal, disagreeTotal } = pool;
  
  // Handle edge case where one side has 0 bets
  // If no bets on a side, return Infinity to indicate undefined odds
  // (you can't calculate odds when there's nothing to win against)
  const agreeOdds = agreeTotal > 0 ? totalPool / agreeTotal : Infinity;
  const disagreeOdds = disagreeTotal > 0 ? totalPool / disagreeTotal : Infinity;
  
  return {
    agreeOdds,
    disagreeOdds,
  };
}

/**
 * Retrieve a betting pool by roundId
 * 
 * @param roundId - Unique identifier for the round
 * @returns The BettingPool if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const pool = getPool('round-123');
 * if (pool) {
 *   console.log(pool.totalPool);
 * }
 * ```
 */
export function getPool(roundId: string): BettingPool | undefined {
  return poolStorage.get(roundId);
}

/**
 * Calculate payouts for all winners of a betting pool
 * 
 * Each winner receives their original bet back plus a profit share
 * proportional to their bet relative to the winning side total.
 * 
 * Profit formula: (theirBet / winningSideTotal) * losingSideTotal
 * Total payout: originalBet + profit
 * 
 * @param pool - The betting pool to calculate payouts for
 * @param winningSide - The winning side: 'agree' or 'disagree'
 * @returns Array of Payout objects for all winners
 * 
 * @example
 * ```typescript
 * const pool = getPool('round-123')!;
 * const payouts = calculatePayouts(pool, 'agree');
 * payouts.forEach(p => console.log(`${p.address}: ${p.total}`));
 * ```
 */
export function calculatePayouts(
  pool: BettingPool,
  winningSide: 'agree' | 'disagree'
): Payout[] {
  const winningBets = pool.bets.filter(bet => bet.side === winningSide);
  
  if (winningBets.length === 0) {
    return [];
  }
  
  const winningSideTotal = winningSide === 'agree' ? pool.agreeTotal : pool.disagreeTotal;
  const losingSideTotal = winningSide === 'agree' ? pool.disagreeTotal : pool.agreeTotal;
  
  // If no one bet on the losing side, winners just get their money back (no profit)
  if (losingSideTotal === 0) {
    return winningBets.map(bet => ({
      address: bet.address,
      originalBet: bet.amount,
      profit: 0,
      total: bet.amount,
    }));
  }
  
  return winningBets.map(bet => {
    // Calculate profit share: (theirBet / winningSideTotal) * losingSideTotal
    const profit = (bet.amount / winningSideTotal) * losingSideTotal;
    
    return {
      address: bet.address,
      originalBet: bet.amount,
      profit,
      total: bet.amount + profit,
    };
  });
}

/**
 * Remove a betting pool from storage
 * 
 * @param roundId - Unique identifier for the round to remove
 * 
 * @example
 * ```typescript
 * clearPool('round-123');
 * const pool = getPool('round-123'); // undefined
 * ```
 */
export function clearPool(roundId: string): void {
  poolStorage.delete(roundId);
}

// ============================================================================
// UTILITY FUNCTIONS (optional helpers)
// ============================================================================

/**
 * Get the total number of pools currently in storage
 * @returns Number of pools
 */
export function getPoolCount(): number {
  return poolStorage.size;
}

/**
 * Check if a pool exists for a given roundId
 * @param roundId - Unique identifier for the round
 * @returns true if pool exists, false otherwise
 */
export function hasPool(roundId: string): boolean {
  return poolStorage.has(roundId);
}

/**
 * Get all pool roundIds
 * @returns Array of roundIds
 */
export function getAllPoolIds(): string[] {
  return Array.from(poolStorage.keys());
}
