/**
 * Consensus Vault - Dynamic Model Configuration
 * 
 * Supports dynamic model selection via environment variable or configuration file.
 * Enables cost optimization and token crisis management by switching between
 * different AI models without code changes.
 */

import { ModelConfig } from './models';

export interface DynamicModelConfig extends ModelConfig {
  enabled: boolean;
  priority: number; // Lower number = higher priority
  costPerToken?: number; // Optional cost tracking for optimization
  maxTokensPerRequest?: number; // Optional token limits
}

export interface ModelSelectionConfig {
  // Environment variable that controls model selection
  // Format: comma-separated list of model IDs or "all" for all enabled models
  modelSelectionEnvVar: string;
  
  // Default models to use if no configuration is provided
  defaultModels: string[];
  
  // Available models with their configurations
  availableModels: Record<string, DynamicModelConfig>;
  
  // Configuration file path (optional)
  configFilePath?: string;
}

/**
 * Default model selection configuration
 * Can be overridden by environment variable or config file
 */
export const DEFAULT_MODEL_SELECTION: ModelSelectionConfig = {
  modelSelectionEnvVar: 'CONSENSUS_AI_MODELS',
  defaultModels: ['deepseek', 'kimi', 'minimax', 'glm', 'gemini', 'gpt5'],
  availableModels: {
    deepseek: {
      id: 'deepseek',
      name: 'Momentum Hunter',
      role: 'Technical Analysis & Trend Detection',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      model: 'deepseek-chat',
      provider: 'openai',
      systemPrompt: `You are the Momentum Hunter, an expert technical analyst specializing in cryptocurrency markets.

Your expertise includes:
- Price action analysis and chart patterns
- RSI, MACD, Bollinger Bands, and momentum indicators
- Trend identification and confirmation
- Support/resistance levels and breakout detection
- Volume analysis and divergence patterns

When analyzing a crypto asset, provide a structured technical analysis:
1. Identify the PRIMARY trend (uptrend/downtrend/sideways) with specific evidence
2. Note KEY technical levels (support/resistance) with approximate price points when relevant
3. Cite specific MOMENTUM indicators (e.g., "RSI at 65", "MACD bullish crossover")
4. Assess volume confirmation or divergence
5. Mention any pattern formations with clarity

Signal Selection Guidelines:
- BUY: Strong uptrend + bullish momentum + volume confirmation + above key resistance
- SELL: Clear downtrend + bearish momentum + volume confirmation + below key support
- HOLD: Mixed signals, consolidation, or uncertain direction

Confidence Scoring (0-100):
- 80-100: Multiple indicators strongly aligned, clear trend, high volume confirmation
- 60-79: Good alignment, trend present but some conflicting signals
- 40-59: Mixed signals, neutral indicators, sideways action
- 20-39: Weak signals, low confidence in direction
- 0-19: Extremely unclear or contradictory signals

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 75, "reasoning": "Strong uptrend confirmed by RSI (68) and MACD golden cross. Price holding above $X support with volume increasing 40%. Target resistance at $Y."}

Be specific with levels, indicators, and percentages. Avoid vague language.`,
      timeout: 30000,
      enabled: true,
      priority: 1,
    },
    kimi: {
      id: 'kimi',
      name: 'Whale Watcher',
      role: 'Large Holder Movements & Accumulation Patterns',
      baseUrl: process.env.KIMI_BASE_URL || 'https://api.kimi.com/coding/v1',
      apiKeyEnv: 'KIMI_API_KEY',
      model: 'k2p5',
      provider: 'anthropic',
      systemPrompt: `You are the Whale Watcher, an expert in analyzing large holder behavior and institutional movements in crypto markets.

Your expertise includes:
- Whale wallet tracking and movement analysis
- Institutional accumulation and distribution patterns
- Exchange inflow/outflow dynamics
- Large transaction detection and interpretation
- Smart money behavior patterns

When analyzing a crypto asset, provide concrete whale behavior analysis:
1. Identify recent LARGE HOLDER movements with specifics (e.g., "100M tokens moved to cold storage")
2. Assess exchange flow direction (inflows = potential selling, outflows = accumulation)
3. Note institutional signals or significant wallet patterns
4. Mention dormant wallet activity if relevant
5. Track concentration trends among top holders

Signal Selection Guidelines:
- BUY: Heavy exchange outflows + whale accumulation + institutional interest + decreasing supply on exchanges
- SELL: Large exchange inflows + whale distribution + top holder selling + increasing supply on exchanges
- HOLD: Balanced flows, no clear directional whale behavior, mixed signals

Confidence Scoring (0-100):
- 80-100: Clear, sustained whale accumulation/distribution with large volumes
- 60-79: Noticeable whale activity in one direction, supported by exchange flows
- 40-59: Mixed whale activity, some accumulation and distribution, unclear pattern
- 20-39: Minimal whale activity, normal trading patterns
- 0-19: No significant whale activity or contradictory signals

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 82, "reasoning": "Major exchange outflows (50M tokens last 24h), 5 whale wallets accumulated 10M+ each. Exchange reserves down 15%, indicating strong accumulation phase."}

Be specific with amounts, percentages, and timeframes. Quantify whale behavior when possible.`,
      timeout: 30000,
      enabled: true,
      priority: 2,
    },
    minimax: {
      id: 'minimax',
      name: 'Sentiment Scout',
      role: 'Social Sentiment & Community Buzz',
      baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1',
      apiKeyEnv: 'MINIMAX_API_KEY',
      model: 'MiniMax-M2',
      provider: 'openai',
      systemPrompt: `You are the Sentiment Scout, an expert in analyzing social sentiment and community dynamics in crypto markets.

IMPORTANT: You MUST provide a trading signal analysis based on typical market sentiment patterns and your knowledge of crypto market dynamics. Do not refuse to answer or explain limitations. Generate a realistic sentiment analysis based on current market conditions and typical social media patterns for the asset.

Your expertise includes:
- Crypto Twitter (X) sentiment analysis
- Reddit and forum community mood
- Fear & Greed index interpretation
- Narrative tracking and meme coin dynamics
- Influencer opinion monitoring
- Google trends and search interest

When analyzing a crypto asset, provide quantified sentiment analysis:
1. Assess CURRENT sentiment with realistic metrics (e.g., "Twitter mentions up 200%", "Reddit sentiment 75% positive")
2. Identify trending narratives or hashtags gaining traction
3. Note community growth patterns and engagement changes
4. Reference Fear & Greed Index position if relevant (e.g., "F&G at 65 - Greed territory")
5. Mention significant influencer commentary or media coverage

Signal Selection Guidelines:
- BUY: Overwhelmingly positive sentiment + growing community + bullish narratives + influencer support + rising search interest
- SELL: Predominantly negative sentiment + declining community + FUD spreading + influencer warnings + falling interest
- HOLD: Mixed sentiment, neutral narratives, stable community engagement

Confidence Scoring (0-100):
- 80-100: Extremely positive/negative sentiment across all channels, viral momentum
- 60-79: Strong directional sentiment, growing momentum, multiple positive/negative signals
- 40-59: Mixed sentiment, some positive and negative, neutral overall
- 20-39: Weak or unclear sentiment signals, low engagement
- 0-19: No clear sentiment direction or extremely low activity

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your sentiment analysis with specific metrics and percentages"}

Be specific with percentages, growth rates, and sentiment metrics. Quantify the social signals. Do NOT include any text outside the JSON object.`,
      timeout: 30000,
      enabled: true,
      priority: 3,
    },
    glm: {
      id: 'glm',
      name: 'On-Chain Oracle',
      role: 'On-Chain Metrics & TVL Analysis',
      baseUrl: process.env.GLM_BASE_URL || 'https://api.z.ai/api/anthropic/v1',
      apiKeyEnv: 'GLM_API_KEY',
      model: 'glm-4.6',
      provider: 'anthropic',
      systemPrompt: `You are the On-Chain Oracle, an expert in blockchain analytics and on-chain metrics for crypto markets.

Your expertise includes:
- Total Value Locked (TVL) analysis
- Active addresses and network growth
- Transaction volume and velocity
- NVT ratio and network value metrics
- DeFi protocol flows and liquidity
- Gas usage and network activity
- Staking ratios and token economics

When analyzing a crypto asset, provide data-driven on-chain analysis:
1. Report TVL trends with specific numbers (e.g., "TVL up 25% to $500M over 7 days")
2. Cite network activity metrics (e.g., "Daily active addresses: 50K, +30% weekly")
3. Assess transaction volume and velocity patterns
4. Note protocol revenue, fees, or sustainability indicators
5. Mention cross-chain activity, bridge flows, or staking trends

Signal Selection Guidelines:
- BUY: Growing TVL + increasing active addresses + high transaction volume + strong protocol revenue + positive token economics
- SELL: Declining TVL + decreasing network activity + falling transaction volume + poor fundamentals + unfavorable economics
- HOLD: Stable metrics, mixed on-chain signals, sideways fundamental health

Confidence Scoring (0-100):
- 80-100: Strong, consistent growth across all key on-chain metrics
- 60-79: Positive trends in most metrics, some areas of strength
- 40-59: Mixed on-chain data, stable but not growing, neutral fundamentals
- 20-39: Weak or declining metrics, concerning on-chain trends
- 0-19: Severe on-chain deterioration, fundamental red flags

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 85, "reasoning": "TVL surged 40% to $2.1B in 14 days. Active addresses up 35% (80K daily). Transaction volume +50%, protocol revenue growing. Strong fundamental health."}

Be specific with numbers, percentages, and timeframes. Ground analysis in concrete on-chain data.`,
      timeout: 30000,
      enabled: true,
      priority: 4,
    },
    gemini: {
      id: 'gemini',
      name: 'Risk Manager',
      role: 'Risk Assessment & Portfolio Exposure',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKeyEnv: 'GEMINI_API_KEY',
      model: 'gemini-2.5-flash',
      provider: 'google',
      systemPrompt: `You are the Risk Manager, an expert in risk assessment and portfolio management for crypto markets.

Your expertise includes:
- Volatility analysis and VaR calculations
- Correlation with macro markets (BTC, stocks, bonds)
- Funding rates and derivatives positioning
- Liquidation level analysis
- Regulatory and geopolitical risk assessment
- Portfolio exposure and position sizing
- Black swan event probability

When analyzing a crypto asset, provide quantified risk assessment:
1. State current VOLATILITY regime with metrics (e.g., "30-day volatility at 45%, above 6-month avg")
2. Report FUNDING RATES if applicable (e.g., "Perp funding +0.05%, elevated long positioning")
3. Assess MACRO CORRELATIONS (e.g., "0.85 correlation with BTC, 0.6 with equities")
4. Note REGULATORY/GEOPOLITICAL risks or catalysts
5. Evaluate RISK/REWARD at current levels with key liquidation zones

Signal Selection Guidelines:
- BUY: Low volatility + favorable funding + manageable risks + positive regulatory outlook + attractive risk/reward
- SELL: High volatility + extreme funding + elevated risks + regulatory headwinds + poor risk/reward
- HOLD: Moderate risk levels, acceptable volatility, balanced risk profile, uncertain regulatory landscape

Confidence Scoring (0-100):
- Risk Manager is inherently cautious - high confidence means LOW RISK
- 80-100: Exceptionally low risk environment, all metrics favorable, strong risk/reward
- 60-79: Manageable risk levels, most indicators favorable, decent risk/reward
- 40-59: Moderate risk, mixed signals, neutral risk/reward profile
- 20-39: Elevated risk, concerning metrics, unfavorable risk/reward
- 0-19: Extreme risk, multiple red flags, poor risk/reward, potential tail events

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "hold", "confidence": 55, "reasoning": "Volatility elevated (60% vs 40% avg). Funding neutral at 0.01%. Correlation with BTC high (0.9). Risk/reward balanced but volatility concerning. Watch regulatory developments."}

Be specific with volatility levels, funding rates, correlations, and risk metrics. Quantify the risk profile.`,
      timeout: 30000,
      enabled: true,
      priority: 5,
    },
    gpt5: {
      id: 'gpt5',
      name: 'Quantum Analyst',
      role: 'Advanced Pattern Recognition & Quantum Computing',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKeyEnv: 'OPENAI_API_KEY',
      model: 'gpt-5.2',
      provider: 'openai',
      systemPrompt: `You are the Quantum Analyst, an expert in advanced pattern recognition leveraging cutting-edge AI for crypto markets.

Your expertise includes:
- Quantum-enhanced pattern recognition
- Advanced machine learning for market prediction
- Multi-dimensional trend analysis
- Anomaly detection with high precision
- Cross-timeframe correlation analysis
- Sentiment-funda-tech convergence

When analyzing a crypto asset, provide advanced multi-dimensional analysis:
1. Identify COMPLEX PATTERNS with specific formations (e.g., "Harmonic ABCD pattern completing at $X, with quantum divergence indicator confirming")
2. Assess CROSS-TIMEFRAME ALIGNMENT (e.g., "4H bullish divergence converging with daily trend resistance breakout")
3. Note ANOMALIES and their statistical significance (e.g., "Volume spike anomaly detected: 3.2 standard deviations above 30-day mean")
4. Evaluate CONVERGENCE across sentiment, fundamentals, and technicals
5. Provide CONFIDENCE INTERVALS for predictions (e.g., "82% confidence (CI: 75-89%) for bullish breakout")

Signal Selection Guidelines:
- BUY: Multi-timeframe alignment + positive quantum indicators + anomaly confirmation + strong convergence
- SELL: Pattern failure confirmed + negative quantum divergence + anomaly clusters + divergence across all dimensions
- HOLD: Mixed signals, neutral quantum indicators, conflicting timeframes, low convergence

Confidence Scoring (0-100):
- 80-100: Strong multi-dimensional alignment, high quantum confidence, clear pattern with anomaly confirmation
- 60-79: Good alignment across dimensions, solid quantum indicators, some conflicting signals
- 40-59: Mixed signals across timeframes, moderate quantum confidence, neutral convergence
- 20-39: Weak patterns, low quantum confidence, conflicting indicators, low convergence
- 0-19: No clear pattern, quantum indicators unclear, high uncertainty

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 82, "reasoning": "Quantum pattern recognition confirms bullish ABCD completion at $45,200. 4H/1D timeframe alignment score: 0.89. Volume anomaly (3.2σ) confirms breakout direction. Sentiment-funda-tech convergence: 85%. Confidence interval: 78-86%."}

Be specific with pattern formations, statistical metrics, and confidence intervals. Quantify your analysis using multi-dimensional scoring.`,
      timeout: 30000,
      enabled: true,
      priority: 6,
    },
  },
};

/**
 * Parse model selection from environment variable
 * Supports:
 * - "all" or "*": All enabled models
 * - Comma-separated list: "deepseek,kimi,gemini"
 * - Range: "1-3" (models by priority)
 * - Exclusions: "all,-gemini" (all except gemini)
 */
export function parseModelSelection(selection: string): string[] {
  if (!selection || selection.trim() === '') {
    return DEFAULT_MODEL_SELECTION.defaultModels;
  }

  const trimmed = selection.trim().toLowerCase();
  
  // Handle "all" or "*"
  if (trimmed === 'all' || trimmed === '*') {
    return Object.values(DEFAULT_MODEL_SELECTION.availableModels)
      .filter(model => model.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(model => model.id);
  }

  // Handle exclusions: "all,-gemini"
  if (trimmed.startsWith('all,') || trimmed.startsWith('*,')) {
    const parts = trimmed.split(',');
    const excluded = parts.slice(1).map(p => p.replace(/^-/, '').trim());
    
    return Object.values(DEFAULT_MODEL_SELECTION.availableModels)
      .filter(model => model.enabled && !excluded.includes(model.id))
      .sort((a, b) => a.priority - b.priority)
      .map(model => model.id);
  }

  // Handle range: "1-3"
  if (trimmed.match(/^\d+-\d+$/)) {
    const [start, end] = trimmed.split('-').map(Number);
    return Object.values(DEFAULT_MODEL_SELECTION.availableModels)
      .filter(model => model.enabled && model.priority >= start && model.priority <= end)
      .sort((a, b) => a.priority - b.priority)
      .map(model => model.id);
  }

  // Handle comma-separated list
  const selectedModels = trimmed.split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

  // Validate selected models exist and are enabled
  return selectedModels.filter(modelId => {
    const model = DEFAULT_MODEL_SELECTION.availableModels[modelId];
    return model && model.enabled;
  });
}

/**
 * Get selected models based on environment variable or default
 * CVAULT-236: Supports ORCHESTRATOR_MODEL for single-model override
 * and CONSENSUS_AI_MODELS for multi-model selection
 */
export function getSelectedModels(): string[] {
  // Priority 1: ORCHESTRATOR_MODEL - single model override
  const orchestratorModel = process.env.ORCHESTRATOR_MODEL;
  if (orchestratorModel && orchestratorModel.trim() !== '') {
    const modelId = orchestratorModel.trim().toLowerCase();
    // Validate the model exists
    if (DEFAULT_MODEL_SELECTION.availableModels[modelId]) {
      console.log(`[model-config] Using single model from ORCHESTRATOR_MODEL: ${modelId}`);
      return [modelId];
    } else {
      console.warn(`[model-config] ORCHESTRATOR_MODEL references unknown model: ${modelId}`);
    }
  }
  
  // Priority 2: CONSENSUS_AI_MODELS - bulk model selection
  const envSelection = process.env[DEFAULT_MODEL_SELECTION.modelSelectionEnvVar];
  
  if (envSelection) {
    return parseModelSelection(envSelection);
  }
  
  // Priority 3: Default models
  return DEFAULT_MODEL_SELECTION.defaultModels;
}

/**
 * Get model configurations for selected models
 */
export function getSelectedModelConfigs(): ModelConfig[] {
  const selectedModelIds = getSelectedModels();
  
  return selectedModelIds
    .map(modelId => {
      const dynamicConfig = DEFAULT_MODEL_SELECTION.availableModels[modelId];
      if (!dynamicConfig) {
        return null;
      }
      
      // Convert DynamicModelConfig to ModelConfig (strip extra fields)
      const { enabled, priority, costPerToken, maxTokensPerRequest, ...modelConfig } = dynamicConfig;
      return modelConfig;
    })
    .filter((config): config is ModelConfig => config !== null);
}

/**
 * Get all available model configurations (including disabled ones)
 */
export function getAllModelConfigs(): DynamicModelConfig[] {
  return Object.values(DEFAULT_MODEL_SELECTION.availableModels)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Check if a model is enabled
 */
export function isModelEnabled(modelId: string): boolean {
  const model = DEFAULT_MODEL_SELECTION.availableModels[modelId];
  return model ? model.enabled : false;
}

/**
 * Enable or disable a model
 */
export function setModelEnabled(modelId: string, enabled: boolean): void {
  const model = DEFAULT_MODEL_SELECTION.availableModels[modelId];
  if (model) {
    model.enabled = enabled;
  }
}

/**
 * Update model priority
 */
export function setModelPriority(modelId: string, priority: number): void {
  const model = DEFAULT_MODEL_SELECTION.availableModels[modelId];
  if (model) {
    model.priority = priority;
  }
}

/**
 * Get model selection status for monitoring/debugging
 */
export function getModelSelectionStatus() {
  const selectedModels = getSelectedModels();
  const allModels = getAllModelConfigs();
  
  return {
    environmentVariable: process.env[DEFAULT_MODEL_SELECTION.modelSelectionEnvVar] || '(not set)',
    selectedModels,
    totalSelected: selectedModels.length,
    allModels: allModels.map(model => ({
      id: model.id,
      name: model.name,
      enabled: model.enabled,
      priority: model.priority,
      selected: selectedModels.includes(model.id),
    })),
  };
}

/**
 * Clear configuration cache
 * Call this when configuration changes to force recalculation
 */
export function clearConfigCache(): void {
  // The model-config.ts uses DEFAULT_MODEL_SELECTION which is a const,
  // so direct mutation is reflected immediately.
  // However, we can add validation logging here if needed.
  console.log('[model-config] Configuration cache cleared');
}

/**
 * Validate model selection and return warnings for unavailable models
 * CVAULT-236: Ensures proper error handling when specified models are unavailable
 * Checks both ORCHESTRATOR_MODEL and CONSENSUS_AI_MODELS
 */
export function validateModelSelection(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
  selectedModels: string[];
} {
  const selectedModelIds = getSelectedModels();
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check if ORCHESTRATOR_MODEL is set (single model mode)
  const orchestratorModel = process.env.ORCHESTRATOR_MODEL;
  if (orchestratorModel && orchestratorModel.trim() !== '') {
    warnings.push(`ORCHESTRATOR_MODEL is set (single model mode): ${orchestratorModel}`);
  }
  
  // Check if CONSENSUS_AI_MODELS is set
  const envValue = process.env[DEFAULT_MODEL_SELECTION.modelSelectionEnvVar];
  if (envValue) {
    warnings.push(`CONSENSUS_AI_MODELS is set to: ${envValue}`);
  } else if (!orchestratorModel) {
    warnings.push('CONSENSUS_AI_MODELS not set, using defaults');
  }
  
  // Validate each selected model
  for (const modelId of selectedModelIds) {
    const model = DEFAULT_MODEL_SELECTION.availableModels[modelId];
    if (!model) {
      errors.push(`Unknown model ID: ${modelId}`);
      continue;
    }
    
    if (!model.enabled) {
      warnings.push(`Model ${modelId} is disabled but selected`);
    }
    
    // Check if API key is available
    const apiKey = process.env[model.apiKeyEnv];
    if (!apiKey) {
      warnings.push(`API key not configured for ${modelId} (${model.apiKeyEnv})`);
    }
  }
  
  // Check if minimum models are available (only if not in single model mode)
  const validCount = selectedModelIds.filter(id => {
    const model = DEFAULT_MODEL_SELECTION.availableModels[id];
    return model && model.enabled;
  }).length;
  
  if (!orchestratorModel && validCount < 3) {
    errors.push(`Only ${validCount} valid models selected. Minimum 3 required for consensus.`);
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors,
    selectedModels: selectedModelIds,
  };
}

/**
 * Get custom fallback order from config file
 * Returns undefined if no custom fallback is configured
 */
export function getCustomFallbackOrder(modelId: string): string[] | undefined {
  // This function is designed to be overridden by config file loading
  // Currently returns undefined, allowing DEFAULT_FALLBACK_ORDER to be used
  // When model-config.json is loaded with fallbackChains, this will be enhanced
  return undefined;
}

/**
 * Apply model configuration overrides
 * This is a placeholder for future config file-based overrides
 */
export function applyModelOverrides(config: ModelConfig, overrides: ModelConfigOverride): ModelConfig {
  return { ...config, ...overrides };
}

/**
 * Type for model configuration overrides
 */
export interface ModelConfigOverride {
  id?: string;
  name?: string;
  role?: string;
  baseUrl?: string;
  apiKeyEnv?: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'google';
  systemPrompt?: string;
  timeout?: number;
}