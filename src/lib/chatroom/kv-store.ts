import { ChatMessage, ChatRoomState, ChatPhase, PersonaPersuasionState } from './types';

const KEYS = {
  messages: 'chatroom:messages',
  state: 'chatroom:state',
  lock: 'chatroom:lock',
  msgIndex: 'chatroom:msg_index',
  persuasion: 'chatroom:persuasion', // CVAULT-185: Persuasion state storage
  marketData: 'chatroom:market_data', // CVAULT-185: Market data cache
};

const MAX_MESSAGES = 200;
const LOCK_TTL_SECONDS = 120;
const PERSUASION_TTL_SECONDS = 86400; // 24 hours

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
      const { kv } = await import('@vercel/kv');
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
      const { kv } = await import('@vercel/kv');
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
      const { kv } = await import('@vercel/kv');
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
      const { kv } = await import('@vercel/kv');
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
      const { kv } = await import('@vercel/kv');
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
      const { kv } = await import('@vercel/kv');
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
      const { kv } = await import('@vercel/kv');
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
