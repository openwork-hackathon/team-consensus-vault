'use client';

import { Analyst } from '@/lib/types';
import { motion } from 'framer-motion';

interface AnalystCardProps {
  analyst: Analyst;
  index: number;
}

export default function AnalystCard({ analyst, index }: AnalystCardProps) {
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
      className={`relative rounded-lg border-2 p-4 transition-all duration-300 ${sentimentColors[analyst.sentiment]}`}
      style={{ borderColor: analyst.borderColor }}
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
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-bold">{analyst.confidence}%</div>
          <div className="text-xs text-muted-foreground hidden sm:block">confidence</div>
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
