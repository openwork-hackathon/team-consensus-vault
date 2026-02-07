'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConsensusMeterProps {
  level: number;
  threshold: number;
}

export default function ConsensusMeter({ level, threshold }: ConsensusMeterProps) {
  const [displayLevel, setDisplayLevel] = useState(0);

  useEffect(() => {
    // Animate level changes
    const timer = setTimeout(() => setDisplayLevel(level), 100);
    return () => clearTimeout(timer);
  }, [level]);

  const getColor = () => {
    if (displayLevel < 40) return 'from-bearish to-bearish-light';
    if (displayLevel < 70) return 'from-yellow-600 to-yellow-400';
    return 'from-bullish to-bullish-light';
  };

  const getStatusText = () => {
    if (displayLevel < 40) return 'Divergent';
    if (displayLevel < 70) return 'Building';
    if (displayLevel < threshold) return 'Strong Agreement';
    return 'CONSENSUS REACHED';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Consensus Level</h2>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-bold">{displayLevel}%</div>
          <div className="text-xs sm:text-sm text-muted-foreground">{getStatusText()}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-8 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor()} relative`}
          initial={{ width: '0%' }}
          animate={{ width: `${displayLevel}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Shimmer effect during progress */}
          {displayLevel > 0 && displayLevel < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Pulse effect when threshold reached */}
          {displayLevel >= threshold && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Threshold Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
          style={{ left: `${threshold}%` }}
        >
          <div className="absolute -top-1 -left-2 w-4 h-4 border-2 border-white rounded-full bg-background" />
          <div className="absolute -bottom-6 -left-3 sm:-left-6 text-xs text-muted-foreground whitespace-nowrap">
            <span className="hidden sm:inline">Threshold </span>{threshold}%
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 flex-wrap gap-2 sm:gap-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 bg-bearish rounded flex-shrink-0" />
          <span className="text-xs">Disagreement</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded flex-shrink-0" />
          <span className="text-xs">Partial</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 bg-bullish rounded flex-shrink-0" />
          <span className="text-xs">Consensus</span>
        </div>
      </div>
    </div>
  );
}
