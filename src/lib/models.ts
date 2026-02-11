/**
 * Consensus Vault - AI Model Configuration
 * 5 specialized crypto analyst models for consensus-based trading signals
 * 
 * CVAULT-236: Enhanced with dynamic model selection via configuration
 * Models can now be configured via:
 * - Environment variables (MODEL_{MODEL_ID}_{SETTING})
 * - Configuration file (model-config.json)
 * - Bulk model selection (CONSENSUS_AI_MODELS)
 * - Default hardcoded configuration (fallback)
 */

import {
  getSelectedModelConfigs,
  getSelectedModels,
  getModelSelectionStatus,
  getCustomFallbackOrder,
  applyModelOverrides,
  type ModelConfigOverride,
} from './model-config';

export type Signal = 'buy' | 'sell' | 'hold';

export interface ModelResponse {
  signal: Signal;
  confidence: number; // 0-100
  reasoning: string;
}

export interface AnalystResult {
  id: string;
  name: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  error?: string;
  // Enhanced error handling
  userFacingError?: {
    type: string;
    message: string;
    severity: 'warning' | 'critical';
    recoveryGuidance: string;
    retryable: boolean;
    modelId?: string;
    estimatedWaitTime?: number;
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  role: string;
  baseUrl: string;
  apiKeyEnv: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'google';
  systemPrompt: string;
  timeout: number; // ms
}

import { 
  modelFactory, 
  getAllEnabledModels, 
  getBestAvailableModel,
  validateModelConfigs 
} from './model-factory';

/**
 * CACHE: Stores the last computed active model configs
 * Used to prevent redundant computations and ensure consistency
 */
let activeModelsCache: ModelConfig[] | null = null;

/**
 * Clear the active models cache
 * Call this when configuration changes to force recalculation
 */
export function clearActiveModelsCache(): void {
  activeModelsCache = null;
}

/**
 * Apply environment variable overrides to a model configuration
 * Uses MODEL_<MODEL_ID>_<SETTING> format
 */
function applyEnvOverrides(config: ModelConfig, modelId: string): ModelConfig {
  const overridePrefix = `MODEL_${modelId.toUpperCase()}_`;
  const overrides: Partial<ModelConfig> = {};
  
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(overridePrefix)) continue;
    
    const setting = key.substring(overridePrefix.length).toLowerCase();
    
    switch (setting) {
      case 'model':
        overrides.model = value;
        break;
      case 'base_url':
      case 'baseurl':
        overrides.baseUrl = value;
        break;
      case 'timeout':
        const timeout = parseInt(value || '30000', 10);
        if (!isNaN(timeout) && timeout >= 1000 && timeout <= 300000) {
          overrides.timeout = timeout;
        }
        break;
      // Provider, systemPrompt, role, name, apiKeyEnv are not overridable via env
    }
  }
  
  return { ...config, ...overrides };
}

/**
 * Get active analyst models based on dynamic configuration
 * 
 * Configuration priority (highest to lowest):
 * 1. CONSENSUS_AI_MODELS env var - bulk model selection
 * 2. MODEL_<MODEL_ID>_* env vars - per-model overrides
 * 3. model-config.json - configuration file settings
 * 4. Default hardcoded configuration (fallback)
 * 
 * @returns Array of active ModelConfig objects with all overrides applied
 */
export function getActiveModelConfigs(): ModelConfig[] {
  // Return cached result if available
  if (activeModelsCache !== null) {
    return activeModelsCache;
  }
  
  // Check if CONSENSUS_AI_MODELS is set and use it for selection
  const selectedModelIds = getSelectedModels();
  
  if (selectedModelIds.length === 0) {
    console.warn('[models] No models selected via CONSENSUS_AI_MODELS, using all enabled models');
    // Fall back to factory's enabled models
    const factoryModels = getAllEnabledModels();
    activeModelsCache = factoryModels.map(model => applyEnvOverrides(model as ModelConfig, model.id));
    return activeModelsCache;
  }
  
  // Get base configs from model-config.ts (which respects CONSENSUS_AI_MODELS)
  let configs = getSelectedModelConfigs();
  
  // If model-config.ts returned empty, fall back to factory
  if (configs.length === 0) {
    console.warn('[models] No valid models from CONSENSUS_AI_MODELS, falling back to factory defaults');
    const factoryModels = getAllEnabledModels();
    configs = factoryModels.map(model => applyEnvOverrides(model as ModelConfig, model.id));
  } else {
    // Apply environment variable overrides to each config
    configs = configs.map(config => applyEnvOverrides(config, config.id));
  }
  
  // Cache the result
  activeModelsCache = configs;
  
  // Log selection for debugging
  console.log('[models] Active models:', configs.map(c => c.id).join(', '));
  
  return activeModelsCache;
}

/**
 * Get fallback order for a model using dynamic configuration
 * CVAULT-236: Uses model-config for dynamic fallback chains
 */
export function getFallbackOrder(modelId: string): string[] {
  // First try to get custom fallback order from config
  const customOrder = getCustomFallbackOrder(modelId);
  if (customOrder) {
    return customOrder;
  }
  
  // Fall back to static default
  return DEFAULT_FALLBACK_ORDER[modelId] || [];
}

/**
 * Backward compatibility: ANALYST_MODELS now uses dynamic configuration
 * @deprecated Use getActiveModelConfigs() or getActiveAnalystModels() instead for dynamic model selection
 */
export const ANALYST_MODELS: ModelConfig[] = getActiveModelConfigs();

/**
 * Map signal to sentiment for frontend display
 */
export function signalToSentiment(signal: Signal): 'bullish' | 'bearish' | 'neutral' {
  switch (signal) {
    case 'buy':
      return 'bullish';
    case 'sell':
      return 'bearish';
    case 'hold':
      return 'neutral';
  }
}

/**
 * Default fallback order: when a model fails, try these alternatives with the same role prompt.
 * Each model can be substituted by any other — the role prompt stays the same.
 * 
 * CVAULT-236: This can now be overridden via model-config.json
 */
const DEFAULT_FALLBACK_ORDER: Record<string, string[]> = {
  deepseek: ['minimax', 'glm', 'kimi', 'gemini'],
  kimi: ['deepseek', 'minimax', 'glm', 'gemini'],
  minimax: ['deepseek', 'kimi', 'glm', 'gemini'],
  glm: ['deepseek', 'minimax', 'kimi', 'gemini'],
  gemini: ['deepseek', 'minimax', 'kimi', 'glm'],
};

/**
 * Export FALLBACK_ORDER for backward compatibility
 * @deprecated Use getFallbackOrder(modelId) instead
 */
export const FALLBACK_ORDER: Record<string, string[]> = DEFAULT_FALLBACK_ORDER;

export type ConsensusStatus = 'CONSENSUS_REACHED' | 'NO_CONSENSUS' | 'INSUFFICIENT_RESPONSES';

export interface IndividualVote {
  model_name: string;
  signal: Signal | null;
  response_time_ms: number;
  confidence: number;
  status: 'success' | 'timeout' | 'error';
  error?: string;
}

export interface ConsensusResponse {
  consensus_status: ConsensusStatus;
  consensus_signal: Signal | null;
  individual_votes: IndividualVote[];
  vote_counts: {
    BUY: number;
    SELL: number;
    HOLD: number;
  };
  timestamp: string;
}

/**
 * Calculate consensus from multiple analyst results
 * Requires 4/5 agreement for a strong signal
 */
export function calculateConsensus(results: AnalystResult[]): {
  signal: Signal | null;
  consensusLevel: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | null;
} {
  const validResults = results.filter((r) => !r.error);

  if (validResults.length < 3) {
    return { signal: null, consensusLevel: 0, recommendation: null };
  }

  const signalCounts = { buy: 0, sell: 0, hold: 0 };
  const confidenceSum = { buy: 0, sell: 0, hold: 0 };

  for (const result of validResults) {
    const signal = sentimentToSignal(result.sentiment);
    signalCounts[signal]++;
    confidenceSum[signal] += result.confidence;
  }

  // Find the majority signal
  const totalValid = validResults.length;
  let majoritySignal: Signal = 'hold';
  let maxCount = 0;

  for (const [signal, count] of Object.entries(signalCounts)) {
    if (count > maxCount) {
      maxCount = count;
      majoritySignal = signal as Signal;
    }
  }

  // Consensus level = (agreeing models / total) * avg confidence of agreeing
  const avgConfidence = maxCount > 0 ? confidenceSum[majoritySignal] / maxCount : 0;
  const agreementRatio = maxCount / totalValid;
  const consensusLevel = Math.round(agreementRatio * avgConfidence);

  // Need 4/5 (80%) agreement for a strong recommendation
  const threshold = 0.8;
  let recommendation: 'BUY' | 'SELL' | 'HOLD' | null = null;

  if (agreementRatio >= threshold) {
    recommendation = majoritySignal.toUpperCase() as 'BUY' | 'SELL' | 'HOLD';
  }

  return { signal: majoritySignal, consensusLevel, recommendation };
}

/**
 * Calculate 4/5 consensus with detailed response structure
 * Implements strict 4-out-of-5 agreement threshold
 */
export function calculateConsensusDetailed(
  results: AnalystResult[],
  responseTimes: Map<string, number>
): ConsensusResponse {
  const timestamp = new Date().toISOString();

  // Build individual votes array
  const individual_votes: IndividualVote[] = results.map((result) => {
    const signal = result.error ? null : sentimentToSignal(result.sentiment);
    let status: 'success' | 'timeout' | 'error' = 'success';

    if (result.error) {
      // Determine if it was a timeout or other error
      if (result.error.toLowerCase().includes('timeout') ||
          result.error.toLowerCase().includes('aborted')) {
        status = 'timeout';
      } else {
        status = 'error';
      }
    }

    return {
      model_name: result.id,
      signal,
      response_time_ms: responseTimes.get(result.id) || 0,
      confidence: result.confidence,
      status,
      error: result.error,
    };
  });

  // Count valid votes (exclude timeouts and errors)
  const validVotes = individual_votes.filter((v) => v.status === 'success');

  // Check for insufficient responses (less than 3 valid responses)
  if (validVotes.length < 3) {
    return {
      consensus_status: 'INSUFFICIENT_RESPONSES',
      consensus_signal: null,
      individual_votes,
      vote_counts: {
        BUY: 0,
        SELL: 0,
        HOLD: 0,
      },
      timestamp,
    };
  }

  // Count votes for each signal
  const vote_counts = {
    BUY: validVotes.filter((v) => v.signal === 'buy').length,
    SELL: validVotes.filter((v) => v.signal === 'sell').length,
    HOLD: validVotes.filter((v) => v.signal === 'hold').length,
  };

  // Determine consensus: need at least 4 votes for the same signal
  const CONSENSUS_THRESHOLD = 4;
  let consensus_signal: Signal | null = null;
  let consensus_status: ConsensusStatus = 'NO_CONSENSUS';

  if (vote_counts.BUY >= CONSENSUS_THRESHOLD) {
    consensus_signal = 'buy';
    consensus_status = 'CONSENSUS_REACHED';
  } else if (vote_counts.SELL >= CONSENSUS_THRESHOLD) {
    consensus_signal = 'sell';
    consensus_status = 'CONSENSUS_REACHED';
  } else if (vote_counts.HOLD >= CONSENSUS_THRESHOLD) {
    consensus_signal = 'hold';
    consensus_status = 'CONSENSUS_REACHED';
  }

  return {
    consensus_status,
    consensus_signal,
    individual_votes,
    vote_counts,
    timestamp,
  };
}

function sentimentToSignal(sentiment: 'bullish' | 'bearish' | 'neutral'): Signal {
  switch (sentiment) {
    case 'bullish':
      return 'buy';
    case 'bearish':
      return 'sell';
    case 'neutral':
      return 'hold';
  }
}

/**
 * CVAULT-236: Get active analyst models with dynamic configuration applied
 * 
 * This is the primary entry point for getting model configurations.
 * It applies overrides from:
 * 1. CONSENSUS_AI_MODELS env var (highest priority)
 * 2. MODEL_<MODEL_ID>_* env vars (per-model overrides)
 * 3. model-config.json (configuration file)
 * 4. Default hardcoded configuration (fallback)
 * 
 * @returns Array of active ModelConfig objects with all overrides applied
 * 
 * @example
 * ```ts
 * const models = getActiveAnalystModels();
 * // Returns: ModelConfig[] with dynamic overrides applied
 * ```
 */
export function getActiveAnalystModels(): ModelConfig[] {
  return getActiveModelConfigs();
}

/**
 * CVAULT-236: Get a specific model's configuration with overrides
 * 
 * @param modelId - The model identifier (e.g., 'deepseek', 'kimi')
 * @returns ModelConfig with overrides applied, or undefined if model not found
 * 
 * @example
 * ```ts
 * const deepseekConfig = getModelConfig('deepseek');
 * if (deepseekConfig) {
 *   console.log(deepseekConfig.model); // May be overridden from config
 * }
 * ```
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  const activeModels = getActiveAnalystModels();
  return activeModels.find(m => m.id === modelId);
}

/**
 * CVAULT-236: Reload model configuration (useful for testing or hot-reload)
 * Clears the configuration cache and returns fresh models
 * 
 * @returns Array of active ModelConfig objects
 * 
 * @example
 * ```ts
 * // After changing model-config.json or environment variables
 * const models = reloadModelConfig();
 * ```
 */
export function reloadModelConfig(): ModelConfig[] {
  // Clear both caches
  clearActiveModelsCache();
  modelFactory.reload();
  
  // Return fresh models
  return getActiveAnalystModels();
}

/**
 * CVAULT-236: Get model selection status for monitoring/debugging
 * Returns information about which models are selected and why
 */
export function getModelSelectionInfo() {
  return getModelSelectionStatus();
}
