/**
 * Chatroom-Council Bridge
 *
 * Connects the multi-persona chatroom consensus system to the 5-agent trading council.
 *
 * Architecture:
 * - Event-based: Chatroom consensus triggers council evaluation
 * - Rate-limited: Minimum 5 minutes between council evaluations
 * - Weighted input: Chatroom consensus provides market sentiment context
 *
 * Data flow:
 * 1. Chatroom reaches 80%+ consensus (bullish/bearish)
 * 2. Bridge receives consensus event
 * 3. Bridge checks rate limits and cooldowns
 * 4. If allowed, triggers trading council with chatroom context
 * 5. Council result is stored and emitted for UI/auto-trading
 */

import type { MessageSentiment, ChatRoomState } from './chatroom/types';
import type { ConsensusData } from './types';
import type { ConsensusResponse } from './models';

// Rate limiting configuration
const MIN_COUNCIL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between council evaluations
const CONSENSUS_STRENGTH_THRESHOLD = 80; // Minimum chatroom consensus strength to trigger

// State tracking
interface BridgeState {
  lastCouncilTriggerTime: number;
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
  pendingTrigger: boolean;
}

// In-memory bridge state (single instance)
let bridgeState: BridgeState = {
  lastCouncilTriggerTime: 0,
  lastChatroomConsensus: null,
  lastCouncilResult: null,
  pendingTrigger: false,
};

// Event listeners for council triggers
type CouncilTriggerListener = (context: CouncilTriggerContext) => void;
type CouncilResultListener = (result: CouncilResultEvent) => void;

const triggerListeners: CouncilTriggerListener[] = [];
const resultListeners: CouncilResultListener[] = [];

/**
 * Context provided when triggering the trading council
 */
export interface CouncilTriggerContext {
  chatroomConsensus: {
    direction: MessageSentiment;
    strength: number;
  };
  triggerReason: 'chatroom_consensus' | 'manual';
  asset: string;
  additionalContext?: string;
}

/**
 * Result event emitted after council evaluation
 */
export interface CouncilResultEvent {
  councilConsensus: ConsensusData;
  chatroomContext: {
    direction: MessageSentiment;
    strength: number;
  } | null;
  timestamp: number;
  triggerReason: 'chatroom' | 'manual';
}

/**
 * Check if the chatroom consensus should trigger a council evaluation
 */
export function shouldTriggerCouncil(
  chatroomDirection: MessageSentiment | null,
  chatroomStrength: number
): { shouldTrigger: boolean; reason: string } {
  const now = Date.now();

  // Check if direction is actionable (not neutral)
  if (!chatroomDirection || chatroomDirection === 'neutral') {
    return { shouldTrigger: false, reason: 'Chatroom consensus is neutral - no action needed' };
  }

  // Check consensus strength threshold
  if (chatroomStrength < CONSENSUS_STRENGTH_THRESHOLD) {
    return {
      shouldTrigger: false,
      reason: `Chatroom consensus strength (${chatroomStrength}%) below threshold (${CONSENSUS_STRENGTH_THRESHOLD}%)`,
    };
  }

  // Check rate limiting
  const timeSinceLastTrigger = now - bridgeState.lastCouncilTriggerTime;
  if (timeSinceLastTrigger < MIN_COUNCIL_INTERVAL_MS) {
    const remainingMs = MIN_COUNCIL_INTERVAL_MS - timeSinceLastTrigger;
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      shouldTrigger: false,
      reason: `Rate limited - council can be triggered again in ${remainingMin} minute(s)`,
    };
  }

  // Check if this is the same consensus we already processed
  if (
    bridgeState.lastChatroomConsensus &&
    bridgeState.lastChatroomConsensus.direction === chatroomDirection &&
    bridgeState.lastChatroomConsensus.strength === chatroomStrength &&
    now - bridgeState.lastChatroomConsensus.timestamp < MIN_COUNCIL_INTERVAL_MS
  ) {
    return { shouldTrigger: false, reason: 'Same consensus already processed recently' };
  }

  return { shouldTrigger: true, reason: 'Chatroom consensus ready to trigger council' };
}

/**
 * Build context string for the trading council based on chatroom consensus
 */
export function buildCouncilContext(
  chatroomDirection: MessageSentiment,
  chatroomStrength: number
): string {
  const sentimentMap: Record<MessageSentiment, string> = {
    bullish: 'optimistic and bullish',
    bearish: 'pessimistic and bearish',
    neutral: 'neutral and undecided',
  };

  return `Market Sentiment Context: The AI chatroom has reached ${chatroomStrength}% consensus with a ${sentimentMap[chatroomDirection]} outlook. ` +
    `This crowd sentiment signal should be considered alongside your technical, on-chain, and risk analysis. ` +
    `The chatroom consensus represents collective AI opinion from diverse analytical perspectives.`;
}

/**
 * Handle a consensus update from the chatroom
 * This is called by the chatroom stream when consensus changes
 */
export function handleChatroomConsensusUpdate(
  direction: MessageSentiment | null,
  strength: number
): void {
  const now = Date.now();

  // Update stored chatroom consensus
  bridgeState.lastChatroomConsensus = {
    direction,
    strength,
    timestamp: now,
  };

  // Check if we should trigger the council
  const { shouldTrigger, reason } = shouldTriggerCouncil(direction, strength);

  console.log(`[chatroom-council-bridge] Consensus update: ${direction} @ ${strength}% - ${reason}`);

  if (shouldTrigger && direction && direction !== 'neutral') {
    bridgeState.pendingTrigger = true;

    // Emit trigger event to listeners
    const context: CouncilTriggerContext = {
      chatroomConsensus: { direction, strength },
      triggerReason: 'chatroom_consensus',
      asset: 'BTC', // Default asset, can be configured
    };

    triggerListeners.forEach(listener => {
      try {
        listener(context);
      } catch (error) {
        console.error('[chatroom-council-bridge] Error in trigger listener:', error);
      }
    });
  }
}

/**
 * Record a council evaluation result
 */
export function recordCouncilResult(
  consensusData: ConsensusData,
  triggeredBy: 'chatroom' | 'manual'
): void {
  const now = Date.now();

  bridgeState.lastCouncilTriggerTime = now;
  bridgeState.lastCouncilResult = {
    consensus: consensusData,
    triggeredBy,
    timestamp: now,
  };
  bridgeState.pendingTrigger = false;

  // Emit result event to listeners
  const event: CouncilResultEvent = {
    councilConsensus: consensusData,
    chatroomContext: bridgeState.lastChatroomConsensus
      ? {
          direction: bridgeState.lastChatroomConsensus.direction!,
          strength: bridgeState.lastChatroomConsensus.strength,
        }
      : null,
    timestamp: now,
    triggerReason: triggeredBy,
  };

  resultListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('[chatroom-council-bridge] Error in result listener:', error);
    }
  });
}

/**
 * Subscribe to council trigger events
 */
export function onCouncilTrigger(listener: CouncilTriggerListener): () => void {
  triggerListeners.push(listener);
  return () => {
    const index = triggerListeners.indexOf(listener);
    if (index !== -1) {
      triggerListeners.splice(index, 1);
    }
  };
}

/**
 * Subscribe to council result events
 */
export function onCouncilResult(listener: CouncilResultListener): () => void {
  resultListeners.push(listener);
  return () => {
    const index = resultListeners.indexOf(listener);
    if (index !== -1) {
      resultListeners.splice(index, 1);
    }
  };
}

/**
 * Get current bridge state (for debugging/UI)
 */
export function getBridgeState(): Readonly<BridgeState> {
  return { ...bridgeState };
}

/**
 * Get time until next council evaluation is allowed
 */
export function getTimeUntilNextCouncilAllowed(): number {
  const now = Date.now();
  const timeSinceLastTrigger = now - bridgeState.lastCouncilTriggerTime;
  const remaining = MIN_COUNCIL_INTERVAL_MS - timeSinceLastTrigger;
  return Math.max(0, remaining);
}

/**
 * Check if council evaluation is currently pending
 */
export function isCouncilPending(): boolean {
  return bridgeState.pendingTrigger;
}

/**
 * Reset bridge state (for testing or manual reset)
 */
export function resetBridgeState(): void {
  bridgeState = {
    lastCouncilTriggerTime: 0,
    lastChatroomConsensus: null,
    lastCouncilResult: null,
    pendingTrigger: false,
  };
}

/**
 * Configuration for the bridge
 */
export const BRIDGE_CONFIG = {
  MIN_COUNCIL_INTERVAL_MS,
  CONSENSUS_STRENGTH_THRESHOLD,
} as const;
