/**
 * Model Health Status Component
 * 
 * Displays real-time health status of all AI models including:
 * - Circuit breaker status (closed/open/half-open)
 * - Success rates and response times
 * - Failure counts and last failure times
 * - Visual indicators for healthy/degraded/unhealthy models
 */

'use client';

import { useState, useEffect } from 'react';
import { getModelsHealthStatus, getSystemHealthSummary } from '@/lib/consensus-engine';
import type { ModelHealthStatus as ModelHealthType } from '@/lib/consensus-engine';
import { cn } from '@/lib/utils';

interface ModelHealthStatusProps {
  className?: string;
  showSystemSummary?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function ModelHealthStatus({ 
  className, 
  showSystemSummary = true,
  refreshInterval = 30000 // 30 seconds default
}: ModelHealthStatusProps) {
  const [modelHealth, setModelHealth] = useState<ModelHealthType[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);
      const [healthData, systemData] = await Promise.all([
        getModelsHealthStatus(),
        getSystemHealthSummary()
      ]);
      setModelHealth(healthData);
      setSystemHealth(systemData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch model health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: ModelHealthType['circuitBreakerStatus'], isHealthy: boolean) => {
    if (!isHealthy) return 'text-red-500';
    
    switch (status) {
      case 'closed': return 'text-green-500';
      case 'half-open': return 'text-yellow-500';
      case 'open': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ModelHealthType['circuitBreakerStatus'], isHealthy: boolean) => {
    if (!isHealthy) return '🔴';
    
    switch (status) {
      case 'closed': return '🟢';
      case 'half-open': return '🟡';
      case 'open': return '🔴';
      default: return '⚪';
    }
  };

  const formatLastFailureTime = (timestamp?: Date) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isLoading && modelHealth.length === 0) {
    return (
      <div className={cn("p-4 border rounded-lg", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 border rounded-lg bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Model Status</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button
            onClick={fetchHealthData}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            disabled={isLoading}
          >
            {isLoading ? '⟳' : '↻'}
          </button>
        </div>
      </div>

      {/* System Summary */}
      {showSystemSummary && systemHealth && (
        <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">System Status: </span>
              <span className={cn(
                "font-semibold",
                systemHealth.overall.status === 'healthy' ? 'text-green-600' :
                systemHealth.overall.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              )}>
                {systemHealth.overall.status.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {systemHealth.overall.healthyModels}/{systemHealth.overall.totalModels} models healthy
            </div>
          </div>
          {systemHealth.overall.openCircuits > 0 && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠️ {systemHealth.overall.openCircuits} circuit breaker(s) open
            </div>
          )}
        </div>
      )}

      {/* Model List */}
      <div className="space-y-2">
        {modelHealth.map((model) => (
          <div
            key={model.modelId}
            className={cn(
              "p-3 rounded-lg border transition-colors",
              model.isHealthy 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            )}
          >
            <div className="flex items-center justify-between">
              {/* Model Info */}
              <div className="flex items-center gap-3">
                <span className="text-lg">{getStatusIcon(model.circuitBreakerStatus, model.isHealthy)}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {model.modelId.charAt(0).toUpperCase() + model.modelId.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {model.circuitBreakerStatus} • {model.totalRequests} requests
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{model.successRate}%</div>
                  <div className="text-gray-500">Success</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{model.averageResponseTime}ms</div>
                  <div className="text-gray-500">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{model.failureCount}</div>
                  <div className="text-gray-500">Failures</div>
                </div>
              </div>
            </div>

            {/* Status Details */}
            <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
              <span className={getStatusColor(model.circuitBreakerStatus, model.isHealthy)}>
                Circuit: {model.circuitBreakerStatus.replace('-', ' ')}
              </span>
              <span>Last failure: {formatLastFailureTime(model.lastFailureTime)}</span>
            </div>

            {/* Additional Status Info */}
            {model.openUntil && (
              <div className="mt-1 text-xs text-orange-600">
                Circuit will reset at: {model.openUntil.toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span>🟢</span> Healthy
            </span>
            <span className="flex items-center gap-1">
              <span>🟡</span> Degraded
            </span>
            <span className="flex items-center gap-1">
              <span>🔴</span> Unhealthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}