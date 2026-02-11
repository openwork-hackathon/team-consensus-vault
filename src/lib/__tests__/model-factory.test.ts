/**
 * Model Factory Tests
 * CVAULT-236: Dynamic Model Selection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  modelFactory,
  getModelConfig,
  getAllEnabledModels,
  getBestAvailableModel,
  validateModelConfigs,
  getModelStatistics,
  type DynamicModelConfig,
  type ModelPriority,
} from '../model-factory';

describe('ModelFactory', () => {
  beforeEach(() => {
    // Reset factory state before each test
    modelFactory['initialized'] = false;
    modelFactory['configCache'].clear();
    modelFactory['configFile'] = null;
  });

  describe('Initialization', () => {
    it('should initialize with default models', () => {
      modelFactory.initialize();
      
      const stats = getModelStatistics();
      expect(stats.totalModels).toBeGreaterThan(0);
      expect(stats.enabledModels).toBeGreaterThan(0);
    });

    it('should load default ANALYST_MODELS', () => {
      modelFactory.initialize();
      
      const deepseek = getModelConfig('deepseek');
      expect(deepseek).toBeDefined();
      expect(deepseek?.name).toBe('Momentum Hunter');
      expect(deepseek?.provider).toBe('openai');
    });

    it('should be idempotent - multiple initializes are safe', () => {
      modelFactory.initialize();
      const stats1 = getModelStatistics();
      
      modelFactory.initialize();
      const stats2 = getModelStatistics();
      
      expect(stats1.totalModels).toBe(stats2.totalModels);
    });
  });

  describe('Model Retrieval', () => {
    beforeEach(() => {
      modelFactory.initialize();
    });

    it('should get a specific model by ID', () => {
      const model = getModelConfig('deepseek');
      expect(model).toBeDefined();
      expect(model?.id).toBe('deepseek');
    });

    it('should return undefined for unknown model', () => {
      const model = getModelConfig('unknown-model');
      expect(model).toBeUndefined();
    });

    it('should return a copy of the config (prevent mutations)', () => {
      const model1 = getModelConfig('deepseek');
      const model2 = getModelConfig('deepseek');
      
      expect(model1).toEqual(model2);
      expect(model1).not.toBe(model2); // Different references
    });
  });

  describe('Enabled Models', () => {
    beforeEach(() => {
      modelFactory.initialize();
    });

    it('should get all enabled models', () => {
      const models = getAllEnabledModels();
      expect(models.length).toBeGreaterThan(0);
      
      for (const model of models) {
        expect(model.enabled).not.toBe(false);
      }
    });

    it('should filter by priority', () => {
      const primaryModels = getAllEnabledModels('primary');
      const secondaryModels = getAllEnabledModels('secondary');
      
      for (const model of primaryModels) {
        expect(model.priority).toBe('primary');
      }
      
      for (const model of secondaryModels) {
        expect(model.priority).toBe('secondary');
      }
    });

    it('should return empty array for unknown priority', () => {
      const models = getAllEnabledModels('unknown' as ModelPriority);
      expect(models).toEqual([]);
    });
  });

  describe('Best Available Model', () => {
    beforeEach(() => {
      modelFactory.initialize();
      // Mock proxy mode so tests don't require actual API keys
      process.env.PROXY_ENABLED = 'true';
    });

    afterEach(() => {
      // Clean up proxy mode
      delete process.env.PROXY_ENABLED;
    });

    it('should return a model when available', () => {
      const best = getBestAvailableModel();
      expect(best).toBeDefined();
    });

    it('should respect exclusion list', () => {
      const best1 = getBestAvailableModel();
      const best2 = getBestAvailableModel([best1?.id || '']);
      
      if (best2) {
        expect(best2.id).not.toBe(best1?.id);
      }
    });

    it('should prioritize by priority level', () => {
      // Set all models to emergency first (directly in cache)
      const allModels = getAllEnabledModels();
      allModels.forEach(m => {
        modelFactory.setModelPriority(m.id, 'emergency');
      });
      
      // Set one model to primary
      modelFactory.setModelPriority('deepseek', 'primary');
      
      const best = getBestAvailableModel();
      
      // Should return the primary model
      expect(best).toBeDefined();
      expect(best?.priority).toBe('primary');
      expect(best?.id).toBe('deepseek');
      
      // Reset priorities for cleanup
      allModels.forEach(m => {
        modelFactory.setModelPriority(m.id, 'primary');
      });
    });

    it('should return undefined when all models excluded', () => {
      const allModels = getAllEnabledModels();
      const allIds = allModels.map(m => m.id);
      
      const best = getBestAvailableModel(allIds);
      expect(best).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate all configurations', () => {
      modelFactory.initialize();
      
      const result = validateModelConfigs();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('modelErrors');
    });

    it('should detect missing required fields', () => {
      const invalidConfig = {
        id: 'test',
        // Missing required fields
      } as DynamicModelConfig;

      const factory = modelFactory as any;
      const result = factory.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid provider', () => {
      const invalidConfig = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        baseUrl: 'https://api.test.com',
        apiKeyEnv: 'TEST_API_KEY',
        model: 'test-model',
        provider: 'invalid' as any,
        timeout: 30000,
        systemPrompt: 'Test prompt',
      };

      const factory = modelFactory as any;
      const result = factory.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid provider'))).toBe(true);
    });

    it('should detect invalid timeout', () => {
      const invalidConfig = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        baseUrl: 'https://api.test.com',
        apiKeyEnv: 'TEST_API_KEY',
        model: 'test-model',
        provider: 'openai' as const,
        timeout: 999, // Too low
        systemPrompt: 'Test prompt',
      };

      const factory = modelFactory as any;
      const result = factory.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('timeout'))).toBe(true);
    });

    it('should detect invalid URL', () => {
      const invalidConfig = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        baseUrl: 'not-a-valid-url',
        apiKeyEnv: 'TEST_API_KEY',
        model: 'test-model',
        provider: 'openai' as const,
        timeout: 30000,
        systemPrompt: 'Test prompt',
      };

      const factory = modelFactory as any;
      const result = factory.validateConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('baseUrl'))).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      modelFactory.initialize();
    });

    it('should return model statistics', () => {
      const stats = getModelStatistics();
      
      expect(stats).toHaveProperty('totalModels');
      expect(stats).toHaveProperty('enabledModels');
      expect(stats).toHaveProperty('modelsByProvider');
      expect(stats).toHaveProperty('modelsByPriority');
    });

    it('should count models correctly', () => {
      const stats = getModelStatistics();
      
      expect(stats.totalModels).toBeGreaterThan(0);
      expect(stats.enabledModels).toBeGreaterThan(0);
      expect(stats.enabledModels).toBeLessThanOrEqual(stats.totalModels);
    });

    it('should categorize by provider', () => {
      const stats = getModelStatistics();
      
      expect(Object.keys(stats.modelsByProvider).length).toBeGreaterThan(0);
      
      let totalByProvider = 0;
      for (const count of Object.values(stats.modelsByProvider)) {
        totalByProvider += count;
      }
      
      expect(totalByProvider).toBe(stats.enabledModels);
    });

    it('should categorize by priority', () => {
      const stats = getModelStatistics();
      
      expect(Object.keys(stats.modelsByPriority).length).toBeGreaterThan(0);
    });
  });

  describe('Runtime Model Management', () => {
    beforeEach(() => {
      modelFactory.initialize();
    });

    it('should enable and disable models', () => {
      const model = getModelConfig('deepseek');
      expect(model?.enabled).not.toBe(false);
      
      modelFactory.setModelEnabled('deepseek', false);
      
      const disabled = getModelConfig('deepseek');
      expect(disabled?.enabled).toBe(false);
      
      // Re-enable for cleanup
      modelFactory.setModelEnabled('deepseek', true);
    });

    it('should change model priority', () => {
      modelFactory.setModelPriority('deepseek', 'emergency');
      
      const model = getModelConfig('deepseek');
      expect(model?.priority).toBe('emergency');
      
      // Reset for cleanup
      modelFactory.setModelPriority('deepseek', 'primary');
    });

    it('should reload configuration', () => {
      const stats1 = getModelStatistics();
      
      modelFactory.reload();
      
      const stats2 = getModelStatistics();
      expect(stats2.totalModels).toBe(stats1.totalModels);
    });
  });

  describe('Fallback Chains', () => {
    beforeEach(() => {
      modelFactory.initialize();
    });

    it('should return fallback chain for a model', () => {
      const chain = modelFactory.getFallbackChain('deepseek');
      expect(Array.isArray(chain)).toBe(true);
    });

    it('should not include the model itself in its chain', () => {
      const chain = modelFactory.getFallbackChain('deepseek');
      expect(chain).not.toContain('deepseek');
    });

    it('should return empty array for unknown model', () => {
      const chain = modelFactory.getFallbackChain('unknown-model');
      expect(chain).toEqual([]);
    });
  });

  describe('API Key Checking', () => {
    beforeEach(() => {
      modelFactory.initialize();
    });

    it('should check if model has API key', () => {
      const model = getModelConfig('deepseek');
      expect(model).toBeDefined();
      
      const hasKey = modelFactory.hasApiKey(model!);
      expect(typeof hasKey).toBe('boolean');
    });

    it('should return true when proxy is enabled', () => {
      // Mock proxy enabled
      const originalProxy = process.env.PROXY_ENABLED;
      process.env.PROXY_ENABLED = 'true';
      
      const model = getModelConfig('deepseek');
      const hasKey = modelFactory.hasApiKey(model!);
      expect(hasKey).toBe(true);
      
      // Restore
      if (originalProxy === undefined) {
        delete process.env.PROXY_ENABLED;
      } else {
        process.env.PROXY_ENABLED = originalProxy;
      }
    });
  });

  describe('Environment Variable Overrides', () => {
    it('should apply MODEL_* environment variables', () => {
      // Set test env vars
      process.env.MODEL_DEEPSEEK_ENABLED = 'false';
      process.env.MODEL_DEEPSEEK_PRIORITY = 'emergency';
      
      modelFactory.initialize();
      
      const model = getModelConfig('deepseek');
      expect(model?.enabled).toBe(false);
      expect(model?.priority).toBe('emergency');
      
      // Cleanup
      delete process.env.MODEL_DEEPSEEK_ENABLED;
      delete process.env.MODEL_DEEPSEEK_PRIORITY;
    });

    it('should handle MODEL_*_BASE_URL override', () => {
      const customUrl = 'https://custom.endpoint.com/v1';
      process.env[`MODEL_DEEPSEEK_BASE_URL`] = customUrl;
      
      modelFactory.initialize();
      
      const model = getModelConfig('deepseek');
      expect(model?.baseUrl).toBe(customUrl);
      
      // Cleanup
      delete process.env.MODEL_DEEPSEEK_BASE_URL;
    });

    it('should handle MODEL_*_MODEL override', () => {
      const customModel = 'deepseek-chat-v2';
      process.env[`MODEL_DEEPSEEK_MODEL`] = customModel;
      
      modelFactory.initialize();
      
      const model = getModelConfig('deepseek');
      expect(model?.model).toBe(customModel);
      
      // Cleanup
      delete process.env.MODEL_DEEPSEEK_MODEL;
    });
  });
});
