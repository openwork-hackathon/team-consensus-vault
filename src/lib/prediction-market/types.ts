/**
 * Prediction Market Types
 * 
 * Type system for the prediction market feature where AI agents reach consensus
 * on trade signals and users can place bets on market outcomes.
 * 
 * Designed for compatibility with:
 * - Real-time SSE streaming
 * - Database persistence (PostgreSQL/Supabase)
 * - Frontend UI components
 */

// ============================================================================
// ROUND PHASE ENUM
// ============================================================================

/**
 * Phases of a prediction market round
 * 
 * Flow: SCANNING -> ENTRY_SIGNAL -> BETTING_WINDOW -> POSITION_OPEN 
 *       -> EXIT_SIGNAL -> SETTLEMENT -> (back to SCANNING)
 */
export enum RoundPhase {
  /** AI agents analyzing market conditions, gathering data */
  SCANNING = 'SCANNING',
  
  /** Consensus reached, preparing to open bets */
  ENTRY_SIGNAL = 'ENTRY_SIGNAL',
  
  /** Users can place bets (time-limited window) */
  BETTING_WINDOW = 'BETTING_WINDOW',
  
  /** Betting closed, position is live, waiting for exit conditions */
  POSITION_OPEN = 'POSITION_OPEN',
  
  /** AI agents signaling exit conditions */
  EXIT_SIGNAL = 'EXIT_SIGNAL',
  
  /** Calculating payouts and distributing to winners */
  SETTLEMENT = 'SETTLEMENT',
}

// ============================================================================
// ROUND STATE
// ============================================================================

/**
 * Current state of a prediction round
 * Contains all information about the round's current status
 */
export interface RoundState {
  /** Unique identifier for the round */
  id: string;
  
  /** Current phase of the round */
  phase: RoundPhase;
  
  /** Asset being traded (e.g., 'BTC', 'ETH', 'SOL') */
  asset: string;
  
  /** Entry price when the position was opened */
  entryPrice: number;
  
  /** Current market price (updated during POSITION_OPEN phase) */
  currentPrice?: number;
  
  /** Exit price when position was closed (available after SETTLEMENT) */
  exitPrice?: number;
  
  /** Direction of the trade: long (up) or short (down) */
  direction: 'long' | 'short';
  
  /** Consensus level (0-100) from AI agents */
  consensusLevel: number;
  
  /** Number of AI agents that agreed on the signal */
  consensusVotes: number;
  
  /** Total number of AI agents that voted */
  totalVotes: number;
  
  /** Timestamp when round was created */
  createdAt: string;
  
  /** Timestamp when betting window opens */
  bettingWindowStart?: string;
  
  /** Timestamp when betting window closes */
  bettingWindowEnd?: string;
  
  /** Timestamp when position was opened */
  positionOpenedAt?: string;
  
  /** Timestamp when exit signal was received */
  exitSignalAt?: string;
  
  /** Timestamp when settlement completed */
  settledAt?: string;
  
  /** Minimum bet amount for this round */
  minBet: number;
  
  /** Maximum bet amount for this round */
  maxBet: number;
  
  /** Pool of all bets placed in this round */
  bettingPool: BettingPool;
  
  /** Consensus snapshot that triggered this round */
  consensusSnapshot: ConsensusSnapshot;
  
  /** Settlement result (available after SETTLEMENT phase) */
  settlementResult?: SettlementResult;
}

// ============================================================================
// CONSENSUS SNAPSHOT
// ============================================================================

/**
 * Capture of AI agent consensus at a point in time
 * Represents the collective decision of the AI analysts
 */
export interface ConsensusSnapshot {
  /** Unique identifier for this consensus snapshot */
  id: string;
  
  /** Timestamp when consensus was reached */
  timestamp: string;
  
  /** Asset being analyzed */
  asset: string;
  
  /** Overall consensus signal */
  signal: 'buy' | 'sell' | 'hold';
  
  /** Consensus level (0-100) */
  consensusLevel: number;
  
  /** Number of agents agreeing with the consensus */
  agreementCount: number;
  
  /** Total number of agents that voted */
  totalAgents: number;
  
  /** Individual votes from each AI agent */
  votes: ConsensusVote[];
  
  /** Combined rationale from all agreeing agents */
  rationale: string;
  
  /** Average confidence across all votes */
  averageConfidence: number;
  
  /** Minimum confidence threshold for consensus */
  threshold: number;
}

/**
 * Individual vote from an AI agent
 */
export interface ConsensusVote {
  /** Agent identifier (e.g., 'deepseek', 'kimi', 'minimax', 'glm', 'gemini') */
  agentId: string;
  
  /** Agent display name */
  agentName: string;
  
  /** Signal voted by this agent */
  signal: 'buy' | 'sell' | 'hold';
  
  /** Confidence level (0-100) */
  confidence: number;
  
  /** Reasoning for the vote */
  reasoning: string;
  
  /** Response time in milliseconds */
  responseTimeMs: number;
  
  /** Whether this vote agrees with the final consensus */
  agreesWithConsensus: boolean;
}

// ============================================================================
// BET
// ============================================================================

/**
 * Individual user bet
 * Represents a single bet placed by a user
 */
export interface Bet {
  /** Unique identifier for the bet */
  id: string;
  
  /** ID of the round this bet belongs to */
  roundId: string;
  
  /** Wallet address of the user placing the bet */
  userAddress: string;
  
  /** Amount bet (in USD) */
  amount: number;
  
  /** Direction of the bet: long (price up) or short (price down) */
  direction: 'long' | 'short';
  
  /** Timestamp when the bet was placed */
  timestamp: string;
  
  /** Transaction hash (for on-chain verification) */
  txHash?: string;
  
  /** Current status of the bet */
  status: 'pending' | 'confirmed' | 'won' | 'lost';
  
  /** Payout amount (available after settlement) */
  payout?: number;
  
  /** Profit/loss amount (available after settlement) */
  profit?: number;
}

// ============================================================================
// BETTING POOL
// ============================================================================

/**
 * Aggregate of all bets in a round
 * Provides summary statistics for the betting pool
 */
export interface BettingPool {
  /** Total amount bet on long (price will go up) */
  totalLong: number;
  
  /** Total amount bet on short (price will go down) */
  totalShort: number;
  
  /** Total amount in the pool (long + short) */
  totalPool: number;
  
  /** Number of bets placed on long */
  longBetCount: number;
  
  /** Number of bets placed on short */
  shortBetCount: number;
  
  /** Total number of bets */
  totalBetCount: number;
  
  /** Average bet amount on long */
  avgLongBet: number;
  
  /** Average bet amount on short */
  avgShortBet: number;
  
  /** Current odds for long (totalPool / totalLong) */
  longOdds: number;
  
  /** Current odds for short (totalPool / totalShort) */
  shortOdds: number;
}

// ============================================================================
// SETTLEMENT RESULT
// ============================================================================

/**
 * Outcome of a prediction round
 * Contains the final results and payout calculations
 */
export interface SettlementResult {
  /** Unique identifier for this settlement */
  id: string;
  
  /** ID of the round being settled */
  roundId: string;
  
  /** Winning side: 'long' or 'short' */
  winningSide: 'long' | 'short';
  
  /** Exit price when position was closed */
  exitPrice: number;
  
  /** Entry price when position was opened */
  entryPrice: number;
  
  /** Price movement percentage */
  priceChangePercent: number;
  
  /** Whether the round was profitable for the winning side */
  isProfitable: boolean;
  
  /** Total profit/loss percentage for winners */
  profitLossPercent: number;
  
  /** Total amount paid out to winners */
  totalPayout: number;
  
  /** Total amount lost by losers */
  totalLoss: number;
  
  /** Platform fee taken from the pool */
  platformFee: number;
  
  /** Fee percentage applied */
  feePercentage: number;
  
  /** Timestamp when settlement was calculated */
  calculatedAt: string;
  
  /** Individual payouts to each winner */
  payouts: Payout[];
}

// ============================================================================
// PAYOUT
// ============================================================================

/**
 * Individual payout to a user
 * Represents the winnings for a single bet
 */
export interface Payout {
  /** Unique identifier for the payout */
  id: string;
  
  /** ID of the bet being paid out */
  betId: string;
  
  /** ID of the round */
  roundId: string;
  
  /** Wallet address receiving the payout */
  userAddress: string;
  
  /** Original bet amount */
  betAmount: number;
  
  /** Direction of the bet */
  direction: 'long' | 'short';
  
  /** Whether this bet was on the winning side */
  isWinner: boolean;
  
  /** Payout amount (bet amount + profit) */
  payoutAmount: number;
  
  /** Profit amount (payout - bet amount - fees) */
  profit: number;
  
  /** Net profit after fees */
  netProfit: number;
  
  /** ROI percentage (profit / betAmount * 100) */
  roiPercent: number;
  
  /** Timestamp when payout was processed */
  processedAt: string;
  
  /** Transaction hash for the payout transfer */
  txHash?: string;
}

// ============================================================================
// PREDICTION MARKET CONFIG
// ============================================================================

/**
 * Configuration constants for the prediction market
 */
export const PredictionMarketConfig = {
  /** Minimum bet amount in USD */
  MIN_BET: 10,
  
  /** Maximum bet amount in USD */
  MAX_BET: 10000,
  
  /** Betting window duration in milliseconds (default: 5 minutes) */
  BETTING_WINDOW_DURATION: 5 * 60 * 1000,
  
  /** Settlement delay in milliseconds (default: 30 seconds) */
  SETTLEMENT_DELAY: 30 * 1000,
  
  /** Platform fee percentage (default: 2%) */
  FEE_PERCENTAGE: 0.02,
  
  /** Minimum consensus level required to open a round (0-100) */
  MIN_CONSENSUS_LEVEL: 75,
  
  /** Minimum number of agents required for consensus */
  MIN_AGREEMENT_COUNT: 4,
  
  /** Price update interval during POSITION_OPEN phase (milliseconds) */
  PRICE_UPDATE_INTERVAL: 5000,
  
  /** Maximum duration for a round before forced settlement (milliseconds) */
  MAX_ROUND_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Round state transition event for SSE streaming
 */
export interface RoundStateEvent {
  type: 'ROUND_STATE_UPDATE';
  roundId: string;
  state: RoundState;
  timestamp: string;
}

/**
 * Bet placement event for SSE streaming
 */
export interface BetEvent {
  type: 'BET_PLACED';
  roundId: string;
  bet: Bet;
  timestamp: string;
}

/**
 * Settlement event for SSE streaming
 */
export interface SettlementEvent {
  type: 'ROUND_SETTLED';
  roundId: string;
  settlementResult: SettlementResult;
  timestamp: string;
}

/**
 * Union type for all prediction market events
 */
export type PredictionMarketEvent = 
  | RoundStateEvent
  | BetEvent
  | SettlementEvent;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a phase allows betting
 */
export function isBettingPhase(phase: RoundPhase): boolean {
  return phase === RoundPhase.BETTING_WINDOW;
}

/**
 * Check if a round is active (not settled)
 */
export function isRoundActive(phase: RoundPhase): boolean {
  return [
    RoundPhase.SCANNING,
    RoundPhase.ENTRY_SIGNAL,
    RoundPhase.BETTING_WINDOW,
    RoundPhase.POSITION_OPEN,
    RoundPhase.EXIT_SIGNAL,
  ].includes(phase);
}

/**
 * Check if a round is completed
 */
export function isRoundCompleted(phase: RoundPhase): boolean {
  return phase === RoundPhase.SETTLEMENT;
}

/**
 * Calculate potential payout for a bet
 */
export function calculatePotentialPayout(
  betAmount: number,
  direction: 'long' | 'short',
  pool: BettingPool,
  feePercentage: number = PredictionMarketConfig.FEE_PERCENTAGE
): { payout: number; profit: number; netProfit: number } {
  const totalPool = pool.totalLong + pool.totalShort;
  const winningPool = direction === 'long' ? pool.totalLong : pool.totalShort;
  
  if (winningPool === 0) {
    return { payout: 0, profit: 0, netProfit: 0 };
  }
  
  // Calculate share of the winning pool
  const shareOfPool = betAmount / winningPool;
  
  // Calculate gross payout (share of entire pool)
  const grossPayout = shareOfPool * totalPool;
  
  // Calculate fee
  const fee = grossPayout * feePercentage;
  
  // Calculate net payout
  const netPayout = grossPayout - fee;
  
  // Calculate profit
  const profit = netPayout - betAmount;
  
  return {
    payout: netPayout,
    profit,
    netProfit: profit,
  };
}

/**
 * Calculate betting pool statistics from an array of bets
 */
export function calculateBettingPool(bets: Bet[]): BettingPool {
  const longBets = bets.filter(b => b.direction === 'long');
  const shortBets = bets.filter(b => b.direction === 'short');
  
  const totalLong = longBets.reduce((sum, b) => sum + b.amount, 0);
  const totalShort = shortBets.reduce((sum, b) => sum + b.amount, 0);
  const totalPool = totalLong + totalShort;
  
  const avgLongBet = longBets.length > 0 ? totalLong / longBets.length : 0;
  const avgShortBet = shortBets.length > 0 ? totalShort / shortBets.length : 0;
  
  const longOdds = totalLong > 0 ? totalPool / totalLong : 0;
  const shortOdds = totalShort > 0 ? totalPool / totalShort : 0;
  
  return {
    totalLong,
    totalShort,
    totalPool,
    longBetCount: longBets.length,
    shortBetCount: shortBets.length,
    totalBetCount: bets.length,
    avgLongBet,
    avgShortBet,
    longOdds,
    shortOdds,
  };
}
