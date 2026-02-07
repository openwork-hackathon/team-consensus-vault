/**
 * Unit tests for 4/5 consensus logic
 */

import { calculateConsensusDetailed, AnalystResult } from '../models';

describe('4/5 Consensus Logic', () => {
  const mockResponseTimes = new Map<string, number>([
    ['deepseek', 1500],
    ['kimi', 2000],
    ['minimax', 1800],
    ['glm', 2200],
    ['gemini', 2500],
  ]);

  describe('CONSENSUS_REACHED scenarios', () => {
    it('should reach consensus with 4/5 BUY votes', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 60, reasoning: 'Moderate risk' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('CONSENSUS_REACHED');
      expect(response.consensus_signal).toBe('buy');
      expect(response.vote_counts.BUY).toBe(4);
      expect(response.vote_counts.HOLD).toBe(1);
      expect(response.individual_votes).toHaveLength(5);
    });

    it('should reach consensus with 4/5 SELL votes', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bearish', confidence: 85, reasoning: 'Breakdown confirmed' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bearish', confidence: 80, reasoning: 'Whale distribution' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bearish', confidence: 75, reasoning: 'Negative sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bearish', confidence: 90, reasoning: 'TVL declining' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'bullish', confidence: 60, reasoning: 'Contrarian play' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('CONSENSUS_REACHED');
      expect(response.consensus_signal).toBe('sell');
      expect(response.vote_counts.SELL).toBe(4);
      expect(response.vote_counts.BUY).toBe(1);
    });

    it('should reach consensus with 5/5 votes', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'bullish', confidence: 85, reasoning: 'Low risk entry' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('CONSENSUS_REACHED');
      expect(response.consensus_signal).toBe('buy');
      expect(response.vote_counts.BUY).toBe(5);
    });

    it('should reach consensus with 4/5 HOLD votes', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'neutral', confidence: 65, reasoning: 'Sideways action' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'neutral', confidence: 70, reasoning: 'No clear whale activity' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'neutral', confidence: 60, reasoning: 'Mixed sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'neutral', confidence: 75, reasoning: 'Stable metrics' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'bullish', confidence: 55, reasoning: 'Slight positive bias' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('CONSENSUS_REACHED');
      expect(response.consensus_signal).toBe('hold');
      expect(response.vote_counts.HOLD).toBe(4);
      expect(response.vote_counts.BUY).toBe(1);
    });
  });

  describe('NO_CONSENSUS scenarios', () => {
    it('should return NO_CONSENSUS with 3-2 split', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bearish', confidence: 85, reasoning: 'Declining metrics' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'bearish', confidence: 80, reasoning: 'High risk' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('NO_CONSENSUS');
      expect(response.consensus_signal).toBe(null);
      expect(response.vote_counts.BUY).toBe(3);
      expect(response.vote_counts.SELL).toBe(2);
    });

    it('should return NO_CONSENSUS with 2-2-1 split', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bearish', confidence: 75, reasoning: 'Negative sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bearish', confidence: 85, reasoning: 'Declining metrics' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 60, reasoning: 'Wait and see' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('NO_CONSENSUS');
      expect(response.consensus_signal).toBe(null);
      expect(response.vote_counts.BUY).toBe(2);
      expect(response.vote_counts.SELL).toBe(2);
      expect(response.vote_counts.HOLD).toBe(1);
    });
  });

  describe('INSUFFICIENT_RESPONSES scenarios', () => {
    it('should return INSUFFICIENT_RESPONSES with only 2 valid responses', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Timeout after 30s' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'API error' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Rate limit exceeded' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('INSUFFICIENT_RESPONSES');
      expect(response.consensus_signal).toBe(null);
      expect(response.individual_votes.filter((v) => v.status === 'success')).toHaveLength(2);
    });

    it('should return INSUFFICIENT_RESPONSES with all failures', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Timeout' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Timeout' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'API error' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Network error' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Rate limit' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('INSUFFICIENT_RESPONSES');
      expect(response.consensus_signal).toBe(null);
      expect(response.vote_counts.BUY).toBe(0);
      expect(response.vote_counts.SELL).toBe(0);
      expect(response.vote_counts.HOLD).toBe(0);
    });
  });

  describe('Edge cases with errors and timeouts', () => {
    it('should handle timeout correctly', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Request timeout after 30 seconds' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.consensus_status).toBe('CONSENSUS_REACHED');
      expect(response.consensus_signal).toBe('buy');
      expect(response.individual_votes.find((v) => v.model_name === 'gemini')?.status).toBe('timeout');
    });

    it('should classify abort errors as timeout', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'AbortError: Request aborted' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.individual_votes.find((v) => v.model_name === 'gemini')?.status).toBe('timeout');
    });

    it('should track response times for all models', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 60, reasoning: 'Moderate risk' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.individual_votes.find((v) => v.model_name === 'deepseek')?.response_time_ms).toBe(1500);
      expect(response.individual_votes.find((v) => v.model_name === 'kimi')?.response_time_ms).toBe(2000);
      expect(response.individual_votes.find((v) => v.model_name === 'gemini')?.response_time_ms).toBe(2500);
    });

    it('should include timestamp in ISO format', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'bullish', confidence: 85, reasoning: 'Low risk' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Vote counting accuracy', () => {
    it('should accurately count votes in complex scenario', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bearish', confidence: 80, reasoning: 'Whale distribution' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Timeout' },
        { id: 'gemini', name: 'Risk Manager', sentiment: 'neutral', confidence: 60, reasoning: 'Wait and see' },
      ];

      const response = calculateConsensusDetailed(results, mockResponseTimes);

      expect(response.vote_counts.BUY).toBe(2);
      expect(response.vote_counts.SELL).toBe(1);
      expect(response.vote_counts.HOLD).toBe(1);
      expect(response.consensus_status).toBe('INSUFFICIENT_RESPONSES'); // Only 4 valid, but no 4/5 consensus
    });
  });
});
