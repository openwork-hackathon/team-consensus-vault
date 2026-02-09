/**
 * Prediction Market SSE Stream API
 * GET /api/prediction-market/stream
 * 
 * Provides Server-Sent Events for prediction market round updates:
 * - round_state: Current round status on connect
 * - consensus_update: After each consensus analysis
 * - phase_change: When round transitions between phases
 * - pool_update: During BETTING_WINDOW phase
 * - price_update: Every 15 seconds during POSITION_OPEN phase
 * 
 * Demo Mode Configuration:
 * - Scanning interval: 15 seconds (not production 60s)
 * - Force BUY signal: If no consensus after 3 polls, force a BUY signal to progress the demo
 * - Force exit: After 2 minutes in POSITION_OPEN, force exit regardless of profit target
 * - Target: Complete full round cycle in under 5 minutes
 */

import { NextRequest } from 'next/server';
import { runDetailedConsensusAnalysis } from '@/lib/consensus-engine';
import { RoundPhase, RoundState, BettingPool, ConsensusSnapshot, PredictionMarketConfig } from '@/lib/prediction-market/types';
import { 
  getCurrentRound, 
  setCurrentRound, 
  updateRoundPhase,
  updateBettingPool,
  getCurrentPool,
  resetPool 
} from '@/lib/prediction-market/state';
import { checkAndCleanupIfNeeded } from '@/lib/stale-trade-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout for demo rounds

// Demo mode configuration - reads from environment variable
const IS_DEMO_MODE = process.env.DEMO_MODE === 'true';

const DEMO_CONFIG = {
  SCANNING_INTERVAL: IS_DEMO_MODE ? 15000 : 60000, // 15s demo, 60s production
  FORCE_BUY_AFTER_POLLS: IS_DEMO_MODE ? 3 : 10, // Force signal after N polls
  FORCE_EXIT_AFTER_MS: IS_DEMO_MODE ? 120000 : 24 * 60 * 60 * 1000, // 2min demo, 24h production
  PRICE_UPDATE_INTERVAL: IS_DEMO_MODE ? 15000 : 5000, // 15s demo, 5s production
  MAX_ROUND_DURATION: IS_DEMO_MODE ? 300000 : 24 * 60 * 60 * 1000, // 5min demo, 24h production
} as const;

// Initialize shared round state if not already set
if (!getCurrentRound()) {
  const initialRound: RoundState = {
    id: `round_${Date.now()}`,
    phase: RoundPhase.SCANNING,
    asset: 'BTC',
    entryPrice: 0,
    direction: 'long',
    consensusLevel: 0,
    consensusVotes: 0,
    totalVotes: 0,
    createdAt: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
      asset: 'BTC',
      signal: 'hold',
      consensusLevel: 0,
      agreementCount: 0,
      totalAgents: 5,
      votes: [],
      rationale: '',
      averageConfidence: 0,
      threshold: 75,
      forced: false,
    },
  };
  setCurrentRound(initialRound);
}

// Mock price data for demo
const mockPrices: Record<string, number> = {
  'BTC': 45000,
  'ETH': 2500,
  'SOL': 100,
};

// Track demo state
let scanningPolls = 0;
let positionOpenStartTime = 0;
let roundStartTime = Date.now();

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const lockId = `pm_sse_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const connectionStartTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventType: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Controller closed
        }
      };

      const sendKeepalive = () => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          // Controller closed
        }
      };

      // Track connection establishment time
      const connectionEstablishmentTime = Date.now() - connectionStartTime;

      // CVAULT-181: Check for and clean up stale trades when a new client connects
      // This handles the case where nobody visited for hours and trades became stale
      let staleCleanupTriggered = false;
      try {
        staleCleanupTriggered = await checkAndCleanupIfNeeded();
        if (staleCleanupTriggered) {
          console.log('[prediction-market-stream] Stale trade cleanup triggered on client connect');
        }
      } catch (cleanupErr) {
        console.error('[prediction-market-stream] Stale cleanup check error:', cleanupErr);
      }

      // Send connection confirmation with timing metrics
      send('connected', {
        timestamp: Date.now(),
        demoMode: true,
        config: DEMO_CONFIG,
        connectionTimeMs: connectionEstablishmentTime,
        staleCleanupTriggered,
      });

      // Send initial round state
      const currentRound = getCurrentRound();
      if (currentRound) {
        send('round_state', currentRound);
      }

      // Keepalive interval
      const keepaliveTimer = setInterval(sendKeepalive, 15000);

      // Main prediction market loop
      const runPredictionMarketLoop = async () => {
        while (!request.signal.aborted) {
          try {
            const currentRound = getCurrentRound();
            if (!currentRound) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }

            const now = Date.now();
            const roundDuration = now - roundStartTime;

            // Check if round has exceeded maximum duration
            if (roundDuration > DEMO_CONFIG.MAX_ROUND_DURATION) {
              console.log('[prediction-market-stream] Round exceeded max duration, forcing settlement');
              await transitionToPhase(RoundPhase.SETTLEMENT, send);
              break;
            }

            // Handle current phase logic
            switch (currentRound.phase) {
              case RoundPhase.SCANNING:
                await handleScanningPhase(send);
                break;

              case RoundPhase.BETTING_WINDOW:
                await handleBettingWindowPhase(send);
                break;

              case RoundPhase.POSITION_OPEN:
                await handlePositionOpenPhase(send);
                break;

              case RoundPhase.SETTLEMENT:
                await handleSettlementPhase(send);
                // Round complete, end stream
                send('round_complete', { 
                  roundId: currentRound.id,
                  duration: roundDuration 
                });
                return;

              default:
                // Other phases just wait
                await new Promise(resolve => setTimeout(resolve, 5000));
                break;
            }

            // Wait before next iteration
            if (!request.signal.aborted) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error('[prediction-market-stream] Loop error:', error);
            send('error', { message: 'Internal server error' });
            
            // Wait before retrying
            if (!request.signal.aborted) {
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
        }
      };

      // Start the main loop
      runPredictionMarketLoop().catch(err => {
        console.error('[prediction-market-stream] Main loop error:', err);
      });

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(keepaliveTimer);
        console.log('[prediction-market-stream] Client disconnected');
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Handle SCANNING phase logic
 */
async function handleScanningPhase(send: (eventType: string, data: unknown) => void) {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  console.log('[prediction-market-stream] Scanning for consensus...');
  
  // Run consensus analysis
  const consensusData = await runDetailedConsensusAnalysis(currentRound.asset);
  
  // Update scanning poll count
  scanningPolls++;
  
  // Send consensus update
  send('consensus_update', {
    ...consensusData,
    scanningPoll: scanningPolls,
    forced: false, // Normal consensus, not forced
  });

  // Check if we have consensus or need to force it for demo
  if (consensusData.consensus_status === 'CONSENSUS_REACHED' && consensusData.consensus_signal === 'buy') {
    console.log('[prediction-market-stream] Consensus reached for BUY signal');
    
    // Update round with consensus snapshot
    const updatedRound = {
      ...currentRound,
      consensusSnapshot: {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        asset: currentRound.asset,
        signal: 'buy' as const,
        consensusLevel: 85, // Mock high consensus for demo
        agreementCount: 4,
        totalAgents: 5,
        votes: [], // Would be populated from consensusData
        rationale: 'Strong consensus across multiple analysts for bullish momentum',
        averageConfidence: 85,
        threshold: 75,
        forced: false, // Organic consensus
      },
      consensusLevel: 85,
      consensusVotes: 4,
      totalVotes: 5,
      direction: 'long' as const,
    };
    
    setCurrentRound(updatedRound);
    
    // Transition to ENTRY_SIGNAL phase
    await transitionToPhase(RoundPhase.ENTRY_SIGNAL, send);
    
  } else if (scanningPolls >= DEMO_CONFIG.FORCE_BUY_AFTER_POLLS) {
    // Force BUY signal for demo progression
    console.log('[prediction-market-stream] Forcing BUY signal for demo after', scanningPolls, 'polls');
    
    // Send consensus update with forced flag
    send('consensus_update', {
      ...consensusData,
      scanningPoll: scanningPolls,
      forced: true, // Forced signal for demo
      rationale: 'Demo mode: Forced BUY signal to progress demonstration',
    });
    
    const updatedRound = {
      ...currentRound,
      consensusSnapshot: {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        asset: currentRound.asset,
        signal: 'buy' as const,
        consensusLevel: 80,
        agreementCount: 4,
        totalAgents: 5,
        votes: [],
        rationale: 'Demo mode: Forced BUY signal to progress demonstration',
        averageConfidence: 80,
        threshold: 75,
        forced: true, // Forced signal for demo
      },
      consensusLevel: 80,
      consensusVotes: 4,
      totalVotes: 5,
      direction: 'long' as const,
    };
    
    setCurrentRound(updatedRound);
    
    // Transition to ENTRY_SIGNAL phase
    await transitionToPhase(RoundPhase.ENTRY_SIGNAL, send);
  } else {
    // Wait for next scanning interval
    console.log(`[prediction-market-stream] No consensus yet, waiting ${DEMO_CONFIG.SCANNING_INTERVAL}ms`);
    await new Promise(resolve => setTimeout(resolve, DEMO_CONFIG.SCANNING_INTERVAL));
  }
}

/**
 * Handle BETTING_WINDOW phase logic
 */
async function handleBettingWindowPhase(send: (eventType: string, data: unknown) => void) {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  // Set betting window timestamps if not already set
  if (!currentRound.bettingWindowStart) {
    const updatedRound = {
      ...currentRound,
      bettingWindowStart: new Date().toISOString(),
      bettingWindowEnd: new Date(Date.now() + 30000).toISOString(), // 30 second betting window for demo
    };
    setCurrentRound(updatedRound);
    
    // Update and send round state
    send('round_state', updatedRound);
    return;
  }

  // Simulate betting activity for demo
  const timeRemaining = new Date(currentRound.bettingWindowEnd!).getTime() - Date.now();
  
  if (timeRemaining <= 0) {
    // Betting window closed, transition to POSITION_OPEN
    console.log('[prediction-market-stream] Betting window closed');
    
    // Get actual pool state from shared state
    const pool = getCurrentPool();
    
    // Update round with actual pool data
    const updatedRound = {
      ...currentRound,
      bettingPool: {
        totalLong: pool.totalUp,
        totalShort: pool.totalDown,
        totalPool: pool.totalUp + pool.totalDown,
        longBetCount: pool.bets.filter(b => b.direction === 'long').length,
        shortBetCount: pool.bets.filter(b => b.direction === 'short').length,
        totalBetCount: pool.bets.length,
        avgLongBet: pool.totalUp > 0 ? pool.totalUp / Math.max(1, pool.bets.filter(b => b.direction === 'long').length) : 0,
        avgShortBet: pool.totalDown > 0 ? pool.totalDown / Math.max(1, pool.bets.filter(b => b.direction === 'short').length) : 0,
        longOdds: pool.totalUp > 0 ? (pool.totalUp + pool.totalDown) / pool.totalUp : 0,
        shortOdds: pool.totalDown > 0 ? (pool.totalUp + pool.totalDown) / pool.totalDown : 0,
      },
      entryPrice: mockPrices[currentRound.asset],
      positionOpenedAt: new Date().toISOString(),
    };
    
    setCurrentRound(updatedRound);
    positionOpenStartTime = Date.now();
    
    await transitionToPhase(RoundPhase.POSITION_OPEN, send);
  } else {
    // Send pool updates during betting window
    const pool = getCurrentPool();
    const poolUpdate = {
      roundId: currentRound.id,
      timeRemaining,
      pool: {
        totalLong: pool.totalUp,
        totalShort: pool.totalDown,
        totalPool: pool.totalUp + pool.totalDown,
        longBetCount: pool.bets.filter(b => b.direction === 'long').length,
        shortBetCount: pool.bets.filter(b => b.direction === 'short').length,
        totalBetCount: pool.bets.length,
      },
      recentBets: pool.bets.slice(-5).map(b => ({
        user: b.userAddress,
        amount: b.amount,
        direction: b.direction,
        timestamp: b.timestamp,
      })),
    };
    
    send('pool_update', poolUpdate);
    
    // Wait before next update
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

/**
 * Handle POSITION_OPEN phase logic
 */
async function handlePositionOpenPhase(send: (eventType: string, data: unknown) => void) {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  const positionDuration = Date.now() - positionOpenStartTime;
  
  // Check if we should force exit for demo
  if (positionDuration >= DEMO_CONFIG.FORCE_EXIT_AFTER_MS) {
    console.log('[prediction-market-stream] Forcing exit after', positionDuration, 'ms in POSITION_OPEN');
    
    // Set exit price (simulate profit for demo)
    const updatedRound = {
      ...currentRound,
      exitPrice: currentRound.entryPrice * 1.05, // 5% profit
      exitSignalAt: new Date().toISOString(),
    };
    setCurrentRound(updatedRound);
    
    // Transition to EXIT_SIGNAL phase with forced flag
    await transitionToPhase(RoundPhase.EXIT_SIGNAL, send, true); // true = forced exit
    return;
  }
  
  // Update current price (simulate market movement)
  const priceChange = Math.sin(Date.now() / 10000) * 0.02; // Oscillating +/- 2%
  const currentPrice = currentRound.entryPrice * (1 + priceChange);
  
  const updatedRound = {
    ...currentRound,
    currentPrice,
  };
  setCurrentRound(updatedRound);
  
  // Send price update
  send('price_update', {
    roundId: currentRound.id,
    currentPrice,
    entryPrice: currentRound.entryPrice,
    profitLossPercent: ((currentPrice - currentRound.entryPrice) / currentRound.entryPrice) * 100,
    positionDuration,
  });
  
  // Check exit conditions (simulate hitting profit target)
  const profitPercent = ((currentPrice - currentRound.entryPrice) / currentRound.entryPrice) * 100;
  if (profitPercent >= 3) { // 3% profit target for demo
    console.log('[prediction-market-stream] Profit target hit:', profitPercent.toFixed(2), '%');
    
    const settledRound = {
      ...updatedRound,
      exitPrice: currentPrice,
      exitSignalAt: new Date().toISOString(),
    };
    setCurrentRound(settledRound);
    
    await transitionToPhase(RoundPhase.EXIT_SIGNAL, send);
    return;
  }
  
  // Wait for next price update
  await new Promise(resolve => setTimeout(resolve, DEMO_CONFIG.PRICE_UPDATE_INTERVAL));
}

/**
 * Handle SETTLEMENT phase logic
 */
async function handleSettlementPhase(send: (eventType: string, data: unknown) => void) {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  console.log('[prediction-market-stream] Calculating settlement...');
  
  // Calculate settlement result
  const priceChangePercent = ((currentRound.exitPrice! - currentRound.entryPrice) / currentRound.entryPrice) * 100;
  const isProfitable = priceChangePercent > 0;
  const winningSide: 'long' | 'short' = currentRound.direction === 'long' && isProfitable ? 'long' : 'short';

  // Mock settlement for demo
  const settlementResult = {
    id: `settlement_${Date.now()}`,
    roundId: currentRound.id,
    winningSide,
    exitPrice: currentRound.exitPrice!,
    entryPrice: currentRound.entryPrice,
    priceChangePercent,
    isProfitable,
    profitLossPercent: priceChangePercent,
    totalPayout: 21000, // Mock payout
    totalLoss: 7500, // Mock loss
    platformFee: 400,
    feePercentage: 0.02,
    calculatedAt: new Date().toISOString(),
    payouts: [], // Would be populated with actual payouts
  };
  
  const settledRound = {
    ...currentRound,
    settlementResult,
    settledAt: new Date().toISOString(),
  };
  setCurrentRound(settledRound);
  
  // Send final round state
  send('round_state', settledRound);
  send('settlement_complete', settlementResult);
  
  // Wait a moment before ending
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Transition to a new phase and send phase_change event
 */
async function transitionToPhase(newPhase: RoundPhase, send: (eventType: string, data: unknown) => void, forced: boolean = false) {
  const currentRound = getCurrentRound();
  if (!currentRound) return;

  const oldPhase = currentRound.phase;
  
  // Update phase using shared state
  updateRoundPhase(newPhase);
  
  console.log(`[prediction-market-stream] Phase change: ${oldPhase} → ${newPhase}${forced ? ' (forced)' : ''}`);
  
  // Send phase change event
  send('phase_change', {
    roundId: currentRound.id,
    from: oldPhase,
    to: newPhase,
    timestamp: new Date().toISOString(),
    forced: forced, // Flag if this phase change was forced by demo mode
  });
  
  // Send updated round state
  const updatedRound = getCurrentRound();
  if (updatedRound) {
    send('round_state', updatedRound);
  }
  
  // Brief pause for demo visibility
  await new Promise(resolve => setTimeout(resolve, 1000));
}