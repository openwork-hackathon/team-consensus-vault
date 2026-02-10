import { NextRequest, NextResponse } from 'next/server';
import { getHistoryWithSnapshots } from '@/lib/chatroom/kv-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chatroom/history
 * 
 * CVAULT-217: Fetch combined view of recent messages (last 1 hour) + historical consensus snapshots
 * This is the primary endpoint for frontend to get complete chat history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitSnapshots = parseInt(searchParams.get('limitSnapshots') || '10', 10);
    const limitMessages = parseInt(searchParams.get('limitMessages') || '50', 10);

    // Get combined history with snapshots
    const { recentMessages, snapshots, currentState } = await getHistoryWithSnapshots();

    // Apply limits
    const limitedMessages = recentMessages.slice(-limitMessages);
    const limitedSnapshots = snapshots
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitSnapshots);

    // Calculate statistics
    const now = Date.now();
    const oldestMessage = limitedMessages.length > 0 ? limitedMessages[0] : null;
    const newestMessage = limitedMessages.length > 0 ? limitedMessages[limitedMessages.length - 1] : null;

    const response = {
      // Current state
      currentState,
      
      // Recent messages (last 1 hour)
      recentMessages: limitedMessages,
      recentMessageCount: limitedMessages.length,
      oldestMessageAge: oldestMessage ? now - oldestMessage.timestamp : 0,
      newestMessageAge: newestMessage ? now - newestMessage.timestamp : 0,
      
      // Historical snapshots (beyond 1 hour)
      snapshots: limitedSnapshots,
      snapshotCount: limitedSnapshots.length,
      
      // Metadata
      timestamp: now,
      rollingWindowHours: 1,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[chatroom/history] Error fetching history with snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}