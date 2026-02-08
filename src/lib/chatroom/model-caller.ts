import { ANALYST_MODELS } from '../models';
import { ChatroomError, ChatroomErrorType, createUserFacingError, createProgressUpdate } from './error-types';
import type { UserFacingError, ProgressUpdate } from '../types';
import { proxyFetch, isProxyConfigured } from '../proxy-fetch';

// Rate limiting per model
const lastRequestTime: Record<string, number> = {};
const MIN_REQUEST_INTERVAL = 1000;

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

/**
 * Call a model and return raw text (not parsed JSON).
 * Reuses the same provider-switching logic from consensus-engine.ts
 * but returns the raw string response instead of parsing it as a trading signal.
 * Enhanced with progress tracking and user-facing errors.
 */
export async function callModelRaw(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 200,
  onProgress?: (progress: ProgressUpdate) => void
): Promise<string> {
  const config = ANALYST_MODELS.find(m => m.id === modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const usingProxy = isProxyConfigured();
  const apiKey = usingProxy ? 'proxy-managed' : process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  // Rate limiting
  const now = Date.now();
  const lastTime = lastRequestTime[config.id] || 0;
  const waitTime = MIN_REQUEST_INTERVAL - (now - lastTime);
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime[config.id] = Date.now();

  return callWithRetry(config, apiKey, systemPrompt, userPrompt, maxTokens, 0);
}

async function callWithRetry(
  config: typeof ANALYST_MODELS[number],
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  retryCount: number
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    let text: string;

    if (config.provider === 'google') {
      text = await callGoogle(config, apiKey, systemPrompt, userPrompt, maxTokens, controller.signal);
    } else if (config.provider === 'anthropic') {
      text = await callAnthropic(config, apiKey, systemPrompt, userPrompt, maxTokens, controller.signal);
    } else {
      text = await callOpenAI(config, apiKey, systemPrompt, userPrompt, maxTokens, controller.signal);
    }

    clearTimeout(timeoutId);
    return text;
  } catch (error) {
    clearTimeout(timeoutId);

    // Classify error type
    let errorType: ChatroomErrorType = ChatroomErrorType.API_ERROR;
    let retryable = false;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorType = ChatroomErrorType.TIMEOUT;
        retryable = true;
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorType = ChatroomErrorType.RATE_LIMIT;
        retryable = true;
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = ChatroomErrorType.NETWORK_ERROR;
        retryable = true;
      } else if (error.message.includes('Empty response')) {
        errorType = ChatroomErrorType.PARSE_ERROR;
        retryable = true;
      }
    }

    // Retry on transient errors
    if (retryable && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(`[chatroom-model] Retrying ${config.id} (attempt ${retryCount + 1}/${MAX_RETRIES}, delay: ${delay}ms, type: ${errorType})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(config, apiKey, systemPrompt, userPrompt, maxTokens, retryCount + 1);
    }

    // Convert to ChatroomError for better error tracking
    if (error instanceof ChatroomError) {
      throw error;
    }

    throw new ChatroomError(
      error instanceof Error ? error.message : 'Unknown error',
      errorType,
      config.id,
      error
    );
  }
}

async function callOpenAI(
  config: typeof ANALYST_MODELS[number],
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  signal: AbortSignal
): Promise<string> {
  const response = await proxyFetch('openai', {
    baseUrl: config.baseUrl,
    path: '/chat/completions',
    model: config.model,
    apiKeyEnv: config.apiKeyEnv,
    body: {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: maxTokens,
    },
  }, signal);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errData = data as { error?: { message?: string } };
    throw new Error(errData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const openaiData = data as { choices?: Array<{ message?: { content?: string } }> };
  const text = openaiData.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI-compatible API');
  return text;
}

async function callAnthropic(
  config: typeof ANALYST_MODELS[number],
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  signal: AbortSignal
): Promise<string> {
  const response = await proxyFetch('anthropic', {
    baseUrl: config.baseUrl,
    path: '/messages',
    model: config.model,
    apiKeyEnv: config.apiKeyEnv,
    body: {
      model: config.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    },
    extraHeaders: { 'anthropic-version': '2023-06-01' },
  }, signal);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errData = data as { error?: { message?: string } };
    throw new Error(errData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const anthropicData = data as { content?: Array<{ text?: string }> };
  const text = anthropicData.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Anthropic-compatible API');
  return text;
}

async function callGoogle(
  config: typeof ANALYST_MODELS[number],
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  signal: AbortSignal
): Promise<string> {
  const response = await proxyFetch('google', {
    baseUrl: config.baseUrl,
    model: config.model,
    apiKeyEnv: config.apiKeyEnv,
    body: {
      contents: [
        {
          parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: maxTokens,
      },
    },
  }, signal);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errData = data as { error?: { message?: string } };
    throw new Error(errData.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const geminiData = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');
  return text;
}
