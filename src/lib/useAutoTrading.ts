'use client';

import { useEffect, useRef, useState } from 'react';
import { ConsensusData } from './types';

/**
 * Auto-trading hook
 * Monitors consensus and executes paper trades when 4/5 or 5/5 agreement is reached
 */
export function useAutoTrading(consensusData: ConsensusData, enabled: boolean = true) {
  const [lastExecutedRecommendation, setLastExecutedRecommendation] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTradeId, setLastTradeId] = useState<string | null>(null);
  const executionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !consensusData.recommendation) return;

    // Only execute if recommendation changed and threshold is met
    const currentRecommendation = consensusData.recommendation;
    const consensusLevel = consensusData.consensusLevel;

    // Skip if we already executed for this recommendation or if below threshold
    if (
      currentRecommendation === lastExecutedRecommendation ||
      consensusLevel < consensusData.threshold ||
      isExecuting ||
      currentRecommendation === 'HOLD'
    ) {
      return;
    }

    // Prevent duplicate executions with ref
    const executionKey = `${currentRecommendation}-${Date.now()}`;
    if (executionRef.current === executionKey) return;
    executionRef.current = executionKey;

    // Execute trade
    const executeTrade = async () => {
      setIsExecuting(true);

      try {
        const response = await fetch('/api/trading/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset: 'BTC/USD' }),
        });

        const data = await response.json();

        if (data.success) {
          console.log('Paper trade executed:', data.trade);
          setLastExecutedRecommendation(currentRecommendation);
          setLastTradeId(data.trade.id);
        } else {
          console.warn('Trade execution failed:', data.message || data.error);
        }
      } catch (error) {
        console.error('Error executing paper trade:', error);
      } finally {
        setIsExecuting(false);
      }
    };

    executeTrade();
  }, [
    consensusData.recommendation,
    consensusData.consensusLevel,
    consensusData.threshold,
    enabled,
    lastExecutedRecommendation,
    isExecuting,
  ]);

  return {
    isAutoTradingEnabled: enabled,
    isExecutingTrade: isExecuting,
    lastTradeId,
  };
}
