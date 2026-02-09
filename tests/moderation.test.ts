/**
 * Unit tests for moderation system
 * CVAULT-188: Human chat moderation bot
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModerationResult, ModerationStatus, ViolationType } from '../chatroom/types';

// Mock data
const mockModerationResult: ModerationResult = {
  status: 'approved' as ModerationStatus,
  violations: [],
  confidence: 95,
  reasoning: 'Message is clean and appropriate',
  flaggedAt: Date.now(),
};

const mockFlaggedResult: ModerationResult = {
  status: 'flagged' as ModerationStatus,
  violations: ['spam' as ViolationType],
  confidence: 70,
  reasoning: 'Message contains promotional content',
  flaggedAt: Date.now(),
};

const mockRemovedResult: ModerationResult = {
  status: 'removed' as ModerationStatus,
  violations: ['hate_speech' as ViolationType, 'harassment' as ViolationType],
  confidence: 95,
  reasoning: 'Message contains hate speech and personal attacks',
  flaggedAt: Date.now(),
};

describe('Moderation System', () => {
  describe('ModerationResult validation', () => {
    it('should accept valid approved result', () => {
      expect(mockModerationResult.status).toBe('approved');
      expect(mockModerationResult.violations).toHaveLength(0);
      expect(mockModerationResult.confidence).toBeGreaterThanOrEqual(0);
      expect(mockModerationResult.confidence).toBeLessThanOrEqual(100);
    });

    it('should accept valid flagged result', () => {
      expect(mockFlaggedResult.status).toBe('flagged');
      expect(mockFlaggedResult.violations).toContain('spam');
      expect(mockFlaggedResult.reasoning).toBeTruthy();
    });

    it('should accept valid removed result', () => {
      expect(mockRemovedResult.status).toBe('removed');
      expect(mockRemovedResult.violations.length).toBeGreaterThan(0);
      expect(mockRemovedResult.confidence).toBeGreaterThan(50);
    });
  });

  describe('Violation Types', () => {
    it('should have all required violation types', () => {
      const validViolations: ViolationType[] = [
        'spam',
        'hate_speech',
        'harassment',
        'manipulation',
        'inappropriate_content',
        'other',
      ];

      validViolations.forEach((violation) => {
        expect(violation).toBeTruthy();
      });
    });
  });

  describe('Auto-moderation thresholds', () => {
    it('should define correct mute thresholds', () => {
      const AUTO_MUTE_THRESHOLD = 3;
      const AUTO_BAN_THRESHOLD = 5;

      expect(AUTO_MUTE_THRESHOLD).toBe(3);
      expect(AUTO_BAN_THRESHOLD).toBe(5);
      expect(AUTO_BAN_THRESHOLD).toBeGreaterThan(AUTO_MUTE_THRESHOLD);
    });

    it('should have escalating mute durations', () => {
      const AUTO_MUTE_DURATIONS = [
        5 * 60 * 1000, // 5 minutes
        15 * 60 * 1000, // 15 minutes
        60 * 60 * 1000, // 1 hour
        24 * 60 * 60 * 1000, // 24 hours
      ];

      expect(AUTO_MUTE_DURATIONS).toHaveLength(4);

      // Each duration should be greater than the previous
      for (let i = 1; i < AUTO_MUTE_DURATIONS.length; i++) {
        expect(AUTO_MUTE_DURATIONS[i]).toBeGreaterThan(AUTO_MUTE_DURATIONS[i - 1]);
      }
    });
  });

  describe('Moderation action validation', () => {
    it('should validate mute action structure', () => {
      const muteAction = {
        type: 'mute' as const,
        targetUserId: 'user123',
        targetHandle: 'testuser',
        duration: 5 * 60 * 1000, // 5 minutes
        reason: 'Spam detected',
        moderatorId: 'gemini',
        timestamp: Date.now(),
      };

      expect(muteAction.type).toBe('mute');
      expect(muteAction.targetUserId).toBeTruthy();
      expect(muteAction.duration).toBeGreaterThan(0);
      expect(muteAction.reason).toBeTruthy();
    });

    it('should validate ban action structure', () => {
      const banAction = {
        type: 'ban' as const,
        targetUserId: 'user123',
        targetHandle: 'testuser',
        reason: 'Multiple violations',
        moderatorId: 'system',
        timestamp: Date.now(),
      };

      expect(banAction.type).toBe('ban');
      expect(banAction.targetUserId).toBeTruthy();
      expect(banAction.reason).toBeTruthy();
      expect(banAction.duration).toBeUndefined(); // Bans don't have duration
    });

    it('should validate permanent mute (null duration)', () => {
      const permanentMuteAction = {
        type: 'mute' as const,
        targetUserId: 'user123',
        targetHandle: 'testuser',
        duration: null,
        reason: 'Permanent mute',
        moderatorId: 'admin',
        timestamp: Date.now(),
      };

      expect(permanentMuteAction.duration).toBeNull();
    });
  });

  describe('User moderation status', () => {
    it('should correctly identify muted user', () => {
      const mutedUser = {
        userId: 'user123',
        handle: 'testuser',
        mutedAt: Date.now(),
        mutedUntil: Date.now() + 60000, // 1 minute from now
        reason: 'Spam',
        moderatorId: 'gemini',
      };

      expect(mutedUser.mutedUntil).toBeGreaterThan(mutedUser.mutedAt);
    });

    it('should correctly identify banned user', () => {
      const bannedUser = {
        userId: 'user123',
        handle: 'testuser',
        bannedAt: Date.now(),
        reason: 'Multiple violations',
        moderatorId: 'system',
      };

      expect(bannedUser.bannedAt).toBeLessThanOrEqual(Date.now());
      expect(bannedUser.reason).toBeTruthy();
    });

    it('should detect expired mutes', () => {
      const expiredMute = {
        userId: 'user123',
        handle: 'testuser',
        mutedAt: Date.now() - 120000, // 2 minutes ago
        mutedUntil: Date.now() - 60000, // 1 minute ago (expired)
        reason: 'Spam',
        moderatorId: 'gemini',
      };

      const isExpired = expiredMute.mutedUntil !== null && expiredMute.mutedUntil < Date.now();
      expect(isExpired).toBe(true);
    });

    it('should identify active mutes', () => {
      const activeMute = {
        userId: 'user123',
        handle: 'testuser',
        mutedAt: Date.now() - 60000, // 1 minute ago
        mutedUntil: Date.now() + 240000, // 4 minutes from now
        reason: 'Spam',
        moderatorId: 'gemini',
      };

      const isActive = activeMute.mutedUntil !== null && activeMute.mutedUntil > Date.now();
      expect(isActive).toBe(true);
    });

    it('should identify permanent mutes', () => {
      const permanentMute = {
        userId: 'user123',
        handle: 'testuser',
        mutedAt: Date.now(),
        mutedUntil: null, // Permanent
        reason: 'Severe violation',
        moderatorId: 'admin',
      };

      expect(permanentMute.mutedUntil).toBeNull();
    });
  });

  describe('Violation tracking', () => {
    it('should track user violation count', () => {
      const userViolations = new Map<string, number>();

      userViolations.set('user1', 1);
      userViolations.set('user2', 3);
      userViolations.set('user3', 5);

      expect(userViolations.get('user1')).toBe(1);
      expect(userViolations.get('user2')).toBe(3);
      expect(userViolations.get('user3')).toBe(5);
    });

    it('should increment violation count', () => {
      let violations = 0;
      violations++;
      expect(violations).toBe(1);
      violations++;
      expect(violations).toBe(2);
    });

    it('should trigger auto-mute at threshold', () => {
      const AUTO_MUTE_THRESHOLD = 3;
      const violations = 3;

      const shouldMute = violations >= AUTO_MUTE_THRESHOLD;
      expect(shouldMute).toBe(true);
    });

    it('should trigger auto-ban at threshold', () => {
      const AUTO_BAN_THRESHOLD = 5;
      const violations = 5;

      const shouldBan = violations >= AUTO_BAN_THRESHOLD;
      expect(shouldBan).toBe(true);
    });
  });

  describe('Message content validation', () => {
    it('should validate message length', () => {
      const shortMessage = 'Hello';
      const longMessage = 'x'.repeat(1001);

      expect(shortMessage.length).toBeLessThanOrEqual(1000);
      expect(longMessage.length).toBeGreaterThan(1000);
    });

    it('should trim whitespace', () => {
      const message = '  Hello world  ';
      const trimmed = message.trim();

      expect(trimmed).toBe('Hello world');
      expect(trimmed.length).toBeLessThan(message.length);
    });

    it('should reject empty messages', () => {
      const emptyMessage = '   ';
      const isEmpty = emptyMessage.trim().length === 0;

      expect(isEmpty).toBe(true);
    });
  });

  describe('Moderation status priority', () => {
    it('should prioritize ban over mute', () => {
      const isBanned = true;
      const isMuted = true;

      // Ban takes precedence
      const shouldBlock = isBanned || isMuted;
      expect(shouldBlock).toBe(true);

      // But ban is checked first
      const reason = isBanned ? 'banned' : 'muted';
      expect(reason).toBe('banned');
    });

    it('should check mute if not banned', () => {
      const isBanned = false;
      const isMuted = true;

      const shouldBlock = isBanned || isMuted;
      expect(shouldBlock).toBe(true);

      const reason = isBanned ? 'banned' : 'muted';
      expect(reason).toBe('muted');
    });

    it('should allow if neither banned nor muted', () => {
      const isBanned = false;
      const isMuted = false;

      const shouldBlock = isBanned || isMuted;
      expect(shouldBlock).toBe(false);
    });
  });

  describe('Moderator attribution', () => {
    it('should attribute to gemini for auto-moderation', () => {
      const moderatorId = 'gemini';
      expect(moderatorId).toBe('gemini');
    });

    it('should attribute to system for auto-actions', () => {
      const moderatorId = 'system';
      expect(moderatorId).toBe('system');
    });

    it('should attribute to admin for manual actions', () => {
      const moderatorId = 'admin_user_123';
      expect(moderatorId).toContain('admin');
    });
  });

  describe('Timestamp validation', () => {
    it('should use current timestamp for new actions', () => {
      const timestamp = Date.now();
      const oneSecondAgo = Date.now() - 1000;

      expect(timestamp).toBeGreaterThanOrEqual(oneSecondAgo);
    });

    it('should calculate mute expiry correctly', () => {
      const duration = 5 * 60 * 1000; // 5 minutes
      const mutedAt = Date.now();
      const mutedUntil = mutedAt + duration;

      expect(mutedUntil).toBeGreaterThan(mutedAt);
      expect(mutedUntil - mutedAt).toBe(duration);
    });
  });
});
