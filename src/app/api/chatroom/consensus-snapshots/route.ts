import { NextRequest, NextResponse } from 'next/server';
import { getConsensusSnapshots, getRollingHistoryStatus } from '@/lib/chatroom/kv-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chatroom/consensus-snapshots
 * 
 * CVAULT-217: Fetch historical consensus snapshots
 * These snapshots persist even after messages are pruned from rolling history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const includeStatus = searchParams.get('includeStatus') === 'true';

    // Fetch consensus snapshots
    const snapshots = await getConsensusSnapshots();
    
    // Sort by timestamp descending (newest first)
    const sortedSnapshots = snapshots
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    const response: {
      snapshots: typeof sortedSnapshots;
      total: number;
      status?: Awaited<ReturnType<typeof getRollingHistoryStatus>>;
    } = {
      snapshots: sortedSnapshots,
      total: snapshots.length,
    };

    // Optionally include rolling history status
    if (includeStatus) {
      response.status = await getRollingHistoryStatus();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[chatroom/consensus-snapshots] Error fetching snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consensus snapshots' },
      { status: 500 }
    );
  }
}
