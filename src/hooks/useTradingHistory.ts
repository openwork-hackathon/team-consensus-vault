'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trade } from '@/lib/trading-types';

export interface TradingHistoryData {
  trades: Trade[];
  metrics: {
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnL: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
  } | null;
  lastUpdated: string;
}

export function useTradingHistory(refreshInterval: number = 30000) {
  const [data, setData] = useState<TradingHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/trading/history');
      const result = await response.json();

      if (result.success) {
        setData({
          trades: result.trades || [],
          metrics: result.metrics || null,
          lastUpdated: result.lastUpdated || new Date().toISOString(),
        });
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch trading history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHistory, refreshInterval]);

  return { data, loading, error, refetch: fetchHistory };
}
