'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  isDemoData?: boolean;
}

export default function SignalHistory({
  signals = [],
  maxEntries = 10,
  className = '',
  isDemoData = false
}: SignalHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Keyboard navigation for signal list
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, signalId: string) => {
    const displaySignals = signals.slice(-maxEntries).reverse();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (index < displaySignals.length - 1) {
          setFocusedIndex(index + 1);
          buttonRefs.current[index + 1]?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          setFocusedIndex(index - 1);
          buttonRefs.current[index - 1]?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        buttonRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(displaySignals.length - 1);
        buttonRefs.current[displaySignals.length - 1]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleExpand(signalId);
        break;
    }
  }, [signals, maxEntries]);

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

  // Reset focused index when signals change
  useEffect(() => {
    setFocusedIndex(-1);
    buttonRefs.current = buttonRefs.current.slice(0, displaySignals.length);
  }, [displaySignals.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-6 border border-border max-w-full overflow-hidden ${className}`}
      role="region"
      aria-label="Signal history"
    >
      {/* Demo Data Banner - Prominent Alert */}
      {isDemoData && displaySignals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">
                Viewing Example Data
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This trade history is for demonstration purposes only. Real trading data will appear here after you execute your first consensus signal.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold" id="signal-history-title">Signal History</h2>
          {isDemoData && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border-2 border-amber-500/40">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              DEMO
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground" id="signal-history-description">
          Recent AI consensus signals (last {maxEntries})
        </p>
      </div>

      {/* Signal List */}
      {displaySignals.length === 0 ? (
        <div 
          className="text-center text-muted-foreground py-8"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-sm">No signals yet</p>
          <p className="text-xs mt-1">
            Run a consensus analysis to see signal history
          </p>
        </div>
      ) : (
        <div 
          className="space-y-3"
          role="list"
          aria-labelledby="signal-history-title"
          aria-describedby="signal-history-description"
        >
          {displaySignals.map((signal, index) => {
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
                  ref={el => { buttonRefs.current[index] = el; }}
                  onClick={() => toggleExpand(signal.id)}
                  onKeyDown={(e) => handleKeyDown(e, index, signal.id)}
                  className="w-full p-4 text-left hover:bg-background/20 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  aria-expanded={isExpanded}
                  aria-controls={`signal-details-${signal.id}`}
                  tabIndex={0}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Signal Type and Confidence */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xl" aria-hidden="true">{colors.icon}</span>
                        <span className={`font-bold text-lg ${colors.text}`}>
                          {signal.signalType}
                        </span>
                        <span className={`text-sm font-semibold ${colors.text}`} aria-label={`${signal.confidence} percent confidence`}>
                          {signal.confidence}%
                        </span>
                        {/* Trade Outcome & P&L */}
                        {signal.tradeExecuted && (
                          <div className="ml-auto flex flex-wrap items-center gap-2">
                            {signal.pnl !== undefined && (
                              <span 
                                className={`text-sm font-bold ${
                                  signal.pnl >= 0 ? 'text-bullish' : 'text-bearish'
                                }`}
                                aria-label={`Profit and loss: ${signal.pnl >= 0 ? 'plus' : 'minus'} ${Math.abs(signal.pnl).toFixed(2)} dollars`}
                              >
                                {signal.pnl >= 0 ? '+' : ''}${Math.abs(signal.pnl).toFixed(2)}
                              </span>
                            )}
                            {signal.tradeStatus && (
                              <span 
                                className={`text-xs px-2 py-0.5 rounded ${
                                  signal.tradeStatus === 'closed'
                                    ? signal.pnl && signal.pnl >= 0
                                      ? 'bg-bullish/20 text-bullish'
                                      : 'bg-bearish/20 text-bearish'
                                    : signal.tradeStatus === 'open'
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                                aria-label={`Trade status: ${signal.tradeStatus}`}
                              >
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
                      aria-hidden="true"
                    >
                      ▼
                    </motion.div>
                  </div>
                </button>

                {/* Reasoning (Expandable) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      id={`signal-details-${signal.id}`}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="bg-background/50 rounded-lg p-3 min-w-0 overflow-hidden">
                                <div className="text-xs text-muted-foreground mb-1 whitespace-nowrap">Entry Price</div>
                                <div className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                                  {signal.entryPrice ? `$${signal.entryPrice.toLocaleString()}` : '-'}
                                </div>
                              </div>
                              <div className="bg-background/50 rounded-lg p-3 min-w-0 overflow-hidden">
                                <div className="text-xs text-muted-foreground mb-1 whitespace-nowrap">Exit Price</div>
                                <div className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                                  {signal.exitPrice ? `$${signal.exitPrice.toLocaleString()}` : '-'}
                                </div>
                              </div>
                              <div className="bg-background/50 rounded-lg p-3 min-w-0 overflow-hidden">
                                <div className="text-xs text-muted-foreground mb-1 whitespace-nowrap">P&L</div>
                                <div className={`text-sm font-bold min-w-0 ${
                                  signal.pnl && signal.pnl >= 0 ? 'text-bullish' : 'text-bearish'
                                }`}>
                                  {signal.pnl !== undefined ? (
                                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                                      {signal.pnl >= 0 ? '+' : ''}${signal.pnl.toFixed(2)}
                                      {signal.pnlPercentage !== undefined && (
                                        <span className="text-xs ml-1">
                                          ({signal.pnlPercentage >= 0 ? '+' : ''}{signal.pnlPercentage.toFixed(1)}%)
                                        </span>
                                      )}
                                    </div>
                                  ) : '-'}
                                </div>
                              </div>
                              <div className="bg-background/50 rounded-lg p-3 min-w-0 overflow-hidden">
                                <div className="text-xs text-muted-foreground mb-1 whitespace-nowrap">Status</div>
                                <div className={`text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${
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
        <div 
          className="mt-4 pt-4 border-t border-border/50"
          role="status"
          aria-live="polite"
        >
          <p className="text-xs text-muted-foreground text-center">
            Showing {displaySignals.length} of {signals.length} total signals
          </p>
        </div>
      )}
    </motion.div>
  );
}
