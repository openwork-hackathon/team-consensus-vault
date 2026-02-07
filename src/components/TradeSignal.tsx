'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TradeSignalProps {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | null;
  consensusLevel: number;
  threshold: number;
}

export default function TradeSignal({ recommendation, consensusLevel, threshold }: TradeSignalProps) {
  const isActive = consensusLevel >= threshold && recommendation !== null;

  const signalColors = {
    BUY: 'from-bullish to-bullish-light border-bullish',
    SELL: 'from-bearish to-bearish-light border-bearish',
    HOLD: 'from-neutral to-neutral-light border-neutral',
  };

  const signalIcons = {
    BUY: '🚀',
    SELL: '⚠️',
    HOLD: '⏸️',
  };

  const signalMessages = {
    BUY: 'AI consensus recommends entering a long position',
    SELL: 'AI consensus recommends exiting or shorting',
    HOLD: 'AI consensus recommends holding current position',
  };

  return (
    <AnimatePresence>
      {isActive && recommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`relative rounded-xl border-2 p-6 bg-gradient-to-br ${signalColors[recommendation]} overflow-hidden`}
        >
          {/* Pulsing background effect */}
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-5xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {signalIcons[recommendation]}
                </motion.span>
                <div>
                  <h3 className="text-3xl font-bold text-white">
                    {recommendation}
                  </h3>
                  <p className="text-sm text-white/80">Trade Signal Active</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold text-white">{consensusLevel}%</div>
                <div className="text-xs text-white/80">Agreement</div>
              </div>
            </div>

            <p className="text-white/90 text-sm leading-relaxed">
              {signalMessages[recommendation]}
            </p>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Execute Trade
            </motion.button>
          </div>

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
