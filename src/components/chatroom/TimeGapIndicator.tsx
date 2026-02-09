'use client';

import { motion } from 'framer-motion';
import { TimeGapInfo, formatTimeGap } from '@/lib/chatroom/local-storage';

interface TimeGapIndicatorProps {
  timeGapInfo: TimeGapInfo;
  missedSummary?: string | null;
  isLoadingSummary?: boolean;
  onDismiss?: () => void;
}

export default function TimeGapIndicator({
  timeGapInfo,
  missedSummary,
  isLoadingSummary,
  onDismiss
}: TimeGapIndicatorProps) {
  if (!timeGapInfo.hasGap || !timeGapInfo.lastVisitTime) {
    return null;
  }

  const formatGapMessage = () => {
    if (timeGapInfo.gapDays) {
      return `You were away for ${timeGapInfo.gapDays} day${timeGapInfo.gapDays !== 1 ? 's' : ''}`;
    } else if (timeGapInfo.gapHours) {
      return `You were away for ${timeGapInfo.gapHours} hour${timeGapInfo.gapHours !== 1 ? 's' : ''}`;
    } else {
      return 'You were away for a while';
    }
  };

  const getGapSeverity = () => {
    if (timeGapInfo.gapDays) return 'high';
    if (timeGapInfo.gapHours && timeGapInfo.gapHours >= 1) return 'medium';
    return 'low';
  };

  const severity = getGapSeverity();
  const severityColors = {
    high: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    medium: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    low: 'bg-muted border-border text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`my-4 mx-4 p-3 rounded-lg border ${severityColors[severity]} text-sm`}
      role="status"
      aria-live="polite"
      aria-label={`Time gap indicator: ${formatGapMessage()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{formatGapMessage()}</span>
          <span className="text-xs opacity-75">
            (Last visit: {formatTimeGap(timeGapInfo.lastVisitTime)})
          </span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs opacity-75 hover:opacity-100 transition-opacity"
            aria-label="Dismiss time gap indicator"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* AI Summary of missed conversation */}
      {isLoadingSummary && (
        <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-80">
          <div className="flex items-center gap-2">
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="italic">Generating AI summary of missed conversation...</span>
          </div>
        </div>
      )}

      {missedSummary && !isLoadingSummary && (
        <div className="mt-3 pt-3 border-t border-current/20 text-xs">
          <div className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium mb-1 opacity-90">What you missed:</p>
              <p className="italic opacity-75 leading-relaxed">{missedSummary}</p>
            </div>
          </div>
        </div>
      )}

      {severity === 'high' && !missedSummary && !isLoadingSummary && (
        <div className="mt-2 text-xs opacity-90">
          <p>You've been away for a while. Consider:</p>
          <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
            <li>Reviewing recent messages for context</li>
            <li>Checking if consensus was reached while you were away</li>
            <li>Noting any phase transitions that occurred</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
}