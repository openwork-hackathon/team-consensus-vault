/**
 * Paper Trading Engine Types
 * Types for simulated trading based on consensus signals
 */

import { Signal } from './models';

export interface Trade {
  id: string;
  timestamp: string;
  asset: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  consensusStrength: '4/5' | '5/5';
  consensusSignal: Signal;
  status: 'open' | 'closed';
  pnl?: number;
  pnlPercentage?: number;
  closedAt?: string;
}

export interface PortfolioMetrics {
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
}

export interface TradingHistory {
  trades: Trade[];
  metrics: PortfolioMetrics;
  lastUpdated: string;
}
