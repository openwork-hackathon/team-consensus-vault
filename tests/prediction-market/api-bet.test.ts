/**
 * CVAULT-242: API Endpoint Tests for /api/prediction-market/bet
 * 
 * Tests the POST and GET endpoints for bet placement and pool state retrieval.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/prediction-market/bet/route';
import { RoundPhase } from '@/lib/prediction-market/types';
import {
  setCurrentRound,
  resetPool,
} from '@/lib/prediction-market/state';

// Mock the prediction market state module
vi.mock('@/lib/prediction-market/state', async () => {
  const actual = await vi.importActual('@/lib/prediction-market/state');
  return {
    ...actual,
    getCurrentRound: vi.fn(),
    getCurrentPool: vi.fn(),
    getCurrentOdds: vi.fn(),
    placeBet: vi.fn(),
    validateBet: vi.fn(),
  };
});

// Mock the cache module
vi.mock('@/lib/cache', () => ({
  getNoCacheHeaders: () => ({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }),
  getCacheHeaders: (ttl: number) => ({
    'Cache-Control': `max-age=${ttl}`,
  }),
  CACHE_TTL: {
    TRADING_HISTORY: 5,
  },
  logCacheEvent: vi.fn(),
  withEdgeCache: (fn: Function) => fn,
}));

import {
  getCurrentRound,
  getCurrentPool,
  getCurrentOdds,
  placeBet,
  validateBet,
} from '@/lib/prediction-market/state';

const createMockRound = (phase: RoundPhase = RoundPhase.BETTING_WINDOW) => ({
  id: `round_${Date.now()}`,
  phase,
  asset: 'BTC',
  entryPrice: 45000,
  direction: 'long',
  consensusLevel: 85,
  consensusVotes: 4,
  totalVotes: 5,
  createdAt: new Date().toISOString(),
  bettingWindowStart: new Date().toISOString(),
  bettingWindowEnd: new Date(Date.now() + 30000).toISOString(),
  minBet: 10,
  maxBet: 10000,
  bettingPool: {
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
  },
  consensusSnapshot: {
    id: `snapshot_${Date.now()}`,
    timestamp: new Date().toISOString(),
    asset: 'BTC',
    signal: 'buy' as const,
    consensusLevel: 85,
    agreementCount: 4,
    totalAgents: 5,
    votes: [],
    rationale: 'Strong bullish consensus',
    averageConfidence: 85,
    threshold: 75,
    forced: false,
  },
});

describe('POST /api/prediction-market/bet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPool?.();
  });

  describe('Request Validation', () => {
    it('should reject request with missing fields', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject request with missing address', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({ amount: 100, side: 'up' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject request with missing amount', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({ address: '0x1234567890123456789012345678901234567890', side: 'up' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject request with missing side', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({ address: '0x1234567890123456789012345678901234567890', amount: 100 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Address Validation', () => {
    it('should reject invalid address format', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: 'invalid-address',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid Ethereum address');
    });

    it('should reject address without 0x prefix', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should reject address with wrong length', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x123456',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should accept valid Ethereum address', async () => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
      vi.mocked(validateBet).mockReturnValue({ isValid: true });
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 0,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1, down: 0 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Amount Validation', () => {
    beforeEach(() => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
    });

    it('should reject zero amount', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 0,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('positive number');
    });

    it('should reject negative amount', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: -100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject non-numeric amount', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 'abc',
          side: 'up',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Side Validation', () => {
    beforeEach(() => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
    });

    it('should reject invalid side', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'invalid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('up" or "down');
    });

    it('should accept "up" side', async () => {
      vi.mocked(validateBet).mockReturnValue({ isValid: true });
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 0,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1, down: 0 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should accept "down" side', async () => {
      vi.mocked(validateBet).mockReturnValue({ isValid: true });
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'short',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 0,
        totalDown: 100,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 0, down: 1 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'down',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Round State Validation', () => {
    it('should reject bet when no active round', async () => {
      vi.mocked(getCurrentRound).mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('No active prediction round');
    });

    it('should reject bet when not in betting phase', async () => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound(RoundPhase.SCANNING));

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Betting window is not open');
    });

    it('should reject bet when betting window has expired', async () => {
      const expiredRound = createMockRound(RoundPhase.BETTING_WINDOW);
      expiredRound.bettingWindowEnd = new Date(Date.now() - 1000).toISOString();
      vi.mocked(getCurrentRound).mockReturnValue(expiredRound);

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Betting window has closed');
    });
  });

  describe('Business Rule Validation', () => {
    beforeEach(() => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
    });

    it('should reject bet that fails business validation', async () => {
      vi.mocked(validateBet).mockReturnValue({
        isValid: false,
        error: 'You have already placed a bet in this round',
      });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already placed a bet');
    });
  });

  describe('Successful Bet Placement', () => {
    beforeEach(() => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
      vi.mocked(validateBet).mockReturnValue({ isValid: true });
    });

    it('should return success response with bet details', async () => {
      const mockBet = {
        id: 'bet_123456',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      };
      vi.mocked(placeBet).mockReturnValue(mockBet);
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 0,
        bets: [mockBet],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1, down: 0 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bet).toBeDefined();
      expect(data.bet.id).toBe('bet_123456');
      expect(data.bet.amount).toBe(100);
      expect(data.bet.side).toBe('up');
    });

    it('should include pool state in response', async () => {
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 50,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1.5, down: 3 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.pool).toBeDefined();
      expect(data.pool.totalUp).toBe(100);
      expect(data.pool.totalDown).toBe(50);
    });

    it('should include odds in response', async () => {
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 0,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1.5, down: 0 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.odds).toBeDefined();
      expect(data.odds.up).toBe(1.5);
    });

    it('should include potential payout calculation', async () => {
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 100,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 2, down: 2 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.potentialPayout).toBeDefined();
      expect(data.potentialPayout.gross).toBeDefined();
      expect(data.potentialPayout.net).toBeDefined();
      expect(data.potentialPayout.profit).toBeDefined();
    });

    it('should include response time in response', async () => {
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 0,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1, down: 0 });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.responseTimeMs).toBeDefined();
      expect(typeof data.responseTimeMs).toBe('number');
      expect(data.responseTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Response Headers', () => {
    beforeEach(() => {
      vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
      vi.mocked(validateBet).mockReturnValue({ isValid: true });
      vi.mocked(placeBet).mockReturnValue({
        id: 'bet_123',
        roundId: 'round_123',
        userAddress: '0x1234567890123456789012345678901234567890',
        amount: 100,
        direction: 'long',
        timestamp: new Date().toISOString(),
        status: 'confirmed',
      });
      vi.mocked(getCurrentPool).mockReturnValue({
        totalUp: 100,
        totalDown: 0,
        bets: [],
      });
      vi.mocked(getCurrentOdds).mockReturnValue({ up: 1, down: 0 });
    });

    it('should include no-cache headers for POST', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
      expect(response.headers.get('X-Cache-Status')).toBe('BYPASS');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(getCurrentRound).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to place bet');
      expect(data.details).toBe('Database connection failed');
    });
  });
});

describe('GET /api/prediction-market/bet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current pool state', async () => {
    vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
    vi.mocked(getCurrentPool).mockReturnValue({
      totalUp: 1000,
      totalDown: 500,
      bets: [],
    });
    vi.mocked(getCurrentOdds).mockReturnValue({ up: 1.5, down: 3 });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.round).toBeDefined();
    expect(data.pool).toBeDefined();
    expect(data.odds).toBeDefined();
    expect(data.canBet).toBe(true);
  });

  it('should indicate when betting is not allowed', async () => {
    vi.mocked(getCurrentRound).mockReturnValue(createMockRound(RoundPhase.SCANNING));
    vi.mocked(getCurrentPool).mockReturnValue({
      totalUp: 0,
      totalDown: 0,
      bets: [],
    });
    vi.mocked(getCurrentOdds).mockReturnValue({ up: 0, down: 0 });

    const response = await GET();
    const data = await response.json();

    expect(data.canBet).toBe(false);
  });

  it('should return null round when no active round', async () => {
    vi.mocked(getCurrentRound).mockReturnValue(null);
    vi.mocked(getCurrentPool).mockReturnValue({
      totalUp: 0,
      totalDown: 0,
      bets: [],
    });
    vi.mocked(getCurrentOdds).mockReturnValue({ up: 0, down: 0 });

    const response = await GET();
    const data = await response.json();

    expect(data.round).toBeNull();
    expect(data.canBet).toBe(false);
  });

  it('should include response time', async () => {
    vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
    vi.mocked(getCurrentPool).mockReturnValue({
      totalUp: 0,
      totalDown: 0,
      bets: [],
    });
    vi.mocked(getCurrentOdds).mockReturnValue({ up: 0, down: 0 });

    const response = await GET();
    const data = await response.json();

    expect(data.responseTimeMs).toBeDefined();
    expect(typeof data.responseTimeMs).toBe('number');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getCurrentRound).mockImplementation(() => {
      throw new Error('State error');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});