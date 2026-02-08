/**
 * Rate Limiting Utility for Consensus API Endpoints
 * 
 * Implements IP-based rate limiting using Vercel KV for serverless environments.
 * Falls back to in-memory storage for local development.
 * 
 * Features:
 * - IP-based rate limiting
 * - Configurable limits per endpoint
 * - 429 responses with Retry-After headers
 * - Works in Vercel's serverless environment
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configuration
export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional identifier for the rate limit (e.g., 'consensus-api') */
  identifier?: string;
}

// Default rate limits
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowSeconds: 60,
  identifier: 'default',
};

// Stricter limits for expensive operations (consensus calls multiple AI models)
export const CONSENSUS_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowSeconds: 60,
  identifier: 'consensus',
};

// In-memory storage for local development (fallback when KV is not available)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Check if Vercel KV is available
 */
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get the client's IP address from the request
 * Handles various proxy scenarios common in serverless environments
 */
export function getClientIP(request: NextRequest): string {
  // Try to get IP from various headers (common in serverless/proxy environments)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one (client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to a hash of the user agent + accept language (not perfect but better than nothing)
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const acceptLang = request.headers.get('accept-language') || 'unknown';
  
  // Create a simple hash for fingerprinting
  const fingerprint = `${userAgent}:${acceptLang}`;
  return `fp_${Buffer.from(fingerprint).toString('base64').slice(0, 16)}`;
}

/**
 * Generate a rate limit key for the given IP and identifier
 */
function getRateLimitKey(ip: string, identifier: string): string {
  return `ratelimit:${identifier}:${ip}`;
}

/**
 * Check rate limit using in-memory storage (for local development)
 */
async function checkInMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired, create new entry
    const resetTime = now + config.windowSeconds * 1000;
    inMemoryStore.set(key, { count: 1, resetTime });
    
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil(resetTime / 1000),
    };
  }

  // Window still active
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(entry.resetTime / 1000),
    };
  }

  // Increment count
  entry.count++;
  inMemoryStore.set(key, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: Math.ceil(entry.resetTime / 1000),
  };
}

/**
 * Check rate limit using Vercel KV (for production)
 */
async function checkKVRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const { kv } = await import('@vercel/kv');
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.windowSeconds;

    // Use a Redis pipeline-like approach with multi
    // Get current count and reset time
    const current = await kv.get<{ count: number; reset: number }>(key);

    if (!current || now > current.reset) {
      // First request or window expired
      const reset = now + config.windowSeconds;
      await kv.set(key, { count: 1, reset }, { ex: config.windowSeconds });
      
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - 1,
        reset,
      };
    }

    // Window still active
    if (current.count >= config.limit) {
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: current.reset,
      };
    }

    // Increment count
    const newCount = current.count + 1;
    const ttl = current.reset - now;
    await kv.set(key, { count: newCount, reset: current.reset }, { ex: ttl });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - newCount,
      reset: current.reset,
    };
  } catch (error) {
    console.error('KV rate limit error, falling back to in-memory:', error);
    return checkInMemoryRateLimit(key, config);
  }
}

/**
 * Check if the request is within rate limits
 * 
 * @param request - The Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with success status and rate limit info
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const ip = getClientIP(request);
  const key = getRateLimitKey(ip, config.identifier || 'default');

  if (isKVAvailable()) {
    return checkKVRateLimit(key, config);
  } else {
    return checkInMemoryRateLimit(key, config);
  }
}

/**
 * Create a 429 Too Many Requests response with proper headers
 */
export function createRateLimitResponse(
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  const retryAfter = Math.max(1, reset - Math.floor(Date.now() / 1000));
  
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      limit,
      remaining,
      reset,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}

/**
 * Middleware helper to check rate limit and return response if exceeded
 * 
 * Usage in API route:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const rateLimitResponse = await applyRateLimit(request, CONSENSUS_RATE_LIMIT);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Your API logic here...
 * }
 * ```
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, config);
  
  if (!result.success) {
    return createRateLimitResponse(result.limit, result.remaining, result.reset);
  }
  
  return null;
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));
  return response;
}
