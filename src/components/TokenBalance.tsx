'use client';

import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useAccount } from 'wagmi';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TokenBalanceProps {
  /** Optional custom className for styling */
  className?: string;
  /** Whether to show the refresh button */
  showRefresh?: boolean;
  /** Whether to show the token symbol */
  showSymbol?: boolean;
  /** Custom label text (default: "Balance") */
  label?: string;
  /** Whether to use compact display for small spaces */
  compact?: boolean;
}

/**
 * TokenBalance Component
 * 
 * Displays the connected wallet's CONSENSUS token balance with:
 * - Real-time balance fetching from on-chain
 * - Loading state with spinner
 * - Error state with retry button
 * - Auto-refresh every 30 seconds
 * - Manual refresh button
 * - Formatted number display with commas
 * 
 * @example
 * ```tsx
 * // Standard display
 * <TokenBalance />
 * 
 * // Compact display for nav/header
 * <TokenBalance compact showRefresh={false} />
 * 
 * // Custom styling
 * <TokenBalance className="bg-card p-4 rounded-lg" label="Your Tokens" />
 * ```
 */
export function TokenBalance({
  className = '',
  showRefresh = true,
  showSymbol = true,
  label = 'Balance',
  compact = false,
}: TokenBalanceProps) {
  const { address, isConnected } = useAccount();
  const { formatted, isLoading, error, symbol, refetch } = useTokenBalance(address);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refetch();
    // Allow animation to complete
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  // Not connected state
  if (!isConnected || !address) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        <span className="text-muted-foreground/60">—</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`} role="alert" aria-live="polite">
        <span className="text-bearish text-sm">Failed to load</span>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Retry loading balance"
            title="Retry"
          >
            <RefreshIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!compact && <span className="text-xs text-muted-foreground">{label}</span>}
        <LoadingSpinner size={compact ? 'sm' : 'md'} />
      </div>
    );
  }

  // Success state
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!compact && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={formatted}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1"
        >
          <span 
            className={`font-semibold text-foreground ${compact ? 'text-sm' : 'text-base'}`}
            aria-label={`Balance: ${formatted} ${symbol}`}
          >
            {formatted}
          </span>
          {showSymbol && (
            <span className="text-xs text-muted-foreground font-medium">
              {symbol}
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      {showRefresh && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          aria-label="Refresh balance"
          title="Refresh"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5, ease: 'linear' }}
          >
            <RefreshIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>
        </button>
      )}
    </div>
  );
}

// Loading spinner component
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin`}
      role="status"
      aria-label="Loading balance"
    />
  );
}

// Refresh icon component
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export default TokenBalance;