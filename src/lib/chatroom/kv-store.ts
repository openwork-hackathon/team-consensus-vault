import { ChatMessage, ChatRoomState, ChatPhase, PersonaPersuasionState, DebateSummary, ConsensusSnapshot, ROLLING_HISTORY_CONFIG, MessageSentiment } from './types';

// Static import for @vercel/kv to avoid Turbopack issues
import { kv } from '@vercel/kv';

const KEYS = {
  messages: 'chatroom:messages',
  state: 'chatroom:state',
  lock: 'chatroom:lock',
  msgIndex: 'chatroom:msg_index',
  persuasion: 'chatroom:persuasion', // CVAULT-185: Persuasion state storage
  marketData: 'chatroom:market_data', // CVAULT-185: Market data cache
  debateSummary: 'chatroom:debate_summary', // CVAULT-190: Debate summary for consensus context
  debateHistory: 'chatroom:debate_history', // CVAULT-190: Historical debate summaries
  consensusSnapshots: 'chatroom:consensus_snapshots', // CVAULT-217: Consensus snapshots (persisted)
  lastCleanup: 'chatroom:last_cleanup', // CVAULT-217: Track last cleanup time
};

const MAX_MESSAGES = ROLLING_HISTORY_CONFIG.MAX_MESSAGES;
const LOCK_TTL_SECONDS = 120;
const PERSUASION_TTL_SECONDS = 86400; // 24 hours
const DEBATE_SUMMARY_TTL_SECONDS = 604800; // 7 days
const MAX_DEBATE_HISTORY = 10; // Keep last 10 debate summaries
// CVAULT-217: Consensus snapshots are preserved indefinitely (no TTL)
const MAX_CONSENSUS_SNAPSHOTS = 100; // Keep last 100 consensus snapshots

// In-memory fallback
let memMessages: ChatMessage[] = [];
let memState: ChatRoomState | null = null;
let memLock: { holder: string; expiresAt: number } | null = null;
let memMsgIndex = 0;
let memPersuasionStates: Record<string, PersonaPersuasionState> = {};

function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function defaultState(): ChatRoomState {
  return {
    phase: 'DEBATE',
    phaseStartedAt: Date.now(),
    cooldownEndsAt: null,
    lastMessageAt: 0,
    lastSpeakerId: null,
    messageCount: 0,
    nextSpeakerId: null,
    consensusDirection: null,
    consensusStrength: 0,
    recentSpeakers: [],
  };
}

export async function getMessages(): Promise<ChatMessage[]> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const messages = await kv.get<ChatMessage[]>(KEYS.messages);
      return messages || [];
    } catch (error) {
      console.error('[chatroom-kv] Error fetching messages:', error);
    }
  }
  return memMessages;
}

export async function appendMessage(message: ChatMessage): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const messages = (await kv.get<ChatMessage[]>(KEYS.messages)) || [];
      messages.push(message);
      // Keep only the last MAX_MESSAGES
      const trimmed = messages.length > MAX_MESSAGES
        ? messages.slice(messages.length - MAX_MESSAGES)
        : messages;
      await kv.set(KEYS.messages, trimmed);
      await kv.incr(KEYS.msgIndex);
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error appending message:', error);
    }
  }
  memMessages.push(message);
  if (memMessages.length > MAX_MESSAGES) {
    memMessages = memMessages.slice(memMessages.length - MAX_MESSAGES);
  }
  memMsgIndex++;
}

export async function getState(): Promise<ChatRoomState> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const state = await kv.get<ChatRoomState>(KEYS.state);
      return state || defaultState();
    } catch (error) {
      console.error('[chatroom-kv] Error fetching state:', error);
    }
  }
  return memState || defaultState();
}

export async function setState(state: ChatRoomState): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      await kv.set(KEYS.state, state);
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error setting state:', error);
    }
  }
  memState = state;
}

export async function acquireLock(holderId: string): Promise<boolean> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      // SET NX EX — only sets if key doesn't exist, with TTL
      const result = await kv.set(KEYS.lock, holderId, { nx: true, ex: LOCK_TTL_SECONDS });
      return result === 'OK';
    } catch (error) {
      console.error('[chatroom-kv] Error acquiring lock:', error);
      return false;
    }
  }
  // In-memory lock
  const now = Date.now();
  if (memLock && memLock.expiresAt > now) {
    return false; // Lock held by someone else
  }
  memLock = { holder: holderId, expiresAt: now + LOCK_TTL_SECONDS * 1000 };
  return true;
}

export async function releaseLock(holderId: string): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      // Only release if we hold it
      const current = await kv.get<string>(KEYS.lock);
      if (current === holderId) {
        await kv.del(KEYS.lock);
      }
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error releasing lock:', error);
    }
  }
  if (memLock && memLock.holder === holderId) {
    memLock = null;
  }
}

export async function getMessageIndex(): Promise<number> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const index = await kv.get<number>(KEYS.msgIndex);
      return index || 0;
    } catch (error) {
      console.error('[chatroom-kv] Error fetching msg index:', error);
    }
  }
  return memMsgIndex;
}

export async function initializeIfEmpty(): Promise<void> {
  const state = await getState();
  if (state.messageCount === 0 && state.lastMessageAt === 0) {
    await setState(defaultState());
  }
}

/**
 * CVAULT-185: Get persuasion states for all personas
 */
export async function getPersuasionStates(): Promise<Record<string, PersonaPersuasionState>> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const states = await kv.get<Record<string, PersonaPersuasionState>>(KEYS.persuasion);
      return states || {};
    } catch (error) {
      console.error('[chatroom-kv] Error fetching persuasion states:', error);
    }
  }
  return memPersuasionStates;
}

/**
 * CVAULT-185: Set persuasion states for all personas
 */
export async function setPersuasionStates(states: Record<string, PersonaPersuasionState>): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      await kv.set(KEYS.persuasion, states, { ex: PERSUASION_TTL_SECONDS });
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error setting persuasion states:', error);
    }
  }
  memPersuasionStates = states;
}

/**
 * CVAULT-185: Get market data cache
 */
export async function getMarketDataCache(): Promise<any> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      return await kv.get(KEYS.marketData);
    } catch (error) {
      console.error('[chatroom-kv] Error fetching market data:', error);
    }
  }
  return null;
}

/**
 * CVAULT-185: Set market data cache
 */
export async function setMarketDataCache(data: any): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      // Cache market data for 60 seconds
      await kv.set(KEYS.marketData, data, { ex: 60 });
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error setting market data:', error);
    }
  }
}

// In-memory fallback for debate summaries
let memDebateSummary: DebateSummary | null = null;
let memDebateHistory: DebateSummary[] = [];

/**
 * CVAULT-190: Get the latest debate summary for consensus context
 */
export async function getDebateSummary(): Promise<DebateSummary | null> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const summary = await kv.get<DebateSummary>(KEYS.debateSummary);
      return summary;
    } catch (error) {
      console.error('[chatroom-kv] Error fetching debate summary:', error);
    }
  }
  return memDebateSummary;
}

/**
 * CVAULT-190: Save debate summary when consensus is reached
 */
export async function saveDebateSummary(summary: DebateSummary): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      // Save as current summary
      await kv.set(KEYS.debateSummary, summary, { ex: DEBATE_SUMMARY_TTL_SECONDS });
      
      // Also append to history
      const history = await kv.get<DebateSummary[]>(KEYS.debateHistory) || [];
      history.push(summary);
      // Keep only the last MAX_DEBATE_HISTORY
      if (history.length > MAX_DEBATE_HISTORY) {
        history.shift();
      }
      await kv.set(KEYS.debateHistory, history, { ex: DEBATE_SUMMARY_TTL_SECONDS });
      
      console.log(`[CVAULT-190] Debate summary saved: Round ${summary.roundNumber}, ${summary.consensusDirection} @ ${summary.consensusStrength}%`);
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error saving debate summary:', error);
    }
  }
  memDebateSummary = summary;
  memDebateHistory.push(summary);
  if (memDebateHistory.length > MAX_DEBATE_HISTORY) {
    memDebateHistory.shift();
  }
  console.log(`[CVAULT-190] Debate summary saved (memory): Round ${summary.roundNumber}, ${summary.consensusDirection} @ ${summary.consensusStrength}%`);
}

/**
 * CVAULT-190: Get debate history
 */
export async function getDebateHistory(): Promise<DebateSummary[]> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      const history = await kv.get<DebateSummary[]>(KEYS.debateHistory);
      return history || [];
    } catch (error) {
      console.error('[chatroom-kv] Error fetching debate history:', error);
    }
  }
  return memDebateHistory;
}

/**
 * CVAULT-190: Clear debate summary (called when starting new debate round)
 */
export async function clearDebateSummary(): Promise<void> {
  if (isKVAvailable()) {
    try {
      // Using kv from @vercel/kv import
      await kv.del(KEYS.debateSummary);
      console.log('[CVAULT-190] Debate summary cleared for new round');
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error clearing debate summary:', error);
    }
  }
  memDebateSummary = null;
  console.log('[CVAULT-190] Debate summary cleared (memory) for new round');
}

// ============================================================================
// CVAULT-217: Rolling 1-hour history with consensus snapshots
// ============================================================================

// In-memory fallback for consensus snapshots
let memConsensusSnapshots: ConsensusSnapshot[] = [];

/**
 * CVAULT-217: Get messages from the last 1 hour only (rolling window)
 * Alias for getRollingHistory for clarity
 */
export async function getRecentMessages(): Promise<ChatMessage[]> {
  return getRollingHistory();
}

/**
 * CVAULT-217: Create a consensus snapshot from messages that are aging out
 */
export async function createConsensusSnapshot(
  messages: ChatMessage[],
  state: ChatRoomState,
  reason: ConsensusSnapshot['snapshotReason'] = 'time_window_rollover'
): Promise<ConsensusSnapshot> {
  const now = Date.now();
  const timestampRange = {
    start: messages.length > 0 ? messages[0].timestamp : now,
    end: messages.length > 0 ? messages[messages.length - 1].timestamp : now,
  };

  // Count messages by sentiment
  const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
  const personaContributions: Record<string, {
    personaId: string;
    handle: string;
    messageCount: number;
    sentiments: MessageSentiment[];
    keyPoints: string[];
  }> = {};

  for (const msg of messages) {
    // Count sentiments
    if (msg.sentiment) {
      sentimentCounts[msg.sentiment]++;
    }

    // Track persona contributions
    if (!personaContributions[msg.personaId]) {
      personaContributions[msg.personaId] = {
        personaId: msg.personaId,
        handle: msg.handle,
        messageCount: 0,
        sentiments: [],
        keyPoints: [],
      };
    }
    personaContributions[msg.personaId].messageCount++;
    if (msg.sentiment) {
      personaContributions[msg.personaId].sentiments.push(msg.sentiment);
    }
    // Extract first sentence as key point (simplified)
    const firstSentence = msg.content.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10) {
      personaContributions[msg.personaId].keyPoints.push(firstSentence);
    }
  }

  // Calculate top persona contributions (top 5 by message count)
  const topPersonaContributions = Object.values(personaContributions)
    .map(pc => ({
      personaId: pc.personaId,
      handle: pc.handle,
      messageCount: pc.messageCount,
      primaryStance: getPrimaryStance(pc.sentiments),
      keyPoints: pc.keyPoints.slice(0, 3), // Top 3 points per persona
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);

  // Extract key arguments by sentiment
  const keyArgumentsSummary = {
    bullish: [] as string[],
    bearish: [] as string[],
    neutral: [] as string[],
  };

  for (const msg of messages) {
    if (msg.sentiment && msg.content) {
      const summary = msg.content.slice(0, 100);
      if (!keyArgumentsSummary[msg.sentiment].includes(summary)) {
        keyArgumentsSummary[msg.sentiment].push(summary);
      }
    }
  }

  // Limit arguments per sentiment
  keyArgumentsSummary.bullish = keyArgumentsSummary.bullish.slice(0, 5);
  keyArgumentsSummary.bearish = keyArgumentsSummary.bearish.slice(0, 5);
  keyArgumentsSummary.neutral = keyArgumentsSummary.neutral.slice(0, 3);

  const snapshot: ConsensusSnapshot = {
    id: `snapshot_${now}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    timestampRange,
    consensusDirection: state.consensusDirection || 'neutral',
    consensusStrength: state.consensusStrength || 0,
    keyArgumentsSummary,
    topPersonaContributions,
    messageCount: messages.length,
    snapshotReason: reason,
  };

  return snapshot;
}

/**
 * Helper to determine primary stance from array of sentiments
 */
function getPrimaryStance(sentiments: MessageSentiment[]): MessageSentiment {
  if (sentiments.length === 0) return 'neutral';
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  for (const s of sentiments) {
    counts[s]++;
  }
  if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) return 'bullish';
  if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) return 'bearish';
  return 'neutral';
}

/**
 * CVAULT-217: Save a consensus snapshot when consensus is reached
 * These snapshots persist even after messages are pruned from rolling history
 */
export async function saveConsensusSnapshot(snapshot: ConsensusSnapshot): Promise<void> {
  if (isKVAvailable()) {
    try {
      const snapshots = await kv.get<ConsensusSnapshot[]>(KEYS.consensusSnapshots) || [];
      snapshots.push(snapshot);
      
      // Keep only the last MAX_CONSENSUS_SNAPSHOTS
      if (snapshots.length > MAX_CONSENSUS_SNAPSHOTS) {
        snapshots.shift();
      }
      
      // No TTL - these persist indefinitely
      await kv.set(KEYS.consensusSnapshots, snapshots);
      console.log(`[CVAULT-217] Consensus snapshot saved: ${snapshot.consensusDirection} @ ${snapshot.consensusStrength}% (${snapshot.id})`);
      return;
    } catch (error) {
      console.error('[chatroom-kv] Error saving consensus snapshot:', error);
    }
  }
  memConsensusSnapshots.push(snapshot);
  if (memConsensusSnapshots.length > MAX_CONSENSUS_SNAPSHOTS) {
    memConsensusSnapshots.shift();
  }
  console.log(`[CVAULT-217] Consensus snapshot saved (memory): ${snapshot.consensusDirection} @ ${snapshot.consensusStrength}%`);
}

/**
 * CVAULT-217: Get all consensus snapshots (persisted historical decisions)
 */
export async function getConsensusSnapshots(): Promise<ConsensusSnapshot[]> {
  if (isKVAvailable()) {
    try {
      const snapshots = await kv.get<ConsensusSnapshot[]>(KEYS.consensusSnapshots);
      return snapshots || [];
    } catch (error) {
      console.error('[chatroom-kv] Error fetching consensus snapshots:', error);
    }
  }
  return memConsensusSnapshots;
}

/**
 * CVAULT-217: Clean up old messages from rolling history (lazy evaluation)
 * Messages older than 1 hour are removed, but consensus snapshots are preserved
 */
export async function cleanupRollingHistory(): Promise<{ removed: number; remaining: number }> {
  const now = Date.now();
  const cutoffTime = now - ROLLING_HISTORY_CONFIG.MAX_MESSAGE_AGE_MS;
  
  if (isKVAvailable()) {
    try {
      // Check if we need to run cleanup (throttle to avoid excessive operations)
      const lastCleanup = await kv.get<number>(KEYS.lastCleanup) || 0;
      if (now - lastCleanup < ROLLING_HISTORY_CONFIG.CLEANUP_INTERVAL_MS) {
        // Cleanup ran recently, skip
        const messages = await kv.get<ChatMessage[]>(KEYS.messages) || [];
        return { removed: 0, remaining: messages.length };
      }
      
      const messages = await kv.get<ChatMessage[]>(KEYS.messages) || [];
      const originalCount = messages.length;
      
      // Filter out messages older than 1 hour
      const filteredMessages = messages.filter(msg => msg.timestamp >= cutoffTime);
      const removed = originalCount - filteredMessages.length;
      
      if (removed > 0) {
        // Create snapshot of aged-out messages before removing them
        const agedOutMessages = messages.filter(msg => msg.timestamp < cutoffTime);
        if (agedOutMessages.length > 0) {
          const state = await getState();
          const snapshot = await createConsensusSnapshot(agedOutMessages, state, 'time_window_rollover');
          await saveConsensusSnapshot(snapshot);
        }
        
        await kv.set(KEYS.messages, filteredMessages);
        await kv.set(KEYS.lastCleanup, now);
        console.log(`[CVAULT-217] Rolling history cleanup: removed ${removed} old messages, ${filteredMessages.length} remaining`);
      } else {
        // Still update last cleanup time even if nothing was removed
        await kv.set(KEYS.lastCleanup, now);
      }
      
      return { removed, remaining: filteredMessages.length };
    } catch (error) {
      console.error('[chatroom-kv] Error cleaning up rolling history:', error);
    }
  }
  
  // In-memory cleanup
  const originalCount = memMessages.length;
  
  // Create snapshot of aged-out messages before removing them
  const agedOutMessages = memMessages.filter(msg => msg.timestamp < cutoffTime);
  if (agedOutMessages.length > 0) {
    const state = await getState();
    const snapshot = await createConsensusSnapshot(agedOutMessages, state, 'time_window_rollover');
    await saveConsensusSnapshot(snapshot);
  }
  
  memMessages = memMessages.filter(msg => msg.timestamp >= cutoffTime);
  const removed = originalCount - memMessages.length;
  
  if (removed > 0) {
    console.log(`[CVAULT-217] Rolling history cleanup (memory): removed ${removed} old messages, ${memMessages.length} remaining`);
  }
  
  return { removed, remaining: memMessages.length };
}

/**
 * CVAULT-217: Get messages within the rolling window (last 1 hour)
 * Automatically triggers cleanup if needed
 */
export async function getRollingHistory(): Promise<ChatMessage[]> {
  // Trigger lazy cleanup
  await cleanupRollingHistory();
  
  const messages = await getMessages();
  const now = Date.now();
  const cutoffTime = now - ROLLING_HISTORY_CONFIG.MAX_MESSAGE_AGE_MS;
  
  // Double-check filtering (in case cleanup didn't run or failed)
  return messages.filter(msg => msg.timestamp >= cutoffTime);
}

/**
 * CVAULT-217: Get history with snapshots - returns recent messages + older snapshots
 * This is the primary API for frontend consumption
 */
export async function getHistoryWithSnapshots(): Promise<{
  recentMessages: ChatMessage[];
  snapshots: ConsensusSnapshot[];
  currentState: ChatRoomState;
}> {
  // Run cleanup first to ensure fresh data
  await cleanupRollingHistory();
  
  const recentMessages = await getRollingHistory();
  const snapshots = await getConsensusSnapshots();
  const currentState = await getState();
  
  return {
    recentMessages,
    snapshots,
    currentState,
  };
}

/**
 * CVAULT-217: Get the current rolling window status for monitoring
 */
export async function getRollingHistoryStatus(): Promise<{
  totalMessages: number;
  rollingMessages: number;
  oldestMessageAge: number;
  newestMessageAge: number;
  snapshotCount: number;
}> {
  const allMessages = await getMessages();
  const rollingMessages = await getRollingHistory();
  const snapshots = await getConsensusSnapshots();
  
  const now = Date.now();
  const oldestMessage = allMessages.length > 0 ? allMessages[0] : null;
  const newestMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
  
  return {
    totalMessages: allMessages.length,
    rollingMessages: rollingMessages.length,
    oldestMessageAge: oldestMessage ? now - oldestMessage.timestamp : 0,
    newestMessageAge: newestMessage ? now - newestMessage.timestamp : 0,
    snapshotCount: snapshots.length,
  };
}
