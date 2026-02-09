import { NextRequest, NextResponse } from 'next/server';
import { HumanChatMessage, MAX_MESSAGE_LENGTH } from '@/lib/human-chat/types';
import {
  appendMessage,
  getState,
  setState,
  updateUser,
  getUsers,
  checkRateLimit,
  recordPost,
} from '@/lib/human-chat/kv-store';
import { broadcastToAll } from '@/lib/human-chat/utils';
import { geminiModerator } from '@/lib/chatroom/gemini-moderator';
import { ModerationResult } from '@/lib/chatroom/types';

export const dynamic = 'force-dynamic';

interface PostMessageRequest {
  userId: string;
  handle: string;
  avatar?: string;
  content: string;
}

/**
 * POST /api/human-chat/post
 *
 * Post a human message to the human chatroom.
 * Requires wallet connection (userId is wallet address).
 * Rate limited: 1 message per 5 seconds per user.
 */
export async function POST(request: NextRequest) {
  try {
    const body: PostMessageRequest = await request.json();
    const { userId, handle, avatar = '👤', content } = body;

    // Validate input
    if (!userId || !handle || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, handle, content' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic check)
    if (!userId.startsWith('0x') || userId.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message content too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfterMs: rateLimit.remainingTimeMs,
          message: `Please wait ${Math.ceil(rateLimit.remainingTimeMs / 1000)} seconds before posting again`,
        },
        { status: 429 }
      );
    }

    // Create the message
    const message: HumanChatMessage = {
      id: `human_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      handle,
      avatar,
      content: content.trim(),
      timestamp: Date.now(),
      moderation: {
        isUserGenerated: true,
        userId,
      },
    };

    // Post message
    await appendMessage(message);

    // Record rate limit
    await recordPost(userId);

    // Update user stats
    const users = await getUsers();
    const existingUser = users[userId];
    await updateUser({
      userId,
      handle,
      avatar,
      lastSeenAt: Date.now(),
      messageCount: (existingUser?.messageCount || 0) + 1,
      joinedAt: existingUser?.joinedAt || Date.now(),
    });

    // Update state
    const state = await getState();
    await setState({
      ...state,
      messageCount: state.messageCount + 1,
      lastMessageAt: message.timestamp,
    });

    // Broadcast to all connected clients
    broadcastToAll('message', message);

    console.log(`[human-chat/post] Posted message from ${handle} (${userId})`);

    // Moderate asynchronously (don't await)
    moderateMessageAsync(message).catch((error) => {
      console.error('[human-chat/post] Moderation failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        timestamp: message.timestamp,
      },
    });
  } catch (error) {
    console.error('[human-chat/post] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to post message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Async moderation function that runs in the background
 */
async function moderateMessageAsync(
  message: HumanChatMessage
): Promise<ModerationResult> {
  try {
    // Call Gemini moderator
    const moderationResult = await geminiModerator.moderateMessage(message.content);

    // Log moderation result
    if (moderationResult.status === 'flagged' || moderationResult.status === 'removed') {
      console.log(
        `[human-chat/post] Message ${message.id} ${moderationResult.status}: ${moderationResult.violations.join(', ')}`
      );
    }

    return moderationResult;
  } catch (error) {
    console.error('[human-chat/post] Error in async moderation:', error);
    throw error;
  }
}
