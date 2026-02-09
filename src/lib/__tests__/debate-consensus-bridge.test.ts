/**
 * Tests for Debate-to-Consensus Bridge
 * CVAULT-190: Wire Debate Arguments into Consensus Round Prompts
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateArgumentQuality,
  extractScoredArguments,
  buildDebateContextForConsensus,
  formatDebateContextForPrompt,
  calculateConsensusInfluenceWeights,
  applyInfluenceWeighting,
  buildConsensusPromptWithDebateContext,
  ScoredArgument,
  DebateContextForConsensus,
  ARGUMENT_QUALITY_CONFIG,
} from '../chatroom/debate-consensus-bridge';
import { ChatMessage, MessageSentiment, DebateSummary } from '../chatroom/types';
import { PersuasionState } from '../chatroom/persuasion';

// Helper to create test messages
function createTestMessage(
  overrides: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    personaId: 'test_persona',
    handle: 'TestPersona',
    avatar: '🧪',
    content: 'Test message content',
    sentiment: 'bullish',
    confidence: 70,
    timestamp: Date.now(),
    phase: 'DEBATE',
    ...overrides,
  };
}

// Helper to create test debate summary
function createTestDebateSummary(overrides: Partial<DebateSummary> = {}): DebateSummary {
  return {
    roundNumber: 1,
    timestamp: Date.now(),
    consensusDirection: 'bullish',
    consensusStrength: 75,
    keyBullishArguments: ['BTC holding support at $45k', 'Volume up 200%'],
    keyBearishArguments: ['RSI overbought at 75'],
    stanceChanges: [],
    topDataPoints: ['$45k', '200%', 'RSI 75'],
    messageCount: 25,
    ...overrides,
  };
}

describe('debate-consensus-bridge', () => {
  describe('calculateArgumentQuality', () => {
    it('should give higher scores to high-confidence messages', () => {
      const highConfidenceMsg = createTestMessage({ confidence: 90 });
      const lowConfidenceMsg = createTestMessage({ confidence: 40 });
      const messages = [highConfidenceMsg, lowConfidenceMsg];

      const highScore = calculateArgumentQuality(highConfidenceMsg, messages);
      const lowScore = calculateArgumentQuality(lowConfidenceMsg, messages);

      expect(highScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(50);
    });

    it('should bonus data-backed arguments', () => {
      const dataBackedMsg = createTestMessage({
        content: 'BTC up 15% with $50B volume at $45k support',
        confidence: 70,
      });
      const vagueMsg = createTestMessage({
        content: 'I think it will go up',
        confidence: 70,
      });
      const messages = [dataBackedMsg, vagueMsg];

      const dataScore = calculateArgumentQuality(dataBackedMsg, messages);
      const vagueScore = calculateArgumentQuality(vagueMsg, messages);

      expect(dataScore).toBeGreaterThan(vagueScore);
      expect(dataScore - vagueScore).toBeGreaterThanOrEqual(ARGUMENT_QUALITY_CONFIG.DATA_BACKED_BONUS);
    });

    it('should bonus messages acknowledging opposing views', () => {
      const acknowledgingMsg = createTestMessage({
        content: 'While I see the bearish case, the volume suggests otherwise',
        acknowledgesOpposingView: true,
        confidence: 75,
      });
      const nonAcknowledgingMsg = createTestMessage({
        content: 'Bullish because volume is high',
        acknowledgesOpposingView: false,
        confidence: 75,
      });
      const messages = [acknowledgingMsg, nonAcknowledgingMsg];

      const ackScore = calculateArgumentQuality(acknowledgingMsg, messages);
      const nonAckScore = calculateArgumentQuality(nonAcknowledgingMsg, messages);

      expect(ackScore).toBeGreaterThan(nonAckScore);
    });

    it('should cap scores at 100', () => {
      const perfectMsg = createTestMessage({
        content: 'BTC up 100% to $100k with $100B volume, RSI at 50 perfect',
        confidence: 100,
        acknowledgesOpposingView: true,
      });
      const messages = [perfectMsg];

      const score = calculateArgumentQuality(perfectMsg, messages);

      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('extractScoredArguments', () => {
    it('should only extract DEBATE phase messages', () => {
      const debateMsg = createTestMessage({ phase: 'DEBATE', sentiment: 'bullish' });
      const consensusMsg = createTestMessage({ phase: 'CONSENSUS', sentiment: 'bullish' });
      const cooldownMsg = createTestMessage({ phase: 'COOLDOWN' });

      const scored = extractScoredArguments([debateMsg, consensusMsg, cooldownMsg]);

      expect(scored).toHaveLength(1);
      expect(scored[0].phase).toBe('DEBATE');
    });

    it('should only extract messages with sentiment and confidence', () => {
      const validMsg = createTestMessage({ sentiment: 'bullish', confidence: 70 });
      const noSentimentMsg = createTestMessage({ sentiment: undefined, confidence: 70 });
      const noConfidenceMsg = createTestMessage({ sentiment: 'bullish', confidence: undefined });

      const scored = extractScoredArguments([validMsg, noSentimentMsg, noConfidenceMsg]);

      expect(scored).toHaveLength(1);
      expect(scored[0].sentiment).toBe('bullish');
    });

    it('should extract data points from content', () => {
      const msg = createTestMessage({
        content: 'BTC up 15% to $45,000 with $50 billion volume',
        sentiment: 'bullish',
        confidence: 80,
      });

      const scored = extractScoredArguments([msg]);

      expect(scored[0].dataPoints.length).toBeGreaterThan(0);
      expect(scored[0].dataPoints).toContain('15%');
    });

    it('should calculate quality scores for all arguments', () => {
      const messages = [
        createTestMessage({ confidence: 90, sentiment: 'bullish' }),
        createTestMessage({ confidence: 60, sentiment: 'bearish' }),
        createTestMessage({ confidence: 75, sentiment: 'neutral' }),
      ];

      const scored = extractScoredArguments(messages);

      expect(scored).toHaveLength(3);
      scored.forEach(arg => {
        expect(arg.qualityScore).toBeGreaterThanOrEqual(0);
        expect(arg.qualityScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('buildDebateContextForConsensus', () => {
    it('should build complete debate context', () => {
      const messages = [
        createTestMessage({ sentiment: 'bullish', confidence: 80, handle: 'Bull1' }),
        createTestMessage({ sentiment: 'bullish', confidence: 75, handle: 'Bull2' }),
        createTestMessage({ sentiment: 'bearish', confidence: 70, handle: 'Bear1' }),
      ];
      const summary = createTestDebateSummary();

      const context = buildDebateContextForConsensus(messages, summary);

      expect(context.summary.totalMessages).toBe(3);
      expect(context.summary.sentimentDistribution.bullish).toBe(2);
      expect(context.summary.sentimentDistribution.bearish).toBe(1);
      expect(context.summary.dominantSentiment).toBe('bullish');
    });

    it('should identify most compelling arguments from each side', () => {
      const messages = [
        createTestMessage({ 
          sentiment: 'bullish', 
          confidence: 95, 
          handle: 'StrongBull',
          content: 'BTC holding $45k support with 300% volume spike'
        }),
        createTestMessage({ 
          sentiment: 'bullish', 
          confidence: 60, 
          handle: 'WeakBull',
          content: 'Looks good'
        }),
        createTestMessage({ 
          sentiment: 'bearish', 
          confidence: 90, 
          handle: 'StrongBear',
          content: 'RSI overbought at 80, expecting correction to $40k'
        }),
      ];
      const summary = createTestDebateSummary();

      const context = buildDebateContextForConsensus(messages, summary);

      expect(context.mostCompellingBullish).not.toBeNull();
      expect(context.mostCompellingBearish).not.toBeNull();
      expect(context.mostCompellingBullish?.handle).toBe('StrongBull');
      expect(context.mostCompellingBearish?.handle).toBe('StrongBear');
    });

    it('should identify points of agreement', () => {
      const messages = [
        createTestMessage({ 
          sentiment: 'bullish', 
          content: 'Volume is the key indicator here, up 200%'
        }),
        createTestMessage({ 
          sentiment: 'bearish', 
          content: 'While bearish, I agree volume is significant'
        }),
      ];
      const summary = createTestDebateSummary();

      const context = buildDebateContextForConsensus(messages, summary);

      expect(context.pointsOfAgreement.length).toBeGreaterThan(0);
    });

    it('should collect all data points referenced', () => {
      const messages = [
        createTestMessage({ content: 'BTC at $45k up 10%' }),
        createTestMessage({ content: 'Volume at $50B, RSI 65' }),
      ];
      const summary = createTestDebateSummary();

      const context = buildDebateContextForConsensus(messages, summary);

      expect(context.dataPointsReferenced.length).toBeGreaterThan(0);
    });

    it('should identify consensus influencers', () => {
      const messages = [
        createTestMessage({ handle: 'Influencer', confidence: 95, sentiment: 'bullish' }),
        createTestMessage({ handle: 'Regular', confidence: 60, sentiment: 'bullish' }),
      ];
      const summary = createTestDebateSummary();

      const context = buildDebateContextForConsensus(messages, summary);

      expect(context.consensusInfluencers.length).toBeGreaterThan(0);
      expect(context.consensusInfluencers[0]).toBe('Influencer');
    });
  });

  describe('formatDebateContextForPrompt', () => {
    it('should format context as readable text', () => {
      const context: DebateContextForConsensus = {
        summary: {
          totalMessages: 10,
          debateDuration: 300000,
          dominantSentiment: 'bullish',
          sentimentDistribution: { bullish: 6, bearish: 3, neutral: 1 },
        },
        keyArguments: {
          bullish: [{
            personaId: 'p1',
            handle: 'Bull1',
            content: 'Strong support at $45k',
            sentiment: 'bullish',
            confidence: 85,
            qualityScore: 80,
            dataPoints: ['$45k'],
            engagementScore: 20,
            isAcknowledgingOpposingView: false,
            timestamp: Date.now(),
          }],
          bearish: [],
          neutral: [],
        },
        pointsOfAgreement: ['Both sides acknowledge volume importance'],
        pointsOfDisagreement: ['Direction from current levels'],
        stanceChanges: [],
        mostCompellingBullish: null,
        mostCompellingBearish: null,
        dataPointsReferenced: ['$45k', '200% volume'],
        consensusInfluencers: ['Bull1'],
      };

      const formatted = formatDebateContextForPrompt(context);

      expect(formatted).toContain('DEBATE CONTEXT');
      expect(formatted).toContain('Bull1');
      expect(formatted).toContain('$45k');
      expect(formatted).toContain('bullish');
    });

    it('should handle empty context gracefully', () => {
      const context: DebateContextForConsensus = {
        summary: {
          totalMessages: 0,
          debateDuration: 0,
          dominantSentiment: 'neutral',
          sentimentDistribution: { bullish: 0, bearish: 0, neutral: 0 },
        },
        keyArguments: { bullish: [], bearish: [], neutral: [] },
        pointsOfAgreement: [],
        pointsOfDisagreement: [],
        stanceChanges: [],
        mostCompellingBullish: null,
        mostCompellingBearish: null,
        dataPointsReferenced: [],
        consensusInfluencers: [],
      };

      const formatted = formatDebateContextForPrompt(context);

      expect(formatted).toContain('DEBATE CONTEXT');
      expect(formatted).toContain('0 messages');
    });
  });

  describe('calculateConsensusInfluenceWeights', () => {
    it('should assign higher weights to personas with quality arguments', () => {
      const messages = [
        createTestMessage({ 
          personaId: 'high_quality', 
          handle: 'Expert',
          confidence: 95,
          content: 'Data-backed analysis with $45k support and 200% volume'
        }),
        createTestMessage({ 
          personaId: 'low_quality', 
          handle: 'Novice',
          confidence: 50,
          content: 'I think maybe'
        }),
      ];

      const weights = calculateConsensusInfluenceWeights(messages);

      const expertWeight = weights.get('high_quality');
      const noviceWeight = weights.get('low_quality');

      expect(expertWeight).toBeGreaterThan(noviceWeight || 0);
      expect(expertWeight).toBeGreaterThan(0.5);
    });

    it('should cap weights at 1.0', () => {
      const messages = [
        createTestMessage({ 
          confidence: 100,
          content: 'Perfect analysis with all data points $100k 100% $100B volume'
        }),
      ];

      const weights = calculateConsensusInfluenceWeights(messages);
      const weight = weights.values().next().value;

      expect(weight).toBeLessThanOrEqual(1.0);
    });

    it('should return empty map for no messages', () => {
      const weights = calculateConsensusInfluenceWeights([]);
      expect(weights.size).toBe(0);
    });
  });

  describe('applyInfluenceWeighting', () => {
    it('should increase consensus strength for high-quality arguments', () => {
      const messages = [
        createTestMessage({ 
          confidence: 95,
          content: 'Excellent data-backed argument'
        }),
        createTestMessage({ 
          confidence: 90,
          content: 'Another strong argument with $45k price level'
        }),
      ];

      const baseStrength = 70;
      const weighted = applyInfluenceWeighting(baseStrength, messages);

      expect(weighted).toBeGreaterThanOrEqual(baseStrength);
    });

    it('should decrease consensus strength for low-quality arguments', () => {
      const messages = [
        createTestMessage({ 
          confidence: 40,
          content: 'Weak argument'
        }),
        createTestMessage({ 
          confidence: 35,
          content: 'Another weak take'
        }),
      ];

      const baseStrength = 70;
      const weighted = applyInfluenceWeighting(baseStrength, messages);

      expect(weighted).toBeLessThanOrEqual(baseStrength);
    });

    it('should cap weighted strength at 100', () => {
      const messages = [
        createTestMessage({ confidence: 100, content: 'Perfect' }),
      ];

      const weighted = applyInfluenceWeighting(95, messages);

      expect(weighted).toBeLessThanOrEqual(100);
    });

    it('should return base strength for empty messages', () => {
      const baseStrength = 70;
      const weighted = applyInfluenceWeighting(baseStrength, []);

      expect(weighted).toBe(baseStrength);
    });
  });

  describe('buildConsensusPromptWithDebateContext', () => {
    it('should include debate context in prompt', () => {
      const context: DebateContextForConsensus = {
        summary: {
          totalMessages: 5,
          debateDuration: 180000,
          dominantSentiment: 'bullish',
          sentimentDistribution: { bullish: 3, bearish: 1, neutral: 1 },
        },
        keyArguments: {
          bullish: [{
            personaId: 'p1',
            handle: 'Bull1',
            content: 'Strong support',
            sentiment: 'bullish',
            confidence: 85,
            qualityScore: 80,
            dataPoints: ['$45k'],
            engagementScore: 20,
            isAcknowledgingOpposingView: false,
            timestamp: Date.now(),
          }],
          bearish: [],
          neutral: [],
        },
        pointsOfAgreement: [],
        pointsOfDisagreement: [],
        stanceChanges: [],
        mostCompellingBullish: null,
        mostCompellingBearish: null,
        dataPointsReferenced: [],
        consensusInfluencers: [],
      };

      const { systemPrompt, userPrompt } = buildConsensusPromptWithDebateContext(
        'TestPersona',
        'bullish',
        80,
        context,
        'Recent messages here'
      );

      expect(systemPrompt).toContain('DEBATE CONTEXT');
      expect(systemPrompt).toContain('Bull1');
      expect(systemPrompt).toContain('bullish');
      expect(systemPrompt).toContain('80%');
      expect(userPrompt).toContain('consensus');
    });

    it('should include sentiment tag instruction', () => {
      const context = buildDebateContextForConsensus(
        [createTestMessage()],
        createTestDebateSummary()
      );

      const { systemPrompt } = buildConsensusPromptWithDebateContext(
        'TestPersona',
        'bearish',
        75,
        context,
        ''
      );

      expect(systemPrompt).toContain('[SENTIMENT: bearish, CONFIDENCE: 75]');
    });
  });

  describe('integration scenarios', () => {
    it('should handle a full debate-to-consensus flow', () => {
      // Simulate a debate with multiple messages
      const debateMessages: ChatMessage[] = [
        createTestMessage({ 
          handle: 'ChartSurgeon', 
          sentiment: 'bullish', 
          confidence: 85,
          content: 'RSI at 65 with MACD flipping green. $45k support holding strong.'
        }),
        createTestMessage({ 
          handle: 'DoomerDave', 
          sentiment: 'bearish', 
          confidence: 70,
          content: 'Volume declining, this is a bear market rally. Expecting $40k test.'
        }),
        createTestMessage({ 
          handle: '0xViv', 
          sentiment: 'bullish', 
          confidence: 80,
          content: 'Exchange outflows up 200%, smart money accumulating. Bullish.'
        }),
        createTestMessage({ 
          handle: 'Moonvember', 
          sentiment: 'bullish', 
          confidence: 90,
          content: 'THIS is the dip you buy. ETF flows accelerating!'
        }),
      ];

      const summary = createTestDebateSummary({
        consensusDirection: 'bullish',
        consensusStrength: 78,
        messageCount: debateMessages.length,
      });

      // Extract arguments
      const scoredArgs = extractScoredArguments(debateMessages);
      expect(scoredArgs.length).toBe(4);

      // Build debate context
      const context = buildDebateContextForConsensus(debateMessages, summary);
      expect(context.summary.dominantSentiment).toBe('bullish');
      expect(context.keyArguments.bullish.length).toBeGreaterThan(0);
      expect(context.keyArguments.bearish.length).toBeGreaterThan(0);

      // Calculate influence weights
      const weights = calculateConsensusInfluenceWeights(debateMessages);
      expect(weights.size).toBeGreaterThan(0);

      // Apply influence weighting to consensus
      const baseStrength = 75;
      const weightedStrength = applyInfluenceWeighting(baseStrength, debateMessages);
      expect(weightedStrength).toBeGreaterThan(0);
      expect(weightedStrength).toBeLessThanOrEqual(100);

      // Format for prompt
      const formatted = formatDebateContextForPrompt(context);
      expect(formatted).toContain('ChartSurgeon');
      expect(formatted).toContain('DoomerDave');
    });

    it('should properly weight stance changes in argument quality', () => {
      const persuasionStates: Record<string, PersuasionState> = {
        'persuaded_persona': {
          personaId: 'persuaded_persona',
          currentStance: 'bullish',
          conviction: 'moderate',
          convictionScore: 60,
          stanceHistory: [
            { stance: 'bearish', conviction: 70, timestamp: Date.now() - 10000 },
            { stance: 'bullish', conviction: 60, timestamp: Date.now(), triggeredBy: 'persuasive_msg' },
          ],
          persuasionFactors: [],
          lastUpdated: Date.now(),
        },
      };

      const persuasiveMsg = createTestMessage({
        id: 'persuasive_msg',
        handle: 'Persuader',
        sentiment: 'bullish',
        confidence: 90,
        content: 'Strong data-driven argument that changed minds',
      });

      const quality = calculateArgumentQuality(
        persuasiveMsg, 
        [persuasiveMsg],
        persuasionStates
      );

      // Should get bonus for causing stance change
      expect(quality).toBeGreaterThan(70);
    });
  });
});