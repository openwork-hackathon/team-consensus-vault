/**
 * Tests for Stale Trade Handler (CVAULT-181)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  runStaleTradeCleanup,
  checkAndCleanupIfNeeded,
  STALE_TRADE_CONFIG,
} from '../stale-trade-handler';
import { setCurrentRound, getCurrentRound, resetPool, setCurrentPool } from '../prediction-market/state';
import { RoundPhase, PredictionMarketConfig } from '../prediction-market/types';
import { setStoredTrades, getStoredTrades } from '../storage';

// Mock price service
vi.mock('../price-service', () => ({
  getCurrentPrice: vi.fn().mockResolvedValue(45000),
}));

describe('Stale Trade Handler', () => {
  beforeEach(async () => {
    // Reset state before each test
    setCurrentRound(null);
    resetPool();
    await setStoredTrades([]);
  });

  describe('runStaleTradeCleanup', () => {
    it('should return executed: true when forced', async () => {
      const result = await runStaleTradeCleanup(true);
      expect(result.executed).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle empty state gracefully', async () => {
      const result = await runStaleTradeCleanup(true);
      expect(result.executed).toBe(true);
      expect(result.paperTradesClosed).toHaveLength(0);
      expect(result.predictionRoundsHandled).toHaveLength(0);
    });

    it('should close stale paper trades', async () => {
      // Create a stale open trade (5 hours ago)
      const staleTimestamp = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      await setStoredTrades([
        {
          id: 'trade-stale-1',
          timestamp: staleTimestamp,
          asset: 'BTC/USD',
          direction: 'long',
          entryPrice: 44000,
          source: 'consensus',
          status: 'open',
        },
      ]);

      const result = await runStaleTradeCleanup(true);
      expect(result.paperTradesClosed).toHaveLength(1);
      expect(result.paperTradesClosed[0].tradeId).toBe('trade-stale-1');
      expect(result.paperTradesClosed[0].exitPrice).toBe(45000); // Mocked price

      // Verify trade is now closed in storage
      const trades = await getStoredTrades();
      expect(trades[0].status).toBe('closed');
      expect(trades[0].exitPrice).toBe(45000);
    });

    it('should not close fresh paper trades', async () => {
      // Create a fresh open trade (1 hour ago)
      const freshTimestamp = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      await setStoredTrades([
        {
          id: 'trade-fresh-1',
          timestamp: freshTimestamp,
          asset: 'BTC/USD',
          direction: 'long',
          entryPrice: 44000,
          source: 'consensus',
          status: 'open',
        },
      ]);

      const result = await runStaleTradeCleanup(true);
      expect(result.paperTradesClosed).toHaveLength(0);

      // Verify trade is still open
      const trades = await getStoredTrades();
      expect(trades[0].status).toBe('open');
    });

    it('should not touch already-closed trades', async () => {
      await setStoredTrades([
        {
          id: 'trade-closed-1',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          asset: 'BTC/USD',
          direction: 'long',
          entryPrice: 44000,
          exitPrice: 45000,
          source: 'consensus',
          status: 'closed',
          closedAt: new Date().toISOString(),
          pnl: 1000,
          pnlPercentage: 2.27,
        },
      ]);

      const result = await runStaleTradeCleanup(true);
      expect(result.paperTradesClosed).toHaveLength(0);
    });
  });

  describe('Prediction Market Round Cleanup', () => {
    it('should expire a round stuck in SCANNING too long', async () => {
      const oldTimestamp = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      setCurrentRound({
        id: 'round_btc_old',
        phase: RoundPhase.SCANNING,
        asset: 'BTC',
        entryPrice: 0,
        direction: 'long',
        consensusLevel: 0,
        consensusVotes: 0,
        totalVotes: 0,
        createdAt: oldTimestamp,
        minBet: PredictionMarketConfig.MIN_BET,
        maxBet: PredictionMarketConfig.MAX_BET,
        bettingPool: {
          totalLong: 0, totalShort: 0, totalPool: 0,
          longBetCount: 0, shortBetCount: 0, totalBetCount: 0,
          avgLongBet: 0, avgShortBet: 0, longOdds: 0, shortOdds: 0,
        },
        consensusSnapshot: {
          id: 'snap1', timestamp: oldTimestamp, asset: 'BTC', signal: 'hold',
          consensusLevel: 0, agreementCount: 0, totalAgents: 5, votes: [],
          rationale: '', averageConfidence: 0, threshold: 75,
        },
      });

      const result = await runStaleTradeCleanup(true);
      expect(result.predictionRoundsHandled).toHaveLength(1);
      expect(result.predictionRoundsHandled[0].action).toBe('expired');
      expect(result.predictionRoundsHandled[0].previousPhase).toBe(RoundPhase.SCANNING);

      // Round should be reset
      const round = getCurrentRound();
      expect(round).toBeTruthy();
      expect(round!.phase).toBe(RoundPhase.SCANNING);
      expect(round!.id).not.toBe('round_btc_old'); // New round ID
    });

    it('should auto-settle a stale POSITION_OPEN round', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      setCurrentRound({
        id: 'round_btc_position',
        phase: RoundPhase.POSITION_OPEN,
        asset: 'BTC',
        entryPrice: 44000,
        currentPrice: 44500,
        direction: 'long',
        consensusLevel: 85,
        consensusVotes: 4,
        totalVotes: 5,
        createdAt: twoHoursAgo,
        positionOpenedAt: twoHoursAgo,
        minBet: PredictionMarketConfig.MIN_BET,
        maxBet: PredictionMarketConfig.MAX_BET,
        bettingPool: {
          totalLong: 5000, totalShort: 3000, totalPool: 8000,
          longBetCount: 3, shortBetCount: 2, totalBetCount: 5,
          avgLongBet: 1666, avgShortBet: 1500, longOdds: 1.6, shortOdds: 2.67,
        },
        consensusSnapshot: {
          id: 'snap2', timestamp: twoHoursAgo, asset: 'BTC', signal: 'buy',
          consensusLevel: 85, agreementCount: 4, totalAgents: 5, votes: [],
          rationale: '', averageConfidence: 85, threshold: 75,
        },
      });

      const result = await runStaleTradeCleanup(true);
      expect(result.predictionRoundsHandled).toHaveLength(1);
      expect(result.predictionRoundsHandled[0].action).toBe('auto_settled');

      // Round should now be in SETTLEMENT phase
      const round = getCurrentRound();
      expect(round).toBeTruthy();
      expect(round!.phase).toBe(RoundPhase.SETTLEMENT);
      expect(round!.exitPrice).toBe(45000); // Mocked price
    });

    it('should expire a BETTING_WINDOW round with expired window', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // Ended 30 min ago
      
      setCurrentRound({
        id: 'round_btc_betting',
        phase: RoundPhase.BETTING_WINDOW,
        asset: 'BTC',
        entryPrice: 44000,
        direction: 'long',
        consensusLevel: 85,
        consensusVotes: 4,
        totalVotes: 5,
        createdAt: oneHourAgo,
        bettingWindowStart: oneHourAgo,
        bettingWindowEnd: windowEnd,
        minBet: PredictionMarketConfig.MIN_BET,
        maxBet: PredictionMarketConfig.MAX_BET,
        bettingPool: {
          totalLong: 0, totalShort: 0, totalPool: 0,
          longBetCount: 0, shortBetCount: 0, totalBetCount: 0,
          avgLongBet: 0, avgShortBet: 0, longOdds: 0, shortOdds: 0,
        },
        consensusSnapshot: {
          id: 'snap3', timestamp: oneHourAgo, asset: 'BTC', signal: 'buy',
          consensusLevel: 85, agreementCount: 4, totalAgents: 5, votes: [],
          rationale: '', averageConfidence: 85, threshold: 75,
        },
      });

      const result = await runStaleTradeCleanup(true);
      expect(result.predictionRoundsHandled).toHaveLength(1);
      expect(result.predictionRoundsHandled[0].action).toBe('expired');
      expect(result.predictionRoundsHandled[0].previousPhase).toBe(RoundPhase.BETTING_WINDOW);
    });

    it('should not touch a fresh active round', async () => {
      const justNow = new Date().toISOString();
      setCurrentRound({
        id: 'round_btc_fresh',
        phase: RoundPhase.SCANNING,
        asset: 'BTC',
        entryPrice: 0,
        direction: 'long',
        consensusLevel: 0,
        consensusVotes: 0,
        totalVotes: 0,
        createdAt: justNow,
        minBet: PredictionMarketConfig.MIN_BET,
        maxBet: PredictionMarketConfig.MAX_BET,
        bettingPool: {
          totalLong: 0, totalShort: 0, totalPool: 0,
          longBetCount: 0, shortBetCount: 0, totalBetCount: 0,
          avgLongBet: 0, avgShortBet: 0, longOdds: 0, shortOdds: 0,
        },
        consensusSnapshot: {
          id: 'snap4', timestamp: justNow, asset: 'BTC', signal: 'hold',
          consensusLevel: 0, agreementCount: 0, totalAgents: 5, votes: [],
          rationale: '', averageConfidence: 0, threshold: 75,
        },
      });

      const result = await runStaleTradeCleanup(true);
      expect(result.predictionRoundsHandled).toHaveLength(0);
      
      // Round should remain unchanged
      const round = getCurrentRound();
      expect(round!.id).toBe('round_btc_fresh');
    });

    it('should reset a long-settled round', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      setCurrentRound({
        id: 'round_btc_settled_old',
        phase: RoundPhase.SETTLEMENT,
        asset: 'BTC',
        entryPrice: 44000,
        exitPrice: 45000,
        direction: 'long',
        consensusLevel: 85,
        consensusVotes: 4,
        totalVotes: 5,
        createdAt: twoHoursAgo,
        settledAt: twoHoursAgo,
        minBet: PredictionMarketConfig.MIN_BET,
        maxBet: PredictionMarketConfig.MAX_BET,
        bettingPool: {
          totalLong: 5000, totalShort: 3000, totalPool: 8000,
          longBetCount: 3, shortBetCount: 2, totalBetCount: 5,
          avgLongBet: 1666, avgShortBet: 1500, longOdds: 1.6, shortOdds: 2.67,
        },
        consensusSnapshot: {
          id: 'snap5', timestamp: twoHoursAgo, asset: 'BTC', signal: 'buy',
          consensusLevel: 85, agreementCount: 4, totalAgents: 5, votes: [],
          rationale: '', averageConfidence: 85, threshold: 75,
        },
      });

      const result = await runStaleTradeCleanup(true);
      expect(result.predictionRoundsHandled).toHaveLength(1);
      expect(result.predictionRoundsHandled[0].action).toBe('expired');
      expect(result.predictionRoundsHandled[0].previousPhase).toBe(RoundPhase.SETTLEMENT);

      // Should be reset to fresh round
      const round = getCurrentRound();
      expect(round!.phase).toBe(RoundPhase.SCANNING);
    });
  });

  describe('Summary statistics', () => {
    it('should include correct summary', async () => {
      const staleTimestamp = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      await setStoredTrades([
        {
          id: 'trade-1',
          timestamp: staleTimestamp,
          asset: 'BTC/USD',
          direction: 'long',
          entryPrice: 44000,
          source: 'consensus',
          status: 'open',
        },
        {
          id: 'trade-2',
          timestamp: staleTimestamp,
          asset: 'ETH/USD',
          direction: 'short',
          entryPrice: 2500,
          source: 'consensus',
          status: 'open',
        },
      ]);

      const result = await runStaleTradeCleanup(true);
      expect(result.summary.paperTradesClosed).toBe(2);
      expect(result.summary.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Rate limiting', () => {
    it('should skip cleanup if run too recently (without force)', async () => {
      // First run succeeds
      const result1 = await runStaleTradeCleanup(true);
      expect(result1.executed).toBe(true);

      // Second run without force should be skipped
      const result2 = await runStaleTradeCleanup(false);
      expect(result2.executed).toBe(false);
      expect(result2.skipReason).toBeDefined();
    });

    it('should not skip when forced', async () => {
      // First run 
      await runStaleTradeCleanup(true);
      
      // Second forced run should still execute
      const result2 = await runStaleTradeCleanup(true);
      expect(result2.executed).toBe(true);
    });
  });
});
