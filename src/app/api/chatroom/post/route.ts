// CVAULT-188: Human message posting with async Gemini moderation
import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage, ModerationResult } from '@/lib/chatroom/types';
import { appendMessage, getState } from '@/lib/chatroom/kv-store';
import { geminiModerator } from '@/lib/chatroom/gemini-moderator';
import {
  canUserPost,
  checkAutoModeration,
  executeModerationAction,
} from '@/lib/chatroom/moderation-kv';

export const dynamic = 'force-dynamic';

interface PostMessageRequest {
  userId: string;
  handle: string;
  content: string;
}

/**
 * POST /api/chatroom/post
 *
 * Post a human message to the chatroom with async moderation.
 * Message appears immediately, then gets moderated by Gemini in the background.
 */
export async function POST(request: NextRequest) {
  try {
    const body: PostMessageRequest = await request.json();
    const { userId, handle, content } = body;

    // Validate input
    if (!userId || !handle || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, handle, content' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message content too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Check if user is allowed to post (not muted/banned)
    const postPermission = await canUserPost(userId);
    if (!postPermission.allowed) {
      return NextResponse.json({ error: postPermission.reason, muted: true }, { status: 403 });
    }

    // Get current state for phase info
    const state = await getState();

    // Create the message
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      personaId: 'human',
      handle: handle,
      avatar: '👤', // Human avatar
      content: content.trim(),
      timestamp: Date.now(),
      phase: state.phase,
      moderation: {
        isUserGenerated: true,
        userId: userId,
      },
    };

    // Post message immediately (non-blocking)
    await appendMessage(message);

    console.log(`[post] Posted human message from ${handle} (${userId})`);

    // Moderate asynchronously (don't await)
    moderateMessageAsync(message)
      .then((moderationResult) => {
        console.log(`[post] Moderation complete for message ${message.id}: ${moderationResult.status}`);
      })
      .catch((error) => {
        console.error('[post] Moderation failed:', error);
      });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        timestamp: message.timestamp,
      },
    });
  } catch (error) {
    console.error('[post] Error:', error);
    return NextResponse.json(
      { error: 'Failed to post message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Async moderation function that runs in the background
 */
async function moderateMessageAsync(message: ChatMessage): Promise<ModerationResult> {
  try {
    // Call Gemini moderator
    const moderationResult = await geminiModerator.moderateMessage(message.content);

    // Update message with moderation result
    if (message.moderation) {
      message.moderation.moderationResult = moderationResult;
    }

    // If message is flagged or removed, take action
    if (
      (moderationResult.status === 'flagged' || moderationResult.status === 'removed') &&
      message.moderation?.userId
    ) {
      const userId = message.moderation.userId;
      const handle = message.handle;

      console.log(
        `[post] Message ${message.id} ${moderationResult.status}: ${moderationResult.violations.join(', ')}`
      );

      // Check if auto-moderation should be triggered
      const autoMod = await checkAutoModeration(userId, handle);

      if (autoMod) {
        // Execute auto-mute or auto-ban
        await executeModerationAction(autoMod.action);

        console.log(
          `[post] Auto-${autoMod.action.type} triggered for ${handle} after ${autoMod.newViolations} violations`
        );

        // TODO: Send notification to user (could use SSE or webhook)
        // For now, just log it
      }
    }

    return moderationResult;
  } catch (error) {
    console.error('[post] Error in async moderation:', error);
    throw error;
  }
}
