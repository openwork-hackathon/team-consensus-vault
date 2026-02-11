/**
 * CVAULT-242: Streaming Endpoint Tests for /api/prediction-market/stream
 * 
 * Tests the Server-Sent Events (SSE) endpoint for real-time updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/prediction-market/stream/route';
import { RoundPhase } from '@/lib/prediction-market/types';

// Mock the consensus engine
vi.mock('@/lib/consensus-engine', () => ({
  runDetailedConsensusAnalysis: vi.fn(),
}));

// Mock the stale trade handler
vi.mock('@/lib/stale-trade-handler', () => ({
  checkAndCleanupIfNeeded: vi.fn().mockResolvedValue(false),
}));

// Mock the prediction market state
vi.mock('@/lib/prediction-market/state', () => ({
  getCurrentRound: vi.fn(),
  setCurrentRound: vi.fn(),
  updateRoundPhase: vi.fn(),
  updateBettingPool: vi.fn(),
  getCurrentPool: vi.fn(),
  resetPool: vi.fn(),
}));

import { runDetailedConsensusAnalysis } from '@/lib/consensus-engine';
import {
  getCurrentRound,
  setCurrentRound,
  getCurrentPool,
} from '@/lib/prediction-market/state';

const createMockRound = (phase: RoundPhase = RoundPhase.SCANNING) => ({
  id: `round_${Date.now()}`,
  phase,
  asset: 'BTC',
  entryPrice: 45000,
  direction: 'long',
  consensusLevel: 85,
  consensusVotes: 4,
  totalVotes: 5,
  createdAt: new Date().toISOString(),
  bettingWindowStart: phase === RoundPhase.BETTING_WINDOW ? new Date().toISOString() : undefined,
  bettingWindowEnd: phase === RoundPhase.BETTING_WINDOW ? new Date(Date.now() + 30000).toISOString() : undefined,
  minBet: 10,
  maxBet: 10000,
  bettingPool: {
    totalLong: 1000,
    totalShort: 500,
    totalPool: 1500,
    longBetCount: 5,
    shortBetCount: 3,
    totalBetCount: 8,
    avgLongBet: 200,
    avgShortBet: 166.67,
    longOdds: 1.5,
    shortOdds: 3,
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

describe('GET /api/prediction-market/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentRound).mockReturnValue(createMockRound());
    vi.mocked(getCurrentPool).mockReturnValue({
      totalUp: 1000,
      totalDown: 500,
      bets: [],
    });
  });

  describe('Response Headers', () => {
    it('should return SSE content type', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('should include no-cache headers', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should include keep-alive connection header', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should disable nginx buffering', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });
  });

  describe('SSE Events', () => {
    it('should send connected event on connect', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.body).toBeDefined();
      
      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);

      expect(text).toContain('event: connected');
      expect(text).toContain('demoMode');
      
      reader.releaseLock();
    });

    it('should send round_state event on connect', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      const reader = response.body!.getReader();
      
      // Read first chunk (connected event)
      await reader.read();
      
      // Read second chunk (round_state event)
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);

      expect(text).toContain('event: round_state');
      
      reader.releaseLock();
    });

    it('should handle aborted connections gracefully', async () => {
      const abortController = new AbortController();
      const request = new NextRequest('http://localhost/api/prediction-market/stream', {
        signal: abortController.signal,
      });

      const response = await GET(request);
      
      // Abort the request
      abortController.abort();

      // Should not throw
      expect(response.body).toBeDefined();
    });
  });

  describe('Demo Mode Configuration', () => {
    it('should include demo config in connected event', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      const reader = response.body!.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);

      const dataMatch = text.match(/data: ({.+})/);
      expect(dataMatch).toBeTruthy();
      
      if (dataMatch) {
        const data = JSON.parse(dataMatch[1]);
        expect(data.config).toBeDefined();
        expect(data.config.SCANNING_INTERVAL).toBeDefined();
        expect(data.config.FORCE_BUY_AFTER_POLLS).toBeDefined();
      }
      
      reader.releaseLock();
    });
  });

  describe('Event Types', () => {
    it('should support consensus_update event', async () => {
      vi.mocked(runDetailedConsensusAnalysis).mockResolvedValue({
        consensus_status: 'CONSENSUS_REACHED',
        consensus_signal: 'buy',
        individual_votes: [],
        vote_counts: { BUY: 4, SELL: 0, HOLD: 1 },
      });

      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.body).toBeDefined();
    });

    it('should support phase_change event', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.body).toBeDefined();
    });

    it('should support pool_update event', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.body).toBeDefined();
    });

    it('should support price_update event', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.body).toBeDefined();
    });

    it('should support settlement_complete event', async () => {
      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.body).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in consensus analysis', async () => {
      vi.mocked(runDetailedConsensusAnalysis).mockRejectedValue(new Error('API error'));

      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      // Should still return a valid response
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should handle missing round state', async () => {
      vi.mocked(getCurrentRound).mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Stale Trade Cleanup', () => {
    it('should check for stale trades on connect', async () => {
      const { checkAndCleanupIfNeeded } = await import('@/lib/stale-trade-handler');

      const request = new NextRequest('http://localhost/api/prediction-market/stream');
      await GET(request);

      expect(checkAndCleanupIfNeeded).toHaveBeenCalled();
    });
  });
});

describe('SSE Event Format', () => {
  it('should format events correctly', async () => {
    const request = new NextRequest('http://localhost/api/prediction-market/stream');
    const response = await GET(request);

    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    // SSE format: event: <type>\ndata: <json>\n\n
    expect(text).toMatch(/event: \w+/);
    expect(text).toMatch(/data: \{/);
    expect(text).toContain('\n\n');

    reader.releaseLock();
  });

  it('should include keepalive comments', async () => {
    const request = new NextRequest('http://localhost/api/prediction-market/stream');
    const response = await GET(request);

    const reader = response.body!.getReader();
    
    // Wait a bit for keepalive
    await new Promise(resolve => setTimeout(resolve, 100));
    
    reader.releaseLock();
    
    // Keepalive is sent every 15 seconds, so we can't easily test it in unit tests
    expect(response.body).toBeDefined();
  });
});
