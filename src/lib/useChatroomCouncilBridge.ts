'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ConsensusData } from './types';
import type { MessageSentiment } from './chatroom/types';

/**
 * Bridge state exposed to React components
 */
export interface BridgeStatus {
  isCouncilPending: boolean;
  timeUntilNextCouncilAllowed: number;
  lastChatroomConsensus: {
    direction: MessageSentiment | null;
    strength: number;
    timestamp: number;
  } | null;
  lastCouncilResult: {
    consensus: ConsensusData | null;
    triggeredBy: 'chatroom' | 'manual';
    timestamp: number;
  } | null;
  canTriggerCouncil: boolean;
  blockedReason: string | null;
}

/**
 * Configuration for the bridge hook
 */
interface UseChatroomCouncilBridgeOptions {
  /** Asset to analyze (default: 'BTC') */
  asset?: string;
  /** Callback when council is triggered by chatroom consensus */
  onCouncilTrigger?: (context: {
    chatroomConsensus: { direction: MessageSentiment; strength: number };
    asset: string;
  }) => void;
  /** Callback when council evaluation completes */
  onCouncilResult?: (result: ConsensusData) => void;
  /** Whether to auto-trigger council when chatroom reaches consensus */
  autoTrigger?: boolean;
}

const CONSENSUS_STRENGTH_THRESHOLD = 80;
const MIN_COUNCIL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * React hook for managing the chatroom-council bridge
 *
 * This hook:
 * 1. Monitors chatroom consensus state
 * 2. Determines when council evaluation is allowed
 * 3. Optionally auto-triggers council when chatroom reaches strong consensus
 * 4. Provides state for UI display
 */
export function useChatroomCouncilBridge(
  chatroomDirection: MessageSentiment | null,
  chatroomStrength: number,
  options: UseChatroomCouncilBridgeOptions = {}
): BridgeStatus & {
  triggerCouncil: () => Promise<void>;
  isEvaluating: boolean;
} {
  const { asset = 'BTC', onCouncilTrigger, onCouncilResult, autoTrigger = false } = options;

  // State
  const [isCouncilPending, setIsCouncilPending] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeUntilNextCouncilAllowed, setTimeUntilNextCouncilAllowed] = useState(0);
  const [lastCouncilResult, setLastCouncilResult] = useState<BridgeStatus['lastCouncilResult']>(null);

  // Track last trigger time
  const lastTriggerTimeRef = useRef(0);
  const lastProcessedConsensusRef = useRef<{ direction: MessageSentiment | null; strength: number } | null>(null);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const timeSinceLast = now - lastTriggerTimeRef.current;
      const remaining = Math.max(0, MIN_COUNCIL_INTERVAL_MS - timeSinceLast);
      setTimeUntilNextCouncilAllowed(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if council can be triggered
  const canTriggerCouncil =
    chatroomDirection !== null &&
    chatroomDirection !== 'neutral' &&
    chatroomStrength >= CONSENSUS_STRENGTH_THRESHOLD &&
    timeUntilNextCouncilAllowed === 0 &&
    !isEvaluating;

  // Determine blocked reason
  let blockedReason: string | null = null;
  if (!chatroomDirection || chatroomDirection === 'neutral') {
    blockedReason = 'Chatroom has no directional consensus';
  } else if (chatroomStrength < CONSENSUS_STRENGTH_THRESHOLD) {
    blockedReason = `Consensus strength ${chatroomStrength}% is below ${CONSENSUS_STRENGTH_THRESHOLD}% threshold`;
  } else if (timeUntilNextCouncilAllowed > 0) {
    const minutes = Math.ceil(timeUntilNextCouncilAllowed / 60000);
    blockedReason = `Rate limited - wait ${minutes} minute(s)`;
  } else if (isEvaluating) {
    blockedReason = 'Council evaluation in progress';
  }

  // Build context for council
  const buildContext = useCallback(() => {
    if (!chatroomDirection || chatroomDirection === 'neutral') return '';

    const sentimentMap: Record<MessageSentiment, string> = {
      bullish: 'optimistic and bullish',
      bearish: 'pessimistic and bearish',
      neutral: 'neutral and undecided',
    };

    return (
      `Market Sentiment Context: The 17-persona AI chatroom has reached ${chatroomStrength}% consensus with a ` +
      `${sentimentMap[chatroomDirection]} outlook. This crowd sentiment signal should be considered alongside ` +
      `your technical, on-chain, and risk analysis.`
    );
  }, [chatroomDirection, chatroomStrength]);

  // Trigger council evaluation
  const triggerCouncil = useCallback(async () => {
    if (!canTriggerCouncil || !chatroomDirection) {
      console.warn('[useChatroomCouncilBridge] Cannot trigger council:', blockedReason);
      return;
    }

    setIsEvaluating(true);
    setIsCouncilPending(true);
    lastTriggerTimeRef.current = Date.now();

    // Notify callback
    if (onCouncilTrigger) {
      onCouncilTrigger({
        chatroomConsensus: { direction: chatroomDirection, strength: chatroomStrength },
        asset,
      });
    }

    try {
      // Call consensus API with chatroom context
      const context = buildContext();
      const response = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, context }),
      });

      if (!response.ok) {
        throw new Error(`Council API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform API response to ConsensusData
      const consensusData: ConsensusData = {
        consensusLevel: data.consensus?.consensusLevel ?? 0,
        recommendation: data.consensus?.recommendation ?? null,
        threshold: 80,
        analysts: data.analysts ?? [],
      };

      setLastCouncilResult({
        consensus: consensusData,
        triggeredBy: 'chatroom',
        timestamp: Date.now(),
      });

      // Notify callback
      if (onCouncilResult) {
        onCouncilResult(consensusData);
      }
    } catch (error) {
      console.error('[useChatroomCouncilBridge] Council evaluation failed:', error);
    } finally {
      setIsEvaluating(false);
      setIsCouncilPending(false);
    }
  }, [
    canTriggerCouncil,
    chatroomDirection,
    chatroomStrength,
    blockedReason,
    asset,
    buildContext,
    onCouncilTrigger,
    onCouncilResult,
  ]);

  // Auto-trigger when chatroom reaches consensus
  useEffect(() => {
    if (!autoTrigger || !canTriggerCouncil) return;

    // Check if this is a new consensus (not the same as last processed)
    const lastProcessed = lastProcessedConsensusRef.current;
    if (
      lastProcessed &&
      lastProcessed.direction === chatroomDirection &&
      lastProcessed.strength === chatroomStrength
    ) {
      return; // Already processed this exact consensus
    }

    // Mark as processed and trigger
    lastProcessedConsensusRef.current = { direction: chatroomDirection, strength: chatroomStrength };
    triggerCouncil();
  }, [autoTrigger, canTriggerCouncil, chatroomDirection, chatroomStrength, triggerCouncil]);

  return {
    isCouncilPending,
    isEvaluating,
    timeUntilNextCouncilAllowed,
    lastChatroomConsensus:
      chatroomDirection !== null
        ? { direction: chatroomDirection, strength: chatroomStrength, timestamp: Date.now() }
        : null,
    lastCouncilResult,
    canTriggerCouncil,
    blockedReason,
    triggerCouncil,
  };
}
