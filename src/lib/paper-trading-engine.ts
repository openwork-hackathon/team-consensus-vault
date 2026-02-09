/**
 * Paper Trading Engine
 * Simulates trades based on consensus signals and tracks P&L
 */

import { Trade, PortfolioMetrics, TradingHistory } from './trading-types';
import { Signal, ConsensusResponse } from './models';
import { getCurrentPrice } from './price-service';
import { getStoredTrades, setStoredTrades, getStoredMetrics, setStoredMetrics } from './storage';
import { SettlementResult, Payout } from './prediction-market/types';

/**
 * Check if consensus signal triggers a trade (4/5 or 5/5 agreement)
 */
export function shouldExecuteTrade(consensusData: ConsensusResponse): boolean {
  return (
    consensusData.consensus_status === 'CONSENSUS_REACHED' &&
    consensusData.consensus_signal !== null &&
    consensusData.consensus_signal !== 'hold'
  );
}

/**
 * Calculate consensus strength from vote counts
 */
function getConsensusStrength(voteCount: number): '4/5' | '5/5' {
  return voteCount >= 5 ? '5/5' : '4/5';
}

/**
 * Create a new paper trade from consensus signal
 */
export async function executePaperTrade(
  consensusData: ConsensusResponse,
  asset: string = 'BTC/USD'
): Promise<Trade> {
  if (!shouldExecuteTrade(consensusData)) {
    throw new Error('Consensus threshold not met for trade execution');
  }

  const price = await getCurrentPrice(asset);
  const signal = consensusData.consensus_signal!;
  const voteCount = consensusData.vote_counts[signal.toUpperCase() as keyof typeof consensusData.vote_counts];

  const trade: Trade = {
    id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: consensusData.timestamp,
    asset,
    direction: signal === 'buy' ? 'long' : 'short',
    entryPrice: price,
    consensusStrength: getConsensusStrength(voteCount),
    consensusSignal: signal,
    source: 'consensus',
    status: 'open',
  };

  // Store trade (append to existing trades)
  const existingTrades = await getTrades();
  await setStoredTrades([...existingTrades, trade]);

  return trade;
}

/**
 * Close an open trade and calculate P&L
 */
export async function closeTrade(tradeId: string, asset: string = 'BTC/USD'): Promise<Trade> {
  const trades = await getTrades();
  const trade = trades.find((t) => t.id === tradeId);

  if (!trade) {
    throw new Error(`Trade ${tradeId} not found`);
  }

  if (trade.status === 'closed') {
    throw new Error(`Trade ${tradeId} is already closed`);
  }

  const exitPrice = await getCurrentPrice(asset);
  const pnl = calculatePnL(trade.entryPrice, exitPrice, trade.direction);
  const pnlPercentage = (pnl / trade.entryPrice) * 100;

  const updatedTrade: Trade = {
    ...trade,
    exitPrice,
    pnl,
    pnlPercentage,
    status: 'closed',
    closedAt: new Date().toISOString(),
  };

  // Update trade in storage
  const updatedTrades = trades.map((t) => (t.id === tradeId ? updatedTrade : t));
  await setStoredTrades(updatedTrades);

  // Update metrics
  await updateMetrics();

  return updatedTrade;
}

/**
 * Calculate P&L for a trade
 */
function calculatePnL(entryPrice: number, exitPrice: number, direction: 'long' | 'short'): number {
  if (direction === 'long') {
    return exitPrice - entryPrice;
  } else {
    return entryPrice - exitPrice;
  }
}

/**
 * Get all trades
 */
export async function getTrades(): Promise<Trade[]> {
  return await getStoredTrades();
}

/**
 * Get portfolio metrics
 */
export async function getMetrics(): Promise<PortfolioMetrics> {
  const metrics = await getStoredMetrics();
  if (metrics) return metrics;

  // If no cached metrics, calculate from trades
  return await calculateMetrics();
}

/**
 * Calculate portfolio metrics from trades
 */
async function calculateMetrics(): Promise<PortfolioMetrics> {
  const trades = await getTrades();
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const openTrades = trades.filter((t) => t.status === 'open');

  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.pnl || 0) <= 0);

  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
    : 0;

  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map((t) => t.pnl || 0))
    : 0;
  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map((t) => t.pnl || 0))
    : 0;

  const metrics: PortfolioMetrics = {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalPnL,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
  };

  return metrics;
}

/**
 * Update cached metrics
 */
async function updateMetrics(): Promise<void> {
  const metrics = await calculateMetrics();
  await setStoredMetrics(metrics);
}

/**
 * Get complete trading history
 */
export async function getTradingHistory(): Promise<TradingHistory> {
  const trades = await getTrades();
  const metrics = await getMetrics();

  return {
    trades,
    metrics,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Auto-close trades based on opposite consensus signal
 * Returns array of closed trade IDs
 */
export async function autoCloseOnReversal(
  consensusData: ConsensusResponse,
  asset: string = 'BTC/USD'
): Promise<string[]> {
  if (consensusData.consensus_status !== 'CONSENSUS_REACHED') {
    return [];
  }

  const trades = await getTrades();
  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTradeIds: string[] = [];

  for (const trade of openTrades) {
    // Close long positions on sell signal
    if (trade.direction === 'long' && consensusData.consensus_signal === 'sell') {
      await closeTrade(trade.id, asset);
      closedTradeIds.push(trade.id);
    }
    // Close short positions on buy signal
    else if (trade.direction === 'short' && consensusData.consensus_signal === 'buy') {
      await closeTrade(trade.id, asset);
      closedTradeIds.push(trade.id);
    }
  }

  return closedTradeIds;
}

/**
 * Bridge function to record prediction market settlements as paper trades
 * 
 * Maps prediction market bet outcomes to paper trading P&L:
 * - Winning bets → positive P&L (net profit)
 * - Losing bets → negative P&L (lost bet amount)
 * 
 * @param settlementResult - The settlement result from prediction market
 * @param entryPrice - Entry price of the round
 * @param exitPrice - Exit price of the round
 * @param asset - Asset being traded
 * @returns Array of created paper trade IDs
 */
export async function recordPredictionMarketSettlement(
  settlementResult: SettlementResult,
  entryPrice: number,
  exitPrice: number,
  asset: string
): Promise<string[]> {
  const createdTradeIds: string[] = [];

  // Create a paper trade for each payout in the settlement
  for (const payout of settlementResult.payouts) {
    try {
      const trade: Trade = {
        id: `pm-trade-${payout.id}`,
        timestamp: payout.processedAt,
        asset: `${asset}/USD`,
        direction: payout.direction,
        entryPrice: entryPrice,
        exitPrice: exitPrice,
        source: 'prediction_market',
        status: 'closed',
        closedAt: payout.processedAt,
        pnl: payout.netProfit, // Use net profit for P&L
        pnlPercentage: payout.roiPercent,
        predictionMarketData: {
          roundId: payout.roundId,
          betId: payout.betId,
          betAmount: payout.betAmount,
          isWinner: payout.isWinner,
          payoutAmount: payout.payoutAmount,
          netProfit: payout.netProfit,
          roiPercent: payout.roiPercent,
        },
      };

      // Store the trade (append to existing trades)
      const existingTrades = await getTrades();
      await setStoredTrades([...existingTrades, trade]);
      
      createdTradeIds.push(trade.id);
    } catch (error) {
      console.error(`Failed to create paper trade for bet ${payout.betId}:`, error);
      // Continue processing other payouts even if one fails
    }
  }

  // Update metrics after recording all trades
  if (createdTradeIds.length > 0) {
    await updateMetrics();
  }

  return createdTradeIds;
}

/**
 * Get paper trading metrics filtered by source
 * Useful for viewing performance of prediction market vs consensus trades separately
 */
export async function getMetricsBySource(source?: 'consensus' | 'prediction_market'): Promise<PortfolioMetrics> {
  const trades = await getTrades();
  
  let filteredTrades = trades;
  if (source) {
    filteredTrades = trades.filter(t => t.source === source);
  }
  
  const closedTrades = filteredTrades.filter((t) => t.status === 'closed');
  const openTrades = filteredTrades.filter((t) => t.status === 'open');

  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.pnl || 0) <= 0);

  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
    : 0;

  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map((t) => t.pnl || 0))
    : 0;
  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map((t) => t.pnl || 0))
    : 0;

  const metrics: PortfolioMetrics = {
    totalTrades: filteredTrades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalPnL,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
  };

  return metrics;
}
