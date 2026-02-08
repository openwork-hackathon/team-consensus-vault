'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { usePredictionMarketStream } from '@/lib/usePredictionMarketStream';
import { RoundPhase } from '@/lib/prediction-market/types';

import BettingPanel from '@/components/prediction-market/BettingPanel';
import LivePnL from '@/components/prediction-market/LivePnL';
import SettlementResult from '@/components/prediction-market/SettlementResult';
import CouncilVotes, { ConsensusSnapshot as CouncilConsensusSnapshot, ModelVote } from '@/components/prediction-market/CouncilVotes';
import { ConsensusSnapshot as MarketConsensusSnapshot } from '@/lib/prediction-market/types';

// Convert market consensus snapshot to council votes format
function convertToCouncilSnapshot(snapshot: MarketConsensusSnapshot): CouncilConsensusSnapshot {
  const modelMap: Record<string, { icon: string; color: string }> = {
    deepseek: { icon: '🔮', color: '#6366f1' },
    kimi: { icon: '🌙', color: '#8b5cf6' },
    minimax: { icon: '⚡', color: '#22c55e' },
    glm: { icon: '🧠', color: '#10b981' },
    gemini: { icon: '♊', color: '#eab308' },
  };

  const models: ModelVote[] = snapshot.votes.map((vote) => {
    const modelInfo = modelMap[vote.agentId] || { icon: '🤖', color: '#6b7280' };
    return {
      modelId: vote.agentId,
      modelName: vote.agentName,
      icon: modelInfo.icon,
      color: modelInfo.color,
      vote: vote.signal === 'buy' ? 'BUY' : vote.signal === 'sell' ? 'SELL' : 'HOLD',
      confidence: vote.confidence,
      isLoading: false,
    };
  });

  return {
    models,
    timestamp: new Date(snapshot.timestamp).getTime(),
  };
}

export default function PredictPage() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const {
    round,
    isConnected,
    error,
    currentPrice,
    pool,
    consensusSnapshot,
  } = usePredictionMarketStream();

  const handlePlaceBet = async (amount: number, direction: 'long' | 'short') => {
    // TODO: Implement actual bet placement API call
    console.log('Placing bet:', amount, direction);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const renderPhaseContent = () => {
    if (!round) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-muted-foreground">Connecting to prediction market...</p>
        </div>
      );
    }

    switch (round.phase) {
      case RoundPhase.SCANNING:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🔍</span>
              </div>
            </div>
            <p className="mt-6 text-xl font-semibold">Scanning market conditions...</p>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              AI analysts are analyzing market data to identify the best trading opportunities
            </p>
            {consensusSnapshot && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <CouncilVotes
                  consensusSnapshot={convertToCouncilSnapshot(consensusSnapshot)}
                  entrySignal={consensusSnapshot.signal === 'buy' ? 'BUY' : consensusSnapshot.signal === 'sell' ? 'SELL' : null}
                />
              </motion.div>
            )}
          </motion.div>
        );

      case RoundPhase.BETTING_WINDOW:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BettingPanel
              roundId={round.id}
              asset={round.asset}
              direction={round.direction}
              entryPrice={round.entryPrice}
              minBet={round.minBet}
              maxBet={round.maxBet}
              longOdds={pool.longOdds || 1.5}
              shortOdds={pool.shortOdds || 2.5}
              onPlaceBet={handlePlaceBet}
            />
          </motion.div>
        );

      case RoundPhase.POSITION_OPEN:
      case RoundPhase.EXIT_SIGNAL:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LivePnL
              round={{
                id: round.id,
                asset: round.asset,
                direction: round.direction,
                entryPrice: round.entryPrice,
                positionSize: pool.totalPool,
                openedAt: round.positionOpenedAt || round.createdAt,
                phase: round.phase,
              }}
              currentPrice={currentPrice || round.entryPrice}
              pool={{
                bullish: pool.totalLong,
                bearish: pool.totalShort,
              }}
              exitVotes={round.phase === RoundPhase.EXIT_SIGNAL ? 4 : 0}
              councilStatus={round.phase === RoundPhase.EXIT_SIGNAL ? 'deliberating' : 'monitoring'}
            />
          </motion.div>
        );

      case RoundPhase.SETTLEMENT:
        if (round.settlementResult) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SettlementResult
                settlement={{
                  winningSide: round.settlementResult.winningSide === 'long' ? 'AGREE' : 'DISAGREE',
                  entryPrice: round.settlementResult.entryPrice,
                  exitPrice: round.settlementResult.exitPrice,
                  totalPool: pool.totalPool,
                  payoutMultiplier: pool.longOdds || 1.5,
                }}
                round={{
                  id: round.id,
                  nextRoundStartsAt: new Date(Date.now() + 60000), // Next round in 1 minute
                }}
                userBets={[]} // TODO: Fetch actual user bets
                address="0x0000...0000" // TODO: Get actual user address
              />
            </motion.div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-muted-foreground">Calculating settlements...</p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground">Unknown phase: {round.phase}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Prediction Market</h1>
              <p className="text-muted-foreground mt-1">
                Bet on AI-powered trade signals and win rewards
              </p>
            </div>
            
            {/* How It Works Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
            >
              {showHowItWorks ? 'Hide' : 'How It Works'}
            </motion.button>
          </div>

          {/* Connection Status */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected to prediction market' : 'Connecting...'}
            </span>
            {round && (
              <span className="ml-4 text-xs text-muted-foreground">
                Phase: <span className="font-semibold text-foreground">{round.phase.replace(/_/g, ' ')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
          >
            <p className="text-red-500 text-sm">{error}</p>
          </motion.div>
        )}

        {/* How It Works Section */}
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">How the Prediction Market Works</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Phase 1: Scanning */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Scanning</h3>
                      <p className="text-sm text-muted-foreground">
                        AI agents analyze market conditions, technical indicators, and on-chain data to identify trading opportunities.
                      </p>
                    </div>
                  </div>

                  {/* Phase 2: Analysis */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Multiple AI models reach consensus on market direction. High agreement levels trigger a trading signal.
                      </p>
                    </div>
                  </div>

                  {/* Phase 3: Betting Window */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Betting Window</h3>
                      <p className="text-sm text-muted-foreground">
                        Users place bets on whether the price will go up (Long) or down (Short). Pool odds adjust in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Phase 4: Position Open */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Position Open</h3>
                      <p className="text-sm text-muted-foreground">
                        The position is opened at the entry price. Watch live P&L as the market moves. AI monitors for exit conditions.
                      </p>
                    </div>
                  </div>

                  {/* Phase 5: Settlement */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      5
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Settlement</h3>
                      <p className="text-sm text-muted-foreground">
                        When exit conditions are met, the position closes. Winners share the losing side's pool (minus 2% platform fee).
                      </p>
                    </div>
                  </div>

                  {/* Phase 6: Cooldown */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      6
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Cooldown</h3>
                      <p className="text-sm text-muted-foreground">
                        Brief pause before the next round begins. Payouts are processed and the cycle starts anew.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Example:</strong> If you bet $100 on Long and win with 2x odds, you'd receive $200 ($100 stake + $100 profit). The platform takes a 2% fee from the total pool before payouts.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase Content */}
        {renderPhaseContent()}
      </div>
    </div>
  );
}
