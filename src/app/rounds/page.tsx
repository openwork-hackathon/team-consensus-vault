'use client';

import { useState } from 'react';
import { usePredictionMarket } from '@/hooks/usePredictionMarket';
import { RoundPhase } from '@/lib/prediction-market/types';
import RoundPhaseIndicator from '@/components/prediction-market/RoundPhaseIndicator';
import BettingPool from '@/components/prediction-market/BettingPool';
import PositionTracker from '@/components/prediction-market/PositionTracker';
import CouncilVotes from '@/components/prediction-market/CouncilVotes';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ToastContainer, { ToastData } from '@/components/ToastContainer';

export default function RoundsPage() {
  const { round, isConnected } = usePredictionMarket();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Prediction Market Rounds">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Prediction Market</h1>
              <p className="text-muted-foreground">
                Trade based on AI consensus signals. Full round lifecycle:
                <span className="font-semibold"> SCANNING → ENTRY → BETTING → POSITION → EXIT → SETTLEMENT</span>
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className={`px-4 py-2 rounded-lg ${isConnected ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                <div className="text-xs font-semibold" style={{ color: isConnected ? 'rgb(34 197 94)' : 'rgb(234 179 8)' }}>
                  {isConnected ? '● LIVE' : '○ CONNECTING...'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isConnected ? 'Real-time updates' : 'Establishing connection'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {!round && (
          <div className="space-y-6">
            <LoadingSkeleton count={1} height="h-24" className="w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton count={1} height="h-64" className="w-full" />
              <LoadingSkeleton count={1} height="h-64" className="w-full" />
            </div>
          </div>
        )}

        {/* Round Display */}
        {round && (
          <>
            {/* Phase Indicator */}
            <section className="mb-6">
              <RoundPhaseIndicator phase={round.phase} />
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Betting Pool */}
              <BettingPool pool={round.bettingPool} />

              {/* Position Tracker (only show during POSITION_OPEN and later) */}
              {[RoundPhase.POSITION_OPEN, RoundPhase.EXIT_SIGNAL, RoundPhase.SETTLEMENT].includes(round.phase) && (
                <PositionTracker round={round} />
              )}

              {/* Asset Info (show during early phases) */}
              {[RoundPhase.SCANNING, RoundPhase.ENTRY_SIGNAL, RoundPhase.BETTING_WINDOW].includes(round.phase) && (
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-bold mb-4">Asset Information</h3>
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Trading Asset</div>
                    <div className="text-3xl font-bold">{round.asset}/USD</div>
                  </div>
                  {round.entryPrice > 0 && (
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                      <div className="text-2xl font-bold">
                        ${round.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Consensus Snapshot */}
            {round.consensusSnapshot && round.consensusSnapshot.votes.length > 0 && (
              <section className="mb-6">
                <CouncilVotes
                  consensusSnapshot={{
                    models: round.consensusSnapshot.votes.map(v => ({
                      modelId: v.agentId,
                      modelName: v.agentName || v.agentId,
                      icon: '🤖',
                      color: '#6b7280',
                      vote: v.signal === 'buy' ? 'BUY' : v.signal === 'sell' ? 'SELL' : 'HOLD',
                      confidence: v.confidence,
                      isLoading: false,
                    })),
                    timestamp: new Date(round.consensusSnapshot.timestamp).getTime(),
                  }}
                  entrySignal={round.consensusSnapshot.signal === 'buy' ? 'BUY' : round.consensusSnapshot.signal === 'sell' ? 'SELL' : null}
                />
              </section>
            )}

            {/* Round Metadata */}
            <section className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-bold mb-4">Round Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Round ID</div>
                  <div className="text-sm font-mono">{round.id.slice(0, 12)}...</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">
                    {new Date(round.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Min Bet</div>
                  <div className="text-sm font-semibold">${round.minBet}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Max Bet</div>
                  <div className="text-sm font-semibold">${round.maxBet}</div>
                </div>
              </div>

              {/* Settlement Result */}
              {round.settlementResult && (
                <div className="mt-6 p-4 bg-background rounded-lg border border-border">
                  <div className="text-sm font-bold mb-3">Settlement Result</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Winning Side</div>
                      <div className={`text-sm font-bold ${round.settlementResult.winningSide === 'long' ? 'text-bullish' : 'text-bearish'}`}>
                        {round.settlementResult.winningSide.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Price Change</div>
                      <div className="text-sm font-bold">
                        {round.settlementResult.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Payout</div>
                      <div className="text-sm font-bold text-bullish">
                        ${round.settlementResult.totalPayout.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Platform Fee</div>
                      <div className="text-sm font-bold">
                        ${round.settlementResult.platformFee.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Real-time prediction market powered by AI consensus engine</p>
        </footer>
      </div>
    </main>
  );
}
