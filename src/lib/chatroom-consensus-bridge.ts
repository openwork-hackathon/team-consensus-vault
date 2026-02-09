/**
 * Chatroom-to-Trading-Council Bridge
 *
 * Connects the 17-persona chatroom consensus system to the 5-agent trading council.
 *
 * Flow:
 * 1. Chatroom generates consensus: direction (bullish/bearish/neutral) + strength (0-100)
 * 2. Bridge formats this as context for trading council
 * 3. Trading council uses chatroom consensus as additional market intelligence
 * 4. Final decision requires 4/5 supermajority from trading council
 */

import { getState, getMessages } from './chatroom/kv-store';
import { calculateRollingConsensus } from './chatroom/consensus-calc';
import { MessageSentiment } from './chatroom/types';

export interface ChatroomConsensusSnapshot {
  direction: MessageSentiment | null;
  strength: number; // 0-100
  phaseState: 'DEBATE' | 'CONSENSUS' | 'COOLDOWN';
  messageCount: number;
  timestamp: number;
  summary: string; // Human-readable summary for trading council context
}

export interface BridgedAnalysisContext {
  chatroomConsensus: ChatroomConsensusSnapshot | null;
  combinedContext: string; // Formatted for trading council consumption
}

/**
 * Fetch current chatroom consensus state
 *
 * Returns the latest rolling consensus from the 17-persona debate.
 * Returns null if chatroom has insufficient data or is in cooldown.
 */
export async function getChatroomConsensus(): Promise<ChatroomConsensusSnapshot | null> {
  try {
    const state = await getState();
    const messages = await getMessages();

    // Calculate fresh consensus from messages
    const consensus = calculateRollingConsensus(messages);

    // Only provide consensus if we have meaningful data
    if (messages.length < 5 || consensus.strength < 20) {
      return null;
    }

    // Generate human-readable summary
    const summary = formatConsensusSummary(
      consensus.direction,
      consensus.strength,
      state.phase,
      messages.length
    );

    return {
      direction: consensus.direction,
      strength: consensus.strength,
      phaseState: state.phase,
      messageCount: messages.length,
      timestamp: Date.now(),
      summary,
    };
  } catch (error) {
    console.error('[chatroom-bridge] Failed to fetch chatroom consensus:', error);
    return null;
  }
}

/**
 * Format consensus into human-readable summary for trading council
 */
function formatConsensusSummary(
  direction: MessageSentiment | null,
  strength: number,
  phase: string,
  messageCount: number
): string {
  if (!direction || direction === 'neutral') {
    return `Community debate ongoing (${messageCount} messages). No clear consensus yet.`;
  }

  const intensity = strength >= 80 ? 'strong' : strength >= 60 ? 'moderate' : 'weak';
  const sentiment = direction === 'bullish' ? 'bullish' : 'bearish';
  const phaseDesc = phase === 'CONSENSUS' ? 'Consensus reached' : 'Active debate';

  return `${phaseDesc}: ${intensity} ${sentiment} consensus (${strength}% agreement) from 17-persona crypto chatroom debate.`;
}

/**
 * Prepare combined context for trading council analysis
 *
 * Merges chatroom consensus with user-provided context into a single
 * context string that the 5-agent trading council can use.
 *
 * @param userContext - Optional user-provided analysis context
 * @returns BridgedAnalysisContext with chatroom data and combined context string
 */
export async function prepareCouncilContext(
  userContext?: string
): Promise<BridgedAnalysisContext> {
  const chatroomConsensus = await getChatroomConsensus();

  // Build combined context string
  let combinedParts: string[] = [];

  if (chatroomConsensus) {
    combinedParts.push(`**Community Consensus:** ${chatroomConsensus.summary}`);
  }

  if (userContext && userContext.trim()) {
    combinedParts.push(`**Additional Context:** ${userContext.trim()}`);
  }

  const combinedContext = combinedParts.length > 0
    ? combinedParts.join('\n\n')
    : undefined;

  return {
    chatroomConsensus,
    combinedContext: combinedContext || '',
  };
}

/**
 * Determine if chatroom consensus should influence trading decision
 *
 * Returns true if chatroom consensus is strong enough to be meaningful.
 * Threshold: >= 60% strength in non-neutral direction.
 */
export function isChatroomConsensusSignificant(
  consensus: ChatroomConsensusSnapshot | null
): boolean {
  if (!consensus) return false;
  if (!consensus.direction || consensus.direction === 'neutral') return false;
  return consensus.strength >= 60;
}

/**
 * Calculate alignment score between chatroom and trading council
 *
 * Measures how well the trading council's decision aligns with
 * the chatroom consensus. Returns 0-100 score.
 *
 * - 100: Perfect alignment (same direction, high confidence both sides)
 * - 50: Partial alignment (same direction, but confidence mismatch)
 * - 0: Complete disagreement (opposite directions)
 */
export function calculateAlignmentScore(
  chatroomConsensus: ChatroomConsensusSnapshot | null,
  councilSignal: 'buy' | 'sell' | 'hold',
  councilConfidence: number
): number {
  if (!chatroomConsensus || !chatroomConsensus.direction) {
    // No chatroom consensus available
    return 50; // Neutral alignment
  }

  const chatroomDirection = chatroomConsensus.direction;
  const chatroomStrength = chatroomConsensus.strength;

  // Map trading signals to sentiment
  let councilSentiment: MessageSentiment;
  if (councilSignal === 'buy') {
    councilSentiment = 'bullish';
  } else if (councilSignal === 'sell') {
    councilSentiment = 'bearish';
  } else {
    councilSentiment = 'neutral';
  }

  // Calculate directional alignment
  if (chatroomDirection === councilSentiment) {
    // Same direction - alignment based on confidence/strength match
    const avgConfidence = (councilConfidence + chatroomStrength) / 2;
    return Math.round(50 + avgConfidence / 2); // 50-100 range
  } else if (
    (chatroomDirection === 'bullish' && councilSentiment === 'bearish') ||
    (chatroomDirection === 'bearish' && councilSentiment === 'bullish')
  ) {
    // Opposite directions - disagreement
    const avgConfidence = (councilConfidence + chatroomStrength) / 2;
    return Math.round(50 - avgConfidence / 2); // 0-50 range
  } else {
    // One side neutral - partial alignment
    return 50;
  }
}

/**
 * Generate alignment commentary for UI display
 */
export function generateAlignmentCommentary(
  alignmentScore: number,
  chatroomConsensus: ChatroomConsensusSnapshot | null,
  councilSignal: 'buy' | 'sell' | 'hold'
): string {
  if (!chatroomConsensus || !chatroomConsensus.direction) {
    return 'No chatroom consensus available for comparison.';
  }

  const councilAction = councilSignal.toUpperCase();
  const chatroomDirection = chatroomConsensus.direction.toUpperCase();

  if (alignmentScore >= 80) {
    return `✅ Strong agreement: Both systems align (chatroom: ${chatroomDirection}, council: ${councilAction})`;
  } else if (alignmentScore >= 60) {
    return `✓ Moderate agreement: Systems mostly align with some variation in confidence`;
  } else if (alignmentScore >= 40) {
    return `⚠️ Weak agreement: Systems have different confidence levels or mixed signals`;
  } else {
    return `❌ Disagreement: Chatroom leans ${chatroomDirection}, but council recommends ${councilAction}`;
  }
}
