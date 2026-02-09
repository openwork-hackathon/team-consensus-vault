import { ChatMessage, ChatRoomState, ChatPhase, PersonaPersuasionState, DebateSummary } from './types';

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
};

const MAX_MESSAGES = 200;
const LOCK_TTL_SECONDS = 120;
const PERSUASION_TTL_SECONDS = 86400; // 24 hours
const DEBATE_SUMMARY_TTL_SECONDS = 604800; // 7 days
const MAX_DEBATE_HISTORY = 10; // Keep last 10 debate summaries

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
