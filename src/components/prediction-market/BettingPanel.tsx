'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

interface BettingPanelProps {
  roundId: string;
  asset: string;
  direction: 'long' | 'short';
  entryPrice: number;
  minBet: number;
  maxBet: number;
  longOdds: number;
  shortOdds: number;
  onPlaceBet: (amount: number, direction: 'long' | 'short') => Promise<void>;
}

export default function BettingPanel({
  roundId,
  asset,
  direction,
  entryPrice,
  minBet,
  maxBet,
  longOdds,
  shortOdds,
  onPlaceBet,
}: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState<string>('');
  const [isPlacing, setIsPlacing] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setBetAmount(value);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const handlePlaceBet = async (selectedDirection: 'long' | 'short') => {
    const amount = parseFloat(betAmount);
    
    if (!amount || amount < minBet || amount > maxBet) {
      toast.error(`Bet amount must be between $${minBet} and $${maxBet}`);
      return;
    }

    setIsPlacing(true);
    try {
      await onPlaceBet(amount, selectedDirection);
      toast.success(`Bet placed: $${amount} on ${selectedDirection.toUpperCase()}`);
      setBetAmount('');
    } catch (error) {
      toast.error('Failed to place bet');
    } finally {
      setIsPlacing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPotentialPayout = (amount: number, selectedDirection: 'long' | 'short') => {
    const odds = selectedDirection === 'long' ? longOdds : shortOdds;
    return amount * odds;
  };

  const isValidAmount = betAmount && parseFloat(betAmount) >= minBet && parseFloat(betAmount) <= maxBet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-card rounded-xl border border-border p-6 space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Place Your Bet</h2>
        <p className="text-muted-foreground">
          Round #{roundId.slice(-6).toUpperCase()} • {asset}/USD
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Entry Price:</span>
          <span className="font-semibold">{formatCurrency(entryPrice)}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            direction === 'long' ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'
          }`}>
            {direction.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Betting Pool Odds */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bullish/10 rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Long Odds</div>
          <div className="text-2xl font-bold text-bullish">{longOdds.toFixed(2)}x</div>
          <div className="text-xs text-muted-foreground">Price will go up</div>
        </div>
        <div className="bg-bearish/10 rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Short Odds</div>
          <div className="text-2xl font-bold text-bearish">{shortOdds.toFixed(2)}x</div>
          <div className="text-xs text-muted-foreground">Price will go down</div>
        </div>
      </div>

      {/* Bet Amount Input */}
      <div className="space-y-4">
        <div>
          <label htmlFor="bet-amount" className="block text-sm font-medium mb-2">
            Bet Amount (USD)
          </label>
          <input
            id="bet-amount"
            type="text"
            value={betAmount}
            onChange={handleAmountChange}
            placeholder={`${minBet}`}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Min: {formatCurrency(minBet)}</span>
            <span>Max: {formatCurrency(maxBet)}</span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[10, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickAmount(amount)}
              className="px-3 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
              disabled={isPlacing}
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
          className="bg-secondary/30 rounded-lg p-4"
        >
          <div className="text-sm text-muted-foreground mb-2">Potential Payout</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-bullish">Long ({longOdds.toFixed(2)}x):</span>
              <span className="font-semibold">{formatCurrency(getPotentialPayout(parseFloat(betAmount), 'long'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-bearish">Short ({shortOdds.toFixed(2)}x):</span>
              <span className="font-semibold">{formatCurrency(getPotentialPayout(parseFloat(betAmount), 'short'))}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePlaceBet('long')}
          disabled={!isValidAmount || isPlacing}
          className="px-6 py-3 bg-bullish hover:bg-bullish/90 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          {isPlacing ? 'Placing...' : 'Bet Long'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePlaceBet('short')}
          disabled={!isValidAmount || isPlacing}
          className="px-6 py-3 bg-bearish hover:bg-bearish/90 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          {isPlacing ? 'Placing...' : 'Bet Short'}
        </motion.button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Betting involves risk. Only bet what you can afford to lose.</p>
        <p>Platform fee: 2% • Settlement time: ~2 minutes</p>
      </div>
    </motion.div>
  );
}