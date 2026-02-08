'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface EnhancedToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
}

const toastIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const toastColors = {
  success: 'bg-bullish text-white',
  error: 'bg-bearish text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

export default function EnhancedToastContainer({
  toasts,
  onRemove,
  position = 'top-right',
  maxVisible = 5,
}: EnhancedToastContainerProps) {
  // Auto-remove toasts after duration
  useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration || 5000;
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [toasts, onRemove]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Limit visible toasts
  const visibleToasts = toasts.slice(-maxVisible);

  return (
    <div className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]} pointer-events-none`}>
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0, y: position.includes('top') ? -50 : 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`${toastColors[toast.type]} rounded-lg shadow-lg p-4 min-w-[300px] max-w-md pointer-events-auto`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{toastIcons[toast.type]}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action!.onClick();
                      onRemove(toast.id);
                    }}
                    className="mt-2 text-sm underline hover:no-underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 ml-2 hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Close toast"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            {/* Progress Bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    message: string,
    type: ToastData['type'] = 'info',
    options?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastData = {
      id,
      message,
      type,
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) => {
    return addToast(message, 'error', options);
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  };
}
