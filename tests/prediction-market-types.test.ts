/**
 * Tests for prediction market types
 * Verify that types are properly defined and helper functions work correctly
 */

import { describe, it, expect } from 'vitest';
import {
  RoundPhase,
  Bet,
  BettingPool,
  ConsensusSnapshot,
  SettlementResult,
  Payout,
  PredictionMarketConfig,
  isBettingPhase,
  isRoundActive,
  isRoundCompleted,
  calculatePotentialPayout,
  calculateBettingPool,
} from '@/lib/prediction-market/types';

describe('Prediction Market Types', () => {
  describe('RoundPhase Enum', () => {
    it('should have all required phases', () => {
      expect(RoundPhase.SCANNING).toBe('SCANNING');
      expect(RoundPhase.ENTRY_SIGNAL).toBe('ENTRY_SIGNAL');
      expect(RoundPhase.BETTING_WINDOW).toBe('BETTING_WINDOW');
      expect(RoundPhase.POSITION_OPEN).toBe('POSITION_OPEN');
      expect(RoundPhase.EXIT_SIGNAL).toBe('EXIT_SIGNAL');
      expect(RoundPhase.SETTLEMENT).toBe('SETTLEMENT');
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify betting phase', () => {
      expect(isBettingPhase(RoundPhase.BETTING_WINDOW)).toBe(true);
      expect(isBettingPhase(RoundPhase.SCANNING)).toBe(false);
      expect(isBettingPhase(RoundPhase.SETTLEMENT)).toBe(false);
    });

    it('should correctly identify active rounds', () => {
      expect(isRoundActive(RoundPhase.SCANNING)).toBe(true);
      expect(isRoundActive(RoundPhase.BETTING_WINDOW)).toBe(true);
      expect(isRoundActive(RoundPhase.POSITION_OPEN)).toBe(true);
      expect(isRoundActive(RoundPhase.SETTLEMENT)).toBe(false);
    });

    it('should correctly identify completed rounds', () => {
      expect(isRoundCompleted(RoundPhase.SETTLEMENT)).toBe(true);
      expect(isRoundCompleted(RoundPhase.BETTING_WINDOW)).toBe(false);
    });
  });

  describe('PredictionMarketConfig', () => {
    it('should have all required configuration values', () => {
      expect(PredictionMarketConfig.MIN_BET).toBeDefined();
      expect(PredictionMarketConfig.MAX_BET).toBeDefined();
      expect(PredictionMarketConfig.BETTING_WINDOW_DURATION).toBeDefined();
      expect(PredictionMarketConfig.SETTLEMENT_DELAY).toBeDefined();
      expect(PredictionMarketConfig.FEE_PERCENTAGE).toBeDefined();
      expect(PredictionMarketConfig.MIN_CONSENSUS_LEVEL).toBeDefined();
      expect(PredictionMarketConfig.MIN_AGREEMENT_COUNT).toBeDefined();
    });

    it('should have reasonable default values', () => {
      expect(PredictionMarketConfig.MIN_BET).toBe(10);
      expect(PredictionMarketConfig.MAX_BET).toBe(10000);
      expect(PredictionMarketConfig.FEE_PERCENTAGE).toBe(0.02);
      expect(PredictionMarketConfig.MIN_CONSENSUS_LEVEL).toBe(75);
      expect(PredictionMarketConfig.MIN_AGREEMENT_COUNT).toBe(4);
    });
  });

  describe('Betting Pool Calculations', () => {
    it('should calculate betting pool correctly', () => {
      const bets: Bet[] = [
        {
          id: '1',
          roundId: 'round-1',
          userAddress: '0x123',
          amount: 100,
          direction: 'long',
          timestamp: new Date().toISOString(),
          status: 'confirmed',
        },
        {
          id: '2',
          roundId: 'round-1',
          userAddress: '0x456',
          amount: 200,
          direction: 'long',
          timestamp: new Date().toISOString(),
          status: 'confirmed',
        },
        {
          id: '3',
          roundId: 'round-1',
          userAddress: '0x789',
          amount: 150,
          direction: 'short',
          timestamp: new Date().toISOString(),
          status: 'confirmed',
        },
      ];

      const pool = calculateBettingPool(bets);

      expect(pool.totalLong).toBe(300);
      expect(pool.totalShort).toBe(150);
      expect(pool.totalPool).toBe(450);
      expect(pool.longBetCount).toBe(2);
      expect(pool.shortBetCount).toBe(1);
      expect(pool.totalBetCount).toBe(3);
      expect(pool.avgLongBet).toBe(150);
      expect(pool.avgShortBet).toBe(150);
    });

    it('should calculate potential payout correctly', () => {
      const pool: BettingPool = {
        totalLong: 1000,
        totalShort: 500,
        totalPool: 1500,
        longBetCount: 10,
        shortBetCount: 5,
        totalBetCount: 15,
        avgLongBet: 100,
        avgShortBet: 100,
        longOdds: 1.5,
        shortOdds: 3,
      };

      // Long bet of 100 wins
      const longResult = calculatePotentialPayout(100, 'long', pool, 0.02);
      expect(longResult.payout).toBeCloseTo(147, 0); // (100/1000) * 1500 * 0.98
      expect(longResult.profit).toBeCloseTo(47, 0);

      // Short bet of 100 wins
      const shortResult = calculatePotentialPayout(100, 'short', pool, 0.02);
      expect(shortResult.payout).toBeCloseTo(294, 0); // (100/500) * 1500 * 0.98 = 294
      expect(shortResult.profit).toBeCloseTo(194, 0);
    });

    it('should handle empty betting pool', () => {
      const emptyPool: BettingPool = {
        totalLong: 0,
        totalShort: 0,
        totalPool: 0,
        longBetCount: 0,
        shortBetCount: 0,
        totalBetCount: 0,
        avgLongBet: 0,
        avgShortBet: 0,
        longOdds: 0,
        shortOdds: 0,
      };

      const result = calculatePotentialPayout(100, 'long', emptyPool);
      expect(result.payout).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.netProfit).toBe(0);
    });
  });
});
