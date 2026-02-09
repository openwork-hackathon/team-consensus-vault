/**
 * Test suite for market data integration and persuasion logic
 * CVAULT-185: Verify personas use real market data and are persuadable
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  fetchMarketData,
  formatMarketDataForPrompt,
  getMarketTalkingPoints,
  getMarketMetrics,
  MarketData
} from '../market-data';
import {
  initializePersuasionState,
  calculatePersuasionImpact,
  applyPersuasion,
  updateStance,
  shouldAcknowledgeOpposingView,
  PersuasionStore,
} from '../persuasion';
import { ChatMessage, MessageSentiment } from '../types';
import { PERSONAS } from '../personas';

describe('Market Data Integration', () => {
  let marketData: MarketData;

  beforeAll(async () => {
    // Fetch real market data for testing
    try {
      marketData = await fetchMarketData('BTC');
    } catch (error) {
      console.warn('Market data fetch failed, using mock data');
      marketData = {
        price: 45000,
        priceChange24h: 500,
        priceChangePercentage24h: 1.12,
        volume24h: 25_000_000_000,
        volumeChange24h: 1_000_000_000,
        marketCap: 880_000_000_000,
        high24h: 46000,
        low24h: 44000,
        ath: 69000,
        athChangePercentage: -34.8,
        atl: 67,
        atlChangePercentage: 67000,
        circulatingSupply: 19_500_000,
        totalSupply: 21_000_000,
        maxSupply: 21_000_000,
        lastUpdated: new Date().toISOString(),
        volatility24h: 4.5,
        volumeToMarketCapRatio: 0.028,
      };
    }
  });

  it('should fetch market data with all required fields', () => {
    expect(marketData).toBeDefined();
    expect(marketData.price).toBeGreaterThan(0);
    expect(marketData.volume24h).toBeGreaterThan(0);
    expect(marketData.marketCap).toBeGreaterThan(0);
    expect(marketData.high24h).toBeGreaterThanOrEqual(marketData.low24h);
  });

  it('should format market data for prompts with specific numbers', () => {
    const formatted = formatMarketDataForPrompt(marketData, 'BTC');

    // Check that it contains specific numeric data
    expect(formatted).toMatch(/\$[\d,]+/); // Price with dollar sign
    expect(formatted).toMatch(/[\d.]+%/); // Percentage
    expect(formatted).toMatch(/24h/i); // Timeframe
    expect(formatted).toMatch(/volume/i); // Volume mentioned
    expect(formatted).toMatch(/market cap/i); // Market cap mentioned
  });

  it('should generate talking points with concrete data', () => {
    const talkingPoints = getMarketTalkingPoints(marketData);

    expect(talkingPoints.length).toBeGreaterThan(0);

    // Each talking point should contain specific data
    talkingPoints.forEach(point => {
      const hasNumbers = /\d+/.test(point);
      expect(hasNumbers).toBe(true);
    });
  });

  it('should classify market metrics correctly', () => {
    const metrics = getMarketMetrics(marketData);

    expect(metrics.priceAction).toBeDefined();
    expect(['strong_up', 'up', 'neutral', 'down', 'strong_down']).toContain(metrics.priceAction);

    expect(metrics.volumeProfile).toBeDefined();
    expect(['high', 'normal', 'low']).toContain(metrics.volumeProfile);

    expect(metrics.volatility).toBeDefined();
    expect(['high', 'normal', 'low']).toContain(metrics.volatility);

    expect(metrics.marketCapTier).toBeDefined();
    expect(['large', 'mid', 'small']).toContain(metrics.marketCapTier);
  });

  it('should include data in prompt that personas can cite', () => {
    const formatted = formatMarketDataForPrompt(marketData, 'BTC');

    // Verify the prompt includes specific data points personas should reference
    expect(formatted).toContain('$');
    expect(formatted).toContain('%');
    expect(formatted).toContain('Volume');
    expect(formatted).toContain('Market Cap');
    expect(formatted).toContain('ATH');
  });
});

describe('Persuasion System', () => {
  const createTestMessage = (
    personaId: string,
    sentiment: MessageSentiment,
    content: string,
    confidence: number = 70
  ): ChatMessage => ({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    personaId,
    handle: PERSONAS.find(p => p.id === personaId)?.handle || 'Unknown',
    avatar: '🧪',
    content,
    sentiment,
    confidence,
    timestamp: Date.now(),
    phase: 'DEBATE',
  });

  it('should initialize persuasion state with default values', () => {
    const state = initializePersuasionState('test_persona', 'neutral', 50);

    expect(state.personaId).toBe('test_persona');
    expect(state.currentStance).toBe('neutral');
    expect(state.convictionScore).toBe(50);
    expect(state.conviction).toBe('moderate');
    expect(state.stanceHistory).toHaveLength(1);
  });

  it('should calculate persuasion impact from data-backed messages', () => {
    const recipientState = initializePersuasionState('nxbl', 'bearish', 60);

    // Message with specific data and timeframe
    const message = createTestMessage(
      'chartsurgeon',
      'bullish',
      'BTC just broke 45k with $28B volume in 24h, RSI at 65 showing momentum',
      80
    );

    const impact = calculatePersuasionImpact(message, recipientState, [message]);

    expect(impact).toBeDefined();
    expect(impact!.impact).toBeGreaterThan(0);
    expect(impact!.type).toBe('data_quality');
  });

  it('should not calculate impact from same-stance messages', () => {
    const recipientState = initializePersuasionState('nxbl', 'bullish', 60);

    const message = createTestMessage(
      'chartsurgeon',
      'bullish', // Same stance
      'Agreed, bullish setup',
      70
    );

    const impact = calculatePersuasionImpact(message, recipientState, [message]);

    expect(impact).toBeNull();
  });

  it('should reward high-confidence speakers with more persuasion impact', () => {
    const recipientState = initializePersuasionState('nxbl', 'bearish', 50);

    const lowConfidenceMsg = createTestMessage(
      'chartsurgeon',
      'bullish',
      'BTC volume at $25B',
      50
    );

    const highConfidenceMsg = createTestMessage(
      'chartsurgeon',
      'bullish',
      'BTC volume at $25B',
      90
    );

    const lowImpact = calculatePersuasionImpact(lowConfidenceMsg, recipientState, [lowConfidenceMsg]);
    const highImpact = calculatePersuasionImpact(highConfidenceMsg, recipientState, [highConfidenceMsg]);

    expect(highImpact!.impact).toBeGreaterThan(lowImpact!.impact);
  });

  it('should apply persuasion and reduce conviction', () => {
    const state = initializePersuasionState('nxbl', 'bearish', 70);

    const impact = {
      type: 'data_quality' as const,
      sourcePersonaId: 'chartsurgeon',
      messageId: 'msg_123',
      impact: 8,
      timestamp: Date.now(),
      description: 'Strong data-backed argument',
    };

    const newState = applyPersuasion(state, impact);

    expect(newState.convictionScore).toBeLessThan(state.convictionScore);
    expect(newState.persuasionFactors).toHaveLength(1);
  });

  it('should update stance when conviction drops too low', () => {
    const state = initializePersuasionState('nxbl', 'bearish', 25);

    const newState = updateStance(state, 'bullish', 'Persuaded by data', 'msg_123');

    expect(newState.currentStance).toBe('bullish');
    expect(newState.stanceHistory).toHaveLength(2);
    expect(newState.stanceHistory[1].stance).toBe('bullish');
  });

  it('should acknowledge opposing views when conviction is weak', () => {
    const state = initializePersuasionState('nxbl', 'bearish', 30); // Weak conviction

    const opposingMessage = createTestMessage(
      'chartsurgeon',
      'bullish',
      'BTC volume spiked 400% with $50B in 24h, clear accumulation',
      85
    );

    // Should have high chance of acknowledging with strong data
    let acknowledged = false;
    for (let i = 0; i < 10; i++) {
      if (shouldAcknowledgeOpposingView(state, opposingMessage)) {
        acknowledged = true;
        break;
      }
    }

    expect(acknowledged).toBe(true);
  });

  it('should NOT acknowledge opposing views when conviction is strong', () => {
    const state = initializePersuasionState('nxbl', 'bearish', 85); // Strong conviction

    const opposingMessage = createTestMessage(
      'chartsurgeon',
      'bullish',
      'BTC looking good',
      60
    );

    const shouldAck = shouldAcknowledgeOpposingView(state, opposingMessage);

    expect(shouldAck).toBe(false);
  });
});

describe('Persuasion Store', () => {
  it('should track persuasion states for multiple personas', () => {
    const store = new PersuasionStore('test_debate');

    store.initializePersona('nxbl', 'neutral');
    store.initializePersona('chartsurgeon', 'bullish');
    store.initializePersona('doomer_dave', 'bearish');

    const states = store.getAllStates();

    expect(Object.keys(states)).toHaveLength(3);
    expect(states['nxbl'].currentStance).toBe('neutral');
    expect(states['chartsurgeon'].currentStance).toBe('bullish');
    expect(states['doomer_dave'].currentStance).toBe('bearish');
  });

  it('should process messages and update all relevant states', () => {
    const store = new PersuasionStore('test_debate');

    store.initializePersona('nxbl', 'neutral');
    store.initializePersona('chartsurgeon', 'neutral');

    const message: ChatMessage = {
      id: 'msg_123',
      personaId: 'nxbl',
      handle: 'nxbl',
      avatar: '🔮',
      content: 'BTC breaking 45k. volume at $30B. watching resistance.',
      sentiment: 'bullish',
      confidence: 75,
      timestamp: Date.now(),
      phase: 'DEBATE',
    };

    store.processMessage(message, [message]);

    const states = store.getAllStates();

    // Sender should have reinforced stance
    expect(states['nxbl'].convictionScore).toBeGreaterThan(50);
  });

  it('should track debate statistics', () => {
    const store = new PersuasionStore('test_debate');

    store.initializePersona('nxbl', 'neutral');
    store.initializePersona('chartsurgeon', 'bullish');

    // Change stance for nxbl
    const state = store.getState('nxbl')!;
    const updatedState = updateStance(state, 'bullish', 'Persuaded');
    store.updateState('nxbl', updatedState);

    const stats = store.getDebateStats();

    expect(stats.totalStanceChanges).toBeGreaterThan(0);
    expect(stats.averageConviction).toBeGreaterThan(0);
    expect(stats.mostPersuadable).toBeDefined();
    expect(stats.mostStubborn).toBeDefined();
  });
});

describe('Persona Stubbornness Thresholds', () => {
  it('should have stubbornness values for all personas', () => {
    PERSONAS.forEach(persona => {
      expect(persona.stubbornness).toBeDefined();
      expect(persona.stubbornness).toBeGreaterThanOrEqual(0);
      expect(persona.stubbornness).toBeLessThanOrEqual(100);
    });
  });

  it('should have conviction thresholds for all personas', () => {
    PERSONAS.forEach(persona => {
      expect(persona.conviction_threshold).toBeDefined();
      expect(persona.conviction_threshold).toBeGreaterThanOrEqual(0);
      expect(persona.conviction_threshold).toBeLessThanOrEqual(100);
    });
  });

  it('should have SatsStacker as very stubborn (hard to persuade)', () => {
    const satsStacker = PERSONAS.find(p => p.id === 'sats_stacker');

    expect(satsStacker).toBeDefined();
    expect(satsStacker!.stubbornness).toBeGreaterThan(80);
    expect(satsStacker!.conviction_threshold).toBeGreaterThan(80);
  });

  it('should have the_intern as easily persuadable', () => {
    const intern = PERSONAS.find(p => p.id === 'the_intern');

    expect(intern).toBeDefined();
    expect(intern!.stubbornness).toBeLessThan(30);
    expect(intern!.conviction_threshold).toBeLessThan(50);
  });

  it('should have DoomerDave as stubborn bear', () => {
    const doomer = PERSONAS.find(p => p.id === 'doomer_dave');

    expect(doomer).toBeDefined();
    expect(doomer!.stubbornness).toBeGreaterThan(80);
  });
});

describe('Integration Test: Market Data in Persuasion', () => {
  it('should increase persuasion impact when message contains market data', () => {
    const recipientState = initializePersuasionState('nxbl', 'bearish', 60);

    // Message without specific data
    const vagueMessage: ChatMessage = {
      id: 'msg_1',
      personaId: 'chartsurgeon',
      handle: 'ChartSurgeon',
      avatar: '🔪',
      content: 'I think Bitcoin is going up soon',
      sentiment: 'bullish',
      confidence: 70,
      timestamp: Date.now(),
      phase: 'DEBATE',
    };

    // Message with specific market data
    const dataMessage: ChatMessage = {
      id: 'msg_2',
      personaId: 'chartsurgeon',
      handle: 'ChartSurgeon',
      avatar: '🔪',
      content: 'BTC up 5.2% in 24h, volume spiked to $35B, RSI at 67 on 4h chart',
      sentiment: 'bullish',
      confidence: 70,
      timestamp: Date.now(),
      phase: 'DEBATE',
    };

    const vagueImpact = calculatePersuasionImpact(vagueMessage, recipientState, [vagueMessage]);
    const dataImpact = calculatePersuasionImpact(dataMessage, recipientState, [dataMessage]);

    // Data-backed message should have higher impact
    expect(dataImpact!.impact).toBeGreaterThan(vagueImpact?.impact || 0);
  });
});
