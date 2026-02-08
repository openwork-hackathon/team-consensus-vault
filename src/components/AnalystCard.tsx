'use client';

import { Analyst } from '@/lib/types';
import { motion } from 'framer-motion';
import ModelRetryButton from './ModelRetryButton';

interface AnalystCardProps {
  analyst: Analyst;
  index: number;
  onRetry?: (modelId: string) => Promise<void>;
}

export default function AnalystCard({ analyst, index, onRetry }: AnalystCardProps) {
  const sentimentColors = {
    bullish: 'border-bullish bg-bullish/10 text-bullish',
    bearish: 'border-bearish bg-bearish/10 text-bearish',
    neutral: 'border-neutral bg-neutral/10 text-neutral',
  };

  const sentimentIcons = {
    bullish: '↗',
    bearish: '↘',
    neutral: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`relative rounded-lg border-2 p-3 sm:p-4 transition-all duration-300 ${sentimentColors[analyst.sentiment]}`}
      style={{ borderColor: analyst.borderColor }}
      role="article"
      aria-label={`${analyst.name} analysis`}
      aria-busy={analyst.isTyping}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: analyst.color, color: '#fff' }}
          >
            {analyst.avatar}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm truncate">{analyst.name}</h3>
            <div className="flex items-center gap-1 sm:gap-2 text-xs">
              <span className="text-base sm:text-lg">{sentimentIcons[analyst.sentiment]}</span>
              <span className="capitalize">{analyst.sentiment}</span>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="text-right flex-shrink-0 ml-2">
          <div className="text-xl sm:text-2xl font-bold tabular-nums">{analyst.confidence}%</div>
          <div className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">confidence</span>
            <span className="sm:hidden">conf.</span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="min-h-[60px] sm:min-h-[80px]">
        {analyst.isTyping ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Analyzing</span>
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ●●●
            </motion.span>
          </div>
        ) : analyst.progress ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-blue-500">⏳</span>
            <p className="text-xs sm:text-sm">
              {analyst.progress.message}
              {analyst.progress.estimatedRemainingTime && (
                <span className="text-xs opacity-70 ml-1">
                  (~{Math.round(analyst.progress.estimatedRemainingTime / 1000)}s remaining)
                </span>
              )}
            </p>
          </div>
        ) : analyst.error ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${analyst.userFacingError?.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
                {analyst.userFacingError?.severity === 'critical' ? '🚨' : '⚠'}
              </span>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                {analyst.userFacingError?.message || analyst.error}
              </p>
            </div>
            {analyst.userFacingError?.recoveryGuidance && (
              <p className="text-xs text-muted-foreground pl-6">
                💡 {analyst.userFacingError.recoveryGuidance}
              </p>
            )}
            {analyst.userFacingError?.retryable && analyst.userFacingError?.estimatedWaitTime && (
              <p className="text-xs text-blue-600 dark:text-blue-400 pl-6">
                ⏱️ Estimated wait: {Math.round(analyst.userFacingError.estimatedWaitTime / 1000)}s
              </p>
            )}
            {/* Retry button */}
            {onRetry && analyst.userFacingError?.retryable && (
              <div className="pt-1">
                <ModelRetryButton
                  modelId={analyst.id}
                  modelName={analyst.name}
                  onRetry={onRetry}
                />
              </div>
            )}
          </div>
        ) : (
          <motion.p
            className="text-xs sm:text-sm leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {analyst.reasoning}
          </motion.p>
        )}
      </div>

      {/* Streaming indicator */}
      {analyst.isTyping && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
