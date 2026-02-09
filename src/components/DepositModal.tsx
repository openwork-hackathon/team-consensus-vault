'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => Promise<void>;
}

export default function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError('');
      setIsLoading(false);
    } else {
      // Focus on close button when modal opens for accessibility
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Trap focus within modal when open
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const validateAmount = (): boolean => {
    if (!amount || amount.trim() === '') {
      setError('Please enter an amount');
      return false;
    }

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
      setError('Invalid number format');
      return false;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than zero');
      return false;
    }

    // Check for minimum deposit (0.0001 ETH)
    if (numAmount < 0.0001) {
      setError('Minimum deposit is 0.0001 ETH');
      return false;
    }

    // Check for maximum precision (6 decimal places)
    const decimalPlaces = (amount.split('.')[1] || '').length;
    if (decimalPlaces > 6) {
      setError('Maximum 6 decimal places allowed');
      return false;
    }

    if (balance && numAmount > parseFloat(formatEther(balance.value))) {
      setError('Insufficient balance');
      return false;
    }

    return true;
  };

  const handleMaxClick = () => {
    if (balance) {
      // Leave a small amount for gas fees
      const maxAmount = Math.max(0, parseFloat(formatEther(balance.value)) - 0.001);
      setAmount(maxAmount.toFixed(6));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAmount()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onDeposit(amount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  // Touch handlers for swipe to dismiss
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isLoading) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -minSwipeDistance;

    if (isSwipeDown) {
      onClose();
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 safe-top safe-bottom"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deposit-modal-title"
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card border border-border rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 id="deposit-modal-title" className="text-2xl font-bold">Deposit to Vault</h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 touch-manipulation p-2 -m-2"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Balance Display */}
            <div className="mb-6 p-4 bg-background rounded-lg border border-border" role="status" aria-live="polite">
              <div className="text-xs text-muted-foreground mb-1">Available Balance</div>
              <div className="text-lg font-semibold">
                {balance ? `${parseFloat(formatEther(balance.value)).toFixed(6)} ${balance.symbol}` : '0.00 ETH'}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="deposit-amount" className="block text-sm font-medium mb-2">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <input
                    ref={amountInputRef}
                    id="deposit-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.0"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    aria-describedby="deposit-amount-description"
                  />
                  <span id="deposit-amount-description" className="sr-only">
                    Enter the amount of ETH you want to deposit. Minimum is 0.0001 ETH.
                  </span>
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    disabled={isLoading || !balance}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                    aria-label="Set maximum deposit amount"
                  >
                    MAX
                  </button>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-bearish flex items-center gap-1"
                    role="alert"
                    aria-live="assertive"
                  >
                    <span aria-hidden="true">⚠</span> <span>{error}</span>
                  </motion.p>
                )}
              </div>

              {/* Info */}
              <div className="mb-6 p-3 bg-accent/10 border border-accent/20 rounded-lg" role="note">
                <p className="text-xs text-muted-foreground">
                  Your deposit will be used for AI-powered consensus trading. Funds are managed by the vault contract and can be withdrawn at any time.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !amount}
                  className="flex-1 px-4 py-3 bg-bullish text-white rounded-lg font-semibold hover:bg-bullish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Deposit'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
