'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RoundState, RoundPhase } from '@/lib/prediction-market/types';

interface PredictionMarketState {
  round: RoundState | null;
  isConnected: boolean;
  error: string | null;
  demoMode: boolean;
}

export function usePredictionMarket(): PredictionMarketState {
  const [round, setRound] = useState<RoundState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource('/api/prediction-market/stream');
        eventSourceRef.current = es;

        es.addEventListener('connected', (event) => {
          try {
            const data = JSON.parse(event.data);
            setIsConnected(true);
            setDemoMode(data.demoMode || false);
            retryCountRef.current = 0;
            setError(null);
          } catch (e) {
            console.error('[prediction-market] Failed to parse connected event:', e);
          }
        });

        es.addEventListener('round_state', (event) => {
          try {
            const roundData: RoundState = JSON.parse(event.data);
            setRound(roundData);
            setError(null);
          } catch (e) {
            console.error('[prediction-market] Failed to parse round_state:', e);
            setError('Failed to parse round state');
          }
        });

        es.addEventListener('phase_change', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[prediction-market] Phase change:', data.from, '→', data.to);
          } catch (e) {
            console.error('[prediction-market] Failed to parse phase_change:', e);
          }
        });

        es.addEventListener('consensus_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[prediction-market] Consensus update:', data);
          } catch (e) {
            console.error('[prediction-market] Failed to parse consensus_update:', e);
          }
        });

        es.addEventListener('pool_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[prediction-market] Pool update:', data);
          } catch (e) {
            console.error('[prediction-market] Failed to parse pool_update:', e);
          }
        });

        es.addEventListener('price_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (round) {
              setRound({
                ...round,
                currentPrice: data.currentPrice,
              });
            }
          } catch (e) {
            console.error('[prediction-market] Failed to parse price_update:', e);
          }
        });

        es.addEventListener('settlement_complete', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[prediction-market] Settlement complete:', data);
          } catch (e) {
            console.error('[prediction-market] Failed to parse settlement_complete:', e);
          }
        });

        es.addEventListener('round_complete', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[prediction-market] Round complete. Duration:', data.duration, 'ms');
          } catch (e) {
            console.error('[prediction-market] Failed to parse round_complete:', e);
          }
        });

        es.addEventListener('error', (event) => {
          try {
            const data = JSON.parse((event as MessageEvent).data);
            setError(data.message || 'Unknown error');
          } catch (e) {
            // Event error without parseable data
            console.error('[prediction-market] SSE error event');
          }
        });

        es.onerror = () => {
          console.error('[prediction-market] Connection error');
          setIsConnected(false);
          es.close();

          if (retryCountRef.current < maxRetries) {
            const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30_000);
            retryCountRef.current++;
            console.log(`[prediction-market] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
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
  }, []);

  return {
    round,
    isConnected,
    error,
    demoMode,
  };
}
