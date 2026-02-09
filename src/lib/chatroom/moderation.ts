// CVAULT-188: Moderation store for persistent mute/ban system
import { ModerationStore, ModerationAction, MutedUser, BannedUser } from './types';

const MODERATION_STORAGE_KEY = 'cvault_moderation_store';
const MODERATION_ACTIONS_LOG_KEY = 'cvault_moderation_actions_log';

export class ModerationManager {
  private store: ModerationStore;
  private actionsLog: ModerationAction[];

  constructor() {
    this.store = this.loadStore();
    this.actionsLog = this.loadActionsLog();
    this.cleanupExpiredMutes();
  }

  /**
   * Load moderation store from localStorage
   */
  private loadStore(): ModerationStore {
    try {
      const stored = localStorage.getItem(MODERATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          mutedUsers: parsed.mutedUsers || {},
          bannedUsers: parsed.bannedUsers || {},
          moderationLog: []
        };
      }
    } catch (error) {
      console.error('[ModerationManager] Failed to load store:', error);
    }

    return {
      mutedUsers: {},
      bannedUsers: {},
      moderationLog: []
    };
  }

  /**
   * Load actions log from localStorage
   */
  private loadActionsLog(): ModerationAction[] {
    try {
      const stored = localStorage.getItem(MODERATION_ACTIONS_LOG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[ModerationManager] Failed to load actions log:', error);
    }

    return [];
  }

  /**
   * Save moderation store to localStorage
   */
  private saveStore(): void {
    try {
      localStorage.setItem(MODERATION_STORAGE_KEY, JSON.stringify(this.store));
    } catch (error) {
      console.error('[ModerationManager] Failed to save store:', error);
    }
  }

  /**
   * Save actions log to localStorage
   */
  private saveActionsLog(): void {
    try {
      localStorage.setItem(MODERATION_ACTIONS_LOG_KEY, JSON.stringify(this.actionsLog));
    } catch (error) {
      console.error('[ModerationManager] Failed to save actions log:', error);
    }
  }

  /**
   * Remove expired mutes
   */
  private cleanupExpiredMutes(): void {
    const now = Date.now();
    let hasChanges = false;

    for (const [userId, mute] of Object.entries(this.store.mutedUsers)) {
      if (mute.mutedUntil !== null && mute.mutedUntil <= now) {
        delete this.store.mutedUsers[userId];
        hasChanges = true;
        console.log(`[ModerationManager] Removed expired mute for user ${userId}`);
      }
    }

    if (hasChanges) {
      this.saveStore();
    }
  }

  /**
   * Mute a user
   */
  muteUser(
    userId: string,
    handle: string,
    duration: number | null, // null = permanent
    reason: string,
    moderatorId: string
  ): boolean {
    try {
      const mutedUntil = duration === null ? null : Date.now() + duration;

      const mutedUser: MutedUser = {
        userId,
        handle,
        mutedAt: Date.now(),
        mutedUntil,
        reason,
        moderatorId
      };

      this.store.mutedUsers[userId] = mutedUser;

      // Log the action
      const action: ModerationAction = {
        type: 'mute',
        targetUserId: userId,
        targetHandle: handle,
        duration: duration === null ? undefined : duration,
        reason,
        moderatorId,
        timestamp: Date.now()
      };

      this.actionsLog.push(action);
      
      // Keep only last 1000 actions
      if (this.actionsLog.length > 1000) {
        this.actionsLog = this.actionsLog.slice(-1000);
      }

      this.saveStore();
      this.saveActionsLog();

      console.log(`[ModerationManager] Muted user ${handle} (${userId}) ${duration === null ? 'permanently' : `for ${duration}ms`}`);
      return true;
    } catch (error) {
      console.error('[ModerationManager] Failed to mute user:', error);
      return false;
    }
  }

  /**
   * Unmute a user
   */
  unmuteUser(userId: string, moderatorId: string): boolean {
    try {
      if (this.store.mutedUsers[userId]) {
        const handle = this.store.mutedUsers[userId].handle;
        delete this.store.mutedUsers[userId];

        // Log the action
        const action: ModerationAction = {
          type: 'unmute',
          targetUserId: userId,
          targetHandle: handle,
          reason: 'Manual unmute',
          moderatorId,
          timestamp: Date.now()
        };

        this.actionsLog.push(action);
        
        // Keep only last 1000 actions
        if (this.actionsLog.length > 1000) {
          this.actionsLog = this.actionsLog.slice(-1000);
        }

        this.saveStore();
        this.saveActionsLog();

        console.log(`[ModerationManager] Unmuted user ${handle} (${userId})`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ModerationManager] Failed to unmute user:', error);
      return false;
    }
  }

  /**
   * Ban a user
   */
  banUser(
    userId: string,
    handle: string,
    reason: string,
    moderatorId: string
  ): boolean {
    try {
      // Remove any existing mute
      if (this.store.mutedUsers[userId]) {
        delete this.store.mutedUsers[userId];
      }

      const bannedUser: BannedUser = {
        userId,
        handle,
        bannedAt: Date.now(),
        reason,
        moderatorId
      };

      this.store.bannedUsers[userId] = bannedUser;

      // Log the action
      const action: ModerationAction = {
        type: 'ban',
        targetUserId: userId,
        targetHandle: handle,
        reason,
        moderatorId,
        timestamp: Date.now()
      };

      this.actionsLog.push(action);
      
      // Keep only last 1000 actions
      if (this.actionsLog.length > 1000) {
        this.actionsLog = this.actionsLog.slice(-1000);
      }

      this.saveStore();
      this.saveActionsLog();

      console.log(`[ModerationManager] Banned user ${handle} (${userId}): ${reason}`);
      return true;
    } catch (error) {
      console.error('[ModerationManager] Failed to ban user:', error);
      return false;
    }
  }

  /**
   * Unban a user
   */
  unbanUser(userId: string, moderatorId: string): boolean {
    try {
      if (this.store.bannedUsers[userId]) {
        const handle = this.store.bannedUsers[userId].handle;
        delete this.store.bannedUsers[userId];

        // Log the action
        const action: ModerationAction = {
          type: 'unban',
          targetUserId: userId,
          targetHandle: handle,
          reason: 'Manual unban',
          moderatorId,
          timestamp: Date.now()
        };

        this.actionsLog.push(action);
        
        // Keep only last 1000 actions
        if (this.actionsLog.length > 1000) {
          this.actionsLog = this.actionsLog.slice(-1000);
        }

        this.saveStore();
        this.saveActionsLog();

        console.log(`[ModerationManager] Unbanned user ${handle} (${userId})`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ModerationManager] Failed to unban user:', error);
      return false;
    }
  }

  /**
   * Check if user is muted
   */
  isUserMuted(userId: string): { muted: boolean; mute?: MutedUser } {
    const mute = this.store.mutedUsers[userId];
    
    if (!mute) {
      return { muted: false };
    }

    // Check if mute has expired
    if (mute.mutedUntil !== null && mute.mutedUntil <= Date.now()) {
      // Clean up expired mute
      delete this.store.mutedUsers[userId];
      this.saveStore();
      return { muted: false };
    }

    return { muted: true, mute };
  }

  /**
   * Check if user is banned
   */
  isUserBanned(userId: string): { banned: boolean; ban?: BannedUser } {
    const ban = this.store.bannedUsers[userId];
    return { banned: !!ban, ban };
  }

  /**
   * Get all muted users
   */
  getMutedUsers(): MutedUser[] {
    this.cleanupExpiredMutes();
    return Object.values(this.store.mutedUsers);
  }

  /**
   * Get all banned users
   */
  getBannedUsers(): BannedUser[] {
    return Object.values(this.store.bannedUsers);
  }

  /**
   * Get moderation actions log
   */
  getActionsLog(limit: number = 100): ModerationAction[] {
    return this.actionsLog.slice(-limit);
  }

  /**
   * Get moderation store
   */
  getStore(): ModerationStore {
    this.cleanupExpiredMutes();
    return { ...this.store };
  }

  /**
   * Update store from external source (for server-side sync)
   */
  updateStore(newStore: ModerationStore): void {
    this.store = { ...newStore };
    this.saveStore();
    console.log('[ModerationManager] Store updated from external source');
  }

  /**
   * Get user status
   */
  getUserStatus(userId: string): {
    muted: boolean;
    banned: boolean;
    mute?: MutedUser;
    ban?: BannedUser;
  } {
    const muteResult = this.isUserMuted(userId);
    const banResult = this.isUserBanned(userId);

    return {
      muted: muteResult.muted,
      banned: banResult.banned,
      mute: muteResult.mute,
      ban: banResult.ban
    };
  }
}

// Client-side singleton instance
export const moderationManager = new ModerationManager();

// For server-side usage
export function createServerModerationManager(): ModerationManager {
  return new ModerationManager();
}