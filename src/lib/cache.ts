/**
 * CVAULT-118: API Response Caching Utilities
 * 
 * Caching Strategy:
 * - Price data: 30s TTL (market data changes frequently)
 * - Consensus analysis: 60s TTL for identical prompts (AI responses are expensive)
 * - Trading history: 5s TTL (changes frequently but brief cache reduces load)
 * - Chatroom/SSE: NO CACHING (real-time requirements)
 * 
 * Implementation Notes:
 * - Uses Next.js unstable_cache for edge-compatible caching
 * - Includes cache key hashing for complex objects
 * - Provides cache control headers for CDN/Vercel Edge
 * - Graceful fallbacks when caching fails
 */

import { unstable_cache } from 'next/cache';

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  PRICE: 30,           // 30 seconds for price data
  CONSENSUS: 60,       // 60 seconds for AI consensus (identical prompts)
  TRADING_HISTORY: 5,  // 5 seconds for trading history
  STATIC: 3600,        // 1 hour for static data
} as const;

// Cache tags for invalidation
export const CACHE_TAGS = {
  PRICE: 'price',
  CONSENSUS: 'consensus',
  TRADING: 'trading',
} as const;

/**
 * Generate a consistent cache key from parameters
 * Uses SHA-256 hash for complex objects to ensure key length limits
 * Uses Web Crypto API for edge runtime compatibility
 */
export async function generateCacheKey(prefix: string, params: Record<string, unknown>): Promise<string> {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join('|');

  // Use Web Crypto API for edge runtime compatibility
  const encoder = new TextEncoder();
  const data = encoder.encode(sortedParams);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

  return `${prefix}:${hash}`;
}

/**
 * Synchronous cache key generation for simple use cases
 * Uses a simple hash function instead of SHA-256
 */
export function generateCacheKeySync(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join('|');

  // Simple hash function for edge runtime compatibility
  let hash = 0;
  for (let i = 0; i < sortedParams.length; i++) {
    const char = sortedParams.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `${prefix}:${Math.abs(hash).toString(36)}`;
}

/**
 * Generate cache control headers for HTTP responses
 * Optimized for Vercel Edge Network
 */
export function getCacheHeaders(
  maxAge: number,
  staleWhileRevalidate: number = maxAge
): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    'CDN-Cache-Control': `public, max-age=${maxAge}`,
    'Vercel-CDN-Cache-Control': `public, max-age=${maxAge}`,
  };
}

/**
 * Generate no-cache headers for dynamic/real-time endpoints
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Memoization cache for in-memory request deduplication
 * Prevents duplicate in-flight requests for identical parameters
 */
class RequestMemoizer<T> {
  private pending = new Map<string, Promise<T>>();
  private results = new Map<string, { value: T; timestamp: number }>();
  private ttlMs: number;

  constructor(ttlSeconds: number) {
    this.ttlMs = ttlSeconds * 1000;
  }

  /**
   * Execute function with memoization
   * - Returns cached result if available and not expired
   * - Deduplicates concurrent requests with same key
   */
  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Check for cached result
    const cached = this.results.get(key);
    if (cached && now - cached.timestamp < this.ttlMs) {
      return cached.value;
    }

    // Check for pending request (deduplication)
    const pending = this.pending.get(key);
    if (pending) {
      return pending;
    }

    // Execute and cache
    const promise = fn().then(result => {
      this.results.set(key, { value: result, timestamp: Date.now() });
      this.pending.delete(key);
      return result;
    }).catch(error => {
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear cached result for a specific key
   */
  invalidate(key: string): void {
    this.results.delete(key);
    this.pending.delete(key);
  }

  /**
   * Clear all cached results
   */
  invalidateAll(): void {
    this.results.clear();
    this.pending.clear();
  }
}

// Singleton instances for different cache types
export const priceMemoizer = new RequestMemoizer<number>(CACHE_TTL.PRICE);
export const consensusMemoizer = new RequestMemoizer<unknown>(CACHE_TTL.CONSENSUS);

/**
 * Wrap a function with Next.js unstable_cache
 * Provides edge-compatible caching with revalidation
 */
export function withEdgeCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttlSeconds: number,
  tags: string[] = []
): T {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      revalidate: ttlSeconds,
      tags,
    }
  ) as T;
}

/**
 * Log cache hit/miss for debugging (development only)
 */
export function logCacheEvent(
  endpoint: string,
  event: 'hit' | 'miss' | 'error',
  details?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const emoji = event === 'hit' ? '✅' : event === 'miss' ? '❌' : '⚠️';
    console.log(`[${timestamp}] ${emoji} Cache ${event.toUpperCase()}: ${endpoint}`, details || '');
  }
}
