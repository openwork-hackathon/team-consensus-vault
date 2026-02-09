/**
 * Enhanced Consensus Progress Component
 * 
 * Provides detailed progress feedback during consensus analysis with:
 * - Individual model progress with status indicators
 * - Partial success communication (3/5 models completed)
 * - Estimated completion time
 * - Real-time model status updates
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ProgressUpdate } from '@/lib/types';

interface ConsensusProgressProps {
  isVisible: boolean;
  progress?: ProgressUpdate;
  completedModels?: string[];
  totalModels?: number;
  onClose?: () => void;
  className?: string;
}

interface ModelProgress {
  modelId: string;
  name: string;
  status: 'pending' | 'processing' | 'slow' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  progress?: number;
  message?: string;
  error?: string;
}

const MODEL_NAMES = {
  'deepseek': 'DeepSeek (Momentum Hunter)',
  'kimi': 'Kimi (Technical Analyst)', 
  'minimax': 'MiniMax (Whale Watcher)',
  'gemini': 'Gemini (Sentiment Scout)',
  'glm': 'GLM (Risk Manager)',
};

export function ConsensusProgress({
  isVisible,
  progress,
  completedModels = [],
  totalModels = 5,
  onClose,
  className
}: ConsensusProgressProps) {
  const [modelProgress, setModelProgress] = useState<Record<string, ModelProgress>>({});
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, startTime]);

  // Update progress when it changes
  useEffect(() => {
    if (!progress) return;

    const { modelId, status, message, elapsedTime } = progress;
    
    setModelProgress(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        modelId,
        name: MODEL_NAMES[modelId as keyof typeof MODEL_NAMES] || modelId,
        status: status === 'processing' ? 'processing' : status,
        message,
        startTime: prev[modelId]?.startTime || (Date.now() - elapsedTime),
        endTime: status === 'completed' || status === 'failed' ? Date.now() : undefined,
      }
    }));
  }, [progress]);

  // Calculate statistics
  const models = Object.values(modelProgress);
  const completedCount = models.filter(m => m.status === 'completed').length;
  const failedCount = models.filter(m => m.status === 'failed').length;
  const inProgressCount = models.filter(m => m.status === 'processing' || m.status === 'slow').length;
  const pendingCount = totalModels - completedCount - failedCount - inProgressCount;

  // Estimate remaining time based on completed models
  const estimateRemainingTime = () => {
    if (completedCount === 0) return null;
    
    const avgTimePerModel = elapsedTime / completedCount;
    const remainingModels = totalModels - completedCount;
    
    return Math.round(avgTimePerModel * remainingModels);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status: ModelProgress['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'processing': return '⚡';
      case 'slow': return '🐌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: ModelProgress['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'slow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const remainingTime = estimateRemainingTime();

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
      className
    )}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Analyzing Market Data
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedCount + failedCount}/{totalModels} models
            </span>
            <span className="text-sm text-gray-500">
              Elapsed: {formatTime(elapsedTime)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((completedCount + failedCount) / totalModels) * 100}%` 
              }}
            ></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">{completedCount}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">{failedCount}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">{inProgressCount}</div>
              <div className="text-xs text-gray-500">Processing</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-400">{pendingCount}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
        </div>

        {/* Partial Success Communication */}
        {completedCount > 0 && (completedCount + failedCount) < totalModels && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="text-sm font-medium text-blue-900">
                Partial Analysis Available
              </span>
            </div>
            <p className="text-sm text-blue-800 mt-1">
              {completedCount} model{completedCount !== 1 ? 's' : ''} completed analysis. 
              {failedCount > 0 && ` ${failedCount} failed.`} 
              {remainingTime && ` Estimated ${formatTime(remainingTime)} remaining.`}
              Results will be available as soon as we have sufficient consensus.
            </p>
          </div>
        )}

        {/* Model Progress List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Individual Model Status
          </h3>
          
          {Object.entries(MODEL_NAMES).map(([modelId, name]) => {
            const progress = modelProgress[modelId] || {
              modelId,
              name,
              status: 'pending' as const,
            };

            return (
              <div
                key={modelId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  getStatusColor(progress.status)
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {getStatusIcon(progress.status)}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {progress.message || 'Waiting to start...'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {progress.status === 'completed' && 'Done'}
                    {progress.status === 'failed' && 'Failed'}
                    {progress.status === 'processing' && 'Working...'}
                    {progress.status === 'slow' && 'Taking time...'}
                    {progress.status === 'pending' && 'Queued'}
                  </div>
                  {progress.startTime && (
                    <div className="text-xs text-gray-500">
                      {progress.status === 'completed' && progress.endTime
                        ? `Completed in ${formatTime(progress.endTime - progress.startTime)}`
                        : formatTime(Date.now() - progress.startTime)
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated Completion */}
        {remainingTime && (
          <div className="mt-6 p-3 bg-gray-50 border rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Estimated completion:</span>{' '}
              {formatTime(remainingTime)} remaining
            </div>
          </div>
        )}
      </div>
    </div>
  );
}