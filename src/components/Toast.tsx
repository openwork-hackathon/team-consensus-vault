'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-bullish',
    error: 'bg-bearish',
    info: 'bg-accent',
    warning: 'bg-yellow-500'
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }[type];

  const ariaLiveType = type === 'error' || type === 'warning' ? 'assertive' : 'polite';
  const roleType = type === 'error' || type === 'warning' ? 'alert' : 'status';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
      role={roleType}
      aria-live={ariaLiveType}
      aria-atomic="true"
    >
      <span className="text-xl font-bold" aria-hidden="true">{icon}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors p-1 -m-1 rounded touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Close notification"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </motion.div>
  );
}
