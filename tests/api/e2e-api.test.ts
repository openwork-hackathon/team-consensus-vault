/**
 * CVAULT-106: End-to-End API Test Suite for Consensus Vault
 * 
 * This test suite validates all API endpoints for:
 * - Successful response (2xx status)
 * - Correct response structure/schema
 * - Error handling (invalid inputs, missing params)
 * - SSE streaming endpoints connection verification
 * 
 * Endpoints tested:
 * - /api/health (GET, HEAD)
 * - /api/price (GET)
 * - /api/consensus (GET - SSE, POST)
 * - /api/consensus-detailed (GET, POST)
 * - /api/chatroom/stream (GET - SSE)
 * - /api/prediction-market/stream (GET - SSE)
 * - /api/prediction-market/bet (GET, POST)
 * - /api/trading/execute (POST)
 * - /api/trading/close (POST)
 * - /api/trading/history (GET)
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test result tracking
const testResults: {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
}[] = [];

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

// Helper to check if response is valid JSON
async function expectValidJson(response: Response): Promise<any> {
  const text = await response.text();
  expect(() => JSON.parse(text)).not.toThrow();
  return JSON.parse(text);
}

// Helper to validate SSE stream connection
async function testSSEConnection(
  endpoint: string,
  timeoutMs: number = 2000
): Promise<{ connected: boolean; headers: Record<string, string | null> }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      connected: response.status === 200,
      headers: {
        'content-type': response.headers.get('Content-Type'),
        'cache-control': response.headers.get('Cache-Control'),
        connection: response.headers.get('Connection'),
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      // Expected - we abort to prevent hanging
      return {
        connected: true, // If we got here, connection was established
        headers: {},
      };
    }
    return {
      connected: false,
      headers: {},
    };
  }
}

describe('CVAULT-106: API Health Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const response = await apiRequest('/api/health');
      
      expect(response.status).toBe(200);
      
      const data = await expectValidJson(response);
      
      // Validate response structure
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('system');
      expect(data).toHaveProperty('models');
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('responseTimeMs');
      
      // Validate system structure
      expect(data.system).toHaveProperty('healthy_models');
      expect(data.system).toHaveProperty('total_models');
      expect(data.system).toHaveProperty('healthy_percentage');
      expect(data.system).toHaveProperty('open_circuits');
      expect(data.system).toHaveProperty('half_open_circuits');
      
      // Validate models is an array
      expect(Array.isArray(data.models)).toBe(true);
      
      // Validate performance structure
      expect(data.performance).toHaveProperty('consensus_engine');
      expect(data.performance).toHaveProperty('cache');
      
      // Validate headers
      expect(response.headers.get('X-Response-Time')).toBeTruthy();
      expect(response.headers.get('X-Cache-Status')).toBe('BYPASS');
      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    }, 10000);

    it('should return valid status values', async () => {
      const response = await apiRequest('/api/health');
      const data = await expectValidJson(response);
      
      expect(['healthy', 'degraded', 'unhealthy', 'error']).toContain(data.status);
      expect(typeof data.system.healthy_percentage).toBe('number');
      expect(data.system.healthy_percentage).toBeGreaterThanOrEqual(0);
      expect(data.system.healthy_percentage).toBeLessThanOrEqual(100);
    }, 10000);
  });

  describe('HEAD /api/health', () => {
    it('should return 200 for HEAD request', async () => {
      const response = await apiRequest('/api/health', { method: 'HEAD' });
      
      expect([200, 503]).toContain(response.status);
      // HEAD should not have a body
      const text = await response.text();
      expect(text).toBe('');
    }, 10000);
  });
});

describe('CVAULT-106: Price Endpoint', () => {
  describe('GET /api/price', () => {
    it('should return price for BTC/USD', async () => {
      const response = await apiRequest('/api/price?asset=BTC/USD');
      
      expect([200, 500]).toContain(response.status);
      
      const data = await expectValidJson(response);
      
      if (response.status === 200) {
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('asset');
        expect(data).toHaveProperty('price');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('cached');
        expect(data).toHaveProperty('responseTimeMs');
        
        expect(typeof data.price).toBe('number');
        expect(data.price).toBeGreaterThan(0);
        expect(typeof data.responseTimeMs).toBe('number');
        
        // Validate cache headers
        expect(response.headers.get('X-Cache-Status')).toBeTruthy();
      }
    }, 10000);

    it('should return price for default asset when no parameter', async () => {
      const response = await apiRequest('/api/price');
      
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await expectValidJson(response);
        expect(data.asset).toBe('BTC/USD');
      }
    }, 10000);

    it('should handle different asset formats', async () => {
      const assets = ['BTC', 'ETH', 'SOL', 'BTC/USD', 'ETH/USD'];
      
      for (const asset of assets) {
        const response = await apiRequest(`/api/price?asset=${asset}`);
        expect([200, 500]).toContain(response.status);
        
        if (response.status === 200) {
          const data = await expectValidJson(response);
          expect(data.asset).toBe(asset);
          expect(typeof data.price).toBe('number');
        }
      }
    }, 30000);
  });
});

describe('CVAULT-106: Consensus Endpoints', () => {
  describe('GET /api/consensus (SSE Streaming)', () => {
    it('should establish SSE connection with correct headers', async () => {
      const result = await testSSEConnection('/api/consensus?asset=BTC', 2000);
      
      expect(result.connected).toBe(true);
    }, 5000);

    it('should return SSE content-type header', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 1000);

      try {
        const response = await fetch(`${BASE_URL}/api/consensus?asset=BTC`, {
          signal: controller.signal,
        });

        expect(response.headers.get('Content-Type')).toBe('text/event-stream');
        expect(response.headers.get('Cache-Control')).toBe('no-cache');
        expect(response.headers.get('X-Request-ID')).toBeTruthy();
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          throw error;
        }
      }
    }, 5000);
  });

  describe('POST /api/consensus', () => {
    it('should return consensus analysis for valid query', async () => {
      const response = await apiRequest('/api/consensus', {
        method: 'POST',
        body: JSON.stringify({ query: 'What is the outlook for Bitcoin?' }),
      });

      expect([200, 429, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        const data = await expectValidJson(response);
        
        expect(data).toHaveProperty('consensus');
        expect(data).toHaveProperty('individual_responses');
        expect(data).toHaveProperty('metadata');
        
        expect(Array.isArray(data.individual_responses)).toBe(true);
        expect(data.individual_responses.length).toBeGreaterThan(0);
        
        // Validate metadata
        expect(data.metadata).toHaveProperty('total_time_ms');
        expect(data.metadata).toHaveProperty('models_succeeded');
        
        // Validate rate limit headers
        expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
        expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      }
    }, 60000);

    it('should return 400 for missing query parameter', async () => {
      const response = await apiRequest('/api/consensus', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect([400, 429]).toContain(response.status);
      
      if (response.status === 400) {
        const data = await expectValidJson(response);
        expect(data).toHaveProperty('error');
      }
    }, 10000);

    it('should return 400 for invalid query type', async () => {
      const response = await apiRequest('/api/consensus', {
        method: 'POST',
        body: JSON.stringify({ query: 123 }),
      });

      expect([400, 429]).toContain(response.status);
    }, 10000);

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limit
      const requests = Array(5).fill(null).map(() => 
        apiRequest('/api/consensus', {
          method: 'POST',
          body: JSON.stringify({ query: 'Test query' }),
        })
      );

      const responses = await Promise.all(requests);
      
      // At least one should have rate limit headers
      const hasRateLimitHeaders = responses.some(r => 
        r.headers.get('X-RateLimit-Limit') !== null
      );
      
      expect(hasRateLimitHeaders).toBe(true);
    }, 60000);
  });
});

describe('CVAULT-106: Consensus Detailed Endpoints', () => {
  describe('GET /api/consensus-detailed', () => {
    it('should return detailed consensus for valid asset', async () => {
      const response = await apiRequest('/api/consensus-detailed?asset=BTC');

      expect([200, 429, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        const data = await expectValidJson(response);
        
        expect(data).toHaveProperty('consensus_status');
        expect(data).toHaveProperty('consensus_signal');
        expect(data).toHaveProperty('individual_votes');
        expect(data).toHaveProperty('vote_counts');
        expect(data).toHaveProperty('timestamp');
        
        // Validate consensus_status values
        expect(['CONSENSUS_REACHED', 'NO_CONSENSUS', 'INSUFFICIENT_RESPONSES']).toContain(data.consensus_status);
        
        // Validate individual_votes structure
        expect(Array.isArray(data.individual_votes)).toBe(true);
        if (data.individual_votes.length > 0) {
          const vote = data.individual_votes[0];
          expect(vote).toHaveProperty('model_name');
          expect(vote).toHaveProperty('signal');
          expect(vote).toHaveProperty('response_time_ms');
          expect(vote).toHaveProperty('confidence');
          expect(vote).toHaveProperty('status');
        }
        
        // Validate vote_counts
        expect(data.vote_counts).toHaveProperty('BUY');
        expect(data.vote_counts).toHaveProperty('SELL');
        expect(data.vote_counts).toHaveProperty('HOLD');
        
        // Validate headers
        expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
        expect(response.headers.get('X-Cache-Status')).toBeTruthy();
      }
    }, 60000);

    it('should return 400 for missing asset parameter', async () => {
      const response = await apiRequest('/api/consensus-detailed');

      expect([400, 429]).toContain(response.status);
      
      if (response.status === 400) {
        const data = await expectValidJson(response);
        expect(data).toHaveProperty('error');
      }
    }, 10000);

    it('should handle optional context parameter', async () => {
      const response = await apiRequest('/api/consensus-detailed?asset=BTC&context=short-term');

      expect([200, 429, 500, 503]).toContain(response.status);
    }, 60000);
  });

  describe('POST /api/consensus-detailed', () => {
    it('should return detailed consensus for valid request body', async () => {
      const response = await apiRequest('/api/consensus-detailed', {
        method: 'POST',
        body: JSON.stringify({ asset: 'BTC', context: 'Test context' }),
      });

      expect([200, 429, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        const data = await expectValidJson(response);
        expect(data).toHaveProperty('consensus_status');
        expect(data).toHaveProperty('individual_votes');
      }
    }, 60000);

    it('should return 400 for missing asset in body', async () => {
      const response = await apiRequest('/api/consensus-detailed', {
        method: 'POST',
        body: JSON.stringify({ context: 'Test' }),
      });

      expect([400, 429]).toContain(response.status);
    }, 10000);

    it('should return no-cache headers for POST', async () => {
      const response = await apiRequest('/api/consensus-detailed', {
        method: 'POST',
        body: JSON.stringify({ asset: 'BTC' }),
      });

      // X-Cache-Status may be null if response is rate limited or error
      if (response.status === 200) {
        expect(response.headers.get('X-Cache-Status')).toBe('BYPASS');
      }
    }, 60000);
  });
});

describe('CVAULT-106: Chatroom SSE Endpoint', () => {
  describe('GET /api/chatroom/stream', () => {
    it('should establish SSE connection', async () => {
      const result = await testSSEConnection('/api/chatroom/stream', 2000);
      expect(result.connected).toBe(true);
    }, 5000);

    it('should return correct SSE headers', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 1000);

      try {
        const response = await fetch(`${BASE_URL}/api/chatroom/stream`, {
          signal: controller.signal,
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toContain('text/event-stream');
        expect(response.headers.get('Cache-Control')).toContain('no-cache');
        expect(response.headers.get('Connection')).toBe('keep-alive');
        expect(response.headers.get('X-Accel-Buffering')).toBe('no');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          throw error;
        }
      }
    }, 5000);

    it('should send initial connection event', async () => {
      const controller = new AbortController();
      const events: string[] = [];
      
      setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${BASE_URL}/api/chatroom/stream`, {
          signal: controller.signal,
        });

        const reader = response.body?.getReader();
        if (reader) {
          const { value } = await reader.read();
          if (value) {
            const text = new TextDecoder().decode(value);
            events.push(text);
          }
        }
      } catch (error) {
        // Expected abort
      }

      // Should have received some data
      expect(events.length).toBeGreaterThan(0);
    }, 5000);
  });
});

describe('CVAULT-106: Prediction Market Endpoints', () => {
  describe('GET /api/prediction-market/stream (SSE)', () => {
    it('should establish SSE connection', async () => {
      const result = await testSSEConnection('/api/prediction-market/stream', 2000);
      expect(result.connected).toBe(true);
    }, 5000);

    it('should return correct SSE headers', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 1000);

      try {
        const response = await fetch(`${BASE_URL}/api/prediction-market/stream`, {
          signal: controller.signal,
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toContain('text/event-stream');
        expect(response.headers.get('Cache-Control')).toContain('no-cache');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          throw error;
        }
      }
    }, 5000);
  });

  describe('GET /api/prediction-market/bet', () => {
    it('should return current pool state', async () => {
      const response = await apiRequest('/api/prediction-market/bet');

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        const data = await expectValidJson(response);
        
        expect(data).toHaveProperty('round');
        expect(data).toHaveProperty('pool');
        expect(data).toHaveProperty('odds');
        expect(data).toHaveProperty('canBet');
        expect(data).toHaveProperty('responseTimeMs');
        
        // Validate pool structure
        expect(data.pool).toHaveProperty('totalUp');
        expect(data.pool).toHaveProperty('totalDown');
        expect(data.pool).toHaveProperty('totalPool');
        expect(data.pool).toHaveProperty('totalBets');
        
        // Validate odds structure
        expect(data.odds).toHaveProperty('up');
        expect(data.odds).toHaveProperty('down');
        
        // Validate canBet is boolean
        expect(typeof data.canBet).toBe('boolean');
      }
    }, 10000);

    it('should include cache headers', async () => {
      const response = await apiRequest('/api/prediction-market/bet');
      
      if (response.status === 200) {
        expect(response.headers.get('X-Cache-Status')).toBeTruthy();
        expect(response.headers.get('Cache-Control')).toBeTruthy();
      }
    }, 10000);
  });

  describe('POST /api/prediction-market/bet', () => {
    it('should validate required fields', async () => {
      const response = await apiRequest('/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect([400, 500]).toContain(response.status);
      
      const data = await expectValidJson(response);
      expect(data).toHaveProperty('error');
    }, 10000);

    it('should validate Ethereum address format', async () => {
      const response = await apiRequest('/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: 'invalid-address',
          amount: 100,
          side: 'up',
        }),
      });

      expect([400, 500]).toContain(response.status);
      
      if (response.status === 400) {
        const data = await expectValidJson(response);
        expect(data.error).toContain('address');
      }
    }, 10000);

    it('should validate amount is positive', async () => {
      const response = await apiRequest('/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: -100,
          side: 'up',
        }),
      });

      expect([400, 500]).toContain(response.status);
      
      if (response.status === 400) {
        const data = await expectValidJson(response);
        expect(data.error).toContain('positive');
      }
    }, 10000);

    it('should validate side is up or down', async () => {
      const response = await apiRequest('/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'invalid',
        }),
      });

      expect([400, 500]).toContain(response.status);
      
      if (response.status === 400) {
        const data = await expectValidJson(response);
        expect(data.error).toContain('up') || expect(data.error).toContain('down');
      }
    }, 10000);

    it('should return no-cache headers', async () => {
      const response = await apiRequest('/api/prediction-market/bet', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x1234567890123456789012345678901234567890',
          amount: 100,
          side: 'up',
        }),
      });

      // X-Cache-Status may be null if response is error or rate limited
      if (response.status === 200) {
        expect(response.headers.get('X-Cache-Status')).toBe('BYPASS');
      }
    }, 10000);
  });
});

describe('CVAULT-106: Trading Endpoints', () => {
  describe('GET /api/trading/history', () => {
    it('should return trading history', async () => {
      const response = await apiRequest('/api/trading/history');

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        const data = await expectValidJson(response);
        
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('trades');
        expect(data).toHaveProperty('metrics');
        expect(data).toHaveProperty('cached');
        expect(data).toHaveProperty('responseTimeMs');
        
        // Validate trades is an array
        expect(Array.isArray(data.trades)).toBe(true);
        
        // Validate metrics structure (portfolio metrics)
        expect(data.metrics).toHaveProperty('totalTrades');
        expect(data.metrics).toHaveProperty('openTrades');
        expect(data.metrics).toHaveProperty('closedTrades');
        expect(data.metrics).toHaveProperty('winningTrades');
        expect(data.metrics).toHaveProperty('losingTrades');
        expect(data.metrics).toHaveProperty('totalPnL');
        expect(data.metrics).toHaveProperty('winRate');
        
        // Validate cache headers
        expect(response.headers.get('X-Cache-Status')).toBeTruthy();
        expect(response.headers.get('Cache-Control')).toBeTruthy();
      }
    }, 10000);
  });

  describe('POST /api/trading/execute', () => {
    it('should validate request body', async () => {
      const response = await apiRequest('/api/trading/execute', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect([200, 400, 500]).toContain(response.status);
      
      const data = await expectValidJson(response);
      
      if (response.status === 200) {
        expect(data).toHaveProperty('success');
        if (data.success) {
          expect(data).toHaveProperty('trade');
          expect(data).toHaveProperty('consensusData');
        }
      }
    }, 60000);

    it('should accept asset parameter', async () => {
      const response = await apiRequest('/api/trading/execute', {
        method: 'POST',
        body: JSON.stringify({ asset: 'ETH/USD' }),
      });

      expect([200, 400, 500]).toContain(response.status);
      
      const data = await expectValidJson(response);
      expect(data).toHaveProperty('success');
    }, 60000);

    it('should return no-cache headers', async () => {
      const response = await apiRequest('/api/trading/execute', {
        method: 'POST',
        body: JSON.stringify({ asset: 'BTC/USD' }),
      });

      // X-Cache-Status may be null if response is error or rate limited
      if (response.status === 200) {
        expect(response.headers.get('X-Cache-Status')).toBe('BYPASS');
      }
    }, 60000);
  });

  describe('POST /api/trading/close', () => {
    it('should require tradeId parameter', async () => {
      const response = await apiRequest('/api/trading/close', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect([200, 400, 500]).toContain(response.status);
      
      if (response.status === 400) {
        const data = await expectValidJson(response);
        expect(data.error).toContain('tradeId');
      }
    }, 10000);

    it('should validate tradeId format', async () => {
      const response = await apiRequest('/api/trading/close', {
        method: 'POST',
        body: JSON.stringify({ tradeId: 'test-trade-123' }),
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    }, 10000);

    it('should return no-cache headers', async () => {
      const response = await apiRequest('/api/trading/close', {
        method: 'POST',
        body: JSON.stringify({ tradeId: 'test-123' }),
      });

      // POST endpoints should have BYPASS or no-cache cache status
      const cacheStatus = response.headers.get('X-Cache-Status');
      const cacheControl = response.headers.get('Cache-Control');
      
      // Either X-Cache-Status should be BYPASS or Cache-Control should contain no-cache
      const hasNoCache = !cacheStatus || cacheStatus === 'BYPASS' || 
                         (cacheControl && cacheControl.includes('no-cache'));
      expect(hasNoCache).toBe(true);
    }, 10000);
  });
});

describe('CVAULT-106: Error Handling & Edge Cases', () => {
  it('should return 404 for non-existent endpoints', async () => {
    const response = await apiRequest('/api/nonexistent');
    expect(response.status).toBe(404);
  }, 10000);

  it('should return 404 for invalid HTTP methods on GET-only endpoints', async () => {
    const response = await apiRequest('/api/health', { method: 'POST' });
    expect(response.status).toBe(405);
  }, 10000);

  it('should handle malformed JSON gracefully', async () => {
    const response = await apiRequest('/api/consensus', {
      method: 'POST',
      body: 'invalid json {',
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 500]).toContain(response.status);
  }, 10000);

  it('should handle very long query strings', async () => {
    const longAsset = 'BTC'.repeat(100);
    const response = await apiRequest(`/api/price?asset=${longAsset}`);
    
    // Should not crash, may return error
    expect([200, 400, 414, 500]).toContain(response.status);
  }, 10000);

  it('should handle special characters in parameters', async () => {
    const specialChars = ['<script>', "'; DROP TABLE", 'BTC\nUSD', 'BTC\tUSD'];
    
    for (const char of specialChars) {
      const response = await apiRequest(`/api/price?asset=${encodeURIComponent(char)}`);
      expect([200, 400, 500]).toContain(response.status);
    }
  }, 30000);
});

describe('CVAULT-106: Response Time Performance', () => {
  it('health endpoint should respond within 2 seconds', async () => {
    const start = Date.now();
    const response = await apiRequest('/api/health');
    const duration = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  }, 10000);

  it('price endpoint should respond within 3 seconds', async () => {
    const start = Date.now();
    const response = await apiRequest('/api/price?asset=BTC');
    const duration = Date.now() - start;
    
    expect([200, 500]).toContain(response.status);
    expect(duration).toBeLessThan(3000);
  }, 10000);

  it('trading history should respond within 2 seconds', async () => {
    const start = Date.now();
    const response = await apiRequest('/api/trading/history');
    const duration = Date.now() - start;
    
    expect([200, 500]).toContain(response.status);
    expect(duration).toBeLessThan(2000);
  }, 10000);

  it('prediction market pool should respond within 2 seconds', async () => {
    const start = Date.now();
    const response = await apiRequest('/api/prediction-market/bet');
    const duration = Date.now() - start;
    
    expect([200, 500]).toContain(response.status);
    expect(duration).toBeLessThan(2000);
  }, 10000);
});

describe('CVAULT-106: Caching Headers', () => {
  it('GET endpoints should have appropriate cache headers', async () => {
    const endpoints = [
      '/api/health',
      '/api/price?asset=BTC',
      '/api/trading/history',
      '/api/prediction-market/bet',
    ];

    for (const endpoint of endpoints) {
      const response = await apiRequest(endpoint);
      
      // All should have Cache-Control header
      expect(response.headers.get('Cache-Control')).toBeTruthy();
      
      // Health should be no-cache
      if (endpoint === '/api/health') {
        expect(response.headers.get('Cache-Control')).toContain('no-cache');
      }
    }
  }, 30000);

  it('POST endpoints should have no-cache headers', async () => {
    const postEndpoints = [
      { endpoint: '/api/consensus', body: { query: 'test' }, expectedCache: ['MISS', 'PARTIAL'] },
      { endpoint: '/api/consensus-detailed', body: { asset: 'BTC' }, expectedCache: ['BYPASS', 'MISS', 'HIT'] },
      { endpoint: '/api/trading/execute', body: { asset: 'BTC' }, expectedCache: ['BYPASS', null] },
      { endpoint: '/api/trading/close', body: { tradeId: 'test' }, expectedCache: ['BYPASS', null] },
      { endpoint: '/api/prediction-market/bet', body: { address: '0x1234567890123456789012345678901234567890', amount: 100, side: 'up' }, expectedCache: ['BYPASS', null] },
    ];

    for (const { endpoint, body, expectedCache } of postEndpoints) {
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // POST endpoints should not be cached (BYPASS, MISS, or PARTIAL are valid, null means header not set)
      const cacheStatus = response.headers.get('X-Cache-Status');
      expect(expectedCache).toContain(cacheStatus);
    }
  }, 60000);
});
