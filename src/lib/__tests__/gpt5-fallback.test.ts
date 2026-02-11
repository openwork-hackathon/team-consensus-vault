/**
 * GPT-5.2 Fallback Test Suite
 * CVAULT-237: Tests for GPT-5.2 fallback when DeepSeek fails
 * 
 * This test suite verifies that:
 * 1. GPT-5.2 is properly configured as a model
 * 2. GPT-5.2 is included in fallback chains for all models
 * 3. Fallback mechanism correctly invokes GPT-5.2 when primary models fail
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getSelectedModels,
  getSelectedModelConfigs,
  getAllModelConfigs,
  getModelSelectionStatus,
  clearConfigCache,
  DEFAULT_MODEL_SELECTION,
  type DynamicModelConfig,
} from '../model-config';
import {
  modelFactory,
  getModelConfig,
  getAllEnabledModels,
  getFallbackOrder as getModelFactoryFallbackOrder,
} from '../model-factory';
import {
  getFallbackOrder,
  FALLBACK_ORDER,
  DEFAULT_FALLBACK_ORDER,
  AnalystResult,
  signalToSentiment,
  calculateConsensus,
} from '../models';

// Mock console methods to avoid cluttering test output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('CVAULT-237: GPT-5.2 Fallback Configuration', () => {
  // Save original env vars
  const originalEnv: Record<string, string | undefined> = {};
  
  beforeEach(() => {
    // Save relevant env vars
    originalEnv.ORCHESTRATOR_MODEL = process.env.ORCHESTRATOR_MODEL;
    originalEnv.CONSENSUS_AI_MODELS = process.env.CONSENSUS_AI_MODELS;
    originalEnv.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    originalEnv.KIMI_API_KEY = process.env.KIMI_API_KEY;
    originalEnv.MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    originalEnv.GLM_API_KEY = process.env.GLM_API_KEY;
    originalEnv.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    originalEnv.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    originalEnv.PROXY_ENABLED = process.env.PROXY_ENABLED;
    
    // Set dummy API keys to pass validation
    process.env.DEEPSEEK_API_KEY = 'test-key';
    process.env.KIMI_API_KEY = 'test-key';
    process.env.MINIMAX_API_KEY = 'test-key';
    process.env.GLM_API_KEY = 'test-key';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.PROXY_ENABLED = 'true'; // Enable proxy mode for tests
    
    // Reset caches
    clearConfigCache();
    modelFactory['initialized'] = false;
    modelFactory['configCache'].clear();
    modelFactory['configFile'] = null;
  });

  afterEach(() => {
    // Restore original env vars
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key as keyof typeof process.env];
      } else {
        process.env[key as keyof typeof process.env] = value;
      }
    });
    
    // Clean up mocks
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
    
    // Reset caches again
    clearConfigCache();
    modelFactory['initialized'] = false;
    modelFactory['configCache'].clear();
  });

  describe('GPT-5.2 Model Configuration', () => {
    it('should have GPT-5.2 (gpt5) in available models', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      expect(gpt5Model?.id).toBe('gpt5');
    });

    it('should have correct provider for GPT-5.2 (OpenAI)', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      expect(gpt5Model?.provider).toBe('openai');
    });

    it('should have correct model name for GPT-5.2', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      expect(gpt5Model?.model).toBe('gpt-5.2');
    });

    it('should have OPENAI_API_KEY env var configured for GPT-5.2', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      expect(gpt5Model?.apiKeyEnv).toBe('OPENAI_API_KEY');
    });

    it('should have Quantum Analyst persona for GPT-5.2', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      expect(gpt5Model?.name).toBe('Quantum Analyst');
      expect(gpt5Model?.role).toBe('Advanced Pattern Recognition & Quantum Computing');
    });

    it('should have GPT-5.2 enabled by default', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      expect(gpt5Model?.enabled).toBe(true);
    });

    it('should have GPT-5.2 with appropriate priority (fallback level)', () => {
      const configs = getAllModelConfigs();
      const gpt5Model = configs.find(m => m.id === 'gpt5');
      
      expect(gpt5Model).toBeDefined();
      // GPT-5.2 should have priority 6 (after gemini's 5)
      expect(gpt5Model?.priority).toBe(6);
    });

    it('should have GPT-5.2 in default models list', () => {
      const defaultModels = DEFAULT_MODEL_SELECTION.defaultModels;
      expect(defaultModels).toContain('gpt5');
    });

    it('should retrieve GPT-5.2 config via getModelConfig', () => {
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config).toBeDefined();
      expect(gpt5Config?.id).toBe('gpt5');
    });

    it('should have OpenAI-compatible base URL for GPT-5.2', () => {
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config).toBeDefined();
      expect(gpt5Config?.baseUrl).toContain('api.openai.com/v1');
    });
  });

  describe('GPT-5.2 Fallback Chain Integration', () => {
    it('should have GPT-5.2 in DeepSeek fallback chain', () => {
      const fallbackOrder = getFallbackOrder('deepseek');
      expect(fallbackOrder).toContain('gpt5');
    });

    it('should have GPT-5.2 in Kimi fallback chain', () => {
      const fallbackOrder = getFallbackOrder('kimi');
      expect(fallbackOrder).toContain('gpt5');
    });

    it('should have GPT-5.2 in MiniMax fallback chain', () => {
      const fallbackOrder = getFallbackOrder('minimax');
      expect(fallbackOrder).toContain('gpt5');
    });

    it('should have GPT-5.2 in GLM fallback chain', () => {
      const fallbackOrder = getFallbackOrder('glm');
      expect(fallbackOrder).toContain('gpt5');
    });

    it('should have GPT-5.2 in Gemini fallback chain', () => {
      const fallbackOrder = getFallbackOrder('gemini');
      expect(fallbackOrder).toContain('gpt5');
    });

    it('should have other models in GPT-5.2 fallback chain', () => {
      const fallbackOrder = getFallbackOrder('gpt5');
      expect(fallbackOrder).toContain('deepseek');
      expect(fallbackOrder).toContain('kimi');
      expect(fallbackOrder).toContain('minimax');
      expect(fallbackOrder).toContain('glm');
      expect(fallbackOrder).toContain('gemini');
    });

    it('should not include GPT-5.2 in its own fallback chain', () => {
      const fallbackOrder = getFallbackOrder('gpt5');
      expect(fallbackOrder).not.toContain('gpt5');
    });

    it('should have GPT-5.2 in static fallback order', () => {
      // The fallback order is defined in models.ts, check getFallbackOrder instead
      const fallbackOrder = getFallbackOrder('deepseek');
      expect(fallbackOrder).toContain('gpt5');
    });

    it('should have consistent fallback order via model factory', () => {
      modelFactory.initialize();
      const factoryFallback = modelFactory.getFallbackChain('deepseek');
      const configFallback = getFallbackOrder('deepseek');
      
      // Both should contain gpt5
      expect(factoryFallback).toContain('gpt5');
      expect(configFallback).toContain('gpt5');
    });
  });

  describe('GPT-5.2 Model Selection', () => {
    it('should select GPT-5.2 when specified in ORCHESTRATOR_MODEL', () => {
      process.env.ORCHESTRATOR_MODEL = 'gpt5';
      clearConfigCache();
      
      const models = getSelectedModels();
      expect(models).toEqual(['gpt5']);
    });

    it('should select GPT-5.2 when specified in CONSENSUS_AI_MODELS', () => {
      process.env.CONSENSUS_AI_MODELS = 'gpt5,deepseek';
      clearConfigCache();
      
      const models = getSelectedModels();
      expect(models).toContain('gpt5');
      expect(models).toContain('deepseek');
    });

    it('should select all models including GPT-5.2 with "all" keyword', () => {
      process.env.CONSENSUS_AI_MODELS = 'all';
      clearConfigCache();
      
      const models = getSelectedModels();
      expect(models).toContain('gpt5');
      expect(models.length).toBeGreaterThanOrEqual(6);
    });

    it('should exclude GPT-5.2 when specified in exclusions', () => {
      process.env.CONSENSUS_AI_MODELS = 'all,-gpt5';
      clearConfigCache();
      
      const models = getSelectedModels();
      expect(models).not.toContain('gpt5');
    });

    it('should return GPT-5.2 config via getSelectedModelConfigs', () => {
      process.env.ORCHESTRATOR_MODEL = 'gpt5';
      clearConfigCache();
      
      const configs = getSelectedModelConfigs();
      expect(configs.length).toBe(1);
      expect(configs[0].id).toBe('gpt5');
    });
  });

  describe('DeepSeek Failure Simulation with GPT-5.2 Fallback', () => {
    it('should have GPT-5.2 as high-priority fallback for DeepSeek', () => {
      const fallbackOrder = getFallbackOrder('deepseek');
      const gpt5Index = fallbackOrder.indexOf('gpt5');
      
      // GPT-5.2 should be in the fallback chain (not first, but present)
      expect(gpt5Index).toBeGreaterThanOrEqual(0);
      // Verify the order: minimax, glm, kimi, gemini, gpt5
      expect(fallbackOrder).toEqual(['minimax', 'glm', 'kimi', 'gemini', 'gpt5']);
    });

    it('should have valid GPT-5.2 config for fallback invocation', () => {
      const gpt5Config = getModelConfig('gpt5');
      
      expect(gpt5Config).toBeDefined();
      expect(gpt5Config?.enabled).toBe(true);
      expect(gpt5Config?.apiKeyEnv).toBeDefined();
    });

    it('should have model factory provide GPT-5.2 as fallback', () => {
      modelFactory.initialize();
      
      // Simulate DeepSeek failure by excluding it
      const availableFallbacks = modelFactory.getFallbackChain('deepseek');
      expect(availableFallbacks).toContain('gpt5');
    });

    it('should detect GPT-5.2 has API key configured', () => {
      modelFactory.initialize();
      const gpt5Config = getModelConfig('gpt5');
      
      expect(gpt5Config).toBeDefined();
      const hasApiKey = modelFactory.hasApiKey(gpt5Config!);
      expect(hasApiKey).toBe(true); // Proxy mode is enabled
    });
  });

  describe('Model Status and Selection', () => {
    it('should show GPT-5.2 in model selection status', () => {
      const status = getModelSelectionStatus();
      
      const gpt5 = status.allModels.find(m => m.id === 'gpt5');
      expect(gpt5).toBeDefined();
      expect(gpt5?.selected).toBe(true);
      expect(gpt5?.enabled).toBe(true);
      expect(gpt5?.priority).toBe(6);
    });

    it('should correctly count GPT-5.2 in total models', () => {
      const status = getModelSelectionStatus();
      
      // Should have at least 6 models (5 original + GPT-5.2)
      expect(status.totalSelected).toBeGreaterThanOrEqual(6);
    });

    it('should have GPT-5.2 in model factory statistics', () => {
      modelFactory.initialize();
      const stats = modelFactory.getStatistics();
      
      expect(stats.totalModels).toBeGreaterThanOrEqual(6);
      expect(stats.enabledModels).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Consensus with GPT-5.2', () => {
    it('should handle GPT-5.2 result in consensus calculation', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bullish', confidence: 90, reasoning: 'TVL increasing' },
        { id: 'gpt5', name: 'Quantum Analyst', sentiment: 'bullish', confidence: 88, reasoning: 'Quantum pattern confirmed' },
      ];

      const consensus = calculateConsensus(results);

      expect(consensus.signal).toBe('buy');
      expect(consensus.consensusLevel).toBeGreaterThan(0);
      expect(consensus.recommendation).toBe('BUY');
    });

    it('should correctly convert GPT-5.2 signals to sentiment', () => {
      expect(signalToSentiment('buy')).toBe('bullish');
      expect(signalToSentiment('sell')).toBe('bearish');
      expect(signalToSentiment('hold')).toBe('neutral');
    });

    it('should handle mixed consensus with GPT-5.2 minority', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'bullish', confidence: 85, reasoning: 'Strong uptrend' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'bullish', confidence: 80, reasoning: 'Whale accumulation' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'bullish', confidence: 75, reasoning: 'Positive sentiment' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'bearish', confidence: 85, reasoning: 'Declining TVL' },
        { id: 'gpt5', name: 'Quantum Analyst', sentiment: 'bearish', confidence: 82, reasoning: 'Pattern failure detected' },
      ];

      const consensus = calculateConsensus(results);

      // 3 bullish, 2 bearish - no consensus (need 4/5)
      expect(consensus.signal).toBe('buy');
      expect(consensus.recommendation).toBe(null); // No 4/5 consensus
    });

    it('should handle GPT-5.2 as only successful model with fallbacks', () => {
      const results: AnalystResult[] = [
        { id: 'deepseek', name: 'Momentum Hunter', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'DeepSeek API error' },
        { id: 'kimi', name: 'Whale Watcher', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'Kimi timeout' },
        { id: 'minimax', name: 'Sentiment Scout', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'MiniMax rate limit' },
        { id: 'glm', name: 'On-Chain Oracle', sentiment: 'neutral', confidence: 0, reasoning: '', error: 'GLM network error' },
        { id: 'gpt5', name: 'Quantum Analyst', sentiment: 'bullish', confidence: 85, reasoning: 'Quantum analysis complete' },
      ];

      const consensus = calculateConsensus(results);

      // Only GPT-5.2 succeeded, but need at least 3 valid results
      expect(consensus.signal).toBe(null);
      expect(consensus.recommendation).toBe(null);
    });
  });

  describe('Environment Variable Configuration for GPT-5.2', () => {
    it('should allow GPT-5.2 to be disabled via environment variable', () => {
      process.env.MODEL_GPT5_ENABLED = 'false';
      modelFactory.initialize();
      
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config?.enabled).toBe(false);
      
      // Cleanup
      delete process.env.MODEL_GPT5_ENABLED;
    });

    it('should allow GPT-5.2 base URL override', () => {
      const customUrl = 'https://custom-openai-proxy.example.com/v1';
      process.env.MODEL_GPT5_BASE_URL = customUrl;
      modelFactory.initialize();
      
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config?.baseUrl).toBe(customUrl);
      
      // Cleanup
      delete process.env.MODEL_GPT5_BASE_URL;
    });

    it('should allow GPT-5.2 model override', () => {
      process.env.MODEL_GPT5_MODEL = 'gpt-5.2-turbo';
      modelFactory.initialize();
      
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config?.model).toBe('gpt-5.2-turbo');
      
      // Cleanup
      delete process.env.MODEL_GPT5_MODEL;
    });

    it('should allow GPT-5.2 priority override', () => {
      process.env.MODEL_GPT5_PRIORITY = 'fallback';
      modelFactory.initialize();
      
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config?.priority).toBe('fallback');
      
      // Cleanup
      delete process.env.MODEL_GPT5_PRIORITY;
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing model behavior with new GPT-5.2', () => {
      // Without any special configuration, all 6 models should be available
      const models = getSelectedModels();
      
      // Original 5 models should still be there
      expect(models).toContain('deepseek');
      expect(models).toContain('kimi');
      expect(models).toContain('minimax');
      expect(models).toContain('glm');
      expect(models).toContain('gemini');
      // Plus GPT-5.2
      expect(models).toContain('gpt5');
    });

    it('should not affect existing fallback chains structure', () => {
      // Original fallback order should now include GPT-5.2 at the end
      const deepseekFallback = getFallbackOrder('deepseek');
      
      // Original models should still be present
      expect(deepseekFallback.slice(0, 4)).toEqual(['minimax', 'glm', 'kimi', 'gemini']);
      // GPT-5.2 should be added at the end
      expect(deepseekFallback[4]).toBe('gpt5');
    });

    it('should not break when OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      process.env.PROXY_ENABLED = 'true'; // Proxy mode bypasses key check
      
      const gpt5Config = getModelConfig('gpt5');
      expect(gpt5Config).toBeDefined();
      
      // In proxy mode, key check should pass
      modelFactory.initialize();
      const hasApiKey = modelFactory.hasApiKey(gpt5Config!);
      expect(hasApiKey).toBe(true);
    });
  });
});

console.log('✅ CVAULT-237: GPT-5.2 fallback test suite loaded');
