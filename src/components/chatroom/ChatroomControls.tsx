'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatroomControlsProps {
  messageCount: number;
  estimatedSize: number;
  hasStoredData: boolean;
  onClearHistory: () => void;
  isConnected: boolean;
  phase: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ChatroomControls({
  messageCount,
  estimatedSize,
  hasStoredData,
  onClearHistory,
  isConnected,
  phase,
}: ChatroomControlsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onClearHistory();
    setIsClearing(false);
    setShowConfirmDialog(false);
  };

  const handleCancelClear = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Storage info */}
      {hasStoredData && (
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <span>{messageCount} msgs</span>
          <span className="opacity-50">({formatBytes(estimatedSize)})</span>
        </div>
      )}

      {/* Connection status */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
        <span className="text-muted-foreground hidden sm:inline">
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      {/* Phase badge */}
      <div className="hidden md:block">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          phase === 'DEBATE' ? 'bg-green-500/20 text-green-400' :
          phase === 'CONSENSUS' ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {phase}
        </span>
      </div>

      {/* Clear history button */}
      {hasStoredData && (
        <button
          onClick={handleClearClick}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10"
          aria-label="Clear chat history"
          title="Clear stored chat history"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Clear</span>
        </button>
      )}

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCancelClear}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Clear History?</h3>
                  <p className="text-sm text-muted-foreground">
                    This will delete {messageCount} stored messages
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
                <p>This action will:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-1">
                  <li>Remove all stored messages from this device</li>
                  <li>Clear the cached missed conversation summary</li>
                  <li>Reset your session continuity tracking</li>
                </ul>
                <p className="mt-2 text-xs opacity-75">
                  New messages will continue to be stored automatically.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelClear}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClear}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isClearing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Clearing...
                    </>
                  ) : (
                    'Clear History'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
