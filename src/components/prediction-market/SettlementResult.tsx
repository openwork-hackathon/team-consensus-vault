'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Settlement data from the prediction market
interface Settlement {
  winningSide: 'AGREE' | 'DISAGREE';
  entryPrice: number;
  exitPrice: number;
  totalPool: number;
  payoutMultiplier: number;
}

// Round information for countdown
interface Round {
  id: string;
  nextRoundStartsAt: Date;
}

// User bet information
interface UserBet {
  side: 'AGREE' | 'DISAGREE';
  amount: number;
}

// Component props interface
interface SettlementResultProps {
  settlement: Settlement;
  round: Round;
  userBets: UserBet[];
  address: string;
}

// Format currency with dollar sign and 2 decimal places
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format currency with sign (+/-)
function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}

// Calculate percentage change between entry and exit prices
function calculatePriceChange(entryPrice: number, exitPrice: number): number {
  return ((exitPrice - entryPrice) / entryPrice) * 100;
}

// Format percentage with sign
function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Truncate wallet address for display
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Countdown timer hook
function useCountdown(targetDate: Date): { seconds: number; isExpired: boolean } {
  const [seconds, setSeconds] = useState<number>(() => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const diff = Math.max(0, Math.floor((target - now) / 1000));
    return diff;
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      
      setSeconds(diff);
      
      if (diff === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return { seconds, isExpired };
}

// Animated banner showing the winning side
function WinnerBanner({ winningSide }: { winningSide: 'AGREE' | 'DISAGREE' }) {
  const isAgree = winningSide === 'AGREE';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      className={`
        relative overflow-hidden rounded-xl p-6 text-center
        ${isAgree 
          ? 'bg-gradient-to-br from-bullish/20 to-bullish/5 border-2 border-bullish' 
          : 'bg-gradient-to-br from-bearish/20 to-bearish/5 border-2 border-bearish'
        }
      `}
    >
      {/* Animated background pulse */}
      <motion.div
        className={`absolute inset-0 ${isAgree ? 'bg-bullish/10' : 'bg-bearish/10'}`}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Confetti-like particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${isAgree ? 'bg-bullish' : 'bg-bearish'}`}
            initial={{ 
              x: '50%', 
              y: '50%', 
              opacity: 0,
              scale: 0 
            }}
            animate={{ 
              x: `${30 + Math.random() * 40}%`, 
              y: `${20 + Math.random() * 60}%`,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.3,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-5xl mb-2"
        >
          {isAgree ? '🎯' : '⚡'}
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={`text-3xl sm:text-4xl font-bold ${isAgree ? 'text-bullish' : 'text-bearish'}`}
        >
          {winningSide} WINS
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-sm text-muted-foreground mt-2"
        >
          The consensus has been settled
        </motion.p>
      </div>
    </motion.div>
  );
}

// Price comparison display
function PriceComparison({ entryPrice, exitPrice }: { entryPrice: number; exitPrice: number }) {
  const priceChange = calculatePriceChange(entryPrice, exitPrice);
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="bg-secondary/30 rounded-lg p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-muted-foreground">Price Movement</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
          <div className="text-lg font-bold">{formatCurrency(entryPrice)}</div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground mb-1">Exit Price</div>
          <div className="text-lg font-bold">{formatCurrency(exitPrice)}</div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Change</span>
          <span className={`text-lg font-bold ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
            {formatPercentage(priceChange)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Pool and payout information
function PoolInfo({ totalPool, payoutMultiplier }: { totalPool: number; payoutMultiplier: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-secondary/30 rounded-lg p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-muted-foreground">Pool & Payouts</h3>
      
      <div>
        <div className="text-xs text-muted-foreground mb-1">Total Pool Size</div>
        <div className="text-2xl font-bold text-primary">{formatCurrency(totalPool)}</div>
      </div>
      
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payout Multiplier</span>
          <span className="text-xl font-bold text-bullish">{payoutMultiplier.toFixed(2)}x</span>
        </div>
      </div>
    </motion.div>
  );
}

// User betting results
function UserResults({ 
  userBets, 
  winningSide, 
  payoutMultiplier 
}: { 
  userBets: UserBet[]; 
  winningSide: 'AGREE' | 'DISAGREE';
  payoutMultiplier: number;
}) {
  const { totalBet, totalWon, netPnL, didWin } = useMemo(() => {
    const totalBet = userBets.reduce((sum, bet) => sum + bet.amount, 0);
    const winningBets = userBets.filter(bet => bet.side === winningSide);
    const totalWon = winningBets.reduce((sum, bet) => sum + (bet.amount * payoutMultiplier), 0);
    const netPnL = totalWon - totalBet;
    const didWin = netPnL > 0;
    
    return { totalBet, totalWon, netPnL, didWin };
  }, [userBets, winningSide, payoutMultiplier]);

  const hasBets = userBets.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className={`
        rounded-lg p-4 border-2
        ${didWin 
          ? 'bg-bullish/10 border-bullish/50' 
          : netPnL < 0 
            ? 'bg-bearish/10 border-bearish/50'
            : 'bg-secondary/30 border-border'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Your Results</h3>
        {hasBets && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${didWin ? 'bg-bullish text-white' : netPnL < 0 ? 'bg-bearish text-white' : 'bg-muted'}`}>
            {didWin ? 'WINNER!' : netPnL < 0 ? 'LOSS' : 'BREAK EVEN'}
          </span>
        )}
      </div>

      {!hasBets ? (
        <div className="text-center py-4 text-muted-foreground">
          <span className="text-2xl block mb-2">🎲</span>
          <p className="text-sm">You didn&apos;t place any bets this round</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bet summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Total Bet</div>
              <div className="font-semibold">{formatCurrency(totalBet)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Won</div>
              <div className={`font-semibold ${totalWon > 0 ? 'text-bullish' : ''}`}>
                {formatCurrency(totalWon)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net P&L</div>
              <div className={`font-bold ${netPnL > 0 ? 'text-bullish' : netPnL < 0 ? 'text-bearish' : ''}`}>
                {formatSignedCurrency(netPnL)}
              </div>
            </div>
          </div>

          {/* Individual bets */}
          <div className="pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Your Bets</div>
            <div className="space-y-1.5">
              {userBets.map((bet, index) => {
                const isWinningBet = bet.side === winningSide;
                const betReturn = isWinningBet ? bet.amount * payoutMultiplier : 0;
                const betPnL = betReturn - bet.amount;

                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-background/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${bet.side === 'AGREE' ? 'bg-bullish' : 'bg-bearish'}`} />
                      <span className={bet.side === 'AGREE' ? 'text-bullish' : 'text-bearish'}>
                        {bet.side}
                      </span>
                      <span className="text-muted-foreground">{formatCurrency(bet.amount)}</span>
                    </div>
                    <div className={`font-medium ${betPnL > 0 ? 'text-bullish' : betPnL < 0 ? 'text-bearish' : 'text-muted-foreground'}`}>
                      {isWinningBet ? `+${formatCurrency(betReturn)}` : formatSignedCurrency(betPnL)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Countdown timer display
function NextRoundCountdown({ nextRoundStartsAt, roundId }: { nextRoundStartsAt: Date; roundId: string }) {
  const { seconds, isExpired } = useCountdown(nextRoundStartsAt);
  
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30"
    >
      <div className="text-xs text-muted-foreground mb-1">Next Round Starts In</div>
      
      {isExpired ? (
        <div className="text-2xl font-bold text-primary">Starting soon...</div>
      ) : (
        <div className="text-3xl font-bold text-primary tabular-nums">
          {formatTime(seconds)}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-2">
        Round #{roundId.slice(-6).toUpperCase()}
      </div>
    </motion.div>
  );
}

// Main component
export default function SettlementResult({
  settlement,
  round,
  userBets,
  address,
}: SettlementResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto space-y-4 p-4"
      role="region"
      aria-label="Settlement Results"
    >
      {/* Winner Banner */}
      <WinnerBanner winningSide={settlement.winningSide} />

      {/* User Address */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="text-center"
      >
        <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          {truncateAddress(address)}
        </span>
      </motion.div>

      {/* Price & Pool Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PriceComparison 
          entryPrice={settlement.entryPrice} 
          exitPrice={settlement.exitPrice} 
        />
        <PoolInfo 
          totalPool={settlement.totalPool} 
          payoutMultiplier={settlement.payoutMultiplier} 
        />
      </div>

      {/* User Results */}
      <UserResults 
        userBets={userBets}
        winningSide={settlement.winningSide}
        payoutMultiplier={settlement.payoutMultiplier}
      />

      {/* Next Round Countdown */}
      <NextRoundCountdown 
        nextRoundStartsAt={round.nextRoundStartsAt}
        roundId={round.id}
      />
    </motion.div>
  );
}

// Export types for consumers
export type { SettlementResultProps, Settlement, Round, UserBet };
