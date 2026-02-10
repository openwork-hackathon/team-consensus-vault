'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RoundState, 
  RoundPhase, 
  BettingPool, 
  SettlementResult,
  isBettingPhase,
  PredictionMarketConfig 
} from '@/lib/prediction-market/types';

interface LatestConsensus {
  level: number;
  direction: 'up' | 'down';
  votes: number;
  totalVotes: number;
  timestamp: string;
  forced?: boolean;
}

interface PredictionMarketState {
  // Core state
  round: RoundState | null;
  pool: BettingPool | null;
  latestConsensus: LatestConsensus | null;
  currentPrice: number | null;
  pnl: number | null;
  isConnected: boolean;
  settlement: SettlementResult | null;
  phaseForced: boolean;

  // Derived state
  isInBettingWindow: boolean;
  bettingTimeRemaining: number;
  canPlaceBet: boolean;

  // Actions
  placeBet: (direction: 'up' | 'down', amount: number) => Promise<void>;
}

export function usePredictionMarket(): PredictionMarketState {
  // Core state
  const [round, setRound] = useState<RoundState | null>(null);
  const [pool, setPool] = useState<BettingPool | null>(null);
  const [latestConsensus, setLatestConsensus] = useState<LatestConsensus | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [pnl, setPnl] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [settlement, setSettlement] = useState<SettlementResult | null>(null);
  const [phaseForced, setPhaseForced] = useState<boolean>(false);


  // Track user's bets to prevent multiple bets per round
  const [userBets, setUserBets] = useState<Set<string>>(new Set());
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Refs for EventSource and retry management
  const retryCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Update derived state
  const isInBettingWindow = round ? isBettingPhase(round.phase) : false;
  
  const bettingTimeRemaining = (() => {
    if (!round || !isInBettingWindow || !round.bettingWindowEnd) return 0;
    
    const endTime = new Date(round.bettingWindowEnd).getTime();
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    
    return Math.floor(remaining / 1000); // Return seconds
  })();

  const canPlaceBet = (() => {
    if (!isConnected || !isInBettingWindow || !round) return false;
    
    // Check if user has already bet this round
    const hasBetThisRound = userBets.has(round.id);
    
    return !hasBetThisRound;
  })();

  // Place bet function
  const placeBet = useCallback(async (direction: 'up' | 'down', amount: number) => {
    if (!round || !canPlaceBet) {
      throw new Error('Cannot place bet: not in betting window or already bet this round');
    }

    try {
      setError(null);

      const abortController = new AbortController();
      const response = await fetch('/api/prediction-market/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roundId: round.id,
          direction,
          amount,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place bet');
      }

      const betData = await response.json();

      // Track the bet to prevent multiple bets
      setUserBets(prev => new Set(prev).add(round.id));

      console.log('[prediction-market] Bet placed successfully:', betData);

    } catch (e) {
      // Ignore abort errors (component unmounted or request cancelled)
      if (e instanceof Error && e.name === 'AbortError') return;
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(errorMessage);
      throw e;
    }
  }, [round, canPlaceBet, userBets]);

  // SSE Event Handlers
  const handleConnected = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      setIsConnected(true);
      retryCountRef.current = 0;
      setError(null);
      console.log('[prediction-market] Connected:', data);
    } catch (e) {
      console.error('[prediction-market] Failed to parse connected event:', e);
    }
  }, []);

  const handleRoundState = useCallback((event: MessageEvent) => {
    try {
      const roundData: RoundState = JSON.parse(event.data);
      setRound(roundData);
      setPool(roundData.bettingPool);
      setCurrentPrice(roundData.currentPrice || null);
      setError(null);
      console.log('[prediction-market] Round state updated:', roundData.phase);
    } catch (e) {
      console.error('[prediction-market] Failed to parse round_state:', e);
      setError('Failed to parse round state');
    }
  }, []);

  const handleConsensusUpdate = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const consensus: LatestConsensus = {
        level: data.level,
        direction: data.direction,
        votes: data.votes,
        totalVotes: data.totalVotes,
        timestamp: data.timestamp,
        forced: data.forced,
      };
      setLatestConsensus(consensus);
      console.log('[prediction-market] Consensus updated:', data);
    } catch (e) {
      console.error('[prediction-market] Failed to parse consensus_update:', e);
    }
  }, []);

  const handlePhaseChange = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[prediction-market] Phase change:', data.from, '→', data.to, data.forced ? '(forced)' : '');

      // Track if phase change was forced by demo mode
      setPhaseForced(data.forced || false);

      // Reset user bets when starting a new round
      if (data.to === RoundPhase.BETTING_WINDOW && data.from !== RoundPhase.BETTING_WINDOW) {
        setUserBets(new Set());
      }
    } catch (e) {
      console.error('[prediction-market] Failed to parse phase_change:', e);
    }
  }, []);

  const handlePoolUpdate = useCallback((event: MessageEvent) => {
    try {
      const poolData: BettingPool = JSON.parse(event.data);
      setPool(poolData);
      console.log('[prediction-market] Pool updated:', poolData);
    } catch (e) {
      console.error('[prediction-market] Failed to parse pool_update:', e);
    }
  }, []);

  const handleSettlement = useCallback((event: MessageEvent) => {
    try {
      const settlementData: SettlementResult = JSON.parse(event.data);
      setSettlement(settlementData);
      
      // Calculate PnL for user
      if (settlementData.payouts) {
        const userPayouts = settlementData.payouts.filter(p => p.isWinner);
        const totalPnL = userPayouts.reduce((sum, p) => sum + p.netProfit, 0);
        setPnl(totalPnL);
      }
      
      console.log('[prediction-market] Settlement completed:', settlementData);
    } catch (e) {
      console.error('[prediction-market] Failed to parse settlement:', e);
    }
  }, []);

  const handlePriceUpdate = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      setCurrentPrice(data.currentPrice);
      
      // Update PnL if we have an entry price and round is active
      if (round && round.entryPrice && data.currentPrice) {
        const priceChange = data.currentPrice - round.entryPrice;
        const pnlPercent = (priceChange / round.entryPrice) * 100;
        
        // Estimate PnL based on user's bets (this would need user bet data in real implementation)
        // For now, just store the current price
      }
    } catch (e) {
      console.error('[prediction-market] Failed to parse price_update:', e);
    }
  }, [round]);

  // SSE Connection Management
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource('/api/prediction-market/stream');
        eventSourceRef.current = es;

        // Register event listeners
        es.addEventListener('connected', handleConnected);
        es.addEventListener('round_state', handleRoundState);
        es.addEventListener('consensus_update', handleConsensusUpdate);
        es.addEventListener('phase_change', handlePhaseChange);
        es.addEventListener('pool_update', handlePoolUpdate);
        es.addEventListener('settlement', handleSettlement);
        es.addEventListener('price_update', handlePriceUpdate);

        // Handle SSE errors
        es.onerror = () => {
          console.error('[prediction-market] Connection error');
          setIsConnected(false);
          es.close();

          if (retryCountRef.current < 10) { // Increased max retries
            // Exponential backoff: start at 1s, max 30s, multiply by 2
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30_000);
            retryCountRef.current++;
            console.log(`[prediction-market] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/10)`);
            setError(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            console.error('[prediction-market] Max retries reached');
            setError('Connection failed after multiple retries. Please refresh the page.');
          }
        };
      } catch (e) {
        console.error('[prediction-market] Failed to create EventSource:', e);
        setError('Failed to establish connection');
        
        // Retry on creation failure
        if (retryCountRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30_000);
          retryCountRef.current++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [
    handleConnected,
    handleRoundState,
    handleConsensusUpdate,
    handlePhaseChange,
    handlePoolUpdate,
    handleSettlement,
    handlePriceUpdate,
  ]);

  return {
    // Core state
    round,
    pool,
    latestConsensus,
    currentPrice,
    pnl,
    isConnected,
    settlement,
    phaseForced,
    // Derived state
    isInBettingWindow,
    bettingTimeRemaining,
    canPlaceBet,

    // Actions
    placeBet,
  };
}
