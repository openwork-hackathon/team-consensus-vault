/**
 * CVAULT-146: AI Response Caching Layer
 * 
 * Specialized caching for AI model responses:
 * - Short TTL (30-60s) for identical prompts
 * - Request deduplication for concurrent identical requests
 * - Response time tracking per model
 * - Cache key based on prompt hash + model config
 * 
 * This reduces API costs and improves response times for repeated queries.
 */

import { logCacheEvent } from './cache';

// AI Cache TTL configurations (in seconds)
export const AI_CACHE_TTL = {
  MODEL_RESPONSE: 45,      // 45 seconds for AI model responses
  CONSENSUS_RESULT: 60,    // 60 seconds for consensus aggregation
  PRICE_DATA: 30,          // 30 seconds for price data
} as const;

// In-memory cache for AI responses
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  modelId: string;
  promptHash: string;
  responseTimeMs: number;
}

class AIResponseCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pending = new Map<string, Promise<unknown>>();
  private metrics = new Map<string, {
    hits: number;
    misses: number;
    totalResponseTime: number;
    avgResponseTime: number;
  }>();

  /**
   * Generate cache key from model ID and prompt
   */
  private generateKey(modelId: string, asset: string, context?: string): string {
    const contextHash = context 
      ? this.simpleHash(context) 
      : 'no-context';
    return `ai:${modelId}:${asset.toUpperCase()}:${contextHash}`;
  }

  /**
   * Simple hash function for strings
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }

  /**
   * Get cached response or execute function
   * Implements request deduplication for concurrent identical requests
   */
  async getOrExecute<T>(
    modelId: string,
    asset: string,
    context: string | undefined,
    fn: () => Promise<T>,
    ttlSeconds: number = AI_CACHE_TTL.MODEL_RESPONSE
  ): Promise<{ result: T; cached: boolean; responseTimeMs: number }> {
    const key = this.generateKey(modelId, asset, context);
    const now = Date.now();
    const ttlMs = ttlSeconds * 1000;

    // Check cache
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && now - cached.timestamp < ttlMs) {
      this.recordMetric(modelId, 'hit', 0);
      logCacheEvent(`ai-${modelId}`, 'hit', { asset, context: context ? 'yes' : 'no' });
      return {
        result: cached.value,
        cached: true,
        responseTimeMs: 0, // Cached responses are instant
      };
    }

    // Check for pending request (deduplication)
    const pending = this.pending.get(key) as Promise<T> | undefined;
    if (pending) {
      // Log as cache hit since we're reusing an in-flight request
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AI-Cache] 🔄 Request deduplication: ai-${modelId}`, { asset, context: context ? 'yes' : 'no' });
      }
      const startTime = Date.now();
      const result = await pending;
      return {
        result,
        cached: false, // Not from cache, but deduplicated
        responseTimeMs: Date.now() - startTime,
      };
    }

    // Execute and cache
    logCacheEvent(`ai-${modelId}`, 'miss', { asset, context: context ? 'yes' : 'no' });
    const startTime = Date.now();
    
    const promise = fn().then(result => {
      const responseTimeMs = Date.now() - startTime;
      
      // Store in cache
      this.cache.set(key, {
        value: result,
        timestamp: Date.now(),
        modelId,
        promptHash: this.simpleHash(asset + (context || '')),
        responseTimeMs,
      });

      this.recordMetric(modelId, 'miss', responseTimeMs);
      this.pending.delete(key);
      
      return result;
    }).catch(error => {
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, promise);
    const result = await promise;
    
    return {
      result,
      cached: false,
      responseTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Record cache metric for a model
   */
  private recordMetric(modelId: string, event: 'hit' | 'miss', responseTimeMs: number): void {
    const existing = this.metrics.get(modelId);
    if (!existing) {
      this.metrics.set(modelId, {
        hits: event === 'hit' ? 1 : 0,
        misses: event === 'miss' ? 1 : 0,
        totalResponseTime: responseTimeMs,
        avgResponseTime: responseTimeMs,
      });
    } else {
      existing.hits += event === 'hit' ? 1 : 0;
      existing.misses += event === 'miss' ? 1 : 0;
      if (responseTimeMs > 0) {
        existing.totalResponseTime += responseTimeMs;
        existing.avgResponseTime = existing.totalResponseTime / existing.misses;
      }
    }
  }

  /**
   * Get cache metrics for all models
   */
  getMetrics(): Record<string, {
    hits: number;
    misses: number;
    hitRate: number;
    avgResponseTime: number;
  }> {
    const result: Record<string, {
      hits: number;
      misses: number;
      hitRate: number;
      avgResponseTime: number;
    }> = {};

    for (const [modelId, metrics] of this.metrics.entries()) {
      const total = metrics.hits + metrics.misses;
      result[modelId] = {
        hits: metrics.hits,
        misses: metrics.misses,
        hitRate: total > 0 ? metrics.hits / total : 0,
        avgResponseTime: metrics.avgResponseTime,
      };
    }

    return result;
  }

  /**
   * Invalidate cache for a specific model/asset combination
   */
  invalidate(modelId: string, asset?: string): void {
    if (asset) {
      // Invalidate specific asset
      for (const [key, entry] of this.cache.entries()) {
        if (entry.modelId === modelId && key.includes(asset.toUpperCase())) {
          this.cache.delete(key);
        }
      }
    } else {
      // Invalidate all entries for this model
      for (const [key, entry] of this.cache.entries()) {
        if (entry.modelId === modelId) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const aiResponseCache = new AIResponseCache();

/**
 * Request deduplication for consensus analysis
 * Prevents duplicate concurrent consensus requests for identical parameters
 */
class ConsensusDeduplicator {
  private pending = new Map<string, Promise<unknown>>();

  /**
   * Generate deduplication key
   */
  private generateKey(asset: string, context?: string): string {
    const contextHash = context 
      ? context.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0).toString(36)
      : 'no-context';
    return `consensus:${asset.toUpperCase()}:${contextHash}`;
  }

  /**
   * Execute function with deduplication
   */
  async execute<T>(asset: string, context: string | undefined, fn: () => Promise<T>): Promise<T> {
    const key = this.generateKey(asset, context);

    // Check for pending request
    const pending = this.pending.get(key) as Promise<T> | undefined;
    if (pending) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ConsensusDeduplicator] Deduplicating request for ${asset}`);
      }
      return pending;
    }

    // Execute and track
    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Check if a request is pending
   */
  isPending(asset: string, context?: string): boolean {
    const key = this.generateKey(asset, context);
    return this.pending.has(key);
  }

  /**
   * Get number of pending requests
   */
  get pendingCount(): number {
    return this.pending.size;
  }
}

// Singleton instance
export const consensusDeduplicator = new ConsensusDeduplicator();

/**
 * Performance tracking for AI model calls
 */
class PerformanceTracker {
  private timings = new Map<string, number[]>();
  private errors = new Map<string, number>();

  /**
   * Record a timing
   */
  recordTiming(modelId: string, durationMs: number): void {
    const existing = this.timings.get(modelId);
    if (!existing) {
      this.timings.set(modelId, [durationMs]);
    } else {
      existing.push(durationMs);
      // Keep only last 100 measurements
      if (existing.length > 100) {
        existing.shift();
      }
    }
  }

  /**
   * Record an error
   */
  recordError(modelId: string): void {
    const existing = this.errors.get(modelId);
    this.errors.set(modelId, (existing || 0) + 1);
  }

  /**
   * Get performance stats for a model
   */
  getStats(modelId: string): {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    errorCount: number;
    sampleSize: number;
  } | null {
    const timings = this.timings.get(modelId);
    if (!timings || timings.length === 0) {
      return null;
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avgResponseTime: Math.round(sum / sorted.length),
      minResponseTime: sorted[0],
      maxResponseTime: sorted[sorted.length - 1],
      p95ResponseTime: sorted[p95Index],
      errorCount: this.errors.get(modelId) || 0,
      sampleSize: sorted.length,
    };
  }

  /**
   * Get all performance stats
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const modelId of this.timings.keys()) {
      result[modelId] = this.getStats(modelId);
    }
    return result;
  }

  /**
   * Clear all stats
   */
  clear(): void {
    this.timings.clear();
    this.errors.clear();
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * Helper to wrap AI model calls with caching and performance tracking
 */
export async function withAICaching<T>(
  modelId: string,
  asset: string,
  context: string | undefined,
  fn: () => Promise<T>,
  options: {
    ttlSeconds?: number;
    trackPerformance?: boolean;
  } = {}
): Promise<{ result: T; cached: boolean; responseTimeMs: number }> {
  const { ttlSeconds = AI_CACHE_TTL.MODEL_RESPONSE, trackPerformance = true } = options;

  const startTime = Date.now();
  
  try {
    const { result, cached, responseTimeMs } = await aiResponseCache.getOrExecute(
      modelId,
      asset,
      context,
      fn,
      ttlSeconds
    );

    if (trackPerformance && !cached) {
      performanceTracker.recordTiming(modelId, responseTimeMs);
    }

    return { result, cached, responseTimeMs };
  } catch (error) {
    if (trackPerformance) {
      performanceTracker.recordError(modelId);
    }
    throw error;
  }
}

/**
 * Get comprehensive performance metrics
 */
export function getPerformanceMetrics(): {
  cache: ReturnType<typeof aiResponseCache.getMetrics>;
  performance: ReturnType<typeof performanceTracker.getAllStats>;
  dedupPending: number;
} {
  return {
    cache: aiResponseCache.getMetrics(),
    performance: performanceTracker.getAllStats(),
    dedupPending: consensusDeduplicator.pendingCount,
  };
}

/**
 * Reset all AI caches and metrics
 */
export function resetAICaches(): void {
  aiResponseCache.clear();
  performanceTracker.clear();
}
