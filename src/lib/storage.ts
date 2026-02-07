/**
 * Storage Adapter
 * Provides a unified interface for persistent storage
 * Falls back to in-memory storage if KV is not available
 */

import { Trade, PortfolioMetrics } from './trading-types';

// In-memory fallback storage
let inMemoryTrades: Trade[] = [];
let inMemoryMetrics: PortfolioMetrics | null = null;

const KV_KEY_PREFIX = 'trading:';
const TRADES_KEY = `${KV_KEY_PREFIX}trades`;
const METRICS_KEY = `${KV_KEY_PREFIX}metrics`;

/**
 * Check if Vercel KV is available
 */
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get trades from storage
 */
export async function getStoredTrades(): Promise<Trade[]> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const trades = await kv.get<Trade[]>(TRADES_KEY);
      return trades || [];
    } catch (error) {
      console.error('Error fetching from KV, using in-memory fallback:', error);
    }
  }

  return inMemoryTrades;
}

/**
 * Set trades in storage
 */
export async function setStoredTrades(trades: Trade[]): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(TRADES_KEY, trades);
      // Also update in-memory cache
      inMemoryTrades = trades;
      return;
    } catch (error) {
      console.error('Error saving to KV, using in-memory fallback:', error);
    }
  }

  inMemoryTrades = trades;
}

/**
 * Get metrics from storage
 */
export async function getStoredMetrics(): Promise<PortfolioMetrics | null> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      const metrics = await kv.get<PortfolioMetrics>(METRICS_KEY);
      return metrics;
    } catch (error) {
      console.error('Error fetching metrics from KV, using in-memory fallback:', error);
    }
  }

  return inMemoryMetrics;
}

/**
 * Set metrics in storage
 */
export async function setStoredMetrics(metrics: PortfolioMetrics): Promise<void> {
  if (isKVAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(METRICS_KEY, metrics);
      // Also update in-memory cache
      inMemoryMetrics = metrics;
      return;
    } catch (error) {
      console.error('Error saving metrics to KV, using in-memory fallback:', error);
    }
  }

  inMemoryMetrics = metrics;
}
