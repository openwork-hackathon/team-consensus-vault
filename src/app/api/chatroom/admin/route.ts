// CVAULT-188: Admin moderation API for reviewing flagged messages and managing users
import { NextRequest, NextResponse } from 'next/server';
import {
  getModerationStore,
  executeModerationAction,
  getUserViolations,
  resetUserViolations,
  isUserMuted,
  isUserBanned,
} from '@/lib/chatroom/moderation-kv';
import { getMessages } from '@/lib/chatroom/kv-store';
import { ModerationAction } from '@/lib/chatroom/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chatroom/admin
 *
 * Execute moderation actions (mute, unmute, ban, unban)
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users
    // For now, accepting moderatorId from request body
    // In production, verify JWT or session

    const body = await request.json();
    const { action, targetUserId, targetHandle, duration, reason, moderatorId } = body;

    // Validate required fields
    if (!action || !targetUserId || !targetHandle || !reason || !moderatorId) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: action, targetUserId, targetHandle, reason, moderatorId',
        },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['mute', 'unmute', 'ban', 'unban', 'reset-violations'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate reason length
    if (reason.length < 5 || reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must be between 5 and 500 characters' },
        { status: 400 }
      );
    }

    let result: any = {};

    if (action === 'reset-violations') {
      // Special action to reset violation count
      await resetUserViolations(targetUserId);
      return NextResponse.json({
        success: true,
        result: {
          action: 'reset-violations',
          targetUserId,
          targetHandle,
        },
      });
    }

    // Validate duration for mute actions
    if (action === 'mute') {
      if (duration !== null && duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
        return NextResponse.json(
          { error: 'Duration must be a positive number (milliseconds) or null for permanent mute' },
          { status: 400 }
        );
      }
    }

    // Create moderation action
    const moderationAction: ModerationAction = {
      type: action as 'mute' | 'unmute' | 'ban' | 'unban',
      targetUserId,
      targetHandle,
      duration: action === 'mute' ? duration : undefined,
      reason,
      moderatorId,
      timestamp: Date.now(),
    };

    // Execute action
    await executeModerationAction(moderationAction);

    // Build response
    switch (action) {
      case 'mute':
        const muteStatus = await isUserMuted(targetUserId);
        result = {
          action: 'mute',
          targetUserId,
          targetHandle,
          mutedUntil: muteStatus.mutedUntil,
          reason,
        };
        break;

      case 'unmute':
        result = {
          action: 'unmute',
          targetUserId,
          targetHandle,
          reason: 'Manual unmute',
        };
        break;

      case 'ban':
        result = {
          action: 'ban',
          targetUserId,
          targetHandle,
          reason,
        };
        break;

      case 'unban':
        result = {
          action: 'unban',
          targetUserId,
          targetHandle,
          reason: 'Manual unban',
        };
        break;
    }

    console.log(`[admin] ${moderatorId} executed ${action} on ${targetHandle} (${targetUserId})`);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[admin] Error processing request:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatroom/admin
 *
 * Get moderation data (flagged messages, muted/banned users, logs)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const validActions = [
      'moderation-queue',
      'muted-users',
      'banned-users',
      'user-status',
      'user-violations',
      'moderation-log',
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'moderation-queue':
        // Get all messages with moderation flags
        const messages = await getMessages();
        const flaggedMessages = messages.filter(
          (msg) =>
            msg.moderation?.moderationResult &&
            (msg.moderation.moderationResult.status === 'flagged' ||
              msg.moderation.moderationResult.status === 'removed')
        );
        result = {
          queue: flaggedMessages,
          count: flaggedMessages.length,
        };
        break;

      case 'muted-users':
        const store = await getModerationStore();
        result = {
          mutedUsers: Object.values(store.mutedUsers),
        };
        break;

      case 'banned-users':
        const storeForBanned = await getModerationStore();
        result = {
          bannedUsers: Object.values(storeForBanned.bannedUsers),
        };
        break;

      case 'user-status':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing userId parameter for user-status action' },
            { status: 400 }
          );
        }
        const muteStatus = await isUserMuted(userId);
        const banStatus = await isUserBanned(userId);
        const violations = await getUserViolations(userId);
        result = {
          userId,
          muted: muteStatus.muted,
          mutedUntil: muteStatus.mutedUntil,
          muteReason: muteStatus.reason,
          banned: banStatus.banned,
          banReason: banStatus.reason,
          violations,
        };
        break;

      case 'user-violations':
        const userIdForViolations = searchParams.get('userId');
        if (!userIdForViolations) {
          return NextResponse.json(
            { error: 'Missing userId parameter for user-violations action' },
            { status: 400 }
          );
        }
        const violationCount = await getUserViolations(userIdForViolations);
        result = {
          userId: userIdForViolations,
          violations: violationCount,
        };
        break;

      case 'moderation-log':
        const limit = parseInt(searchParams.get('limit') || '100');
        const logStore = await getModerationStore();
        result = {
          log: logStore.moderationLog.slice(-limit),
        };
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[admin] Error processing GET request:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
