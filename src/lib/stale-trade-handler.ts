/**
 * Stale Trade Handler
 * 
 * CVAULT-181: Handles stale/orphaned trading positions when nobody visits the app.
 * 
 * Problem: If no one visits the app for hours, open positions (both paper trades 
 * and prediction market rounds) can become stale/orphaned because:
 * - The SSE prediction market loop only runs while clients are connected
 * - Paper trades opened by consensus signals may never get a reversal signal
 * - Module-level state resets on serverless cold starts
 * 
 * Solution: A cleanup mechanism that can be triggered via:
 * 1. Vercel Cron job (periodic, e.g., every 30 minutes)
 * 2. On-demand when any API route detects stale state
 * 3. Manual invocation via API endpoint
 * 
 * Approach:
 * - Paper trades open longer than STALE_TRADE_THRESHOLD are auto-closed at current market price
 * - Prediction market rounds stuck in non-terminal phases are auto-settled or expired
 * - Prediction market bets in stale rounds get refunded (no winners/losers)
 * - All actions are logged for auditability
 * 
 * @module stale-trade-handler
 */

import { Trade } from './trading-types';
import { getStoredTrades, setStoredTrades } from './storage';
import { getCurrentPrice } from './price-service';
import { getCurrentRound, setCurrentRound, getCurrentPool, resetPool } from './prediction-market/state';
import { RoundPhase, PredictionMarketConfig } from './prediction-market/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const STALE_TRADE_CONFIG = {
  /** 
   * Maximum age for an open paper trade before auto-close (milliseconds)
   * Default: 4 hours. Paper trades open longer than this are considered stale.
   */
  PAPER_TRADE_MAX_AGE_MS: 4 * 60 * 60 * 1000,

  /**
   * Maximum age for a prediction market round in non-terminal phases (milliseconds)
   * Default: 2 hours. Rounds stuck longer than this are auto-settled/expired.
   * Note: PredictionMarketConfig.MAX_ROUND_DURATION is 24h but that's for 
   * actively-monitored rounds. Stale rounds should be cleaned up sooner.
   */
  PREDICTION_ROUND_MAX_AGE_MS: 2 * 60 * 60 * 1000,

  /**
   * Maximum time a round can stay in BETTING_WINDOW after the window closes (ms)
   * If the betting window ended but no one transitioned to POSITION_OPEN, it's stale.
   * Default: 10 minutes.
   */
  BETTING_WINDOW_GRACE_PERIOD_MS: 10 * 60 * 1000,

  /**
   * Maximum time a round can stay in POSITION_OPEN without price updates (ms)
   * Default: 1 hour. Without an active SSE stream, prices aren't updating.
   */
  POSITION_OPEN_MAX_STALE_MS: 1 * 60 * 60 * 1000,

  /**
   * Minimum time between cleanup runs to prevent excessive processing (ms)
   * Default: 5 minutes.
   */
  MIN_CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
} as const;

// Track last cleanup time to prevent excessive runs
let lastCleanupTimestamp = 0;

// ============================================================================
// TYPES
// ============================================================================

export interface StaleTradeCleanupResult {
  /** Timestamp when cleanup was performed */
  timestamp: string;
  
  /** Whether the cleanup actually ran (may be skipped if too recent) */
  executed: boolean;
  
  /** Reason if not executed */
  skipReason?: string;
  
  /** Paper trades that were auto-closed */
  paperTradesClosed: {
    tradeId: string;
    asset: string;
    direction: 'long' | 'short';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPercentage: number;
    ageMs: number;
    reason: string;
  }[];
  
  /** Prediction market rounds that were expired/settled */
  predictionRoundsHandled: {
    roundId: string;
    previousPhase: string;
    action: 'expired' | 'auto_settled' | 'refunded';
    betsRefunded: number;
    totalRefundAmount: number;
    reason: string;
  }[];
  
  /** Summary statistics */
  summary: {
    paperTradesChecked: number;
    paperTradesClosed: number;
    predictionRoundChecked: boolean;
    predictionRoundAction: string | null;
    totalBetsRefunded: number;
    durationMs: number;
  };
  
  /** Log entries for each action taken */
  logs: string[];
}

// ============================================================================
// MAIN CLEANUP FUNCTION
// ============================================================================

/**
 * Run stale trade cleanup
 * 
 * This is the main entry point for handling stale trades.
 * Can be called from a cron job, API endpoint, or on-demand.
 * 
 * @param force - If true, skip the minimum interval check
 * @returns Cleanup result with details of all actions taken
 */
export async function runStaleTradeCleanup(
  force: boolean = false
): Promise<StaleTradeCleanupResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  
  const log = (message: string) => {
    const entry = `[stale-trade-handler] ${new Date().toISOString()} ${message}`;
    logs.push(entry);
    console.log(entry);
  };

  // Check minimum interval
  if (!force && (startTime - lastCleanupTimestamp) < STALE_TRADE_CONFIG.MIN_CLEANUP_INTERVAL_MS) {
    const skipReason = `Skipped: last cleanup was ${Math.round((startTime - lastCleanupTimestamp) / 1000)}s ago (minimum interval: ${STALE_TRADE_CONFIG.MIN_CLEANUP_INTERVAL_MS / 1000}s)`;
    log(skipReason);
    return {
      timestamp: new Date().toISOString(),
      executed: false,
      skipReason,
      paperTradesClosed: [],
      predictionRoundsHandled: [],
      summary: {
        paperTradesChecked: 0,
        paperTradesClosed: 0,
        predictionRoundChecked: false,
        predictionRoundAction: null,
        totalBetsRefunded: 0,
        durationMs: Date.now() - startTime,
      },
      logs,
    };
  }

  lastCleanupTimestamp = startTime;
  log('Starting stale trade cleanup...');

  // Phase 1: Handle stale paper trades
  const paperTradeResults = await handleStalePaperTrades(log);

  // Phase 2: Handle stale prediction market rounds
  const predictionRoundResults = await handleStalePredictionRounds(log);

  const durationMs = Date.now() - startTime;
  log(`Cleanup complete in ${durationMs}ms. Closed ${paperTradeResults.length} paper trades, handled ${predictionRoundResults.length} prediction rounds.`);

  return {
    timestamp: new Date().toISOString(),
    executed: true,
    paperTradesClosed: paperTradeResults,
    predictionRoundsHandled: predictionRoundResults,
    summary: {
      paperTradesChecked: paperTradeResults.length > 0 ? paperTradeResults.length : 0,
      paperTradesClosed: paperTradeResults.length,
      predictionRoundChecked: true,
      predictionRoundAction: predictionRoundResults.length > 0 
        ? predictionRoundResults[0].action 
        : null,
      totalBetsRefunded: predictionRoundResults.reduce((sum, r) => sum + r.betsRefunded, 0),
      durationMs,
    },
    logs,
  };
}

// ============================================================================
// PAPER TRADE CLEANUP
// ============================================================================

/**
 * Find and auto-close stale paper trades
 * 
 * A paper trade is considered stale if:
 * - It has status 'open'
 * - It was opened more than PAPER_TRADE_MAX_AGE_MS ago
 * 
 * Stale trades are closed at the current market price.
 */
async function handleStalePaperTrades(
  log: (msg: string) => void
): Promise<StaleTradeCleanupResult['paperTradesClosed']> {
  const results: StaleTradeCleanupResult['paperTradesClosed'] = [];
  
  try {
    const trades = await getStoredTrades();
    const openTrades = trades.filter(t => t.status === 'open');
    const now = Date.now();
    
    log(`Found ${openTrades.length} open paper trades to check`);

    if (openTrades.length === 0) {
      return results;
    }

    let updatedTrades = [...trades];
    let hasChanges = false;

    for (const trade of openTrades) {
      const tradeTimestamp = new Date(trade.timestamp).getTime();
      const ageMs = now - tradeTimestamp;

      if (ageMs > STALE_TRADE_CONFIG.PAPER_TRADE_MAX_AGE_MS) {
        log(`Trade ${trade.id} is stale (age: ${Math.round(ageMs / 60000)}min, asset: ${trade.asset})`);

        try {
          // Get current price for the trade's asset
          const exitPrice = await getCurrentPrice(trade.asset);
          
          // Calculate P&L
          const pnl = trade.direction === 'long'
            ? exitPrice - trade.entryPrice
            : trade.entryPrice - exitPrice;
          const pnlPercentage = (pnl / trade.entryPrice) * 100;

          // Update the trade to closed
          const closedTrade: Trade = {
            ...trade,
            exitPrice,
            pnl,
            pnlPercentage,
            status: 'closed',
            closedAt: new Date().toISOString(),
          };

          // Replace in the trades array
          updatedTrades = updatedTrades.map(t => 
            t.id === trade.id ? closedTrade : t
          );
          hasChanges = true;

          const result = {
            tradeId: trade.id,
            asset: trade.asset,
            direction: trade.direction,
            entryPrice: trade.entryPrice,
            exitPrice,
            pnl,
            pnlPercentage,
            ageMs,
            reason: `Auto-closed: trade open for ${Math.round(ageMs / 3600000)}h ${Math.round((ageMs % 3600000) / 60000)}m (threshold: ${STALE_TRADE_CONFIG.PAPER_TRADE_MAX_AGE_MS / 3600000}h)`,
          };

          results.push(result);
          log(`Closed trade ${trade.id}: ${trade.direction} ${trade.asset} @ ${trade.entryPrice} → ${exitPrice}, PnL: ${pnl.toFixed(2)} (${pnlPercentage.toFixed(2)}%)`);

        } catch (priceError) {
          log(`Warning: Could not get price for ${trade.asset} to close trade ${trade.id}: ${priceError}`);
          
          // Close at entry price (zero P&L) as fallback
          const closedTrade: Trade = {
            ...trade,
            exitPrice: trade.entryPrice,
            pnl: 0,
            pnlPercentage: 0,
            status: 'closed',
            closedAt: new Date().toISOString(),
          };

          updatedTrades = updatedTrades.map(t => 
            t.id === trade.id ? closedTrade : t
          );
          hasChanges = true;

          results.push({
            tradeId: trade.id,
            asset: trade.asset,
            direction: trade.direction,
            entryPrice: trade.entryPrice,
            exitPrice: trade.entryPrice,
            pnl: 0,
            pnlPercentage: 0,
            ageMs,
            reason: `Auto-closed at entry price (price fetch failed): trade open for ${Math.round(ageMs / 3600000)}h`,
          });
        }
      }
    }

    // Persist updated trades
    if (hasChanges) {
      await setStoredTrades(updatedTrades);
      log(`Persisted ${results.length} closed stale trades to storage`);
    }

  } catch (error) {
    log(`Error handling stale paper trades: ${error}`);
  }

  return results;
}

// ============================================================================
// PREDICTION MARKET ROUND CLEANUP
// ============================================================================

/**
 * Handle stale prediction market rounds
 * 
 * A prediction market round is considered stale based on its phase:
 * 
 * - SCANNING: Stale if round created > PREDICTION_ROUND_MAX_AGE_MS ago
 *   → Action: Reset to fresh SCANNING state (no bets to refund)
 * 
 * - ENTRY_SIGNAL: Stale if stuck > 10 minutes
 *   → Action: Reset to SCANNING (no bets placed yet)
 * 
 * - BETTING_WINDOW: Stale if betting window ended > BETTING_WINDOW_GRACE_PERIOD_MS ago
 *   → Action: If bets exist, expire round and refund all bets
 *   → Action: If no bets, reset to SCANNING
 * 
 * - POSITION_OPEN: Stale if position opened > POSITION_OPEN_MAX_STALE_MS ago
 *   → Action: Auto-settle at current price, calculate winners/losers
 * 
 * - EXIT_SIGNAL: Stale if exit signal > 10 minutes ago (should auto-settle quickly)
 *   → Action: Auto-settle at current price
 * 
 * - SETTLEMENT: Not stale (terminal state), but reset if older than 1 hour
 *   → Action: Reset to SCANNING for new round
 */
async function handleStalePredictionRounds(
  log: (msg: string) => void
): Promise<StaleTradeCleanupResult['predictionRoundsHandled']> {
  const results: StaleTradeCleanupResult['predictionRoundsHandled'] = [];

  try {
    const currentRound = getCurrentRound();
    
    if (!currentRound) {
      log('No active prediction market round found');
      return results;
    }

    const now = Date.now();
    const roundCreatedAt = new Date(currentRound.createdAt).getTime();
    const roundAge = now - roundCreatedAt;

    log(`Checking prediction round ${currentRound.id}, phase: ${currentRound.phase}, age: ${Math.round(roundAge / 60000)}min`);

    switch (currentRound.phase) {
      case RoundPhase.SCANNING: {
        if (roundAge > STALE_TRADE_CONFIG.PREDICTION_ROUND_MAX_AGE_MS) {
          log(`Round ${currentRound.id} stuck in SCANNING for ${Math.round(roundAge / 60000)}min, resetting`);
          resetToFreshRound(currentRound.asset);
          results.push({
            roundId: currentRound.id,
            previousPhase: RoundPhase.SCANNING,
            action: 'expired',
            betsRefunded: 0,
            totalRefundAmount: 0,
            reason: `Round stuck in SCANNING for ${Math.round(roundAge / 60000)}min`,
          });
        }
        break;
      }

      case RoundPhase.ENTRY_SIGNAL: {
        // ENTRY_SIGNAL should transition quickly to BETTING_WINDOW
        if (roundAge > 10 * 60 * 1000) { // 10 minutes
          log(`Round ${currentRound.id} stuck in ENTRY_SIGNAL, resetting`);
          resetToFreshRound(currentRound.asset);
          results.push({
            roundId: currentRound.id,
            previousPhase: RoundPhase.ENTRY_SIGNAL,
            action: 'expired',
            betsRefunded: 0,
            totalRefundAmount: 0,
            reason: `Round stuck in ENTRY_SIGNAL for ${Math.round(roundAge / 60000)}min`,
          });
        }
        break;
      }

      case RoundPhase.BETTING_WINDOW: {
        // Check if betting window has ended
        const bettingWindowEnd = currentRound.bettingWindowEnd 
          ? new Date(currentRound.bettingWindowEnd).getTime() 
          : 0;
        
        const timeSinceWindowEnd = bettingWindowEnd > 0 ? now - bettingWindowEnd : 0;
        
        if (bettingWindowEnd > 0 && timeSinceWindowEnd > STALE_TRADE_CONFIG.BETTING_WINDOW_GRACE_PERIOD_MS) {
          const pool = getCurrentPool();
          const totalBets = pool.bets.length;
          const totalAmount = pool.totalUp + pool.totalDown;

          if (totalBets > 0) {
            // Refund all bets - round expired without settling
            log(`Round ${currentRound.id} expired in BETTING_WINDOW with ${totalBets} bets totaling $${totalAmount}. Refunding.`);
            
            // Mark all bets as refunded (set status to pending for identification)
            for (const bet of pool.bets) {
              bet.status = 'pending'; // Mark as needing refund
            }
            
            resetPool();
            resetToFreshRound(currentRound.asset);

            results.push({
              roundId: currentRound.id,
              previousPhase: RoundPhase.BETTING_WINDOW,
              action: 'refunded',
              betsRefunded: totalBets,
              totalRefundAmount: totalAmount,
              reason: `Betting window ended ${Math.round(timeSinceWindowEnd / 60000)}min ago with no transition to POSITION_OPEN`,
            });
          } else {
            log(`Round ${currentRound.id} expired in BETTING_WINDOW with no bets, resetting`);
            resetToFreshRound(currentRound.asset);
            results.push({
              roundId: currentRound.id,
              previousPhase: RoundPhase.BETTING_WINDOW,
              action: 'expired',
              betsRefunded: 0,
              totalRefundAmount: 0,
              reason: `Betting window ended ${Math.round(timeSinceWindowEnd / 60000)}min ago, no bets placed`,
            });
          }
        }
        break;
      }

      case RoundPhase.POSITION_OPEN: {
        const positionOpenedAt = currentRound.positionOpenedAt 
          ? new Date(currentRound.positionOpenedAt).getTime() 
          : roundCreatedAt;
        const positionAge = now - positionOpenedAt;

        if (positionAge > STALE_TRADE_CONFIG.POSITION_OPEN_MAX_STALE_MS) {
          log(`Round ${currentRound.id} stuck in POSITION_OPEN for ${Math.round(positionAge / 60000)}min, auto-settling`);

          try {
            // Get current price for settlement
            const exitPrice = await getCurrentPrice(currentRound.asset);
            const pool = getCurrentPool();
            const totalBets = pool.bets.length;
            const totalAmount = pool.totalUp + pool.totalDown;

            // Calculate price change
            const priceChangePercent = currentRound.entryPrice > 0
              ? ((exitPrice - currentRound.entryPrice) / currentRound.entryPrice) * 100
              : 0;

            // Determine winning side
            const winningSide = priceChangePercent >= 0 ? 'long' : 'short';

            // Update round to settled state
            const settledRound = {
              ...currentRound,
              phase: RoundPhase.SETTLEMENT,
              exitPrice,
              currentPrice: exitPrice,
              exitSignalAt: new Date().toISOString(),
              settledAt: new Date().toISOString(),
              settlementResult: {
                id: `settlement_stale_${currentRound.id}`,
                roundId: currentRound.id,
                winningSide: winningSide as 'long' | 'short',
                exitPrice,
                entryPrice: currentRound.entryPrice,
                priceChangePercent,
                isProfitable: winningSide === currentRound.direction,
                profitLossPercent: Math.abs(priceChangePercent),
                totalPayout: totalAmount * (1 - PredictionMarketConfig.FEE_PERCENTAGE),
                totalLoss: winningSide === 'long' ? pool.totalDown : pool.totalUp,
                platformFee: totalAmount * PredictionMarketConfig.FEE_PERCENTAGE,
                feePercentage: PredictionMarketConfig.FEE_PERCENTAGE,
                calculatedAt: new Date().toISOString(),
                payouts: [], // Simplified - no individual payouts for stale settlement
              },
            };

            setCurrentRound(settledRound);

            results.push({
              roundId: currentRound.id,
              previousPhase: RoundPhase.POSITION_OPEN,
              action: 'auto_settled',
              betsRefunded: 0,
              totalRefundAmount: 0,
              reason: `Position open for ${Math.round(positionAge / 60000)}min without exit signal. Auto-settled at ${exitPrice} (entry: ${currentRound.entryPrice}, change: ${priceChangePercent.toFixed(2)}%). Winner: ${winningSide}`,
            });

            log(`Auto-settled round ${currentRound.id}: entry=${currentRound.entryPrice}, exit=${exitPrice}, change=${priceChangePercent.toFixed(2)}%, winner=${winningSide}`);

          } catch (priceError) {
            // Can't get price - refund all bets instead
            log(`Cannot get price for auto-settlement, refunding ${getCurrentPool().bets.length} bets`);
            const pool = getCurrentPool();
            const totalBets = pool.bets.length;
            const totalAmount = pool.totalUp + pool.totalDown;

            resetPool();
            resetToFreshRound(currentRound.asset);

            results.push({
              roundId: currentRound.id,
              previousPhase: RoundPhase.POSITION_OPEN,
              action: 'refunded',
              betsRefunded: totalBets,
              totalRefundAmount: totalAmount,
              reason: `Position stale for ${Math.round(positionAge / 60000)}min and price unavailable. All bets refunded.`,
            });
          }
        }
        break;
      }

      case RoundPhase.EXIT_SIGNAL: {
        const exitSignalAt = currentRound.exitSignalAt 
          ? new Date(currentRound.exitSignalAt).getTime() 
          : roundCreatedAt;
        const exitAge = now - exitSignalAt;

        if (exitAge > 10 * 60 * 1000) { // 10 minutes stuck in EXIT_SIGNAL
          log(`Round ${currentRound.id} stuck in EXIT_SIGNAL for ${Math.round(exitAge / 60000)}min, forcing settlement`);

          try {
            const exitPrice = currentRound.exitPrice || await getCurrentPrice(currentRound.asset);
            
            const settledRound = {
              ...currentRound,
              phase: RoundPhase.SETTLEMENT,
              exitPrice,
              settledAt: new Date().toISOString(),
            };

            setCurrentRound(settledRound);

            results.push({
              roundId: currentRound.id,
              previousPhase: RoundPhase.EXIT_SIGNAL,
              action: 'auto_settled',
              betsRefunded: 0,
              totalRefundAmount: 0,
              reason: `Stuck in EXIT_SIGNAL for ${Math.round(exitAge / 60000)}min, forced settlement at ${exitPrice}`,
            });
          } catch (error) {
            log(`Error settling from EXIT_SIGNAL: ${error}`);
          }
        }
        break;
      }

      case RoundPhase.SETTLEMENT: {
        // Settlement is terminal, but if it's been sitting here for over an hour,
        // reset to allow a new round to begin
        const settledAt = currentRound.settledAt 
          ? new Date(currentRound.settledAt).getTime()
          : roundCreatedAt;
        const settlementAge = now - settledAt;

        if (settlementAge > 60 * 60 * 1000) { // 1 hour after settlement
          log(`Round ${currentRound.id} settled ${Math.round(settlementAge / 60000)}min ago, resetting for new round`);
          resetPool();
          resetToFreshRound(currentRound.asset);
          results.push({
            roundId: currentRound.id,
            previousPhase: RoundPhase.SETTLEMENT,
            action: 'expired',
            betsRefunded: 0,
            totalRefundAmount: 0,
            reason: `Round settled ${Math.round(settlementAge / 60000)}min ago, reset to allow new round`,
          });
        }
        break;
      }
    }

  } catch (error) {
    log(`Error handling stale prediction rounds: ${error}`);
  }

  return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Reset prediction market to a fresh SCANNING round
 */
function resetToFreshRound(asset: string): void {
  const now = new Date().toISOString();
  const roundId = `round_${asset.toLowerCase()}_${Date.now()}`;

  setCurrentRound({
    id: roundId,
    phase: RoundPhase.SCANNING,
    asset: asset.toUpperCase(),
    entryPrice: 0,
    currentPrice: undefined,
    exitPrice: undefined,
    direction: 'long',
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
    bettingPool: {
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
    },
    consensusSnapshot: {
      id: `snapshot_${Date.now()}`,
      timestamp: now,
      asset: asset.toUpperCase(),
      signal: 'hold',
      consensusLevel: 0,
      agreementCount: 0,
      totalAgents: 5,
      votes: [],
      rationale: '',
      averageConfidence: 0,
      threshold: PredictionMarketConfig.MIN_CONSENSUS_LEVEL,
      forced: false,
    },
  });
}

// ============================================================================
// ON-DEMAND CLEANUP CHECK
// ============================================================================

/**
 * Lightweight check to determine if cleanup is needed
 * Can be called from any API route without blocking
 * 
 * Returns true if stale trades were detected and cleanup was triggered
 */
export async function checkAndCleanupIfNeeded(): Promise<boolean> {
  const now = Date.now();
  
  // Don't run if we cleaned up recently
  if ((now - lastCleanupTimestamp) < STALE_TRADE_CONFIG.MIN_CLEANUP_INTERVAL_MS) {
    return false;
  }

  try {
    // Quick check: any open paper trades older than threshold?
    const trades = await getStoredTrades();
    const hasStaleOpenTrades = trades.some(t => 
      t.status === 'open' && 
      (now - new Date(t.timestamp).getTime()) > STALE_TRADE_CONFIG.PAPER_TRADE_MAX_AGE_MS
    );

    // Quick check: is the prediction round stale?
    const currentRound = getCurrentRound();
    let hasStaleRound = false;
    
    if (currentRound) {
      const roundAge = now - new Date(currentRound.createdAt).getTime();
      
      if (currentRound.phase === RoundPhase.POSITION_OPEN) {
        const positionAge = currentRound.positionOpenedAt 
          ? now - new Date(currentRound.positionOpenedAt).getTime()
          : roundAge;
        hasStaleRound = positionAge > STALE_TRADE_CONFIG.POSITION_OPEN_MAX_STALE_MS;
      } else if (currentRound.phase === RoundPhase.BETTING_WINDOW && currentRound.bettingWindowEnd) {
        const timeSinceEnd = now - new Date(currentRound.bettingWindowEnd).getTime();
        hasStaleRound = timeSinceEnd > STALE_TRADE_CONFIG.BETTING_WINDOW_GRACE_PERIOD_MS;
      } else if (currentRound.phase !== RoundPhase.SETTLEMENT) {
        hasStaleRound = roundAge > STALE_TRADE_CONFIG.PREDICTION_ROUND_MAX_AGE_MS;
      }
    }

    if (hasStaleOpenTrades || hasStaleRound) {
      // Run cleanup asynchronously (don't block the calling route)
      runStaleTradeCleanup().catch(err => {
        console.error('[stale-trade-handler] Background cleanup error:', err);
      });
      return true;
    }

  } catch (error) {
    console.error('[stale-trade-handler] Error in checkAndCleanupIfNeeded:', error);
  }

  return false;
}

/**
 * Get the timestamp of the last cleanup run
 */
export function getLastCleanupTimestamp(): number {
  return lastCleanupTimestamp;
}
