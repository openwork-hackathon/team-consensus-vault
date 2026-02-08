'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({ 
  size = 'md', 
  className = '',
  text 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

// Inline spinner for buttons
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

// Full page loading overlay
export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-lg font-medium text-foreground">{text}</p>
      </div>
    </div>
  );
}

// Section loading state
export function SectionLoader({ 
  text = 'Loading...',
  className = '' 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
