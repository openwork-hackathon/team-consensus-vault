/**
 * Stale Trade Cleanup Cron API Route
 * GET /api/cron/stale-trades
 * 
 * CVAULT-181: Handles stale/orphaned trading positions
 * 
 * This endpoint is designed to be called by:
 * 1. Vercel Cron (configured in vercel.json) - runs every 30 minutes
 * 2. Manual invocation for debugging/operations
 * 
 * Security: Protected by CRON_SECRET environment variable.
 * Vercel Cron automatically sends this header.
 * 
 * Query Parameters:
 * - force=true: Skip minimum interval check and force cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { runStaleTradeCleanup, getLastCleanupTimestamp } from '@/lib/stale-trade-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for cleanup

/**
 * GET handler for cron-triggered stale trade cleanup
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify authorization
  // Vercel Cron sends Authorization header with CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, require CRON_SECRET for security
  // In development, allow unauthenticated access
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/stale-trades] Unauthorized request attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check for force parameter
    const force = request.nextUrl.searchParams.get('force') === 'true';

    console.log(`[cron/stale-trades] Starting cleanup (force=${force})`);

    // Run the cleanup
    const result = await runStaleTradeCleanup(force);
    const responseTime = Date.now() - startTime;

    // Build response
    const response = NextResponse.json({
      success: true,
      ...result,
      responseTimeMs: responseTime,
      lastCleanupTimestamp: getLastCleanupTimestamp(),
    });

    // No caching for cron endpoints
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;

  } catch (error) {
    console.error('[cron/stale-trades] Error during cleanup:', error);
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: responseTime,
      },
      { status: 500 }
    );
  }
}
