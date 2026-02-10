import { NextRequest, NextResponse } from 'next/server';
import { cleanupRollingHistory, getRollingHistoryStatus } from '@/lib/chatroom/kv-store';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/cleanup-rolling-history
 * 
 * CVAULT-217: Cron job endpoint for cleaning up rolling history
 * Can be called by external cron services (Vercel Cron, GitHub Actions, etc.)
 * 
 * Requires CRON_SECRET environment variable for authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }
      
      const token = authHeader.slice(7);
      if (token !== cronSecret) {
        return NextResponse.json(
          { error: 'Invalid cron secret' },
          { status: 403 }
        );
      }
    }

    // Run cleanup
    const cleanupResult = await cleanupRollingHistory();
    const status = await getRollingHistoryStatus();

    const response = {
      success: true,
      timestamp: Date.now(),
      cleanupResult,
      status,
      message: cleanupResult.removed > 0 
        ? `Removed ${cleanupResult.removed} old messages, ${cleanupResult.remaining} remain in rolling window`
        : 'No messages to clean up',
    };

    console.log(`[CVAULT-217] Cron cleanup executed: ${response.message}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[cron/cleanup-rolling-history] Error executing cleanup:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to execute cleanup',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/cleanup-rolling-history
 * 
 * CVAULT-217: Get current status without performing cleanup
 * Useful for monitoring and debugging
 */
export async function GET(request: NextRequest) {
  try {
    const status = await getRollingHistoryStatus();
    
    const response = {
      success: true,
      timestamp: Date.now(),
      status,
      message: `Rolling history status: ${status.rollingMessages} messages in window, ${status.snapshotCount} snapshots`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[cron/cleanup-rolling-history] Error fetching status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}