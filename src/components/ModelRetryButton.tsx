'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface ModelRetryButtonProps {
  modelId: string;
  modelName: string;
  onRetry: (modelId: string) => Promise<void>;
  disabled?: boolean;
}

export default function ModelRetryButton({
  modelId,
  modelName,
  onRetry,
  disabled = false,
}: ModelRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying || disabled) return;

    setIsRetrying(true);
    try {
      await onRetry(modelId);
    } catch (error) {
      console.error(`Retry failed for ${modelId}:`, error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRetry();
    }
  };

  return (
    <motion.button
      onClick={handleRetry}
      onKeyDown={handleKeyDown}
      disabled={isRetrying || disabled}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-medium
        flex items-center gap-1.5
        transition-all duration-200
        touch-manipulation min-h-[44px] min-w-[44px]
        ${isRetrying || disabled
          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30'
        }
      `}
      whileHover={!(isRetrying || disabled) ? { scale: 1.02 } : undefined}
      whileTap={!(isRetrying || disabled) ? { scale: 0.98 } : undefined}
      aria-label={`Retry analysis for ${modelName}`}
      aria-live="polite"
      title={`Retry ${modelName}`}
    >
      {isRetrying ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-sm"
            aria-hidden="true"
          >
            ⏳
          </motion.span>
          <span>Retrying...</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">🔄</span>
          <span>Retry</span>
        </>
      )}
    </motion.button>
  );
}
