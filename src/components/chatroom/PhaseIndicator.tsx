'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatPhase } from '@/lib/chatroom/types';

interface PhaseIndicatorProps {
  phase: ChatPhase;
  cooldownEndsAt: number | null;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function PhaseIndicator({ phase, cooldownEndsAt }: PhaseIndicatorProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (phase !== 'COOLDOWN' || !cooldownEndsAt) {
      setCountdown('');
      return;
    }

    const update = () => {
      const remaining = cooldownEndsAt - Date.now();
      setCountdown(remaining > 0 ? formatCountdown(remaining) : '0:00');
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [phase, cooldownEndsAt]);

  if (phase === 'DEBATE') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-bullish/10 border-b border-bullish/20">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-bullish"
        />
        <span className="text-xs font-semibold text-bullish uppercase tracking-wider">
          Live Debate
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto">
          Sentiment tracking active
        </span>
      </div>
    );
  }

  if (phase === 'CONSENSUS') {
    return (
      <motion.div
        initial={{ backgroundColor: 'rgba(234, 179, 8, 0)' }}
        animate={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}
        className="flex items-center gap-2 px-3 py-1.5 border-b border-yellow-500/30"
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="text-sm"
        >
          &#x1F3AF;
        </motion.span>
        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
          Consensus Reached
        </span>
        <span className="text-[11px] text-yellow-400/70 ml-auto">
          Trade signal firing
        </span>
      </motion.div>
    );
  }

  // COOLDOWN
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border-b border-blue-500/20">
      <div className="w-2 h-2 rounded-full bg-blue-400" />
      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
        Cooldown
      </span>
      {countdown && (
        <span className="text-xs text-blue-400/80 font-mono">
          {countdown}
        </span>
      )}
      <span className="text-[11px] text-muted-foreground ml-auto">
        Casual mode
      </span>
    </div>
  );
}
