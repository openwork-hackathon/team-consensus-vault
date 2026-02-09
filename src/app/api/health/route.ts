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
 * - Cache performance
 * 
 * This endpoint is useful for:
 * - Monitoring dashboards
 * - Load balancer health checks
 * - Debugging system issues
 * - SRE monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const healthData = getSystemHealthSummary();
    const consensusMetrics = getConsensusMetrics();
    const cacheMetrics = getAIPerformanceMetrics();

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
        cache: cacheMetrics,
      },
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
    };

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
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