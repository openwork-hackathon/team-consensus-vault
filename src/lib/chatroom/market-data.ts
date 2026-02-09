/**
 * Market Data Service for Chatroom Personas
 * Fetches real market data from CoinGecko for data-driven arguments
 * CVAULT-185: Real Market Data Integration
 */

import { withEdgeCache, CACHE_TTL, CACHE_TAGS } from '@/lib/cache';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Asset mapping for CoinGecko IDs
const ASSET_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
};

// In-memory cache for fallback
interface CacheEntry {
  data: MarketData;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry>();
const MEMORY_CACHE_TTL = 60000; // 1 minute

export interface MarketData {
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercentage: number;
  atl: number;
  atlChangePercentage: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  lastUpdated: string;
  // Additional metrics for richer arguments
  volatility24h?: number;
  volumeToMarketCapRatio?: number;
}

export interface MarketMetrics {
  priceAction: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
  volumeProfile: 'high' | 'normal' | 'low';
  volatility: 'high' | 'normal' | 'low';
  marketCapTier: 'large' | 'mid' | 'small';
}

/**
 * Fetch comprehensive market data for an asset
 */
async function fetchMarketDataRaw(asset: string): Promise<MarketData> {
  const coinId = ASSET_ID_MAP[asset] || ASSET_ID_MAP['BTC'];

  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }, // Next.js revalidation
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const md = data.market_data;

    const marketData: MarketData = {
      price: md.current_price?.usd || 0,
      priceChange24h: md.price_change_24h_in_currency?.usd || 0,
      priceChangePercentage24h: md.price_change_percentage_24h || 0,
      volume24h: md.total_volume?.usd || 0,
      volumeChange24h: calculateVolumeChange(md),
      marketCap: md.market_cap?.usd || 0,
      high24h: md.high_24h?.usd || 0,
      low24h: md.low_24h?.usd || 0,
      ath: md.ath?.usd || 0,
      athChangePercentage: md.ath_change_percentage || 0,
      atl: md.atl?.usd || 0,
      atlChangePercentage: md.atl_change_percentage || 0,
      circulatingSupply: md.circulating_supply || 0,
      totalSupply: md.total_supply || null,
      maxSupply: md.max_supply || null,
      lastUpdated: md.last_updated || new Date().toISOString(),
    };

    // Calculate derived metrics
    marketData.volatility24h = calculateVolatility(marketData);
    marketData.volumeToMarketCapRatio = marketData.marketCap > 0 
      ? marketData.volume24h / marketData.marketCap 
      : 0;

    return marketData;
  } catch (error) {
    console.error('[market-data] Error fetching data:', error);
    // Return cached data if available
    const cached = memoryCache.get(coinId);
    if (cached) {
      console.warn('[market-data] Using stale cached data');
      return cached.data;
    }
    // Return fallback data
    return getFallbackMarketData();
  }
}

/**
 * Cached version of market data fetch
 */
export const fetchMarketData = withEdgeCache(
  fetchMarketDataRaw,
  'market-data',
  CACHE_TTL.PRICE,
  [CACHE_TAGS.PRICE]
);

/**
 * Calculate volume change (approximate from available data)
 */
function calculateVolumeChange(marketData: any): number {
  // CoinGecko doesn't directly provide volume change, estimate from trends
  const volume24h = marketData.total_volume?.usd || 0;
  // Use a heuristic based on price movement correlation
  const priceChange = marketData.price_change_percentage_24h || 0;
  // Rough estimate: volume often increases with volatility
  return volume24h * (priceChange / 100) * 0.5;
}

/**
 * Calculate 24h volatility approximation
 */
function calculateVolatility(data: MarketData): number {
  if (data.high24h <= 0 || data.low24h <= 0 || data.price <= 0) return 0;
  const range = (data.high24h - data.low24h) / data.price;
  return range * 100; // As percentage
}

/**
 * Get market metrics interpretation
 */
export function getMarketMetrics(data: MarketData): MarketMetrics {
  const priceChange = data.priceChangePercentage24h;
  
  // Price action classification
  let priceAction: MarketMetrics['priceAction'] = 'neutral';
  if (priceChange > 10) priceAction = 'strong_up';
  else if (priceChange > 3) priceAction = 'up';
  else if (priceChange < -10) priceAction = 'strong_down';
  else if (priceChange < -3) priceAction = 'down';

  // Volume profile
  const vmcRatio = data.volumeToMarketCapRatio || 0;
  let volumeProfile: MarketMetrics['volumeProfile'] = 'normal';
  if (vmcRatio > 0.15) volumeProfile = 'high';
  else if (vmcRatio < 0.05) volumeProfile = 'low';

  // Volatility
  const vol = data.volatility24h || 0;
  let volatility: MarketMetrics['volatility'] = 'normal';
  if (vol > 8) volatility = 'high';
  else if (vol < 3) volatility = 'low';

  // Market cap tier
  let marketCapTier: MarketMetrics['marketCapTier'] = 'small';
  if (data.marketCap > 100_000_000_000) marketCapTier = 'large';
  else if (data.marketCap > 10_000_000_000) marketCapTier = 'mid';

  return { priceAction, volumeProfile, volatility, marketCapTier };
}

/**
 * Format market data for persona prompts
 */
export function formatMarketDataForPrompt(data: MarketData, asset: string = 'BTC'): string {
  const metrics = getMarketMetrics(data);
  const priceFormatted = formatPrice(data.price);
  const volumeFormatted = formatLargeNumber(data.volume24h);
  const marketCapFormatted = formatLargeNumber(data.marketCap);
  
  const priceChangeEmoji = data.priceChangePercentage24h >= 0 ? '📈' : '📉';
  const volumeChangePct = data.volume24h > 0 && data.volumeChange24h !== 0
    ? ((data.volumeChange24h / data.volume24h) * 100).toFixed(1)
    : '0';

  return `
=== CURRENT MARKET DATA (${asset}) ===
Price: $${priceFormatted} (${data.priceChangePercentage24h >= 0 ? '+' : ''}${data.priceChangePercentage24h.toFixed(2)}% 24h) ${priceChangeEmoji}
24h Volume: $${volumeFormatted} (${volumeChangePct}% change)
Market Cap: $${marketCapFormatted}
24h Range: $${formatPrice(data.low24h)} - $${formatPrice(data.high24h)}
Volatility: ${data.volatility24h?.toFixed(2)}% (24h range)
Volume/Market Cap: ${(data.volumeToMarketCapRatio || 0).toFixed(3)}
ATH: $${formatPrice(data.ath)} (${data.athChangePercentage.toFixed(1)}% from ATH)
Market Profile: ${metrics.priceAction} price, ${metrics.volumeProfile} volume, ${metrics.volatility} volatility
Last Updated: ${new Date(data.lastUpdated).toLocaleTimeString()}
=== END MARKET DATA ===
`;
}

/**
 * Get key talking points based on market data
 */
export function getMarketTalkingPoints(data: MarketData): string[] {
  const points: string[] = [];
  const metrics = getMarketMetrics(data);

  // Price action points
  if (data.priceChangePercentage24h > 15) {
    points.push(`Strong breakout: +${data.priceChangePercentage24h.toFixed(1)}% in 24h`);
  } else if (data.priceChangePercentage24h < -15) {
    points.push(`Significant correction: ${data.priceChangePercentage24h.toFixed(1)}% in 24h`);
  }

  // Volume analysis
  if (metrics.volumeProfile === 'high') {
    points.push(`Elevated volume: $${formatLargeNumber(data.volume24h)} (high conviction move)`);
  } else if (metrics.volumeProfile === 'low') {
    points.push(`Low volume: $${formatLargeNumber(data.volume24h)} (weak participation)`);
  }

  // Volatility
  if (metrics.volatility === 'high') {
    points.push(`High volatility: ${data.volatility24h?.toFixed(1)}% range - expect sharp moves`);
  }

  // Distance from ATH
  if (data.athChangePercentage > -20 && data.athChangePercentage < 0) {
    points.push(`Near ATH: only ${Math.abs(data.athChangePercentage).toFixed(1)}% below all-time high`);
  } else if (data.athChangePercentage < -50) {
    points.push(`Deep bear market: ${Math.abs(data.athChangePercentage).toFixed(1)}% from ATH`);
  }

  // Support/Resistance levels
  const rangePosition = (data.price - data.low24h) / (data.high24h - data.low24h || 1);
  if (rangePosition > 0.8) {
    points.push(`At daily highs: testing ${formatPrice(data.high24h)} resistance`);
  } else if (rangePosition < 0.2) {
    points.push(`At daily lows: holding ${formatPrice(data.low24h)} support`);
  }

  return points;
}

/**
 * Format price with appropriate decimals
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
}

/**
 * Format large numbers (millions, billions)
 */
function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

/**
 * Fallback market data when API fails
 */
function getFallbackMarketData(): MarketData {
  return {
    price: 45000,
    priceChange24h: 500,
    priceChangePercentage24h: 1.12,
    volume24h: 25_000_000_000,
    volumeChange24h: 1_000_000_000,
    marketCap: 880_000_000_000,
    high24h: 46000,
    low24h: 44000,
    ath: 69000,
    athChangePercentage: -34.8,
    atl: 67,
    atlChangePercentage: 67000,
    circulatingSupply: 19_500_000,
    totalSupply: 21_000_000,
    maxSupply: 21_000_000,
    lastUpdated: new Date().toISOString(),
    volatility24h: 4.5,
    volumeToMarketCapRatio: 0.028,
  };
}

/**
 * Fetch multiple assets at once (batch request)
 */
export async function fetchMultipleMarketData(assets: string[]): Promise<Record<string, MarketData>> {
  const results: Record<string, MarketData> = {};
  
  // Fetch in parallel with Promise.allSettled to handle partial failures
  const promises = assets.map(async (asset) => {
    try {
      const data = await fetchMarketData(asset);
      return { asset, data, success: true };
    } catch (error) {
      return { asset, data: getFallbackMarketData(), success: false };
    }
  });

  const settled = await Promise.allSettled(promises);
  
  settled.forEach((result) => {
    if (result.status === 'fulfilled') {
      results[result.value.asset] = result.value.data;
    }
  });

  return results;
}
