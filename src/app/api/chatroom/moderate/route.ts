// CVAULT-188: API route for moderation actions
import { NextRequest, NextResponse } from 'next/server';
import { moderationManager } from '@/lib/chatroom/moderation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, targetUserId, targetHandle, duration, reason, moderatorId } = body;

    // Validate required fields
    if (!action || !targetUserId || !targetHandle || !reason || !moderatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, targetUserId, targetHandle, reason, moderatorId' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['mute', 'unmute', 'ban', 'unban'];
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

    // Validate duration for mute actions
    if (action === 'mute') {
      if (duration !== null && (typeof duration !== 'number' || duration <= 0)) {
        return NextResponse.json(
          { error: 'Duration must be a positive number (milliseconds) or null for permanent mute' },
          { status: 400 }
        );
      }
    } else if (duration !== undefined) {
      return NextResponse.json(
        { error: 'Duration can only be specified for mute actions' },
        { status: 400 }
      );
    }

    let success = false;
    let result: any = {};

    switch (action) {
      case 'mute':
        success = moderationManager.muteUser(
          targetUserId,
          targetHandle,
          duration,
          reason,
          moderatorId
        );
        if (success) {
          const muteInfo = moderationManager.isUserMuted(targetUserId);
          result = {
            action: 'mute',
            targetUserId,
            targetHandle,
            mutedUntil: muteInfo.mute?.mutedUntil || null,
            reason
          };
        }
        break;

      case 'unmute':
        success = moderationManager.unmuteUser(targetUserId, moderatorId);
        if (success) {
          result = {
            action: 'unmute',
            targetUserId,
            targetHandle,
            reason: 'Manual unmute'
          };
        }
        break;

      case 'ban':
        success = moderationManager.banUser(
          targetUserId,
          targetHandle,
          reason,
          moderatorId
        );
        if (success) {
          result = {
            action: 'ban',
            targetUserId,
            targetHandle,
            reason
          };
        }
        break;

      case 'unban':
        success = moderationManager.unbanUser(targetUserId, moderatorId);
        if (success) {
          result = {
            action: 'unban',
            targetUserId,
            targetHandle,
            reason: 'Manual unban'
          };
        }
        break;
    }

    if (!success) {
      const errorMsg = action === 'unmute' || action === 'unban' 
        ? `User not found or already ${action}d`
        : 'Action failed';
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    console.log(`[Moderation API] ${moderatorId} ${action}ed ${targetHandle} (${targetUserId})`);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[Moderation API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    const validActions = ['list-muted', 'list-banned', 'actions-log', 'user-status'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'list-muted':
        result = {
          mutedUsers: moderationManager.getMutedUsers()
        };
        break;

      case 'list-banned':
        result = {
          bannedUsers: moderationManager.getBannedUsers()
        };
        break;

      case 'actions-log':
        const limit = parseInt(searchParams.get('limit') || '100');
        result = {
          actionsLog: moderationManager.getActionsLog(limit)
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
        result = {
          userId,
          status: moderationManager.getUserStatus(userId)
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Moderation API] Error processing GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}