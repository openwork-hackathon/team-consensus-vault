'use client';

import { motion } from 'framer-motion';

interface ConsensusDirectionIndicatorProps {
  direction: 'bullish' | 'bearish' | 'neutral' | null;
  strength: number;
}

export default function ConsensusDirectionIndicator({
  direction,
  strength,
}: ConsensusDirectionIndicatorProps) {
  if (!direction) return null;

  const isBullish = direction === 'bullish';
  const isBearish = direction === 'bearish';
  const strengthPercent = Math.round(strength * 100);

  // Dynamic styling based on direction
  const getContainerStyles = () => {
    if (isBullish) {
      return 'bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border-b-2 border-green-500';
    }
    if (isBearish) {
      return 'bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 border-b-2 border-red-500';
    }
    return 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/20 border-b-2 border-yellow-500';
  };

  const getTextColor = () => {
    if (isBullish) return 'text-green-400';
    if (isBearish) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getGlowColor = () => {
    if (isBullish) return 'rgba(34, 197, 94, 0.5)';
    if (isBearish) return 'rgba(239, 68, 68, 0.5)';
    return 'rgba(234, 179, 8, 0.5)';
  };

  const getIcon = () => {
    if (isBullish) {
      return (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    }
    if (isBearish) {
      return (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12h14"
        />
      </svg>
    );
  };

  const getLabel = () => {
    if (isBullish) return 'BULLISH';
    if (isBearish) return 'BEARISH';
    return 'NEUTRAL';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`px-4 py-3 ${getContainerStyles()}`}
      style={{
        boxShadow: `0 0 20px ${getGlowColor()}`,
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side: Icon and Label */}
        <div className="flex items-center gap-3">
          {/* Animated icon container */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: isBullish ? [0, -5, 5, 0] : isBearish ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`${getTextColor()}`}
          >
            {getIcon()}
          </motion.div>

          {/* Consensus Label */}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Consensus Reached
            </span>
            <motion.span
              animate={{
                textShadow: [
                  `0 0 0px ${getGlowColor()}`,
                  `0 0 10px ${getGlowColor()}`,
                  `0 0 0px ${getGlowColor()}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`text-xl sm:text-2xl font-black ${getTextColor()} uppercase tracking-wide`}
            >
              {getLabel()}
            </motion.span>
          </div>
        </div>

        {/* Right side: Strength indicator */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Strength
          </span>
          <div className="flex items-center gap-2">
            {/* Strength bar */}
            <div className="w-16 sm:w-24 h-2 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${strengthPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className={`h-full rounded-full ${
                  isBullish
                    ? 'bg-gradient-to-r from-green-600 to-green-400'
                    : isBearish
                    ? 'bg-gradient-to-r from-red-600 to-red-400'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                }`}
              />
            </div>
            <span className={`text-lg sm:text-xl font-bold ${getTextColor()}`}>
              {strengthPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Trade signal indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-2 flex items-center gap-2"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${
            isBullish ? 'bg-green-500' : isBearish ? 'bg-red-500' : 'bg-yellow-500'
          }`}
        />
        <span className={`text-xs font-semibold ${getTextColor()}`}>
          Trade signal firing
        </span>
      </motion.div>
    </motion.div>
  );
}
