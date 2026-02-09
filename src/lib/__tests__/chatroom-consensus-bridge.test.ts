/**
 * Tests for Chatroom-to-Trading-Council Bridge
 * CVAULT-177
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateAlignmentScore,
  generateAlignmentCommentary,
  isChatroomConsensusSignificant,
} from '../chatroom-consensus-bridge';
import type { ChatroomConsensusSnapshot } from '../chatroom-consensus-bridge';

describe('chatroom-consensus-bridge', () => {
  describe('calculateAlignmentScore', () => {
    it('returns high score for aligned bullish signals', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'bullish',
        strength: 85,
        phaseState: 'CONSENSUS',
        messageCount: 50,
        timestamp: Date.now(),
        summary: 'Strong bullish consensus',
      };

      const score = calculateAlignmentScore(consensus, 'buy', 88);

      expect(score).toBeGreaterThanOrEqual(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns low score for opposite signals', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'bearish',
        strength: 80,
        phaseState: 'CONSENSUS',
        messageCount: 50,
        timestamp: Date.now(),
        summary: 'Strong bearish consensus',
      };

      const score = calculateAlignmentScore(consensus, 'buy', 85);

      expect(score).toBeLessThan(50);
    });

    it('returns 50 for neutral alignment when no consensus', () => {
      const score = calculateAlignmentScore(null, 'buy', 70);

      expect(score).toBe(50);
    });

    it('returns 50 when one side is neutral', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'neutral',
        strength: 45,
        phaseState: 'DEBATE',
        messageCount: 20,
        timestamp: Date.now(),
        summary: 'No clear consensus',
      };

      const score = calculateAlignmentScore(consensus, 'buy', 70);

      expect(score).toBe(50);
    });
  });

  describe('generateAlignmentCommentary', () => {
    it('generates strong agreement message', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'bullish',
        strength: 85,
        phaseState: 'CONSENSUS',
        messageCount: 50,
        timestamp: Date.now(),
        summary: 'Strong bullish consensus',
      };

      const commentary = generateAlignmentCommentary(90, consensus, 'buy');

      expect(commentary).toContain('Strong agreement');
      expect(commentary).toContain('✅');
    });

    it('generates disagreement message', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'bearish',
        strength: 75,
        phaseState: 'CONSENSUS',
        messageCount: 50,
        timestamp: Date.now(),
        summary: 'Strong bearish consensus',
      };

      const commentary = generateAlignmentCommentary(30, consensus, 'buy');

      expect(commentary).toContain('Disagreement');
      expect(commentary).toContain('❌');
    });

    it('handles null consensus', () => {
      const commentary = generateAlignmentCommentary(50, null, 'hold');

      expect(commentary).toContain('No chatroom consensus available');
    });
  });

  describe('isChatroomConsensusSignificant', () => {
    it('returns true for strong non-neutral consensus', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'bullish',
        strength: 75,
        phaseState: 'CONSENSUS',
        messageCount: 50,
        timestamp: Date.now(),
        summary: 'Strong bullish consensus',
      };

      expect(isChatroomConsensusSignificant(consensus)).toBe(true);
    });

    it('returns false for weak consensus', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'bullish',
        strength: 45,
        phaseState: 'DEBATE',
        messageCount: 20,
        timestamp: Date.now(),
        summary: 'Weak bullish lean',
      };

      expect(isChatroomConsensusSignificant(consensus)).toBe(false);
    });

    it('returns false for neutral consensus', () => {
      const consensus: ChatroomConsensusSnapshot = {
        direction: 'neutral',
        strength: 70,
        phaseState: 'DEBATE',
        messageCount: 30,
        timestamp: Date.now(),
        summary: 'No clear direction',
      };

      expect(isChatroomConsensusSignificant(consensus)).toBe(false);
    });

    it('returns false for null consensus', () => {
      expect(isChatroomConsensusSignificant(null)).toBe(false);
    });
  });
});
