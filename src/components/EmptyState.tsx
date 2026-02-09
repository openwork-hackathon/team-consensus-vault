'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
    >
      {/* Icon */}
      <div className="mb-4">
        {typeof icon === 'string' ? (
          <span className="text-6xl opacity-50">{icon}</span>
        ) : (
          icon
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-center">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// Specialized empty state variants
export function NoBetsEmptyState() {
  return (
    <EmptyState
      icon="💰"
      title="No bets yet"
      description="Be the first to place a bet on this round. Connect your wallet and choose your position."
    />
  );
}

export function NoRoundsEmptyState() {
  return (
    <EmptyState
      icon="🔍"
      title="No active rounds"
      description="The AI council is scanning market conditions. A new betting round will start when consensus is reached."
    />
  );
}

export function DisconnectedEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="🔌"
      title="Connection lost"
      description="Unable to connect to the prediction market. Please check your internet connection and try again."
      action={onRetry ? {
        label: 'Retry Connection',
        onClick: onRetry
      } : undefined}
    />
  );
}

export function NoHistoryEmptyState() {
  return (
    <EmptyState
      icon="📊"
      title="No trading history"
      description="You haven't participated in any rounds yet. Place your first bet to start building your trading history."
    />
  );
}

export function WalletNotConnectedEmptyState({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      icon="👛"
      title="Wallet not connected"
      description="Connect your wallet to participate in prediction markets and track your bets."
      action={onConnect ? {
        label: 'Connect Wallet',
        onClick: onConnect
      } : undefined}
    />
  );
}
