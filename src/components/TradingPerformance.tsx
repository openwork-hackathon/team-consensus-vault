'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trade, PortfolioMetrics } from '@/lib/trading-types';
import { TradingPerformanceSkeleton } from './LoadingSkeleton';

interface TradingPerformanceProps {
  className?: string;
}

export default function TradingPerformance({ className = '' }: TradingPerformanceProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetchTradingHistory(abortController.signal);
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchTradingHistory(), 30000);

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  const fetchTradingHistory = async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/trading/history', { signal });
      const data = await response.json();

      if (data.success) {
        setTrades(data.trades || []);
        setMetrics(data.metrics || null);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch trading history');
      }
    } catch (err) {
      // Ignore abort errors (component unmounted or request cancelled)
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${formatPrice(pnl)}`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return <TradingPerformanceSkeleton className={className} />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card rounded-xl p-6 border border-border ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-bearish/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load trading data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error.includes('fetch') || error.includes('Network')
              ? 'Unable to connect to the server. Please check your connection.'
              : 'An error occurred while loading your trading history.'}
          </p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchTradingHistory();
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-manipulation min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-6 border border-border ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Paper Trading Performance</h2>
        <p className="text-sm text-muted-foreground">
          Simulated trades based on AI consensus signals
        </p>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div className={`text-lg sm:text-xl font-bold ${metrics.totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {formatPnL(metrics.totalPnL)}
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className="text-lg sm:text-xl font-bold">{metrics.winRate.toFixed(1)}%</div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
            <div className="text-lg sm:text-xl font-bold">{metrics.totalTrades}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Open Positions</div>
            <div className="text-lg sm:text-xl font-bold text-primary">{metrics.openTrades}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Avg Win</div>
            <div className="text-sm font-bold text-bullish">{formatPnL(metrics.avgWin)}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Avg Loss</div>
            <div className="text-sm font-bold text-bearish">{formatPnL(metrics.avgLoss)}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Largest Win</div>
            <div className="text-sm font-bold text-bullish">{formatPnL(metrics.largestWin)}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-muted-foreground mb-1">Largest Loss</div>
            <div className="text-sm font-bold text-bearish">{formatPnL(metrics.largestLoss)}</div>
          </div>
        </div>
      )}

      {/* Trade History */}
      <div>
        <h3 className="text-lg font-bold mb-3">Recent Trades</h3>

        {trades.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No trades yet. Trades will execute automatically when 4/5 or 5/5 AI models reach consensus.
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-3">
              {trades.slice().reverse().slice(0, 20).map((trade) => (
                <div key={trade.id} className="bg-background/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.asset}</span>
                      <span className={`text-sm font-semibold ${trade.direction === 'long' ? 'text-bullish' : 'text-bearish'}`}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      trade.status === 'open'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Entry</div>
                      <div className="font-medium">{formatPrice(trade.entryPrice)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Exit</div>
                      <div className="font-medium">{trade.exitPrice ? formatPrice(trade.exitPrice) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">P&L</div>
                      <div className="font-semibold">
                        {trade.pnl !== undefined ? (
                          <span className={trade.pnl >= 0 ? 'text-bullish' : 'text-bearish'}>
                            {formatPnL(trade.pnl)} ({formatPercentage(trade.pnlPercentage || 0)})
                          </span>
                        ) : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Consensus</div>
                      <div className="font-medium">{trade.consensusStrength}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {new Date(trade.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block -mx-2 px-2">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm min-w-[500px] lg:min-w-[640px]">
                <colgroup>
                  <col className="w-[80px]" />
                  <col className="w-[70px]" />
                  <col className="w-[80px]" />
                  <col className="w-[100px]" />
                  <col className="w-[100px]" />
                  <col className="w-[130px] hidden md:table-column" />
                  <col className="w-[90px] hidden lg:table-column" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Time</th>
                    <th className="text-left py-2 px-2">Asset</th>
                    <th className="text-left py-2 px-2">Direction</th>
                    <th className="text-right py-2 px-2">Entry</th>
                    <th className="text-right py-2 px-2">Exit</th>
                    <th className="text-right py-2 px-2 hidden md:table-cell">P&L</th>
                    <th className="text-center py-2 px-2 hidden lg:table-cell">Consensus</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice().reverse().slice(0, 20).map((trade) => (
                    <tr key={trade.id} className="border-b border-border/50 hover:bg-background/30">
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2 font-medium">{trade.asset}</td>
                      <td className="py-2 px-2">
                        <span className={`${trade.direction === 'long' ? 'text-bullish' : 'text-bearish'}`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">{formatPrice(trade.entryPrice)}</td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        {trade.exitPrice ? formatPrice(trade.exitPrice) : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-medium whitespace-nowrap hidden md:table-cell">
                        {trade.pnl !== undefined ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={trade.pnl >= 0 ? 'text-bullish' : 'text-bearish'}>
                              {formatPnL(trade.pnl)}
                            </span>
                            <span className="text-xs opacity-75">
                              {formatPercentage(trade.pnlPercentage || 0)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-2 text-center hidden lg:table-cell">
                        <span className="text-xs bg-primary/20 px-2 py-1 rounded">
                          {trade.consensusStrength}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          trade.status === 'open'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={() => fetchTradingHistory()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation px-4 py-2"
        >
          Refresh
        </button>
      </div>
    </motion.div>
  );
}
