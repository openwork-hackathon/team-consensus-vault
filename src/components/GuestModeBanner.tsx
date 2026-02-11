'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGuest } from '@/contexts/GuestContext';
import { useAccount } from 'wagmi';

interface GuestModeBannerProps {
  onConnectWallet?: () => void;
  className?: string;
}

/**
 * GuestModeBanner - Displays when user is in guest mode
 * Shows guest status and provides a non-intrusive prompt to connect wallet
 */
export default function GuestModeBanner({ 
  onConnectWallet, 
  className = '' 
}: GuestModeBannerProps) {
  const { isGuestMode, guestUser, clearGuestUser } = useGuest();
  const { isConnected } = useAccount();

  // Don't show if user is connected with wallet
  if (isConnected) {
    return null;
  }

  return (
    <AnimatePresence>
      {isGuestMode && guestUser && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border-b border-blue-500/20 ${className}`}
          role="status"
          aria-label="Guest mode active"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Guest Status */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Guest Mode</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      {guestUser.username}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can view and chat. Connect wallet for full access.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onConnectWallet}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors touch-manipulation min-h-[40px]"
                  aria-label="Connect wallet to unlock full features"
                >
                  Connect Wallet
                </button>
                <button
                  onClick={clearGuestUser}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[40px]"
                  aria-label="Exit guest mode"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact version for use in headers or small spaces
 */
export function GuestModeBadge({ onConnectWallet }: { onConnectWallet?: () => void }) {
  const { isGuestMode, guestUser } = useGuest();
  const { isConnected } = useAccount();

  if (isConnected || !isGuestMode || !guestUser) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2"
    >
      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
        👤 {guestUser.username}
      </span>
      <button
        onClick={onConnectWallet}
        className="text-xs text-primary hover:text-primary/80 underline"
        aria-label="Connect wallet"
      >
        Connect
      </button>
    </motion.div>
  );
}

/**
 * Prompt shown when guest tries to perform an action requiring wallet
 */
export function WalletRequiredPrompt({ 
  isOpen, 
  onClose, 
  onConnect, 
  action = 'perform this action' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConnect: () => void;
  action?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-required-title"
          >
            <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">👛</span>
                </div>
                
                <h3 id="wallet-required-title" className="text-lg font-bold mb-2">
                  Wallet Connection Required
                </h3>
                
                <p className="text-sm text-muted-foreground mb-6">
                  You need to connect your wallet to {action}. 
                  Your chat messages and activity will be preserved.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onConnect}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors touch-manipulation min-h-[44px]"
                  >
                    Connect Wallet
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors touch-manipulation min-h-[44px]"
                  >
                    Continue as Guest
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
