'use client';

import { BettingPool as BettingPoolType } from '@/lib/prediction-market/types';

interface BettingPoolProps {
  pool: BettingPoolType;
  className?: string;
}

export default function BettingPool({ pool, className = '' }: BettingPoolProps) {
  const longPercentage = pool.totalPool > 0 ? (pool.totalLong / pool.totalPool) * 100 : 50;
  const shortPercentage = 100 - longPercentage;

  return (
    <div className={`bg-card rounded-xl p-6 border border-border ${className}`}>
      <h3 className="text-lg font-bold mb-4">Betting Pool</h3>

      {/* Pool Size */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground mb-1">Total Pool</div>
        <div className="text-3xl font-bold">${pool.totalPool.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {pool.totalBetCount} bet{pool.totalBetCount !== 1 ? 's' : ''} placed
        </div>
      </div>

      {/* Pool Distribution Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-sm text-muted-foreground flex-1">Pool Distribution</div>
        </div>
        <div className="h-6 bg-background rounded-lg overflow-hidden flex">
          <div
            className="bg-bullish flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{ width: `${longPercentage}%` }}
          >
            {longPercentage > 15 && `${Math.round(longPercentage)}%`}
          </div>
          <div
            className="bg-bearish flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{ width: `${shortPercentage}%` }}
          >
            {shortPercentage > 15 && `${Math.round(shortPercentage)}%`}
          </div>
        </div>
      </div>

      {/* Long vs Short Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background/50 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">LONG (Price Up)</div>
          <div className="text-xl font-bold text-bullish">${pool.totalLong.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {pool.longBetCount} bet{pool.longBetCount !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg: ${pool.avgLongBet.toFixed(0)}
          </div>
          <div className="text-sm font-semibold mt-2 text-bullish">
            {pool.longOdds.toFixed(2)}x payout
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">SHORT (Price Down)</div>
          <div className="text-xl font-bold text-bearish">${pool.totalShort.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {pool.shortBetCount} bet{pool.shortBetCount !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg: ${pool.avgShortBet.toFixed(0)}
          </div>
          <div className="text-sm font-semibold mt-2 text-bearish">
            {pool.shortOdds.toFixed(2)}x payout
          </div>
        </div>
      </div>
    </div>
  );
}
