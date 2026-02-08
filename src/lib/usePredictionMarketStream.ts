'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RoundState, RoundPhase, BettingPool, ConsensusSnapshot } from './prediction-market/types';

interface UsePredictionMarketStreamOptions {
  enabled?: boolean;
  apiUrl?: string;
}

interface PredictionMarketStreamData {
  round: RoundState | null;
  isConnected: boolean;
  error: string | null;
  currentPrice: number;
  pool: BettingPool;
  consensusSnapshot: ConsensusSnapshot | null;
}

export function usePredictionMarketStream({
  enabled = true,
  apiUrl = '/api/prediction-market/stream',
}: UsePredictionMarketStreamOptions = {}): PredictionMarketStreamData {
  const [round, setRound] = useState<RoundState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [pool, setPool] = useState<BettingPool>({
    totalLong: 0,
    totalShort: 0,
    totalPool: 0,
    longBetCount: 0,
    shortBetCount: 0,
    totalBetCount: 0,
    avgLongBet: 0,
    avgShortBet: 0,
    longOdds: 0,
    shortOdds: 0,
  });
  const [consensusSnapshot, setConsensusSnapshot] = useState<ConsensusSnapshot | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) {
      return;
    }

    console.log('[usePredictionMarketStream] Connecting to', apiUrl);

    try {
      const eventSource = new EventSource(apiUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[usePredictionMarketStream] Connected');
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0;
      };

      // Handle connected event
      eventSource.addEventListener('connected', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Connection confirmed:', data);
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse connected event:', err);
        }
      });

      // Handle round_state event
      eventSource.addEventListener('round_state', (event: MessageEvent) => {
        try {
          const roundState: RoundState = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Round state update:', roundState.phase);
          setRound(roundState);
          
          // Update current price if available
          if (roundState.currentPrice) {
            setCurrentPrice(roundState.currentPrice);
          }
          
          // Update pool
          if (roundState.bettingPool) {
            setPool(roundState.bettingPool);
          }
          
          // Update consensus snapshot
          if (roundState.consensusSnapshot) {
            setConsensusSnapshot(roundState.consensusSnapshot);
          }
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse round_state:', err);
        }
      });

      // Handle consensus_update event
      eventSource.addEventListener('consensus_update', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Consensus update:', data);
          setConsensusSnapshot(data);
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse consensus_update:', err);
        }
      });

      // Handle phase_change event
      eventSource.addEventListener('phase_change', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Phase change:', data.from, '→', data.to);
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse phase_change:', err);
        }
      });

      // Handle pool_update event
      eventSource.addEventListener('pool_update', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Pool update:', data.pool);
          if (data.pool) {
            setPool(data.pool);
          }
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse pool_update:', err);
        }
      });

      // Handle price_update event
      eventSource.addEventListener('price_update', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Price update:', data.currentPrice);
          if (data.currentPrice) {
            setCurrentPrice(data.currentPrice);
          }
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse price_update:', err);
        }
      });

      // Handle settlement_complete event
      eventSource.addEventListener('settlement_complete', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Settlement complete:', data);
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse settlement_complete:', err);
        }
      });

      // Handle round_complete event
      eventSource.addEventListener('round_complete', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[usePredictionMarketStream] Round complete:', data);
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse round_complete:', err);
        }
      });

      // Handle error event
      eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.error('[usePredictionMarketStream] Server error:', data);
          setError(data.message || 'Server error');
        } catch (err) {
          console.error('[usePredictionMarketStream] Failed to parse error event:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.error('[usePredictionMarketStream] Connection error:', err);
        setIsConnected(false);
        
        // Close the existing connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (retryCountRef.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          console.log(`[usePredictionMarketStream] Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
          
          setError(`Connection lost. Reconnecting... (${retryCountRef.current + 1}/${maxRetries})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++;
            connect();
          }, delay);
        } else {
          setError('Connection failed. Please refresh the page.');
        }
      };

    } catch (err) {
      console.error('[usePredictionMarketStream] Failed to create EventSource:', err);
      setError('Failed to connect to prediction market');
      setIsConnected(false);
    }
  }, [enabled, apiUrl]);

  const disconnect = useCallback(() => {
    console.log('[usePredictionMarketStream] Disconnecting');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    round,
    isConnected,
    error,
    currentPrice,
    pool,
    consensusSnapshot,
  };
}
