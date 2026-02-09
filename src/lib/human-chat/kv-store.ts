import {
  HumanChatMessage,
  HumanChatUser,
  HumanChatState,
  RateLimitInfo,
  RATE_LIMIT_MS,
  MAX_HUMAN_CHAT_MESSAGES,
} from './types';

const KEYS = {
  messages: 'human-chat:messages',
  users: 'human-chat:users',
  state: 'human-chat:state',
  rateLimits: 'human-chat:rate-limits',
};

// In-memory fallback
let memMessages: HumanChatMessage[] = [];
let memUsers: Record<string, HumanChatUser> = {};
let memState: HumanChatState | null = null;
let memRateLimits: Record<string, number> = {};

function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function defaultState(): HumanChatState {
  return {
    messageCount: 0,
    activeUsers: 0,
    lastMessageAt: null,
  };
}

export async function getMessages(): Promise<HumanChatMessage[]> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const messages = await kv.get<HumanChatMessage[]>(KEYS.messages);
      return messages || [];
    } catch (error) {
      console.error('[human-chat-kv] Error fetching messages:', error);
    }
  }
  return memMessages;
}

export async function appendMessage(message: HumanChatMessage): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const messages = (await kv.get<HumanChatMessage[]>(KEYS.messages)) || [];
      messages.push(message);
      // Keep only the last MAX_HUMAN_CHAT_MESSAGES
      const trimmed = messages.length > MAX_HUMAN_CHAT_MESSAGES
        ? messages.slice(messages.length - MAX_HUMAN_CHAT_MESSAGES)
        : messages;
      await kv.set(KEYS.messages, trimmed);
      return;
    } catch (error) {
      console.error('[human-chat-kv] Error appending message:', error);
    }
  }
  memMessages.push(message);
  if (memMessages.length > MAX_HUMAN_CHAT_MESSAGES) {
    memMessages = memMessages.slice(memMessages.length - MAX_HUMAN_CHAT_MESSAGES);
  }
}

export async function getState(): Promise<HumanChatState> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const state = await kv.get<HumanChatState>(KEYS.state);
      return state || defaultState();
    } catch (error) {
      console.error('[human-chat-kv] Error fetching state:', error);
    }
  }
  return memState || defaultState();
}

export async function setState(state: HumanChatState): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(KEYS.state, state);
      return;
    } catch (error) {
      console.error('[human-chat-kv] Error setting state:', error);
    }
  }
  memState = state;
}

export async function getUsers(): Promise<Record<string, HumanChatUser>> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const users = await kv.get<Record<string, HumanChatUser>>(KEYS.users);
      return users || {};
    } catch (error) {
      console.error('[human-chat-kv] Error fetching users:', error);
    }
  }
  return memUsers;
}

export async function setUsers(users: Record<string, HumanChatUser>): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(KEYS.users, users);
      return;
    } catch (error) {
      console.error('[human-chat-kv] Error setting users:', error);
    }
  }
  memUsers = users;
}

export async function updateUser(user: HumanChatUser): Promise<void> {
  const users = await getUsers();
  users[user.userId] = user;
  await setUsers(users);
}

export async function removeUser(userId: string): Promise<void> {
  const users = await getUsers();
  delete users[userId];
  await setUsers(users);
}

/**
 * Check rate limit for a user
 * Returns RateLimitInfo indicating if user can post and remaining time
 */
export async function checkRateLimit(userId: string): Promise<RateLimitInfo> {
  const now = Date.now();
  
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const rateLimits = await kv.get<Record<string, number>>(KEYS.rateLimits) || {};
      const lastPostTime = rateLimits[userId] || 0;
      const remainingTimeMs = Math.max(0, RATE_LIMIT_MS - (now - lastPostTime));
      
      return {
        allowed: remainingTimeMs === 0,
        remainingTimeMs,
        lastPostTime,
      };
    } catch (error) {
      console.error('[human-chat-kv] Error checking rate limit:', error);
    }
  }
  
  const lastPostTime = memRateLimits[userId] || 0;
  const remainingTimeMs = Math.max(0, RATE_LIMIT_MS - (now - lastPostTime));
  
  return {
    allowed: remainingTimeMs === 0,
    remainingTimeMs,
    lastPostTime,
  };
}

/**
 * Record a message post for rate limiting
 */
export async function recordPost(userId: string): Promise<void> {
  const now = Date.now();
  
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const rateLimits = await kv.get<Record<string, number>>(KEYS.rateLimits) || {};
      rateLimits[userId] = now;
      await kv.set(KEYS.rateLimits, rateLimits, { ex: 3600 }); // Expire after 1 hour
      return;
    } catch (error) {
      console.error('[human-chat-kv] Error recording post:', error);
    }
  }
  
  memRateLimits[userId] = now;
}

/**
 * Clean up old users (not seen in last 5 minutes)
 */
export async function cleanupInactiveUsers(): Promise<void> {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const users = await getUsers();
  let changed = false;
  
  for (const [userId, user] of Object.entries(users)) {
    if (user.lastSeenAt < fiveMinutesAgo) {
      delete users[userId];
      changed = true;
    }
  }
  
  if (changed) {
    await setUsers(users);
  }
}
