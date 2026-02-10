'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsensusSnapshot, MessageSentiment } from '@/lib/chatroom/types';

interface ConsensusSnapshotHistoryProps {
  snapshots?: ConsensusSnapshot[];
  isLoading?: boolean;
}

interface SnapshotWithFormattedDate extends ConsensusSnapshot {
  formattedDate: string;
  formattedTime: string;
  timeAgo: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSentimentColor(sentiment: MessageSentiment): string {
  switch (sentiment) {
    case 'bullish':
      return 'text-green-500 bg-green-500/10 border-green-500/30';
    case 'bearish':
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
  }
}

function getSentimentEmoji(sentiment: MessageSentiment): string {
  switch (sentiment) {
    case 'bullish':
      return '📈';
    case 'bearish':
      return '📉';
    default:
      return '⚖️';
  }
}

function getSnapshotReasonLabel(reason: ConsensusSnapshot['snapshotReason']): string {
  switch (reason) {
    case 'consensus_reached':
      return 'Consensus Reached';
    case 'time_window_rollover':
      return 'Time Window Archive';
    case 'manual':
      return 'Manual Snapshot';
    default:
      return 'Archived';
  }
}

export default function ConsensusSnapshotHistory({
  snapshots = [],
  isLoading = false,
}: ConsensusSnapshotHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ConsensusSnapshot | null>(null);
  const [formattedSnapshots, setFormattedSnapshots] = useState<SnapshotWithFormattedDate[]>([]);

  // Format snapshots with dates
  useEffect(() => {
    const formatted = snapshots.map(snapshot => ({
      ...snapshot,
      formattedDate: formatDate(snapshot.timestamp),
      formattedTime: formatTime(snapshot.timestamp),
      timeAgo: formatTimeAgo(snapshot.timestamp),
    }));
    setFormattedSnapshots(formatted);
  }, [snapshots]);

  // Auto-expand if there are new snapshots
  useEffect(() => {
    if (snapshots.length > 0 && !isExpanded) {
      // Don't auto-expand, let user control this
    }
  }, [snapshots.length, isExpanded]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📸</span>
          <h3 className="font-semibold text-sm">Consensus History</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No consensus snapshots yet. Snapshots are created when consensus is reached or when messages age out of the 1-hour window.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <div>
            <h3 className="font-semibold text-sm">Consensus History</h3>
            <p className="text-xs text-muted-foreground">
              {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} preserved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Latest consensus preview */}
          {snapshots.length > 0 && !isExpanded && (
            <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(snapshots[snapshots.length - 1].consensusDirection)}`}>
              <span>{getSentimentEmoji(snapshots[snapshots.length - 1].consensusDirection)}</span>
              <span>{snapshots[snapshots.length - 1].consensusDirection.toUpperCase()}</span>
              <span className="opacity-75">{Math.round(snapshots[snapshots.length - 1].consensusStrength * 100)}%</span>
            </div>
          )}
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border">
              {/* Info banner */}
              <div className="py-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 my-3">
                <p>
                  💡 <strong>About Snapshots:</strong> Messages older than 1 hour are pruned from the active chat,
                  but consensus snapshots preserve the key decisions and arguments permanently.
                </p>
              </div>

              {/* Snapshot list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {formattedSnapshots.slice().reverse().map((snapshot, index) => (
                  <motion.button
                    key={snapshot.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedSnapshot(snapshot)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getSentimentEmoji(snapshot.consensusDirection)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase ${getSentimentColor(snapshot.consensusDirection).split(' ')[0]}`}>
                              {snapshot.consensusDirection}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(snapshot.consensusStrength * 100)}% strength
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{snapshot.formattedDate}</span>
                            <span>•</span>
                            <span>{snapshot.formattedTime}</span>
                            <span className="text-xs opacity-75">({snapshot.timeAgo})</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          snapshot.snapshotReason === 'consensus_reached'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {getSnapshotReasonLabel(snapshot.snapshotReason)}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1">
                          {snapshot.messageCount} msgs
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSnapshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSnapshot(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSentimentEmoji(selectedSnapshot.consensusDirection)}</span>
                  <div>
                    <h3 className="font-semibold">
                      {selectedSnapshot.consensusDirection.toUpperCase()} Consensus
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(selectedSnapshot.timestamp)} at {formatTime(selectedSnapshot.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{Math.round(selectedSnapshot.consensusStrength * 100)}%</div>
                    <div className="text-xs text-muted-foreground">Strength</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{selectedSnapshot.messageCount}</div>
                    <div className="text-xs text-muted-foreground">Messages</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{selectedSnapshot.topPersonaContributions.length}</div>
                    <div className="text-xs text-muted-foreground">Contributors</div>
                  </div>
                </div>

                {/* Key Arguments */}
                <div className="space-y-3">
                  {selectedSnapshot.keyArgumentsSummary.bullish.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-1">
                        <span>📈</span> Bullish Arguments
                      </h4>
                      <ul className="space-y-1">
                        {selectedSnapshot.keyArgumentsSummary.bullish.map((arg, i) => (
                          <li key={i} className="text-xs text-muted-foreground bg-green-500/5 rounded px-2 py-1.5">
                            {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedSnapshot.keyArgumentsSummary.bearish.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1">
                        <span>📉</span> Bearish Arguments
                      </h4>
                      <ul className="space-y-1">
                        {selectedSnapshot.keyArgumentsSummary.bearish.map((arg, i) => (
                          <li key={i} className="text-xs text-muted-foreground bg-red-500/5 rounded px-2 py-1.5">
                            {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Top Contributors */}
                {selectedSnapshot.topPersonaContributions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2">Top Contributors</h4>
                    <div className="space-y-2">
                      {selectedSnapshot.topPersonaContributions.map((contributor) => (
                        <div key={contributor.personaId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              contributor.primaryStance === 'bullish' ? 'bg-green-500' :
                              contributor.primaryStance === 'bearish' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                            <span className="font-medium">{contributor.handle}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {contributor.messageCount} msgs • {contributor.primaryStance}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Range */}
                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <p>
                    <strong>Time Range:</strong>{' '}
                    {formatTime(selectedSnapshot.timestampRange.start)} - {formatTime(selectedSnapshot.timestampRange.end)}
                  </p>
                  <p className="mt-1">
                    <strong>Snapshot Type:</strong>{' '}
                    {getSnapshotReasonLabel(selectedSnapshot.snapshotReason)}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
