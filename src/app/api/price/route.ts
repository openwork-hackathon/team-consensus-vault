/**
 * API Route: Current Price
 * GET /api/price?asset=BTC
 * Returns current price for an asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPrice } from '@/lib/price-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const asset = searchParams.get('asset') || 'BTC/USD';

    const price = await getCurrentPrice(asset);

    return NextResponse.json({
      success: true,
      asset,
      price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
