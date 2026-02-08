'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SignalHistoryEntry {
  id: string;
  timestamp: number;
  query: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  asset?: string;
  // Trade outcome tracking
  tradeExecuted?: boolean;
  tradeId?: string;
  entryPrice?: number;
  exitPrice?: number;
  // P&L tracking
  pnl?: number;
  pnlPercentage?: number;
  tradeStatus?: 'pending' | 'open' | 'closed' | 'cancelled';
}

interface SignalHistoryProps {
  signals?: SignalHistoryEntry[];
  maxEntries?: number;
  className?: string;
}

export default function SignalHistory({
  signals = [],
  maxEntries = 10,
  className = ''
}: SignalHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const signalColors = {
    BUY: {
      bg: 'bg-bullish/10',
      border: 'border-bullish',
      text: 'text-bullish',
      icon: '🚀'
    },
    SELL: {
      bg: 'bg-bearish/10',
      border: 'border-bearish',
      text: 'text-bearish',
      icon: '⚠️'
    },
    HOLD: {
      bg: 'bg-neutral/10',
      border: 'border-neutral',
      text: 'text-neutral',
      icon: '⏸️'
    }
  };

  // Limit to maxEntries most recent signals
  const displaySignals = signals.slice(-maxEntries).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-6 border border-border ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Signal History</h2>
        <p className="text-sm text-muted-foreground">
          Recent AI consensus signals (last {maxEntries})
        </p>
      </div>

      {/* Signal List */}
      {displaySignals.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-sm">No signals yet</p>
          <p className="text-xs mt-1">
            Run a consensus analysis to see signal history
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySignals.map((signal) => {
            const colors = signalColors[signal.signalType];
            const isExpanded = expandedIds.has(signal.id);

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-lg border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all`}
              >
                {/* Signal Header (Always Visible) */}
                <button
                  onClick={() => toggleExpand(signal.id)}
                  className="w-full p-4 text-left hover:bg-background/20 transition-colors touch-manipulation"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Signal Type and Confidence */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{colors.icon}</span>
                        <span className={`font-bold text-lg ${colors.text}`}>
                          {signal.signalType}
                        </span>
                        <span className={`text-sm font-semibold ${colors.text}`}>
                          {signal.confidence}%
                        </span>
                        {/* Trade Outcome & P&L */}
                        {signal.tradeExecuted && (
                          <div className="ml-auto flex items-center gap-2">
                            {signal.pnl !== undefined && (
                              <span className={`text-sm font-bold ${
                                signal.pnl >= 0 ? 'text-bullish' : 'text-bearish'
                              }`}>
                                {signal.pnl >= 0 ? '+' : ''}${Math.abs(signal.pnl).toFixed(2)}
                              </span>
                            )}
                            {signal.tradeStatus && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                signal.tradeStatus === 'closed'
                                  ? signal.pnl && signal.pnl >= 0
                                    ? 'bg-bullish/20 text-bullish'
                                    : 'bg-bearish/20 text-bearish'
                                  : signal.tradeStatus === 'open'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {signal.tradeStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Query Text */}
                      <p className="text-sm font-medium text-foreground/90 mb-1 truncate">
                        {signal.asset || signal.query}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(signal.timestamp)}
                      </p>
                    </div>

                    {/* Expand/Collapse Indicator */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground text-lg flex-shrink-0"
                    >
                      ▼
                    </motion.div>
                  </div>
                </button>

                {/* Reasoning (Expandable) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border/50"
                    >
                      <div className="p-4 bg-background/30 space-y-4">
                        {/* AI Reasoning */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            AI Reasoning
                          </h4>
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {signal.reasoning || 'No reasoning provided'}
                          </p>
                        </div>

                        {/* Trade Outcome Details */}
                        {signal.tradeExecuted && (
                          <div className="pt-3 border-t border-border/30">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                              Trade Outcome
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                                <div className="text-sm font-semibold">
                                  {signal.entryPrice ? `$${signal.entryPrice.toLocaleString()}` : '-'}
                                </div>
                              </div>
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">Exit Price</div>
                                <div className="text-sm font-semibold">
                                  {signal.exitPrice ? `$${signal.exitPrice.toLocaleString()}` : '-'}
                                </div>
                              </div>
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">P&L</div>
                                <div className={`text-sm font-bold ${
                                  signal.pnl && signal.pnl >= 0 ? 'text-bullish' : 'text-bearish'
                                }`}>
                                  {signal.pnl !== undefined ? (
                                    <>
                                      {signal.pnl >= 0 ? '+' : ''}${signal.pnl.toFixed(2)}
                                      {signal.pnlPercentage !== undefined && (
                                        <span className="text-xs ml-1">
                                          ({signal.pnlPercentage >= 0 ? '+' : ''}{signal.pnlPercentage.toFixed(1)}%)
                                        </span>
                                      )}
                                    </>
                                  ) : '-'}
                                </div>
                              </div>
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">Status</div>
                                <div className={`text-sm font-semibold ${
                                  signal.tradeStatus === 'closed'
                                    ? signal.pnl && signal.pnl >= 0
                                      ? 'text-bullish'
                                      : 'text-bearish'
                                    : signal.tradeStatus === 'open'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }`}>
                                  {signal.tradeStatus || 'pending'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      {displaySignals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Showing {displaySignals.length} of {signals.length} total signals
          </p>
        </div>
      )}
    </motion.div>
  );
}
