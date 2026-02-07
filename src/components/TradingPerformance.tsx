'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trade, PortfolioMetrics } from '@/lib/trading-types';

interface TradingPerformanceProps {
  className?: string;
}

export default function TradingPerformance({ className = '' }: TradingPerformanceProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTradingHistory();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTradingHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTradingHistory = async () => {
    try {
      const response = await fetch('/api/trading/history');
      const data = await response.json();

      if (data.success) {
        setTrades(data.trades || []);
        setMetrics(data.metrics || null);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch trading history');
      }
    } catch (err) {
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
    return (
      <div className={`bg-card rounded-xl p-6 border border-border ${className}`}>
        <div className="text-center text-muted-foreground">Loading trading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-card rounded-xl p-6 border border-border ${className}`}>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div className={`text-xl font-bold ${metrics.totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {formatPnL(metrics.totalPnL)}
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className="text-xl font-bold">{metrics.winRate.toFixed(1)}%</div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
            <div className="text-xl font-bold">{metrics.totalTrades}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Open Positions</div>
            <div className="text-xl font-bold text-primary">{metrics.openTrades}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Avg Win</div>
            <div className="text-sm font-bold text-bullish">{formatPnL(metrics.avgWin)}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Avg Loss</div>
            <div className="text-sm font-bold text-bearish">{formatPnL(metrics.avgLoss)}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Largest Win</div>
            <div className="text-sm font-bold text-bullish">{formatPnL(metrics.largestWin)}</div>
          </div>

          <div className="bg-background/50 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Largest Loss</div>
            <div className="text-sm font-bold text-bearish">{formatPnL(metrics.largestLoss)}</div>
          </div>
        </div>
      )}

      {/* Trade History Table */}
      <div>
        <h3 className="text-lg font-bold mb-3">Recent Trades</h3>

        {trades.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No trades yet. Trades will execute automatically when 4/5 or 5/5 AI models reach consensus.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Asset</th>
                  <th className="text-left py-2 px-2">Direction</th>
                  <th className="text-right py-2 px-2">Entry</th>
                  <th className="text-right py-2 px-2">Exit</th>
                  <th className="text-right py-2 px-2">P&L</th>
                  <th className="text-center py-2 px-2">Consensus</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice().reverse().slice(0, 20).map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 hover:bg-background/30">
                    <td className="py-2 px-2 text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-2 font-medium">{trade.asset}</td>
                    <td className="py-2 px-2">
                      <span className={`${trade.direction === 'long' ? 'text-bullish' : 'text-bearish'}`}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">{formatPrice(trade.entryPrice)}</td>
                    <td className="py-2 px-2 text-right">
                      {trade.exitPrice ? formatPrice(trade.exitPrice) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {trade.pnl !== undefined ? (
                        <span className={trade.pnl >= 0 ? 'text-bullish' : 'text-bearish'}>
                          {formatPnL(trade.pnl)}
                          <span className="text-xs ml-1">
                            ({formatPercentage(trade.pnlPercentage || 0)})
                          </span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
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
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={fetchTradingHistory}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh
        </button>
      </div>
    </motion.div>
  );
}
