/**
 * Price Service - Fetch real-time crypto prices
 * Uses CoinGecko free API for BTC/USD pricing
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PRICE_CACHE_TTL = 30000; // 30 seconds

interface PriceCache {
  price: number;
  timestamp: number;
}

const priceCache = new Map<string, PriceCache>();

/**
 * Map asset symbol to CoinGecko ID
 */
const ASSET_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
};

/**
 * Fetch current price for an asset
 */
export async function getCurrentPrice(asset: string): Promise<number> {
  const coinId = ASSET_ID_MAP[asset] || ASSET_ID_MAP['BTC'];

  // Check cache first
  const cached = priceCache.get(coinId);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data[coinId]?.usd;

    if (!price) {
      throw new Error(`Price not found for ${asset}`);
    }

    // Update cache
    priceCache.set(coinId, {
      price,
      timestamp: Date.now(),
    });

    return price;
  } catch (error) {
    console.error('Error fetching price:', error);

    // Return cached price if available, even if stale
    if (cached) {
      console.warn('Using stale price from cache');
      return cached.price;
    }

    // Fallback to a reasonable default for demo purposes
    return coinId === 'bitcoin' ? 45234 : 2500;
  }
}

/**
 * Get historical price (for demo, returns current price with slight randomization)
 * In production, would use actual historical API
 */
export async function getHistoricalPrice(asset: string, timestamp: string): Promise<number> {
  // For demo purposes, use current price with small random variation
  const currentPrice = await getCurrentPrice(asset);
  const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
  return currentPrice * (1 + variation);
}
