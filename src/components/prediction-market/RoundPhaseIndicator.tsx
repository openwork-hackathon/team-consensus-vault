'use client';

import { RoundPhase } from '@/lib/prediction-market/types';

interface RoundPhaseIndicatorProps {
  phase: RoundPhase;
  className?: string;
}

const phaseConfig = {
  [RoundPhase.SCANNING]: {
    label: 'Scanning',
    description: 'AI agents analyzing market conditions',
    icon: '🔍',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
  [RoundPhase.ENTRY_SIGNAL]: {
    label: 'Entry Signal',
    description: 'Consensus reached, preparing bets',
    icon: '📊',
    color: 'bg-green-500/10 text-green-500 border-green-500/30',
  },
  [RoundPhase.BETTING_WINDOW]: {
    label: 'Betting Window',
    description: 'Place your bets now!',
    icon: '💰',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  },
  [RoundPhase.POSITION_OPEN]: {
    label: 'Position Open',
    description: 'Tracking live P&L',
    icon: '📈',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  },
  [RoundPhase.EXIT_SIGNAL]: {
    label: 'Exit Signal',
    description: 'Position closing',
    icon: '🚪',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  },
  [RoundPhase.SETTLEMENT]: {
    label: 'Settlement',
    description: 'Calculating payouts',
    icon: '💸',
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  },
};

export default function RoundPhaseIndicator({ phase, className = '' }: RoundPhaseIndicatorProps) {
  const config = phaseConfig[phase];

  return (
    <div className={`${className}`} role="region" aria-label="Round phase indicator" aria-live="polite">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 ${config.color} transition-all`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Current phase: ${config.label}. ${config.description}`}
      >
        <div className="text-3xl" aria-hidden="true">
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg" id="round-phase-label">{config.label}</div>
          <div className="text-sm opacity-80" id="round-phase-description">{config.description}</div>
        </div>
      </div>
    </div>
  );
}
