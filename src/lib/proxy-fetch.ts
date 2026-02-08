/**
 * Proxy fetch wrapper for AI model API calls.
 *
 * When AI_PROXY_URL is configured, routes requests through the local proxy
 * server (which holds the API keys). Falls back to direct calls when the
 * proxy is not configured (local dev with keys in .env.local).
 */

// In production (Vercel), always use the proxy since API keys live on the proxy server.
// In local dev, keys are in .env.local so call models directly.
const DEFAULT_PROXY_URL = 'https://disposal-sophisticated-adsl-rate.trycloudflare.com';
const IS_VERCEL = !!process.env.VERCEL;
const PROXY_URL = process.env.AI_PROXY_URL !== undefined
  ? process.env.AI_PROXY_URL  // Explicitly set (can be empty string to disable)
  : IS_VERCEL
    ? DEFAULT_PROXY_URL  // On Vercel, always use proxy
    : (process.env.DEEPSEEK_API_KEY ? '' : DEFAULT_PROXY_URL);  // Local: auto-detect

/**
 * Enhanced error types for proxy connection issues
 */
export enum ProxyErrorType {
  CONNECTION_REFUSED = 'ECONNREFUSED',
  CONNECTION_TIMEDOUT = 'ETIMEDOUT',
  HOST_NOT_FOUND = 'ENOTFOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROXY_DOWN = 'PROXY_DOWN',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
}

export class ProxyError extends Error {
  constructor(
    message: string,
    public type: ProxyErrorType,
    public retryable: boolean = true,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}

/**
 * Detect if an error is a proxy connection issue
 */
function isProxyConnectionError(error: unknown): boolean {
  if (error instanceof ProxyError) {
    return [
      ProxyErrorType.CONNECTION_REFUSED,
      ProxyErrorType.CONNECTION_TIMEDOUT,
      ProxyErrorType.HOST_NOT_FOUND,
      ProxyErrorType.NETWORK_ERROR,
      ProxyErrorType.PROXY_DOWN,
    ].includes(error.type);
  }
  return false;
}

/**
 * Fetch from an AI model API, optionally routing through the proxy.
 * Returns a standard Response object — callers parse it the same way
 * regardless of whether the proxy was used.
 * 
 * Enhanced with comprehensive error handling for proxy connection issues.
 */
export async function proxyFetch(
  provider: 'openai' | 'anthropic' | 'google',
  config: {
    baseUrl: string;
    path?: string;
    model: string;
    apiKeyEnv: string;
    body: unknown;
    extraHeaders?: Record<string, string>;
  },
  signal?: AbortSignal
): Promise<Response> {
  if (PROXY_URL) {
    // Route through proxy — it handles auth
    try {
      const response = await fetch(`${PROXY_URL}/v1/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        signal,
        body: JSON.stringify({
          provider,
          baseUrl: config.baseUrl,
          path: config.path || '',
          model: config.model,
          apiKeyEnv: config.apiKeyEnv,
          body: config.body,
          headers: config.extraHeaders,
        }),
      });

      // Handle HTTP errors from proxy
      if (!response.ok) {
        // Check for proxy-specific errors (502, 503, 504)
        if (response.status === 502) {
          throw new ProxyError(
            'AI proxy server is temporarily unavailable (Bad Gateway)',
            ProxyErrorType.PROXY_DOWN,
            true,
            502
          );
        }
        if (response.status === 503) {
          throw new ProxyError(
            'AI models temporarily unavailable (Service Unavailable)',
            ProxyErrorType.PROXY_DOWN,
            true,
            503
          );
        }
        if (response.status === 504) {
          throw new ProxyError(
            'AI proxy request timed out (Gateway Timeout)',
            ProxyErrorType.CONNECTION_TIMEDOUT,
            true,
            504
          );
        }
        if (response.status === 429) {
          throw new ProxyError(
            'Rate limit exceeded - please wait before trying again',
            ProxyErrorType.RATE_LIMIT,
            true,
            429
          );
        }
        // Other server errors
        if (response.status >= 500) {
          throw new ProxyError(
            `AI proxy server error: ${response.status}`,
            ProxyErrorType.SERVER_ERROR,
            true,
            response.status
          );
        }
        // Client errors (4xx except 429) - not retryable
        if (response.status >= 400 && response.status < 500) {
          throw new ProxyError(
            `AI proxy client error: ${response.status}`,
            ProxyErrorType.NETWORK_ERROR,
            false,
            response.status
          );
        }
      }

      return response;
    } catch (error) {
      // Handle network-level errors
      if (error instanceof ProxyError) {
        throw error;
      }

      // Detect specific network errors
      const errorMessage = error instanceof Error ? error.message : String(error);

      // ECONNREFUSED - Connection refused
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        throw new ProxyError(
          'Unable to connect to AI proxy - connection refused',
          ProxyErrorType.CONNECTION_REFUSED,
          true,
          undefined,
          error
        );
      }

      // ETIMEDOUT - Connection timed out
      if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
        throw new ProxyError(
          'AI proxy connection timed out',
          ProxyErrorType.CONNECTION_TIMEDOUT,
          true,
          undefined,
          error
        );
      }

      // ENOTFOUND - Host not found
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        throw new ProxyError(
          'AI proxy server not found - check proxy configuration',
          ProxyErrorType.HOST_NOT_FOUND,
          false,
          undefined,
          error
        );
      }

      // Generic network error
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        throw new ProxyError(
          'Network error - unable to reach AI proxy',
          ProxyErrorType.NETWORK_ERROR,
          true,
          undefined,
          error
        );
      }

      // AbortError - Request was cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProxyError(
          'Request cancelled',
          ProxyErrorType.CONNECTION_TIMEDOUT,
          true,
          undefined,
          error
        );
      }

      // Unknown error - wrap it
      throw new ProxyError(
        `Unexpected proxy error: ${errorMessage}`,
        ProxyErrorType.NETWORK_ERROR,
        true,
        undefined,
        error
      );
    }
  }

  // Direct call — local dev with API keys in environment
  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new ProxyError(
      `Missing API key: ${config.apiKeyEnv}`,
      ProxyErrorType.NETWORK_ERROR,
      false
    );
  }

  let url: string;
  let headers: Record<string, string>;

  if (provider === 'google') {
    url = `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`;
    headers = { 'Content-Type': 'application/json' };
  } else if (provider === 'anthropic') {
    url = `${config.baseUrl}${config.path || '/messages'}`;
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(config.extraHeaders || {}),
    };
  } else {
    url = `${config.baseUrl}${config.path || '/chat/completions'}`;
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(config.extraHeaders || {}),
    };
  }

  try {
    return await fetch(url, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(config.body),
    });
  } catch (error) {
    // Handle direct API call errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      throw new ProxyError(
        'Connection refused - API server unavailable',
        ProxyErrorType.CONNECTION_REFUSED,
        true,
        undefined,
        error
      );
    }

    if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      throw new ProxyError(
        'API request timed out',
        ProxyErrorType.CONNECTION_TIMEDOUT,
        true,
        undefined,
        error
      );
    }

    if (error instanceof TypeError && errorMessage.includes('fetch')) {
      throw new ProxyError(
        'Network error - unable to reach API',
        ProxyErrorType.NETWORK_ERROR,
        true,
        undefined,
        error
      );
    }

    throw error;
  }
}

/**
 * Check if the proxy is configured.
 * When true, API key checks should be skipped (proxy has the keys).
 */
export function isProxyConfigured(): boolean {
  return !!PROXY_URL;
}

/**
 * Check if an error is a retryable proxy connection error
 */
export function isRetryableProxyError(error: unknown): boolean {
  if (error instanceof ProxyError) {
    return error.retryable;
  }
  return false;
}

/**
 * Get a user-friendly error message for proxy errors
 */
export function getProxyErrorMessage(error: unknown): string {
  if (error instanceof ProxyError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}
