/**
 * CVAULT-146: Performance Metrics Collection
 * 
 * Tracks API response times, cache performance, and overall system health.
 * Provides exportable metrics for monitoring and alerting.
 */

import { NextRequest, NextResponse } from 'next/server';

// Metric types
interface TimingMetric {
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode: number;
  cached: boolean;
  timestamp: number;
}

interface CacheMetric {
  endpoint: string;
  event: 'hit' | 'miss' | 'error';
  responseTimeMs?: number;
  timestamp: number;
}

interface ErrorMetric {
  endpoint: string;
  method: string;
  errorType: string;
  message: string;
  timestamp: number;
}

// In-memory metrics storage (last 1000 entries)
const MAX_METRICS = 1000;
const timings: TimingMetric[] = [];
const cacheEvents: CacheMetric[] = [];
const errors: ErrorMetric[] = [];

/**
 * Record API response timing
 */
export function recordTiming(
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode: number,
  cached: boolean = false
): void {
  timings.push({
    endpoint,
    method,
    durationMs,
    statusCode,
    cached,
    timestamp: Date.now(),
  });

  // Keep only last N entries
  if (timings.length > MAX_METRICS) {
    timings.shift();
  }

  // Log slow requests in development
  if (process.env.NODE_ENV === 'development' && durationMs > 1000) {
    console.warn(`[Performance] Slow request: ${method} ${endpoint} took ${durationMs}ms`);
  }
}

/**
 * Record cache event
 */
export function recordCacheEvent(
  endpoint: string,
  event: 'hit' | 'miss' | 'error',
  responseTimeMs?: number
): void {
  cacheEvents.push({
    endpoint,
    event,
    responseTimeMs,
    timestamp: Date.now(),
  });

  if (cacheEvents.length > MAX_METRICS) {
    cacheEvents.shift();
  }
}

/**
 * Record error
 */
export function recordError(
  endpoint: string,
  method: string,
  errorType: string,
  message: string
): void {
  errors.push({
    endpoint,
    method,
    errorType,
    message,
    timestamp: Date.now(),
  });

  if (errors.length > MAX_METRICS) {
    errors.shift();
  }
}

/**
 * Calculate percentiles
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Get endpoint performance summary
 */
export function getEndpointPerformance(
  endpoint?: string,
  timeWindowMs: number = 5 * 60 * 1000 // 5 minutes
): Record<string, {
  requests: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
}> {
  const cutoff = Date.now() - timeWindowMs;
  const filtered = timings.filter(t => 
    t.timestamp >= cutoff && 
    (!endpoint || t.endpoint === endpoint)
  );

  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.endpoint]) {
      acc[t.endpoint] = [];
    }
    acc[t.endpoint].push(t);
    return acc;
  }, {} as Record<string, TimingMetric[]>);

  const result: Record<string, {
    requests: number;
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  }> = {};

  for (const [ep, metrics] of Object.entries(grouped)) {
    const durations = metrics.map(m => m.durationMs).sort((a, b) => a - b);
    const total = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);
    const errors = metrics.filter(m => m.statusCode >= 400).length;
    const cached = metrics.filter(m => m.cached).length;

    result[ep] = {
      requests: total,
      avgResponseTime: Math.round(sum / total),
      p50ResponseTime: calculatePercentile(durations, 50),
      p95ResponseTime: calculatePercentile(durations, 95),
      p99ResponseTime: calculatePercentile(durations, 99),
      errorRate: total > 0 ? errors / total : 0,
      cacheHitRate: total > 0 ? cached / total : 0,
    };
  }

  return result;
}

/**
 * Get cache performance summary
 */
export function getCachePerformance(
  timeWindowMs: number = 5 * 60 * 1000
): {
  totalEvents: number;
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
  byEndpoint: Record<string, { hits: number; misses: number; hitRate: number }>;
} {
  const cutoff = Date.now() - timeWindowMs;
  const filtered = cacheEvents.filter(e => e.timestamp >= cutoff);

  const hits = filtered.filter(e => e.event === 'hit').length;
  const misses = filtered.filter(e => e.event === 'miss').length;
  const errors = filtered.filter(e => e.event === 'error').length;
  const total = filtered.length;

  // Group by endpoint
  const byEndpoint: Record<string, { hits: number; misses: number; hitRate: number }> = {};
  for (const event of filtered) {
    if (!byEndpoint[event.endpoint]) {
      byEndpoint[event.endpoint] = { hits: 0, misses: 0, hitRate: 0 };
    }
    if (event.event === 'hit') {
      byEndpoint[event.endpoint].hits++;
    } else if (event.event === 'miss') {
      byEndpoint[event.endpoint].misses++;
    }
  }

  // Calculate hit rates
  for (const ep of Object.keys(byEndpoint)) {
    const epTotal = byEndpoint[ep].hits + byEndpoint[ep].misses;
    byEndpoint[ep].hitRate = epTotal > 0 ? byEndpoint[ep].hits / epTotal : 0;
  }

  return {
    totalEvents: total,
    hits,
    misses,
    errors,
    hitRate: total > 0 ? hits / total : 0,
    byEndpoint,
  };
}

/**
 * Get slowest endpoints
 */
export function getSlowestEndpoints(
  limit: number = 5,
  timeWindowMs: number = 5 * 60 * 1000
): Array<{
  endpoint: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  requests: number;
}> {
  const performance = getEndpointPerformance(undefined, timeWindowMs);
  
  return Object.entries(performance)
    .map(([endpoint, stats]) => ({
      endpoint,
      ...stats,
    }))
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, limit);
}

/**
 * Get all metrics summary
 */
export function getMetricsSummary(): {
  endpoints: ReturnType<typeof getEndpointPerformance>;
  cache: ReturnType<typeof getCachePerformance>;
  slowestEndpoints: ReturnType<typeof getSlowestEndpoints>;
  totalRequests: number;
  totalErrors: number;
  overallErrorRate: number;
  overallCacheHitRate: number;
} {
  const endpoints = getEndpointPerformance();
  const cache = getCachePerformance();
  const slowestEndpoints = getSlowestEndpoints();

  const totalRequests = Object.values(endpoints).reduce((sum, e) => sum + e.requests, 0);
  const totalErrors = Object.values(endpoints).reduce((sum, e) => sum + Math.round(e.requests * e.errorRate), 0);

  return {
    endpoints,
    cache,
    slowestEndpoints,
    totalRequests,
    totalErrors,
    overallErrorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
    overallCacheHitRate: cache.hitRate,
  };
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  timings.length = 0;
  cacheEvents.length = 0;
  errors.length = 0;
}

/**
 * Middleware to track response times
 * Usage: Add to middleware.ts or wrap route handlers
 */
export async function withPerformanceTracking<T extends Response | NextResponse>(
  request: NextRequest,
  handler: () => Promise<T>,
  endpoint: string
): Promise<T> {
  const startTime = Date.now();
  const method = request.method;

  try {
    const response = await handler();
    const durationMs = Date.now() - startTime;
    const cached = response.headers.get('X-Cache-Status') === 'HIT';

    recordTiming(endpoint, method, durationMs, response.status, cached);

    // Add performance headers
    response.headers.set('X-Response-Time', `${durationMs}ms`);
    
    return response;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    recordTiming(endpoint, method, durationMs, 500, false);
    recordError(endpoint, method, error instanceof Error ? error.name : 'Unknown', 
      error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Create a performance-tracking wrapper for API routes
 */
export function createPerformanceWrapper(endpoint: string) {
  return function<T extends Response | NextResponse>(
    handler: (request: NextRequest) => Promise<T>
  ) {
    return async (request: NextRequest): Promise<T> => {
      return withPerformanceTracking(request, () => handler(request), endpoint);
    };
  };
}

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(): string {
  const summary = getMetricsSummary();
  const lines: string[] = [];

  // Request duration histogram
  lines.push('# HELP api_request_duration_ms API request duration in milliseconds');
  lines.push('# TYPE api_request_duration_ms summary');
  
  for (const [endpoint, stats] of Object.entries(summary.endpoints)) {
    const safeEndpoint = endpoint.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`api_request_duration_ms{endpoint="${safeEndpoint}",quantile="0.5"} ${stats.p50ResponseTime}`);
    lines.push(`api_request_duration_ms{endpoint="${safeEndpoint}",quantile="0.95"} ${stats.p95ResponseTime}`);
    lines.push(`api_request_duration_ms{endpoint="${safeEndpoint}",quantile="0.99"} ${stats.p99ResponseTime}`);
    lines.push(`api_request_duration_ms_sum{endpoint="${safeEndpoint}"} ${stats.avgResponseTime * stats.requests}`);
    lines.push(`api_request_duration_ms_count{endpoint="${safeEndpoint}"} ${stats.requests}`);
  }

  // Cache hit rate
  lines.push('# HELP api_cache_hit_rate Cache hit rate');
  lines.push('# TYPE api_cache_hit_rate gauge');
  lines.push(`api_cache_hit_rate ${summary.overallCacheHitRate}`);

  // Error rate
  lines.push('# HELP api_error_rate Error rate');
  lines.push('# TYPE api_error_rate gauge');
  lines.push(`api_error_rate ${summary.overallErrorRate}`);

  return lines.join('\n');
}
