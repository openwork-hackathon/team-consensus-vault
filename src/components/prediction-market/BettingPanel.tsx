'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { RoundState, BettingPool as BettingPoolType } from '@/lib/prediction-market/types';

interface BettingPanelProps {
  round: RoundState;
  pool: BettingPoolType;
  onPlaceBet: (side: 'agree' | 'disagree', amount: number) => Promise<void>;
  isConnected: boolean;
  address: string | undefined;
  bettingTimeRemaining: number;
}

export default function BettingPanel({
  round,
  pool,
  onPlaceBet,
  isConnected,
  address,
  bettingTimeRemaining,
}: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState<string>('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(bettingTimeRemaining);
  const [userBets, setUserBets] = useState<Array<{side: 'agree' | 'disagree', amount: number}>>([]);

  // Update timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle amount input with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and up to 2 decimal places
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setBetAmount(value);
    }
  };

  // Handle quick amount buttons
  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  // Validate amount (min 100 as per requirements)
  const validateAmount = (amount: number): { isValid: boolean; error?: string } => {
    if (!amount || isNaN(amount)) {
      return { isValid: false, error: 'Please enter a valid amount' };
    }

    if (amount < 100) {
      return { isValid: false, error: 'Minimum bet amount is $100' };
    }

    if (amount > 10000) {
      return { isValid: false, error: 'Maximum bet amount is $10,000' };
    }

    return { isValid: true };
  };

  // Handle placing a bet
  const handlePlaceBet = async (side: 'agree' | 'disagree') => {
    if (!isConnected) {
      toast.error('Please connect your wallet to place bets');
      return;
    }

    const amount = parseFloat(betAmount);
    const validation = validateAmount(amount);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid bet amount');
      return;
    }

    setIsPlacing(true);
    try {
      await onPlaceBet(side, amount);
      toast.success(`Bet placed: $${amount} on ${side.toUpperCase()}`);
      
      // Add to user bets
      setUserBets(prev => [...prev, { side, amount }]);
      setBetAmount('');
    } catch (error) {
      toast.error('Failed to place bet');
      console.error('Bet placement error:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate agree/disagree percentages for progress bar
  const agreePercentage = pool.totalPool > 0 ? (pool.totalLong / pool.totalPool) * 100 : 50;
  const disagreePercentage = 100 - agreePercentage;

  // Calculate potential payout
  const getPotentialPayout = (amount: number, side: 'agree' | 'disagree') => {
    const odds = side === 'agree' ? pool.longOdds : pool.shortOdds;
    return amount * odds;
  };

  const isValidAmount = betAmount && parseFloat(betAmount) >= 100 && parseFloat(betAmount) <= 10000;

  // Calculate total user bets
  const totalUserBets = userBets.reduce((sum, bet) => sum + bet.amount, 0);
  const agreeBets = userBets.filter(bet => bet.side === 'agree').reduce((sum, bet) => sum + bet.amount, 0);
  const disagreeBets = userBets.filter(bet => bet.side === 'disagree').reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-card rounded-xl border border-border p-6 space-y-6"
      role="region"
      aria-label="Prediction market betting panel"
    >
      {/* Signal Display Header */}
      <div className="text-center space-y-3" role="status" aria-live="polite">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-primary">AI Council Signal</span>
        </div>
        <h2 className="text-2xl font-bold">
          {round.direction === 'long' ? 'BUY' : 'SELL'} {round.asset} at {formatCurrency(round.entryPrice)}
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Consensus: {round.consensusLevel}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Votes: {round.consensusVotes}/{round.totalVotes}</span>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="bg-background/50 rounded-lg p-4 border border-border" role="timer" aria-live="polite" aria-atomic="true">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">⏰</span>
            <span className="font-medium">Betting Window Closes In</span>
          </div>
          <div
            className={`text-2xl font-bold ${timeRemaining < 60 ? 'text-red-500' : 'text-foreground'}`}
            aria-label={`Time remaining: ${formatTimeRemaining(timeRemaining)}`}
          >
            {formatTimeRemaining(timeRemaining)}
          </div>
        </div>
        <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={(timeRemaining / bettingTimeRemaining) * 100} aria-valuemin={0} aria-valuemax={100} aria-label="Betting time remaining">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeRemaining / bettingTimeRemaining) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Live Odds Display */}
      <div className="grid grid-cols-2 gap-4" role="region" aria-label="Live betting pools">
        <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20" role="status" aria-live="polite">
          <div className="text-xs text-muted-foreground mb-1">AGREE Pool</div>
          <div className="text-2xl font-bold text-green-500" aria-label={`Agree pool total: ${formatCurrency(pool.totalLong)}`}>{formatCurrency(pool.totalLong)}</div>
          <div className="text-sm text-muted-foreground mt-1" aria-label={`${pool.longBetCount} bets placed`}>{pool.longBetCount} bets</div>
          <div className="text-lg font-bold text-green-500 mt-2" aria-label={`${pool.longOdds.toFixed(2)} times payout multiplier`}>{pool.longOdds.toFixed(2)}x payout</div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20" role="status" aria-live="polite">
          <div className="text-xs text-muted-foreground mb-1">DISAGREE Pool</div>
          <div className="text-2xl font-bold text-red-500" aria-label={`Disagree pool total: ${formatCurrency(pool.totalShort)}`}>{formatCurrency(pool.totalShort)}</div>
          <div className="text-sm text-muted-foreground mt-1" aria-label={`${pool.shortBetCount} bets placed`}>{pool.shortBetCount} bets</div>
          <div className="text-lg font-bold text-red-500 mt-2" aria-label={`${pool.shortOdds.toFixed(2)} times payout multiplier`}>{pool.shortOdds.toFixed(2)}x payout</div>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-green-500 font-medium">AGREE {agreePercentage.toFixed(1)}%</span>
          <span className="text-red-500 font-medium">DISAGREE {disagreePercentage.toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${agreePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.div
            className="h-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${disagreePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Bet Amount Input */}
      <div className="space-y-4">
        <div>
          <label htmlFor="bet-amount" className="block text-sm font-medium mb-2">
            Bet Amount (USD)
          </label>
          <div className="relative">
            <input
              id="bet-amount"
              type="text"
              inputMode="decimal"
              value={betAmount}
              onChange={handleAmountChange}
              placeholder="100"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              disabled={!isConnected || isPlacing}
              aria-describedby="bet-amount-description bet-amount-constraints"
              aria-invalid={betAmount ? parseFloat(betAmount) < 100 : false}
            />
            <span id="bet-amount-description" className="sr-only">
              Enter the amount in USD you want to bet on the AI council signal.
            </span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
              USD
            </div>
          </div>
          <div id="bet-amount-constraints" className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Min: {formatCurrency(100)}</span>
            <span>Max: {formatCurrency(10000)}</span>
          </div>
          {betAmount && parseFloat(betAmount) < 100 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-500"
              role="alert"
              aria-live="assertive"
            >
              Minimum bet amount is $100
            </motion.p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Quick bet amount buttons">
          {[100, 250, 500, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickAmount(amount)}
              disabled={!isConnected || isPlacing}
              className="px-3 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Set bet amount to ${amount} dollars`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Potential Payout */}
      {isValidAmount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-secondary/30 rounded-lg p-4 border border-border"
        >
          <div className="text-sm text-muted-foreground mb-2">Potential Payout</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-500 font-medium">AGREE ({pool.longOdds.toFixed(2)}x):</span>
              <span className="font-bold">{formatCurrency(getPotentialPayout(parseFloat(betAmount), 'agree'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-500 font-medium">DISAGREE ({pool.shortOdds.toFixed(2)}x):</span>
              <span className="font-bold">{formatCurrency(getPotentialPayout(parseFloat(betAmount), 'disagree'))}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4" role="group" aria-label="Place bet buttons">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePlaceBet('agree')}
          disabled={!isValidAmount || isPlacing || !isConnected}
          className="px-6 py-4 bg-green-500 hover:bg-green-600 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
          aria-label={`Place ${betAmount ? formatCurrency(parseFloat(betAmount)) : ''} bet on AGREE`}
        >
          {isPlacing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              <span>Placing...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">✓</span>
              <span>AGREE</span>
            </>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePlaceBet('disagree')}
          disabled={!isValidAmount || isPlacing || !isConnected}
          className="px-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
          aria-label={`Place ${betAmount ? formatCurrency(parseFloat(betAmount)) : ''} bet on DISAGREE`}
        >
          {isPlacing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              <span>Placing...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">✗</span>
              <span>DISAGREE</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
          <div className="text-lg mb-2">🔒</div>
          <p className="font-medium text-yellow-500">Connect your wallet to place bets</p>
          <p className="text-sm text-muted-foreground mt-1">
            You need to connect your wallet to participate in the prediction market
          </p>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Wallet Connected</span>
            </div>
            <span className="text-sm text-muted-foreground font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
      )}

      {/* Your Bets Section */}
      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-bold mb-3">Your Bets</h3>
        {userBets.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-muted-foreground">No bets placed yet</p>
            <p className="text-sm text-muted-foreground mt-1">Place your first bet above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userBets.map((bet, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  bet.side === 'agree' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bet.side === 'agree' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {bet.side === 'agree' ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="font-medium">{bet.side.toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="font-bold">{formatCurrency(bet.amount)}</div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-medium">Total Bets:</span>
              <span className="font-bold">{formatCurrency(totalUserBets)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Demo Mode Badge */}
      <div className="text-center pt-4 border-t border-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <span className="text-xs">🔄</span>
          <span className="text-xs font-medium text-primary">Demo Mode</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is a demonstration interface. Real betting functionality requires integration with smart contracts.
        </p>
      </div>
    </motion.div>
  );
}