'use client';

import { motion } from 'framer-motion';
import { RoundPhase } from '@/lib/prediction-market/types';

interface RoundStatusProps {
  phase: RoundPhase;
  asset: string;
  entryPrice: number;
  bettingTimeRemaining?: number;
  className?: string;
}

const phaseConfig = {
  [RoundPhase.SCANNING]: {
    label: 'Scanning',
    description: 'AI analyzing market conditions',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    icon: '🔍',
  },
  [RoundPhase.ENTRY_SIGNAL]: {
    label: 'Entry Signal',
    description: 'Consensus reached, preparing bets',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    icon: '📊',
  },
  [RoundPhase.BETTING_WINDOW]: {
    label: 'Betting Window',
    description: 'Place your bets!',
    color: 'bg-bullish/10 text-bullish border-bullish/30',
    icon: '💰',
  },
  [RoundPhase.POSITION_OPEN]: {
    label: 'Position Open',
    description: 'Tracking live P&L',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    icon: '📈',
  },
  [RoundPhase.EXIT_SIGNAL]: {
    label: 'Exit Signal',
    description: 'Position closing soon',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    icon: '🚪',
  },
  [RoundPhase.SETTLEMENT]: {
    label: 'Settlement',
    description: 'Calculating payouts',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    icon: '💸',
  },
};

const phaseOrder = [
  RoundPhase.SCANNING,
  RoundPhase.ENTRY_SIGNAL,
  RoundPhase.BETTING_WINDOW,
  RoundPhase.POSITION_OPEN,
  RoundPhase.EXIT_SIGNAL,
  RoundPhase.SETTLEMENT,
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function RoundStatus({ 
  phase, 
  asset, 
  entryPrice, 
  bettingTimeRemaining = 0, 
  className = '' 
}: RoundStatusProps) {
  const config = phaseConfig[phase];
  const currentPhaseIndex = phaseOrder.indexOf(phase);

  return (
    <div className={`w-full bg-card rounded-xl border border-border p-6 ${className}`}>
      {/* Phase Badge */}
      <motion.div
        key={phase}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border-2 ${config.color} transition-all mb-4`}
      >
        <div className="text-xl" aria-hidden="true">
          {config.icon}
        </div>
        <div>
          <div className="font-bold text-sm">{config.label}</div>
          <div className="text-xs opacity-80">{config.description}</div>
        </div>
      </motion.div>

      {/* Market Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">{asset}/USD</div>
          <div className="text-sm text-muted-foreground">
            Entry: <span className="font-semibold text-foreground">{formatCurrency(entryPrice)}</span>
          </div>
        </div>
        
        {/* Countdown Timer - only visible during BETTING_WINDOW */}
        {phase === RoundPhase.BETTING_WINDOW && bettingTimeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1 bg-secondary/30 rounded-lg"
          >
            <div className="w-2 h-2 bg-bullish rounded-full animate-pulse" />
            <span className="text-sm font-mono font-bold">
              {formatCountdown(bettingTimeRemaining)}
            </span>
          </motion.div>
        )}
      </div>

      {/* 6-Phase Progress Bar */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted/30 rounded-full">
          <motion.div
            className="h-full bg-gradient-to-r from-bullish to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentPhaseIndex / (phaseOrder.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Phase Dots */}
        <div className="relative flex justify-between">
          {phaseOrder.map((phaseItem, index) => {
            const isActive = index <= currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            
            return (
              <div key={phaseItem} className="flex flex-col items-center">
                {/* Dot */}
                <motion.div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted/30 border-muted/50 text-muted-foreground'
                  }`}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ 
                    duration: isCurrent ? 2 : 0,
                    repeat: isCurrent ? Infinity : 0,
                    ease: 'easeInOut'
                  }}
                >
                  {index + 1}
                </motion.div>
                
                {/* Phase Label */}
                <div className={`mt-2 text-xs text-center max-w-16 ${
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {phaseConfig[phaseItem].label.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Status Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Round Phase: {phase.replace(/_/g, ' ')}</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
    </div>
  );
}