/**
 * Enhanced loading progress component with time estimates
 *
 * Displays loading state with progress indicator and estimated time remaining.
 * Shows different states based on elapsed time (normal → slow → timeout warning).
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingProgressProps {
  modelName: string;
  elapsedTime: number; // milliseconds
  estimatedRemainingTime?: number; // milliseconds
  status?: 'processing' | 'slow' | 'timeout_warning';
  message?: string;
  compact?: boolean;
}

export default function LoadingProgress({
  modelName,
  elapsedTime,
  estimatedRemainingTime,
  status,
  message,
  compact = false,
}: LoadingProgressProps) {
  const [displayTime, setDisplayTime] = useState(elapsedTime);

  // Update display time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Determine status based on elapsed time if not provided
  const effectiveStatus = status || (
    elapsedTime > 30000 ? 'timeout_warning' :
    elapsedTime > 15000 ? 'slow' :
    'processing'
  );

  const statusConfig = {
    processing: {
      icon: '⏳',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    slow: {
      icon: '⌛',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    timeout_warning: {
      icon: '⚠️',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
  };

  const config = statusConfig[effectiveStatus];

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const getStatusMessage = () => {
    if (message) return message;

    if (effectiveStatus === 'timeout_warning') {
      return 'Taking unusually long - model may be experiencing issues';
    } else if (effectiveStatus === 'slow') {
      return 'Taking longer than expected - please be patient';
    } else {
      return 'Analyzing market data...';
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={`text-sm ${config.color}`}
        >
          {config.icon}
        </motion.span>
        <p className="text-xs flex-1 text-muted-foreground">
          {getStatusMessage()} ({formatTime(displayTime)})
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={`text-xl ${config.color} flex-shrink-0`}
        >
          {config.icon}
        </motion.span>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium ${config.color}`}>
              {modelName}
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(displayTime)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {getStatusMessage()}
          </p>

          {estimatedRemainingTime && estimatedRemainingTime > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>⏱️</span>
              <span>Estimated: ~{formatTime(estimatedRemainingTime)} remaining</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 ${config.color.replace('text-', 'bg-')}`}
              initial={{ width: '0%' }}
              animate={{
                width: estimatedRemainingTime
                  ? `${Math.min(100, (displayTime / (displayTime + estimatedRemainingTime)) * 100)}%`
                  : ['0%', '100%']
              }}
              transition={
                estimatedRemainingTime
                  ? { duration: 0.5 }
                  : { duration: 2, repeat: Infinity, ease: 'linear' }
              }
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
