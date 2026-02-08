'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (amount: string) => Promise<void>;
  depositedBalance: string;
}

const WITHDRAWAL_COOLDOWN_SECONDS = 5;

export default function WithdrawModal({ isOpen, onClose, onWithdraw, depositedBalance }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { isConnected } = useAccount();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError('');
      setIsLoading(false);
      setShowConfirmation(false);
      setCooldownRemaining(0);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

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

    const balance = parseFloat(depositedBalance);
    if (numAmount > balance) {
      setError(`Insufficient balance. Available: ${depositedBalance} ETH`);
      return false;
    }

    // Warn if withdrawing more than 90% of balance
    if (numAmount > balance * 0.9) {
      return true; // Valid but will show confirmation
    }

    return true;
  };

  const handleMaxClick = () => {
    if (depositedBalance && parseFloat(depositedBalance) > 0) {
      setAmount(depositedBalance);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAmount()) {
      return;
    }

    // Check if withdrawing >90% requires confirmation
    const numAmount = parseFloat(amount);
    const balance = parseFloat(depositedBalance);
    if (numAmount > balance * 0.9 && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onWithdraw(amount);
      setCooldownRemaining(WITHDRAWAL_COOLDOWN_SECONDS);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdrawal = () => {
    setShowConfirmation(false);
    handleSubmit(new Event('submit') as any);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Withdraw from Vault</h2>
              <button
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
            <div className="mb-6 p-4 bg-background rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Your Deposited Balance</div>
              <div className="text-lg font-semibold">
                {depositedBalance} ETH
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.0"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    disabled={isLoading || parseFloat(depositedBalance) <= 0}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    MAX
                  </button>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-bearish flex items-center gap-1"
                  >
                    <span>⚠</span> {error}
                  </motion.p>
                )}
              </div>

              {/* Info */}
              <div className="mb-6 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Withdraw your deposited funds from the vault. Your withdrawal will be processed instantly.
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
                  disabled={isLoading || !amount || parseFloat(depositedBalance) <= 0}
                  className="flex-1 px-4 py-3 bg-bearish text-white rounded-lg font-semibold hover:bg-bearish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
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
                    'Withdraw'
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
