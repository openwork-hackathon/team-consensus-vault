/**
 * Proxy fetch wrapper for AI model API calls.
 *
 * When AI_PROXY_URL is configured, routes requests through the local proxy
 * server (which holds the API keys). Falls back to direct calls when the
 * proxy is not configured (local dev with keys in .env.local).
 */

const PROXY_URL = process.env.AI_PROXY_URL || '';

/**
 * Fetch from an AI model API, optionally routing through the proxy.
 * Returns a standard Response object — callers parse it the same way
 * regardless of whether the proxy was used.
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
    return fetch(`${PROXY_URL}/v1/proxy`, {
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
  }

  // Direct call — local dev with API keys in environment
  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
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

  return fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify(config.body),
  });
}

/**
 * Check if the proxy is configured.
 * When true, API key checks should be skipped (proxy has the keys).
 */
export function isProxyConfigured(): boolean {
  return !!PROXY_URL;
}
