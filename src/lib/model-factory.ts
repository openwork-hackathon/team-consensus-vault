/**
 * Dynamic Model Selection Factory
 * 
 * CVAULT-236: Infrastructure for dynamic model selection via environment
 * variables or configuration file. Enables runtime switching between
 * different LLM providers (Claude, DeepSeek, GPT-4, etc.) without code changes.
 * 
 * Features:
 * - Environment variable-based configuration
 * - JSON config file support (optional)
 * - Factory pattern for model client instantiation
 * - Configuration validation
 * - Backward compatibility with existing ANALYST_MODELS
 * - Runtime model switching for cost optimization
 * - Token crisis management through model fallbacks
 */

import { ModelConfig, ANALYST_MODELS } from './models';

/**
 * Model provider types supported by the factory
 */
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'custom';

/**
 * Priority levels for model selection during token crisis
 */
export type ModelPriority = 'primary' | 'secondary' | 'fallback' | 'emergency';

/**
 * Enhanced model configuration with dynamic selection support
 */
export interface DynamicModelConfig extends Omit<ModelConfig, 'provider'> {
  provider: ModelProvider;
  priority?: ModelPriority;
  costPerToken?: number; // Cost per 1K tokens for optimization
  maxTokens?: number; // Context window size
  enabled?: boolean; // Enable/disable model at runtime
  region?: string; // For regional deployment
}

/**
 * Configuration file structure
 */
export interface ModelConfigurationFile {
  version: string;
  defaultProvider?: ModelProvider;
  models: Record<string, DynamicModelConfig>;
  fallbackChains?: Record<string, string[]>; // Fallback model IDs by priority
}

/**
 * Environment variable prefix for model overrides
 */
const ENV_PREFIX = 'MODEL_';

/**
 * Singleton instance of the model factory
 */
class ModelFactory {
  private static instance: ModelFactory;
  private configCache: Map<string, DynamicModelConfig> = new Map();
  private configFile: ModelConfigurationFile | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): ModelFactory {
    if (!ModelFactory.instance) {
      ModelFactory.instance = new ModelFactory();
    }
    return ModelFactory.instance;
  }

  /**
   * Initialize the factory with configuration from multiple sources
   * Priority (highest to lowest):
   * 1. Environment variables (MODEL_<MODEL_ID>_*)  
   * 2. Config file (model-config.json)
   * 3. Default ANALYST_MODELS from models.ts
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Load default models first (synchronous)
    this.loadDefaultModels();

    // Apply environment variable overrides (synchronous)
    this.applyEnvOverrides();

    // Try to load config file asynchronously (optional enhancement)
    // We don't await this - config file is optional enhancement
    this.loadConfigFileAsync().catch(() => {
      // Config file loading is optional
    });

    this.initialized = true;
    console.log('[ModelFactory] Initialized with', this.configCache.size, 'model configurations');
  }

  /**
   * Ensure initialization is complete (for async contexts)
   */
  async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeAsync();
    return this.initPromise;
  }

  /**
   * Async initialization including config file
   */
  private async initializeAsync(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load default models first
    this.loadDefaultModels();

    // Try to load config file
    await this.loadConfigFileAsync();

    // Apply environment variable overrides
    this.applyEnvOverrides();

    this.initialized = true;
    console.log('[ModelFactory] Initialized with', this.configCache.size, 'model configurations');
  }

  /**
   * Load default ANALYST_MODELS into cache
   */
  private loadDefaultModels(): void {
    for (const model of ANALYST_MODELS) {
      this.configCache.set(model.id, {
        ...model,
        priority: 'primary',
        enabled: true,
      });
    }
  }

  /**
   * Load configuration from model-config.json if it exists
   * Uses dynamic imports to support both Node.js and Edge runtimes
   */
  private async loadConfigFileAsync(): Promise<void> {
    // Only load config file in Node.js environment (not Edge runtime or browser)
    if (typeof window !== 'undefined' || typeof process === 'undefined') {
      return;
    }

    try {
      // Dynamic import to avoid Edge runtime issues
      const fs = await import('fs');
      const path = await import('path');

      const configPaths = [
        path.join(process.cwd(), 'model-config.json'),
        path.join(process.cwd(), '.model-config.json'),
        path.join(process.cwd(), 'config', 'models.json'),
      ];

      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          try {
            const content = fs.readFileSync(configPath, 'utf-8');
            this.configFile = JSON.parse(content);
            this.mergeConfigFile();
            console.log('[ModelFactory] Loaded config from', configPath);
            return;
          } catch (error) {
            console.warn('[ModelFactory] Failed to load config from', configPath, error);
          }
        }
      }
    } catch {
      // fs/path not available (Edge runtime) - this is expected
    }
  }

  /**
   * Merge config file settings into cache
   */
  private mergeConfigFile(): void {
    if (!this.configFile) return;

    for (const [modelId, config] of Object.entries(this.configFile.models)) {
      const existing = this.configCache.get(modelId);
      if (existing) {
        // Merge with existing config
        this.configCache.set(modelId, { ...existing, ...config });
      } else {
        // Add new model
        this.configCache.set(modelId, config);
      }
    }
  }

  /**
   * Apply environment variable overrides
   * Format: MODEL_<MODEL_ID>_<SETTING>=value
   * Examples:
   *   MODEL_DEEPSEEK_ENABLED=false
   *   MODEL_DEEPSEEK_BASE_URL=https://custom.endpoint.com
   *   MODEL_DEEPSEEK_MODEL=deepseek-chat-v2
   *   MODEL_DEEPSEEK_PRIORITY=secondary
   */
  private applyEnvOverrides(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (!key.startsWith(ENV_PREFIX)) continue;
      if (!value) continue;

      // Parse MODEL_<MODEL_ID>_<SETTING>
      const parts = key.substring(ENV_PREFIX.length).split('_');
      if (parts.length < 2) continue;

      const modelId = parts[0].toLowerCase();
      const setting = parts.slice(1).join('_').toLowerCase();

      const config = this.configCache.get(modelId);
      if (!config) {
        console.warn('[ModelFactory] Unknown model ID in env var:', modelId);
        continue;
      }

      // Apply the override based on setting type
      switch (setting) {
        case 'enabled':
          config.enabled = value === 'true' || value === '1';
          break;
        case 'base_url':
        case 'baseurl':
          config.baseUrl = value;
          break;
        case 'model':
          config.model = value;
          break;
        case 'api_key':
        case 'apikey':
          // API keys are handled separately via the original env vars
          break;
        case 'priority':
          config.priority = value as ModelPriority;
          break;
        case 'timeout':
          config.timeout = parseInt(value, 10);
          break;
        case 'provider':
          config.provider = value as ModelProvider;
          break;
        case 'max_tokens':
        case 'maxtokens':
          config.maxTokens = parseInt(value, 10);
          break;
        case 'cost_per_token':
        case 'costpertoken':
          config.costPerToken = parseFloat(value);
          break;
        case 'region':
          config.region = value;
          break;
        default:
          console.warn('[ModelFactory] Unknown setting:', setting);
      }

      console.log(`[ModelFactory] Applied env override: ${modelId}.${setting}=${value}`);
    }
  }

  /**
   * Get a model configuration by ID
   * @param modelId - The model identifier
   * @returns Model configuration or undefined if not found
   */
  getModel(modelId: string): DynamicModelConfig | undefined {
    if (!this.initialized) {
      this.initialize();
    }

    const config = this.configCache.get(modelId);
    if (!config) {
      console.warn('[ModelFactory] Model not found:', modelId);
      return undefined;
    }

    // Return a copy to prevent external mutations
    return { ...config };
  }

  /**
   * Get all enabled model configurations
   * @param priority - Optional priority filter
   * @returns Array of enabled model configs
   */
  getEnabledModels(priority?: ModelPriority): DynamicModelConfig[] {
    if (!this.initialized) {
      this.initialize();
    }

    let models = Array.from(this.configCache.values()).filter(m => m.enabled !== false);

    if (priority) {
      models = models.filter(m => m.priority === priority);
    }

    return models.map(m => ({ ...m }));
  }

  /**
   * Get models by provider
   * @param provider - The provider type
   * @returns Array of models from the specified provider
   */
  getModelsByProvider(provider: ModelProvider): DynamicModelConfig[] {
    if (!this.initialized) {
      this.initialize();
    }

    return Array.from(this.configCache.values())
      .filter(m => m.provider === provider && m.enabled !== false)
      .map(m => ({ ...m }));
  }

  /**
   * Get the best available model based on cost and availability
   * Used for cost optimization during token crisis
   * @param excludeModels - Model IDs to exclude (e.g., already failed)
   * @returns Best available model or undefined
   */
  getBestAvailableModel(excludeModels: string[] = []): DynamicModelConfig | undefined {
    if (!this.initialized) {
      this.initialize();
    }

    const available = Array.from(this.configCache.values())
      .filter(m => 
        m.enabled !== false &&
        !excludeModels.includes(m.id) &&
        this.hasApiKey(m)
      );

    if (available.length === 0) {
      return undefined;
    }

    // Sort by priority and cost
    const priorityOrder = { primary: 0, secondary: 1, fallback: 2, emergency: 3 };
    
    available.sort((a, b) => {
      const aPriority = a.priority || 'primary';
      const bPriority = b.priority || 'primary';
      const aOrder = priorityOrder[aPriority] ?? 99;
      const bOrder = priorityOrder[bPriority] ?? 99;
      const priorityDiff = aOrder - bOrder;
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, prefer lower cost
      const costA = a.costPerToken ?? Number.MAX_VALUE;
      const costB = b.costPerToken ?? Number.MAX_VALUE;
      return costA - costB;
    });

    return { ...available[0] };
  }

  /**
   * Get fallback chain for a model
   * @param modelId - The primary model ID
   * @returns Array of fallback model IDs in order
   */
  getFallbackChain(modelId: string): string[] {
    if (!this.initialized) {
      this.initialize();
    }

    // Check config file first
    if (this.configFile?.fallbackChains?.[modelId]) {
      return this.configFile.fallbackChains[modelId];
    }

    // Default fallback: all other models of same provider, then other providers
    const primaryModel = this.configCache.get(modelId);
    if (!primaryModel) {
      return [];
    }

    const sameProvider = Array.from(this.configCache.values())
      .filter(m => m.id !== modelId && m.provider === primaryModel.provider && m.enabled !== false)
      .map(m => m.id);

    const otherProviders = Array.from(this.configCache.values())
      .filter(m => m.id !== modelId && m.provider !== primaryModel.provider && m.enabled !== false)
      .map(m => m.id);

    return [...sameProvider, ...otherProviders];
  }

  /**
   * Check if a model has a valid API key configured
   * @param config - Model configuration
   * @returns true if API key is available
   */
  hasApiKey(config: DynamicModelConfig): boolean {
    const usingProxy = process.env.PROXY_ENABLED === 'true';
    if (usingProxy) {
      return true; // Proxy manages keys
    }

    const apiKey = process.env[config.apiKeyEnv];
    return !!apiKey;
  }

  /**
   * Validate a model configuration
   * @param config - Model configuration to validate
   * @returns Object with valid flag and errors array
   */
  validateConfig(config: DynamicModelConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!config.id) errors.push('Missing required field: id');
    if (!config.name) errors.push('Missing required field: name');
    if (!config.model) errors.push('Missing required field: model');
    if (!config.baseUrl) errors.push('Missing required field: baseUrl');
    if (!config.apiKeyEnv) errors.push('Missing required field: apiKeyEnv');
    if (!config.systemPrompt) errors.push('Missing required field: systemPrompt');

    // Provider validation
    const validProviders = ['openai', 'anthropic', 'google', 'custom'];
    if (!config.provider || !validProviders.includes(config.provider)) {
      errors.push(`Invalid provider: ${config.provider}. Must be one of: ${validProviders.join(', ')}`);
    }

    // Timeout validation
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout < 1000 || config.timeout > 300000) {
        errors.push('Invalid timeout: must be between 1000 and 300000 ms');
      }
    }

    // Max tokens validation
    if (config.maxTokens !== undefined) {
      if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
        errors.push('Invalid maxTokens: must be a positive number');
      }
    }

    // Cost validation
    if (config.costPerToken !== undefined) {
      if (typeof config.costPerToken !== 'number' || config.costPerToken < 0) {
        errors.push('Invalid costPerToken: must be a non-negative number');
      }
    }

    // Priority validation
    const validPriorities = ['primary', 'secondary', 'fallback', 'emergency'];
    if (config.priority && !validPriorities.includes(config.priority)) {
      errors.push(`Invalid priority: ${config.priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    // URL validation
    try {
      if (config.baseUrl) new URL(config.baseUrl);
    } catch {
      errors.push(`Invalid baseUrl: ${config.baseUrl}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate all model configurations
   * @returns Object with overall validity and per-model errors
   */
  validateAllConfigs(): { valid: boolean; modelErrors: Record<string, string[]> } {
    if (!this.initialized) {
      this.initialize();
    }

    const modelErrors: Record<string, string[]> = {};
    let overallValid = true;

    for (const [modelId, config] of this.configCache.entries()) {
      const result = this.validateConfig(config);
      if (!result.valid) {
        modelErrors[modelId] = result.errors;
        overallValid = false;
      }
    }

    return { valid: overallValid, modelErrors };
  }

  /**
   * Get model statistics for monitoring
   * @returns Statistics about configured models
   */
  getStatistics(): {
    totalModels: number;
    enabledModels: number;
    modelsByProvider: Record<string, number>;
    modelsByPriority: Record<string, number>;
  } {
    if (!this.initialized) {
      this.initialize();
    }

    const models = Array.from(this.configCache.values());
    const enabled = models.filter(m => m.enabled !== false);

    const byProvider: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const model of enabled) {
      byProvider[model.provider] = (byProvider[model.provider] || 0) + 1;
      const priority = model.priority || 'primary';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    }

    return {
      totalModels: models.length,
      enabledModels: enabled.length,
      modelsByProvider: byProvider,
      modelsByPriority: byPriority,
    };
  }

  /**
   * Enable or disable a model at runtime
   * @param modelId - Model to enable/disable
   * @param enabled - New enabled state
   */
  setModelEnabled(modelId: string, enabled: boolean): void {
    if (!this.initialized) {
      this.initialize();
    }

    const config = this.configCache.get(modelId);
    if (config) {
      config.enabled = enabled;
      console.log(`[ModelFactory] Model ${modelId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Update a model's priority at runtime
   * @param modelId - Model to update
   * @param priority - New priority level
   */
  setModelPriority(modelId: string, priority: ModelPriority): void {
    if (!this.initialized) {
      this.initialize();
    }

    const config = this.configCache.get(modelId);
    if (config) {
      config.priority = priority;
      console.log(`[ModelFactory] Model ${modelId} priority set to ${priority}`);
    }
  }

  /**
   * Reload configuration (for hot-reloading without restart)
   */
  reload(): void {
    this.initialized = false;
    this.configCache.clear();
    this.configFile = null;
    this.initPromise = null;
    this.initialize();
    console.log('[ModelFactory] Configuration reloaded');
  }
}

/**
 * Export singleton instance
 */
export const modelFactory = ModelFactory.getInstance();

/**
 * Convenience function to get a model config
 */
export function getModelConfig(modelId: string): DynamicModelConfig | undefined {
  return modelFactory.getModel(modelId);
}

/**
 * Convenience function to get all enabled models
 */
export function getAllEnabledModels(priority?: ModelPriority): DynamicModelConfig[] {
  return modelFactory.getEnabledModels(priority);
}

/**
 * Convenience function to get the best available model
 */
export function getBestAvailableModel(excludeModels?: string[]): DynamicModelConfig | undefined {
  return modelFactory.getBestAvailableModel(excludeModels);
}

/**
 * Validate all model configurations
 */
export function validateModelConfigs(): { valid: boolean; modelErrors: Record<string, string[]> } {
  return modelFactory.validateAllConfigs();
}

/**
 * Get model statistics
 */
export function getModelStatistics(): ReturnType<typeof modelFactory.getStatistics> {
  return modelFactory.getStatistics();
}
