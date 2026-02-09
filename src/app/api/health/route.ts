import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealthSummary, getPerformanceMetrics as getConsensusMetrics } from '@/lib/consensus-engine';
import { getPerformanceMetrics as getAIPerformanceMetrics } from '@/lib/ai-cache';

/**
 * Health check endpoint for monitoring system status
 *
 * Returns:
 * - Overall system health status
 * - Individual model health including circuit breaker status
 * - Performance metrics
 * - Cache performance with hit rates and response times per model
 * - Average response times per endpoint category
 *
 * This endpoint is useful for:
 * - Monitoring dashboards
 * - Load balancer health checks
 * - Debugging system issues
 * - SRE monitoring
 *
 * CVAULT-165: Enhanced with detailed cache metrics and response time tracking
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const healthData = getSystemHealthSummary();
    const consensusMetrics = getConsensusMetrics();
    const aiCacheMetrics = getAIPerformanceMetrics();

    // Determine HTTP status based on system health
    let statusCode = 200;
    switch (healthData.overall.status) {
      case 'healthy':
        statusCode = 200;
        break;
      case 'degraded':
        statusCode = 200; // Still operational but degraded
        break;
      case 'unhealthy':
        statusCode = 503; // Service unavailable
        break;
      default:
        statusCode = 200;
    }

    // Calculate aggregate cache statistics
    const cacheMetricsArray = Object.entries(aiCacheMetrics.cache);
    const totalHits = cacheMetricsArray.reduce((sum, [_, m]) => sum + m.hits, 0);
    const totalMisses = cacheMetricsArray.reduce((sum, [_, m]) => sum + m.misses, 0);
    const totalRequests = totalHits + totalMisses;
    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    // Calculate average response time across all models (for cache misses)
    const avgResponseTimes = cacheMetricsArray
      .map(([_, m]) => m.avgResponseTime)
      .filter(t => t > 0);
    const overallAvgResponseTime = avgResponseTimes.length > 0
      ? avgResponseTimes.reduce((sum, t) => sum + t, 0) / avgResponseTimes.length
      : 0;

    // Calculate endpoint response times from performance tracking
    const endpointResponseTimes: Record<string, {
      avg: number;
      min: number;
      max: number;
      p95: number;
      sampleSize: number;
    }> = {};

    // Aggregate performance stats across all models
    Object.entries(aiCacheMetrics.performance).forEach(([modelId, stats]) => {
      if (stats) {
        const category = modelId.includes('deepseek') ? 'ai_inference' :
                        modelId.includes('consensus') ? 'consensus' : 'other';

        if (!endpointResponseTimes[category]) {
          endpointResponseTimes[category] = {
            avg: stats.avgResponseTime,
            min: stats.minResponseTime,
            max: stats.maxResponseTime,
            p95: stats.p95ResponseTime,
            sampleSize: stats.sampleSize,
          };
        } else {
          // Update with running average
          const existing = endpointResponseTimes[category];
          const totalSamples = existing.sampleSize + stats.sampleSize;
          endpointResponseTimes[category] = {
            avg: Math.round((existing.avg * existing.sampleSize + stats.avgResponseTime * stats.sampleSize) / totalSamples),
            min: Math.min(existing.min, stats.minResponseTime),
            max: Math.max(existing.max, stats.maxResponseTime),
            p95: Math.max(existing.p95, stats.p95ResponseTime),
            sampleSize: totalSamples,
          };
        }
      }
    });

    const responseTime = Date.now() - startTime;

    const response = {
      status: healthData.overall.status,
      timestamp: healthData.overall.timestamp,
      system: {
        healthy_models: healthData.overall.healthyModels,
        total_models: healthData.overall.totalModels,
        healthy_percentage: healthData.overall.healthyPercentage,
        open_circuits: healthData.overall.openCircuits,
        half_open_circuits: healthData.overall.halfOpenCircuits,
      },
      models: healthData.models.map(model => ({
        id: model.modelId,
        status: model.isHealthy ? 'healthy' : 'unhealthy',
        circuit_breaker: model.circuitBreakerStatus,
        failure_count: model.failureCount,
        success_rate: model.successRate,
        avg_response_time_ms: model.averageResponseTime,
        total_requests: model.totalRequests,
        last_failure: model.lastFailureTime,
        open_until: model.openUntil,
      })),
      performance: {
        consensus_engine: consensusMetrics,
        cache: {
          // Aggregate statistics
          aggregate: {
            total_hits: totalHits,
            total_misses: totalMisses,
            total_requests: totalRequests,
            hit_rate: overallHitRate,
            avg_response_time_ms: Math.round(overallAvgResponseTime),
            dedup_pending: aiCacheMetrics.dedupPending,
          },
          // Per-model breakdown
          per_model: Object.entries(aiCacheMetrics.cache).reduce((acc, [modelId, metrics]) => {
            acc[modelId] = {
              hits: metrics.hits,
              misses: metrics.misses,
              hit_rate: metrics.hitRate,
              avg_response_time_ms: Math.round(metrics.avgResponseTime),
            };
            return acc;
          }, {} as Record<string, { hits: number; misses: number; hit_rate: number; avg_response_time_ms: number }>),
          // Performance tracking
          performance_tracking: aiCacheMetrics.performance,
        },
        // Endpoint response times by category
        endpoint_response_times: endpointResponseTimes,
      },
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
      responseTimeMs: responseTime,
    };

    const jsonResponse = NextResponse.json(response, { status: statusCode });

    // Add cache and response time headers (CVAULT-165)
    jsonResponse.headers.set('X-Response-Time', `${responseTime}ms`);
    jsonResponse.headers.set('X-Cache-Status', 'BYPASS'); // Health checks should not be cached

    // No-cache headers to ensure fresh health data
    jsonResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return jsonResponse;
  } catch (error) {
    console.error('Health check failed:', error);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: responseTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Optional: Simple health check for load balancers
 * Returns just the basic status without detailed metrics
 */
export async function HEAD(request: NextRequest) {
  const healthData = getSystemHealthSummary();
  
  let statusCode = 200;
  if (healthData.overall.status === 'unhealthy') {
    statusCode = 503;
  }

  return new NextResponse(null, { status: statusCode });
}