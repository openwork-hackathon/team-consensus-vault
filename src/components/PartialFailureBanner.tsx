'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ConsensusData } from '@/lib/types';

interface PartialFailureBannerProps {
  partialFailures: ConsensusData['partialFailures'];
  onRetry?: () => void;
  isRetrying?: boolean;
}

export default function PartialFailureBanner({
  partialFailures,
  onRetry,
  isRetrying = false,
}: PartialFailureBannerProps) {
  if (!partialFailures || partialFailures.failedCount === 0) {
    return null;
  }

  const { failedModels, failedCount, successCount, errorSummary } = partialFailures;
  const severity = failedCount >= 3 ? 'critical' : 'warning';
  const bgColor = severity === 'critical' 
    ? 'bg-red-500/10 border-red-500/30' 
    : 'bg-yellow-500/10 border-yellow-500/30';
  const textColor = severity === 'critical'
    ? 'text-red-600 dark:text-red-400'
    : 'text-yellow-600 dark:text-yellow-400';
  const icon = severity === 'critical' ? '🚨' : '⚠️';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className={`rounded-lg border ${bgColor} ${textColor} p-4 mb-4`}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Partial Analysis Complete
            </h3>
            <p className="text-xs mb-2">
              {errorSummary}
            </p>
            
            {/* Show which models failed */}
            <div className="text-xs opacity-90 space-y-1">
              <p className="font-medium">Models that failed:</p>
              <ul className="list-disc list-inside pl-2">
                {failedModels.map((model) => (
                  <li key={model}>{model}</li>
                ))}
              </ul>
            </div>

            {/* Recovery guidance */}
            <div className="mt-3 flex items-start gap-2 text-xs">
              <span className="flex-shrink-0">💡</span>
              <p>
                {successCount >= 3 
                  ? `You can still make informed decisions based on the ${successCount} successful analyses.`
                  : 'Consider retrying to get more comprehensive insights.'
                }
              </p>
            </div>

            {/* Retry button */}
            {onRetry && (
              <div className="mt-3">
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="px-4 py-2 bg-current text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                  aria-label="Retry failed models"
                >
                  {isRetrying ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ⏳
                      </motion.span>
                      Retrying failed models...
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      Retry Failed Models
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
