'use client';

import { RoundState } from '@/lib/prediction-market/types';

interface PositionTrackerProps {
  round: RoundState;
  className?: string;
}

export default function PositionTracker({ round, className = '' }: PositionTrackerProps) {
  const { entryPrice, currentPrice, exitPrice, direction } = round;

  const displayPrice = exitPrice || currentPrice || entryPrice;
  const priceChange = displayPrice - entryPrice;
  const priceChangePercent = ((priceChange / entryPrice) * 100);

  // Calculate P&L based on direction
  const isProfit = direction === 'long' ? priceChange > 0 : priceChange < 0;
  const pnlPercent = direction === 'long' ? priceChangePercent : -priceChangePercent;

  return (
    <div className={`bg-card rounded-xl p-6 border border-border ${className}`}>
      <h3 className="text-lg font-bold mb-4">Position Tracker</h3>

      {/* Current Price Display */}
      <div className="mb-6">
        <div className="text-sm text-muted-foreground mb-1">Current Price</div>
        <div className="text-4xl font-bold">
          ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-lg font-semibold mt-1 ${isProfit ? 'text-bullish' : 'text-bearish'}`}>
          {isProfit ? '+' : ''}{priceChangePercent.toFixed(2)}% ({isProfit ? '+' : ''}${priceChange.toFixed(2)})
        </div>
      </div>

      {/* Position Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Direction</div>
          <div className={`text-lg font-bold ${direction === 'long' ? 'text-bullish' : 'text-bearish'}`}>
            {direction === 'long' ? '📈 LONG' : '📉 SHORT'}
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
          <div className="text-lg font-bold">
            ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* P&L Card */}
      <div className={`rounded-lg p-4 ${isProfit ? 'bg-bullish/10 border border-bullish/30' : 'bg-bearish/10 border border-bearish/30'}`}>
        <div className="text-sm text-muted-foreground mb-1">Current P&L</div>
        <div className={`text-2xl font-bold ${isProfit ? 'text-bullish' : 'text-bearish'}`}>
          {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
        </div>
        <div className="text-sm opacity-80 mt-1">
          {isProfit ? 'Winning' : 'Losing'} position
        </div>
      </div>

      {/* Consensus Info */}
      <div className="mt-4 p-3 bg-background/50 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">AI Consensus</div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{round.consensusLevel}% agreement</div>
          <div className="text-xs text-muted-foreground">
            ({round.consensusVotes}/{round.totalVotes} agents)
          </div>
        </div>
      </div>
    </div>
  );
}
