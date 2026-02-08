'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Prediction round information
 * Contains position details, entry price, and direction
 */
export interface PredictionRound {
  /** Unique identifier for the round */
  id: string;
  /** Asset being traded (e.g., 'BTC', 'ETH', 'SOL') */
  asset: string;
  /** Direction of the position */
  direction: 'long' | 'short';
  /** Entry price when position was opened */
  entryPrice: number;
  /** Amount invested in this position */
  positionSize: number;
  /** Timestamp when position was opened */
  openedAt: string;
  /** Current phase of the round */
  phase: 'POSITION_OPEN' | 'EXIT_SIGNAL';
}

/**
 * Pool information for bulls vs bears
 */
export interface PoolInfo {
  /** Total amount bet on bullish (price up) */
  bullish: number;
  /** Total amount bet on bearish (price down) */
  bearish: number;
}

/**
 * AI Council monitoring status
 */
export type CouncilStatus = 'monitoring' | 'deliberating';

/**
 * Component props interface
 */
export interface LivePnLProps {
  /** Prediction round data containing position info */
  round: PredictionRound;
  /** Current live price feed */
  currentPrice: number;
  /** Total amounts on each side of the pool */
  pool: PoolInfo;
  /** Optional: Current exit vote count (0-5) */
  exitVotes?: number;
  /** Optional: AI Council status override */
  councilStatus?: CouncilStatus;
  /** Optional: Callback when exit threshold is reached */
  onExitThresholdReached?: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency with dollar sign and 2 decimal places
 */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage with sign and 2 decimal places
 */
function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Calculate P&L based on position direction, entry price, and current price
 */
function calculatePnL(
  direction: 'long' | 'short',
  entryPrice: number,
  currentPrice: number,
  positionSize: number
): { dollarPnL: number; percentChange: number } {
  const priceChangePercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  
  // For long: profit when price goes up
  // For short: profit when price goes down
  const directionMultiplier = direction === 'long' ? 1 : -1;
  const percentChange = priceChangePercent * directionMultiplier;
  const dollarPnL = (positionSize * percentChange) / 100;
  
  return { dollarPnL, percentChange };
}

/**
 * Calculate potential win/loss at current price
 */
function calculatePotentialOutcome(
  pool: PoolInfo,
  direction: 'long' | 'short',
  entryPrice: number,
  currentPrice: number
): { winAmount: number; lossAmount: number; isWinningSide: boolean } {
  const totalPool = pool.bullish + pool.bearish;
  const priceChangePercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  
  // Determine which side is winning based on price movement
  const isBullishWinning = priceChangePercent > 0;
  const isWinningSide = direction === 'long' ? isBullishWinning : !isBullishWinning;
  
  const winningPool = isBullishWinning ? pool.bullish : pool.bearish;
  const losingPool = isBullishWinning ? pool.bearish : pool.bullish;
  
  // Potential win is share of losing pool
  const winAmount = winningPool > 0 ? (direction === 'long' ? pool.bullish : pool.bearish) / winningPool * losingPool : 0;
  const lossAmount = direction === 'long' ? pool.bullish : pool.bearish;
  
  return { winAmount, lossAmount, isWinningSide };
}

// ============================================================================
// ANIMATED NUMBER COMPONENT
// ============================================================================

/**
 * Animated counter that smoothly transitions between values
 */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display: MotionValue<string> = useTransform(spring, (current) => 
    formatCurrency(current)
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

/**
 * Animated percentage counter
 */
function AnimatedPercentage({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display: MotionValue<string> = useTransform(spring, (current) => 
    formatPercentage(current)
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Direction badge showing BUY (green) or SELL (red)
 */
function DirectionBadge({ direction }: { direction: 'long' | 'short' }) {
  const isLong = direction === 'long';
  
  return (
    <span 
      className={`
        px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
        ${isLong 
          ? 'bg-bullish/20 text-bullish border border-bullish/30' 
          : 'bg-bearish/20 text-bearish border border-bearish/30'
        }
      `}
    >
      {isLong ? 'BUY' : 'SELL'}
    </span>
  );
}

/**
 * P&L Display - Hero element with large animated numbers
 */
function PnLDisplay({ dollarPnL, percentChange }: { dollarPnL: number; percentChange: number }) {
  const isProfitable = dollarPnL >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      className={`
        relative overflow-hidden rounded-2xl p-8 text-center
        ${isProfitable 
          ? 'bg-gradient-to-br from-bullish/20 via-bullish/10 to-transparent border-2 border-bullish/50' 
          : 'bg-gradient-to-br from-bearish/20 via-bearish/10 to-transparent border-2 border-bearish/50'
        }
      `}
    >
      {/* Animated background glow */}
      <motion.div
        className={`absolute inset-0 ${isProfitable ? 'bg-bullish/5' : 'bg-bearish/5'}`}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <div className="relative z-10">
        {/* Arrow indicator */}
        <motion.div
          animate={{ y: isProfitable ? [0, -4, 0] : [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-3"
        >
          <span className={`text-4xl ${isProfitable ? 'text-bullish' : 'text-bearish'}`}>
            {isProfitable ? '↑' : '↓'}
          </span>
        </motion.div>
        
        {/* Dollar P&L - Large hero number */}
        <div className={`text-5xl sm:text-6xl font-bold tracking-tight ${isProfitable ? 'text-bullish' : 'text-bearish'}`}>
          <AnimatedNumber value={dollarPnL} />
        </div>
        
        {/* Percentage change below */}
        <div className={`mt-2 text-xl font-medium ${isProfitable ? 'text-bullish/80' : 'text-bearish/80'}`}>
          <AnimatedPercentage value={percentChange} />
        </div>
        
        {/* Label */}
        <p className="text-sm text-muted-foreground mt-3">
          Live Unrealized P&L
        </p>
      </div>
    </motion.div>
  );
}

/**
 * AI Council Monitoring Indicator
 */
function CouncilIndicator({ 
  status, 
  exitVotes = 0 
}: { 
  status: CouncilStatus; 
  exitVotes?: number;
}) {
  const isDeliberating = status === 'deliberating';
  const votesNeeded = Math.max(0, 5 - exitVotes);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="flex items-center justify-center gap-3 py-3 px-4 bg-secondary/30 rounded-xl"
    >
      {/* Pulsing dot */}
      <div className="relative">
        <motion.div
          className={`w-3 h-3 rounded-full ${isDeliberating ? 'bg-amber-500' : 'bg-emerald-500'}`}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Outer ring */}
        <motion.div
          className={`absolute inset-0 w-3 h-3 rounded-full ${isDeliberating ? 'bg-amber-500' : 'bg-emerald-500'}`}
          animate={{ 
            scale: [1, 2],
            opacity: [0.5, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>
      
      {/* Status text */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {isDeliberating ? `Exit Vote: ${exitVotes}/5` : 'AI Council Monitoring'}
        </span>
        {isDeliberating && votesNeeded > 0 && (
          <span className="text-xs text-muted-foreground">
            {votesNeeded} more vote{votesNeeded > 1 ? 's' : ''} to trigger exit
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Pool Summary - Bulls vs Bears
 */
function PoolSummary({ 
  pool, 
  direction, 
  entryPrice, 
  currentPrice 
}: { 
  pool: PoolInfo; 
  direction: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
}) {
  const totalPool = pool.bullish + pool.bearish;
  const bullishPercent = totalPool > 0 ? (pool.bullish / totalPool) * 100 : 50;
  const { winAmount, lossAmount, isWinningSide } = calculatePotentialOutcome(
    pool, direction, entryPrice, currentPrice
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-secondary/30 rounded-xl p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold text-muted-foreground">Pool Summary</h3>
      
      {/* Bulls vs Bears bars */}
      <div className="space-y-3">
        {/* Bulls */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bullish" />
              <span className="font-medium text-bullish">Bulls</span>
            </span>
            <span className="font-semibold">{formatCurrency(pool.bullish)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bullishPercent}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="h-full bg-bullish rounded-full"
            />
          </div>
        </div>
        
        {/* Bears */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bearish" />
              <span className="font-medium text-bearish">Bears</span>
            </span>
            <span className="font-semibold">{formatCurrency(pool.bearish)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - bullishPercent}%` }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="h-full bg-bearish rounded-full"
            />
          </div>
        </div>
      </div>
      
      {/* Potential outcome at current price */}
      <div className="pt-3 border-t border-border/50">
        <div className="text-xs text-muted-foreground mb-2">Potential Outcome at Current Price</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg ${isWinningSide ? 'bg-bullish/10 border border-bullish/30' : 'bg-muted/50'}`}>
            <div className="text-xs text-muted-foreground mb-1">If Win</div>
            <div className={`font-bold ${isWinningSide ? 'text-bullish' : 'text-foreground'}`}>
              +{formatCurrency(winAmount)}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${!isWinningSide ? 'bg-bearish/10 border border-bearish/30' : 'bg-muted/50'}`}>
            <div className="text-xs text-muted-foreground mb-1">If Lose</div>
            <div className={`font-bold ${!isWinningSide ? 'text-bearish' : 'text-foreground'}`}>
              -{formatCurrency(lossAmount)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Position Info Section
 */
function PositionInfo({ 
  round, 
  currentPrice 
}: { 
  round: PredictionRound; 
  currentPrice: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-card rounded-xl border border-border"
    >
      {/* Asset and Direction */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
          {round.asset.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{round.asset}/USD</span>
            <DirectionBadge direction={round.direction} />
          </div>
          <span className="text-xs text-muted-foreground">
            Round #{round.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Prices */}
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-0.5">Entry Price</div>
          <div className="font-semibold tabular-nums">{formatCurrency(round.entryPrice)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-0.5">Current Price</div>
          <div className="font-semibold tabular-nums">{formatCurrency(currentPrice)}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LivePnL Component
 * 
 * Displays real-time profit/loss information during POSITION_OPEN and EXIT_SIGNAL phases.
 * Shows position details, animated P&L numbers, AI Council monitoring status, and pool summary.
 */
export default function LivePnL({
  round,
  currentPrice,
  pool,
  exitVotes = 0,
  councilStatus,
  onExitThresholdReached,
}: LivePnLProps) {
  // Calculate P&L
  const { dollarPnL, percentChange } = useMemo(() => 
    calculatePnL(round.direction, round.entryPrice, currentPrice, round.positionSize),
    [round.direction, round.entryPrice, currentPrice, round.positionSize]
  );
  
  // Determine council status based on exit votes if not explicitly provided
  const effectiveStatus: CouncilStatus = councilStatus ?? (exitVotes > 0 ? 'deliberating' : 'monitoring');
  
  // Trigger callback when exit threshold reached
  useEffect(() => {
    if (exitVotes >= 5 && onExitThresholdReached) {
      onExitThresholdReached();
    }
  }, [exitVotes, onExitThresholdReached]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto space-y-4 p-4"
      role="region"
      aria-label="Live Position P&L"
    >
      {/* Position Info Section */}
      <PositionInfo round={round} currentPrice={currentPrice} />
      
      {/* P&L Display - Hero Element */}
      <PnLDisplay dollarPnL={dollarPnL} percentChange={percentChange} />
      
      {/* AI Council Monitoring Indicator */}
      <CouncilIndicator status={effectiveStatus} exitVotes={exitVotes} />
      
      {/* Pool Summary */}
      <PoolSummary 
        pool={pool} 
        direction={round.direction}
        entryPrice={round.entryPrice}
        currentPrice={currentPrice}
      />
    </motion.div>
  );
}

// Types are already exported above via `export interface` and `export type` declarations
