'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TradeSignalProps {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | null;
  consensusLevel: number;
  threshold: number;
  isForced?: boolean;
  onExecuteTrade?: () => void;
}

export default function TradeSignal({ recommendation, consensusLevel, threshold, isForced, onExecuteTrade }: TradeSignalProps) {
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

  const signalAriaLabels = {
    BUY: 'Buy signal activated',
    SELL: 'Sell signal activated',
    HOLD: 'Hold signal activated',
  };

  return (
    <AnimatePresence>
      {isActive && recommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`relative rounded-xl border-2 p-4 sm:p-6 bg-gradient-to-br ${signalColors[recommendation]} overflow-hidden`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {/* Pulsing background effect */}
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-3xl sm:text-4xl md:text-5xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-hidden="true"
                >
                  {signalIcons[recommendation]}
                </motion.span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {recommendation}
                    </h3>
                    {isForced && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white/90 rounded-full border border-white/30">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-white/80">
                    {isForced ? 'Forced Signal (Demo Mode)' : 'Trade Signal Active'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tabular-nums" aria-label={`${consensusLevel} percent agreement`}>
                  {consensusLevel}%
                </div>
                <div className="text-xs text-white/80">Agreement</div>
              </div>
            </div>

            <p className="text-white/90 text-sm leading-relaxed mb-4">
              {signalMessages[recommendation]}
            </p>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-lg transition-colors touch-manipulation min-h-[48px]"
              aria-label={`Execute ${recommendation} trade`}
              onClick={onExecuteTrade}
              disabled={!onExecuteTrade}
            >
              Execute Trade
            </motion.button>
          </div>

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
