// CVAULT-188: Server-side moderation storage using Vercel KV
import { ModerationStore, MutedUser, BannedUser, ModerationAction } from './types';

const KEYS = {
  moderation: 'chatroom:moderation_store',
  userViolations: 'chatroom:user_violations',
  moderationQueue: 'chatroom:moderation_queue', // Flagged messages pending review
};

const AUTO_MUTE_THRESHOLD = 3; // Mute after 3 flagged messages
const AUTO_BAN_THRESHOLD = 5; // Ban after 5 flagged messages
const AUTO_MUTE_DURATIONS = [
  5 * 60 * 1000,   // 5 minutes (first offense)
  15 * 60 * 1000,  // 15 minutes (second offense)
  60 * 60 * 1000,  // 1 hour (third offense)
  24 * 60 * 60 * 1000, // 24 hours (fourth offense)
];

// In-memory fallback
let memModerationStore: ModerationStore = {
  mutedUsers: {},
  bannedUsers: {},
  moderationLog: [],
};
let memUserViolations: Record<string, number> = {};

function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get moderation store
 */
export async function getModerationStore(): Promise<ModerationStore> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const store = await kv.get<ModerationStore>(KEYS.moderation);
      return store || {
        mutedUsers: {},
        bannedUsers: {},
        moderationLog: [],
      };
    } catch (error) {
      console.error('[moderation-kv] Error fetching moderation store:', error);
    }
  }
  return { ...memModerationStore };
}

/**
 * Save moderation store
 */
export async function saveModerationStore(store: ModerationStore): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(KEYS.moderation, store);
      return;
    } catch (error) {
      console.error('[moderation-kv] Error saving moderation store:', error);
    }
  }
  memModerationStore = { ...store };
}

/**
 * Get user violation count
 */
export async function getUserViolations(userId: string): Promise<number> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const violations = await kv.get<Record<string, number>>(KEYS.userViolations);
      return violations?.[userId] || 0;
    } catch (error) {
      console.error('[moderation-kv] Error fetching user violations:', error);
    }
  }
  return memUserViolations[userId] || 0;
}

/**
 * Increment user violation count
 */
export async function incrementUserViolations(userId: string): Promise<number> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const violations = (await kv.get<Record<string, number>>(KEYS.userViolations)) || {};
      violations[userId] = (violations[userId] || 0) + 1;
      await kv.set(KEYS.userViolations, violations);
      return violations[userId];
    } catch (error) {
      console.error('[moderation-kv] Error incrementing user violations:', error);
    }
  }
  memUserViolations[userId] = (memUserViolations[userId] || 0) + 1;
  return memUserViolations[userId];
}

/**
 * Reset user violation count
 */
export async function resetUserViolations(userId: string): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const violations = (await kv.get<Record<string, number>>(KEYS.userViolations)) || {};
      delete violations[userId];
      await kv.set(KEYS.userViolations, violations);
      return;
    } catch (error) {
      console.error('[moderation-kv] Error resetting user violations:', error);
    }
  }
  delete memUserViolations[userId];
}

/**
 * Check if user should be auto-muted or auto-banned
 * Returns action to take, or null if no action needed
 */
export async function checkAutoModeration(
  userId: string,
  handle: string
): Promise<{ action: ModerationAction; newViolations: number } | null> {
  const violationCount = await incrementUserViolations(userId);

  if (violationCount >= AUTO_BAN_THRESHOLD) {
    // Auto-ban
    return {
      action: {
        type: 'ban',
        targetUserId: userId,
        targetHandle: handle,
        reason: `Automatic ban after ${violationCount} flagged messages`,
        moderatorId: 'system',
        timestamp: Date.now(),
      },
      newViolations: violationCount,
    };
  } else if (violationCount >= AUTO_MUTE_THRESHOLD) {
    // Auto-mute with escalating duration
    const muteIndex = Math.min(violationCount - AUTO_MUTE_THRESHOLD, AUTO_MUTE_DURATIONS.length - 1);
    const duration = AUTO_MUTE_DURATIONS[muteIndex];

    return {
      action: {
        type: 'mute',
        targetUserId: userId,
        targetHandle: handle,
        duration,
        reason: `Automatic mute after ${violationCount} flagged messages`,
        moderatorId: 'system',
        timestamp: Date.now(),
      },
      newViolations: violationCount,
    };
  }

  return null;
}

/**
 * Execute a moderation action
 */
export async function executeModerationAction(action: ModerationAction): Promise<void> {
  const store = await getModerationStore();

  switch (action.type) {
    case 'mute':
      store.mutedUsers[action.targetUserId] = {
        userId: action.targetUserId,
        handle: action.targetHandle,
        mutedAt: action.timestamp,
        mutedUntil: action.duration ? action.timestamp + action.duration : null,
        reason: action.reason,
        moderatorId: action.moderatorId,
      };
      break;

    case 'unmute':
      delete store.mutedUsers[action.targetUserId];
      break;

    case 'ban':
      store.bannedUsers[action.targetUserId] = {
        userId: action.targetUserId,
        handle: action.targetHandle,
        bannedAt: action.timestamp,
        reason: action.reason,
        moderatorId: action.moderatorId,
      };
      // Also remove from muted users if present
      delete store.mutedUsers[action.targetUserId];
      break;

    case 'unban':
      delete store.bannedUsers[action.targetUserId];
      // Reset violation count when unbanning
      await resetUserViolations(action.targetUserId);
      break;
  }

  // Log the action
  store.moderationLog.push(action);

  // Keep only last 500 log entries
  if (store.moderationLog.length > 500) {
    store.moderationLog = store.moderationLog.slice(-500);
  }

  await saveModerationStore(store);

  console.log(
    `[moderation-kv] Executed ${action.type} on user ${action.targetHandle} by ${action.moderatorId}`
  );
}

/**
 * Check if user is muted
 */
export async function isUserMuted(
  userId: string
): Promise<{ muted: boolean; reason?: string; mutedUntil?: number | null }> {
  const store = await getModerationStore();
  const mute = store.mutedUsers[userId];

  if (!mute) {
    return { muted: false };
  }

  // Check if temporary mute has expired
  if (mute.mutedUntil !== null && mute.mutedUntil < Date.now()) {
    // Expired, auto-unmute
    await executeModerationAction({
      type: 'unmute',
      targetUserId: userId,
      targetHandle: mute.handle,
      reason: 'Mute period expired',
      moderatorId: 'system',
      timestamp: Date.now(),
    });
    return { muted: false };
  }

  return {
    muted: true,
    reason: mute.reason,
    mutedUntil: mute.mutedUntil,
  };
}

/**
 * Check if user is banned
 */
export async function isUserBanned(userId: string): Promise<{ banned: boolean; reason?: string }> {
  const store = await getModerationStore();
  const ban = store.bannedUsers[userId];

  if (!ban) {
    return { banned: false };
  }

  return {
    banned: true,
    reason: ban.reason,
  };
}

/**
 * Check if user can post (not muted or banned)
 */
export async function canUserPost(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check banned first
  const banStatus = await isUserBanned(userId);
  if (banStatus.banned) {
    return {
      allowed: false,
      reason: `You are banned: ${banStatus.reason}`,
    };
  }

  // Check muted
  const muteStatus = await isUserMuted(userId);
  if (muteStatus.muted) {
    const until = muteStatus.mutedUntil
      ? new Date(muteStatus.mutedUntil).toLocaleString()
      : 'permanently';
    return {
      allowed: false,
      reason: `You are muted until ${until}: ${muteStatus.reason}`,
    };
  }

  return { allowed: true };
}

/**
 * Clean up expired mutes
 */
export async function cleanupExpiredMutes(): Promise<void> {
  const store = await getModerationStore();
  const now = Date.now();
  let modified = false;

  for (const [userId, mute] of Object.entries(store.mutedUsers)) {
    if (mute.mutedUntil !== null && mute.mutedUntil < now) {
      delete store.mutedUsers[userId];
      modified = true;
      console.log(`[moderation-kv] Auto-unmuted user ${mute.handle} (mute expired)`);
    }
  }

  if (modified) {
    await saveModerationStore(store);
  }
}
