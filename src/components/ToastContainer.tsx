'use client';

import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import Toast from './Toast';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right'
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const prevToastsLengthRef = useRef(0);
  const latestToastRef = useRef<HTMLDivElement | null>(null);

  // Focus management for new toasts
  useEffect(() => {
    if (toasts.length > prevToastsLengthRef.current) {
      // A new toast was added, focus it after a short delay for animation
      const timer = setTimeout(() => {
        // Find the newest toast (first in the array for top-positioned, last for bottom)
        const isNewToastTop = position.startsWith('top');
        const toastIndex = isNewToastTop ? 0 : toasts.length - 1;

        const toastElements = document.querySelectorAll('[role="alert"], [role="status"]');
        if (toastElements[toastIndex]) {
          (toastElements[toastIndex] as HTMLElement).focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    prevToastsLengthRef.current = toasts.length;
  }, [toasts.length, position]);

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
