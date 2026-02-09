/**
 * Prediction Market Round Engine
 * 
 * Server-side state machine for managing prediction market rounds.
 * Orchestrates the lifecycle of a trading round from scanning to settlement.
 * 
 * State Machine Flow:
 * SCANNING → ENTRY_SIGNAL → BETTING_WINDOW → POSITION_OPEN → EXIT_SIGNAL → SETTLEMENT
 * 
 * @module prediction-market/round-engine
 */

import { ConsensusResponse, Signal } from '../models';
import { getCurrentPrice } from '../price-service';
import { getCurrentPool } from './state';
import {
  RoundState,
  RoundPhase,
  BettingPool,
  SettlementResult,
  ConsensusSnapshot,
  PredictionMarketConfig,
  calculateBettingPool,
  Bet,
  Payout,
} from './types';

// ============================================================================
// TYPE ALIASES
// ============================================================================

/**
 * Round - Alias for RoundState for convenience
 */
export type Round = RoundState;

// ============================================================================
// ROUND CREATION
// ============================================================================

/**
 * Create a new prediction market round in SCANNING state
 * 
 * @param asset - The asset to trade (e.g., 'BTC', 'ETH', 'SOL')
 * @returns A new Round object initialized in SCANNING phase
 */
export function createNewRound(asset: string): Round {
  const now = new Date().toISOString();
  const roundId = `round_${asset.toLowerCase()}_${Date.now()}`;

  return {
    id: roundId,
    phase: RoundPhase.SCANNING,
    asset: asset.toUpperCase(),
    entryPrice: 0,
    currentPrice: undefined,
    exitPrice: undefined,
    direction: 'long', // Default direction, will be set based on consensus
    consensusLevel: 0,
    consensusVotes: 0,
    totalVotes: 0,
    createdAt: now,
    bettingWindowStart: undefined,
    bettingWindowEnd: undefined,
    positionOpenedAt: undefined,
    exitSignalAt: undefined,
    settledAt: undefined,
    minBet: PredictionMarketConfig.MIN_BET,
    maxBet: PredictionMarketConfig.MAX_BET,
    bettingPool: createEmptyBettingPool(),
    consensusSnapshot: createEmptyConsensusSnapshot(),
    settlementResult: undefined,
  };
}

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Process consensus result and transition round state accordingly
 * 
 * State Transitions:
 * - SCANNING → ENTRY_SIGNAL: When 4/5 (80%) consensus reaches BUY or SELL
 * - ENTRY_SIGNAL → BETTING_WINDOW: Capture entry price, open betting window
 * - BETTING_WINDOW → POSITION_OPEN: Timer expires, betting closed, position is live
 * - POSITION_OPEN → EXIT_SIGNAL: When consensus flips (BUY→SELL or SELL→BUY)
 * - EXIT_SIGNAL → SETTLEMENT: Capture exit price, calculate results
 * 
 * @param round - The current round state
 * @param consensus - The consensus response from AI analysts
 * @returns Updated round with new state
 */
export async function processConsensusResult(
  round: Round,
  consensus: ConsensusResponse
): Promise<Round> {
  const updatedRound = { ...round };

  switch (round.phase) {
    case RoundPhase.SCANNING:
      // Check if we have strong consensus (4/5 or 80% agreement)
      if (consensus.consensus_status === 'CONSENSUS_REACHED' && 
          consensus.consensus_signal &&
          consensus.consensus_signal !== 'hold') {
        
        // Transition to ENTRY_SIGNAL
        updatedRound.phase = RoundPhase.ENTRY_SIGNAL;
        updatedRound.direction = consensusSignalToDirection(consensus.consensus_signal);
        updatedRound.consensusLevel = calculateConsensusLevel(consensus);
        updatedRound.consensusVotes = consensus.individual_votes.filter(
          v => v.signal === consensus.consensus_signal && v.status === 'success'
        ).length;
        updatedRound.totalVotes = consensus.individual_votes.filter(
          v => v.status === 'success'
        ).length;
        
        // Store consensus snapshot
        updatedRound.consensusSnapshot = createConsensusSnapshot(consensus, round.asset);
        
        // Auto-transition to BETTING_WINDOW by capturing entry price
        return await transitionToBettingWindow(updatedRound);
      }
      break;

    case RoundPhase.ENTRY_SIGNAL:
      // Should auto-transition to BETTING_WINDOW (handled above)
      // If we're still here, capture entry price and move to betting
      return await transitionToBettingWindow(updatedRound);

    case RoundPhase.BETTING_WINDOW:
      // Check if betting window has expired
      if (round.bettingWindowEnd) {
        const endTime = new Date(round.bettingWindowEnd).getTime();
        if (Date.now() >= endTime) {
          return transitionToPositionOpen(updatedRound);
        }
      }
      break;

    case RoundPhase.POSITION_OPEN:
      // Check for consensus flip (exit signal)
      if (consensus.consensus_status === 'CONSENSUS_REACHED' && 
          consensus.consensus_signal &&
          consensus.consensus_signal !== 'hold') {
        
        const currentDirection = consensusSignalToDirection(consensus.consensus_signal);
        const previousDirection = round.direction;
        
        // Check if consensus flipped (long → short or short → long)
        if (isConsensusFlipped(
          previousDirection === 'long' ? 'buy' : 'sell',
          currentDirection === 'long' ? 'buy' : 'sell'
        )) {
          return transitionToExitSignal(updatedRound);
        }
      }
      break;

    case RoundPhase.EXIT_SIGNAL:
      // Auto-transition to SETTLEMENT by capturing exit price
      return await transitionToSettlement(updatedRound);

    case RoundPhase.SETTLEMENT:
      // Round is complete, no further transitions
      break;
  }

  return updatedRound;
}

/**
 * Transition round to BETTING_WINDOW phase
 * Captures entry price and sets up betting window
 */
async function transitionToBettingWindow(round: Round): Promise<Round> {
  const now = new Date();
  const bettingWindowStart = now.toISOString();
  const bettingWindowEnd = new Date(
    now.getTime() + PredictionMarketConfig.BETTING_WINDOW_DURATION
  ).toISOString();

  // Fetch current entry price
  const entryPrice = await getCurrentPrice(round.asset);

  return {
    ...round,
    phase: RoundPhase.BETTING_WINDOW,
    entryPrice,
    currentPrice: entryPrice,
    bettingWindowStart,
    bettingWindowEnd,
  };
}

/**
 * Transition round to POSITION_OPEN phase
 * Betting is closed, position is now live
 */
function transitionToPositionOpen(round: Round): Round {
  return {
    ...round,
    phase: RoundPhase.POSITION_OPEN,
    positionOpenedAt: new Date().toISOString(),
  };
}

/**
 * Transition round to EXIT_SIGNAL phase
 * Consensus has flipped, prepare to exit
 */
function transitionToExitSignal(round: Round): Round {
  return {
    ...round,
    phase: RoundPhase.EXIT_SIGNAL,
    exitSignalAt: new Date().toISOString(),
  };
}

/**
 * Transition round to SETTLEMENT phase
 * Captures exit price and calculates settlement
 */
async function transitionToSettlement(round: Round): Promise<Round> {
  const exitPrice = await getCurrentPrice(round.asset);
  const now = new Date().toISOString();

  // Get current pool with bets
  const currentPoolData = getCurrentPool();
  const bets = currentPoolData.bets;

  // Calculate settlement result
  const settlementResult = calculateSettlement(round, round.bettingPool, bets);

  return {
    ...round,
    phase: RoundPhase.SETTLEMENT,
    exitPrice,
    currentPrice: exitPrice,
    settledAt: now,
    settlementResult: {
      ...settlementResult,
      exitPrice,
      calculatedAt: now,
    },
  };
}

// ============================================================================
// CONSENSUS HELPERS
// ============================================================================

/**
 * Check if consensus has flipped from previous to current
 * 
 * @param previousConsensus - Previous consensus signal ('buy', 'sell', or 'hold')
 * @param currentConsensus - Current consensus signal ('buy', 'sell', or 'hold')
 * @returns True if consensus flipped (buy→sell or sell→buy)
 */
export function isConsensusFlipped(
  previousConsensus: string,
  currentConsensus: string
): boolean {
  const prev = previousConsensus.toLowerCase();
  const curr = currentConsensus.toLowerCase();

  // Flip occurs when buy changes to sell or sell changes to buy
  return (
    (prev === 'buy' && curr === 'sell') ||
    (prev === 'sell' && curr === 'buy')
  );
}

/**
 * Convert consensus signal to trade direction
 */
function consensusSignalToDirection(signal: Signal): 'long' | 'short' {
  return signal === 'buy' ? 'long' : 'short';
}

/**
 * Calculate consensus level from consensus response
 * Returns percentage (0-100) of analysts agreeing with the consensus
 */
function calculateConsensusLevel(consensus: ConsensusResponse): number {
  if (!consensus.consensus_signal) {
    return 0;
  }

  const signalCounts = {
    buy: consensus.vote_counts.BUY,
    sell: consensus.vote_counts.SELL,
    hold: consensus.vote_counts.HOLD,
  };

  const totalVotes = signalCounts.buy + signalCounts.sell + signalCounts.hold;
  const agreeingVotes = signalCounts[consensus.consensus_signal];

  if (totalVotes === 0) {
    return 0;
  }

  return Math.round((agreeingVotes / totalVotes) * 100);
}

// ============================================================================
// SETTLEMENT CALCULATION
// ============================================================================

/**
 * Calculate settlement result for a completed round
 * Compares entry vs exit price to determine winners
 * 
 * @param round - The round to settle
 * @param pool - The betting pool for the round
 * @param bets - Array of all bets placed in this round
 * @returns Settlement result with winning side and payouts
 */
export function calculateSettlement(
  round: Round,
  pool: BettingPool,
  bets: Bet[]
): SettlementResult {
  const { entryPrice, exitPrice, direction, asset, id } = round;

  if (!exitPrice) {
    throw new Error('Cannot settle round: exit price not available');
  }

  // Calculate price change
  const priceChangePercent = ((exitPrice - entryPrice) / entryPrice) * 100;

  // Determine winning side
  // For long: price up = win, price down = loss
  // For short: price down = win, price up = loss
  let winningSide: 'long' | 'short';
  
  if (direction === 'long') {
    winningSide = priceChangePercent > 0 ? 'long' : 'short';
  } else {
    winningSide = priceChangePercent < 0 ? 'long' : 'short';
  }

  const isProfitable = winningSide === direction;
  const profitLossPercent = Math.abs(priceChangePercent);

  // Calculate pool totals
  const totalPool = pool.totalLong + pool.totalShort;
  const winningPool = winningSide === 'long' ? pool.totalLong : pool.totalShort;
  const losingPool = winningSide === 'long' ? pool.totalShort : pool.totalLong;

  // Calculate platform fee
  const feePercentage = PredictionMarketConfig.FEE_PERCENTAGE;
  const platformFee = totalPool * feePercentage;

  // Calculate payouts
  const totalPayout = totalPool - platformFee;
  const totalLoss = losingPool;

  // Generate individual payouts
  const payouts: Payout[] = [];

  // Process each bet and calculate payouts
  bets.forEach((bet) => {
    const isWinner = bet.direction === winningSide;
    
    if (isWinner && winningPool > 0) {
      // Calculate payout for winners
      // Each winner gets a proportional share of the total payout based on their bet size
      const betShareOfWinningPool = bet.amount / winningPool;
      const payoutAmount = betShareOfWinningPool * totalPayout;
      const profit = payoutAmount - bet.amount;
      const netProfit = profit; // Fees already deducted from totalPayout
      const roiPercent = (profit / bet.amount) * 100;

      // Update bet status and payout fields
      bet.status = 'won';
      bet.payout = payoutAmount;
      bet.profit = profit;

      // Create payout object
      const payout: Payout = {
        id: `payout_${bet.id}_${Date.now()}`,
        betId: bet.id,
        roundId: round.id,
        userAddress: bet.userAddress,
        betAmount: bet.amount,
        direction: bet.direction,
        isWinner: true,
        payoutAmount,
        profit,
        netProfit,
        roiPercent,
        processedAt: new Date().toISOString(),
      };

      payouts.push(payout);
    } else {
      // Losers get no payout
      const payoutAmount = 0;
      const profit = -bet.amount; // Lost the entire bet
      const netProfit = profit;
      const roiPercent = -100; // Lost 100% of the bet

      // Update bet status and payout fields
      bet.status = 'lost';
      bet.payout = 0;
      bet.profit = profit;

      // Create payout object for losers
      const payout: Payout = {
        id: `payout_${bet.id}_${Date.now()}`,
        betId: bet.id,
        roundId: round.id,
        userAddress: bet.userAddress,
        betAmount: bet.amount,
        direction: bet.direction,
        isWinner: false,
        payoutAmount,
        profit,
        netProfit,
        roiPercent,
        processedAt: new Date().toISOString(),
      };

      payouts.push(payout);
    }
  });

  return {
    id: `settlement_${id}`,
    roundId: id,
    winningSide,
    exitPrice,
    entryPrice,
    priceChangePercent,
    isProfitable,
    profitLossPercent,
    totalPayout,
    totalLoss,
    platformFee,
    feePercentage,
    calculatedAt: new Date().toISOString(),
    payouts,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an empty betting pool
 */
function createEmptyBettingPool(): BettingPool {
  return {
    totalLong: 0,
    totalShort: 0,
    totalPool: 0,
    longBetCount: 0,
    shortBetCount: 0,
    totalBetCount: 0,
    avgLongBet: 0,
    avgShortBet: 0,
    longOdds: 0,
    shortOdds: 0,
  };
}

/**
 * Create an empty consensus snapshot
 */
function createEmptyConsensusSnapshot(): ConsensusSnapshot {
  return {
    id: '',
    timestamp: '',
    asset: '',
    signal: 'hold',
    consensusLevel: 0,
    agreementCount: 0,
    totalAgents: 0,
    votes: [],
    rationale: '',
    averageConfidence: 0,
    threshold: PredictionMarketConfig.MIN_CONSENSUS_LEVEL,
  };
}

/**
 * Create a consensus snapshot from a consensus response
 */
function createConsensusSnapshot(
  consensus: ConsensusResponse,
  asset: string
): ConsensusSnapshot {
  const signal = consensus.consensus_signal || 'hold';
  const agreeingVotes = consensus.vote_counts[signal.toUpperCase() as keyof typeof consensus.vote_counts] || 0;
  const totalVotes = consensus.individual_votes.filter(v => v.status === 'success').length;
  
  // Calculate average confidence from successful votes
  const successfulVotes = consensus.individual_votes.filter(v => v.status === 'success');
  const avgConfidence = successfulVotes.length > 0
    ? successfulVotes.reduce((sum, v) => sum + v.confidence, 0) / successfulVotes.length
    : 0;

  // Build votes array
  const votes = consensus.individual_votes.map(v => ({
    agentId: v.model_name,
    agentName: v.model_name,
    signal: (v.signal || 'hold') as 'buy' | 'sell' | 'hold',
    confidence: v.confidence,
    reasoning: v.error || '',
    responseTimeMs: v.response_time_ms,
    agreesWithConsensus: v.signal === consensus.consensus_signal,
  }));

  // Build rationale from agreeing votes
  const agreeingVotesData = votes.filter(v => v.agreesWithConsensus);
  const rationale = agreeingVotesData.length > 0
    ? `${agreeingVotesData.length} out of ${totalVotes} analysts agree on ${signal.toUpperCase()}`
    : `Consensus: ${signal.toUpperCase()}`;

  return {
    id: `consensus_${Date.now()}`,
    timestamp: consensus.timestamp,
    asset: asset.toUpperCase(),
    signal,
    consensusLevel: Math.round((agreeingVotes / Math.max(totalVotes, 1)) * 100),
    agreementCount: agreeingVotes,
    totalAgents: totalVotes,
    votes,
    rationale,
    averageConfidence: Math.round(avgConfidence),
    threshold: PredictionMarketConfig.MIN_CONSENSUS_LEVEL,
  };
}

// ============================================================================
// ROUND STATUS HELPERS
// ============================================================================

/**
 * Check if a round is in a valid state for a given operation
 */
export function canPlaceBet(round: Round): boolean {
  return round.phase === RoundPhase.BETTING_WINDOW;
}

/**
 * Check if a round has completed
 */
export function isRoundComplete(round: Round): boolean {
  return round.phase === RoundPhase.SETTLEMENT;
}

/**
 * Check if a round is active (in any phase except settlement)
 */
export function isRoundActive(round: Round): boolean {
  return round.phase !== RoundPhase.SETTLEMENT;
}

/**
 * Get time remaining in betting window (in milliseconds)
 * Returns 0 if betting window is closed
 */
export function getBettingWindowTimeRemaining(round: Round): number {
  if (round.phase !== RoundPhase.BETTING_WINDOW || !round.bettingWindowEnd) {
    return 0;
  }

  const endTime = new Date(round.bettingWindowEnd).getTime();
  const now = Date.now();
  return Math.max(0, endTime - now);
}

/**
 * Check if betting window has expired
 */
export function hasBettingWindowExpired(round: Round): boolean {
  return getBettingWindowTimeRemaining(round) === 0;
}
