/**
 * Dynamic Model Selection - Usage Examples
 * CVAULT-236: Infrastructure for dynamic model selection
 * 
 * This file demonstrates how to use the new model factory
 * for various scenarios including cost optimization and token crisis management.
 */

import {
  modelFactory,
  getModelConfig,
  getAllEnabledModels,
  getBestAvailableModel,
  validateModelConfigs,
  getModelStatistics,
} from './model-factory';
import type { DynamicModelConfig, ModelPriority } from './model-factory';

/**
 * Example 1: Basic Model Retrieval
 * 
 * Get a specific model configuration.
 */
export function example1_BasicModelRetrieval() {
  // Initialize the factory (usually done automatically)
  modelFactory.initialize();

  // Get a specific model
  const deepseek = getModelConfig('deepseek');
  if (deepseek) {
    console.log(`Model: ${deepseek.name}`);
    console.log(`Provider: ${deepseek.provider}`);
    console.log(`Priority: ${deepseek.priority}`);
    console.log(`Cost per 1K tokens: $${deepseek.costPerToken}`);
  }
}

/**
 * Example 2: Get All Enabled Models
 * 
 * Retrieve all models that are currently enabled.
 */
export function example2_GetAllEnabledModels() {
  // Get all enabled models
  const allModels = getAllEnabledModels();
  console.log(`Found ${allModels.length} enabled models`);

  // Get only primary models
  const primaryModels = getAllEnabledModels('primary');
  console.log(`Found ${primaryModels.length} primary models`);

  // Get fallback models
  const fallbackModels = getAllEnabledModels('fallback');
  console.log(`Found ${fallbackModels.length} fallback models`);
}

/**
 * Example 3: Cost-Optimized Model Selection
 * 
 * Automatically select the best available model based on cost and priority.
 * Useful for token crisis management.
 */
export async function example3_CostOptimizedSelection() {
  // Scenario: DeepSeek and Kimi have failed (quota limits)
  const failedModels = ['deepseek', 'kimi'];

  // Get the best available alternative
  const bestModel = getBestAvailableModel(failedModels);

  if (bestModel) {
    console.log(`Selected model: ${bestModel.name}`);
    console.log(`Priority: ${bestModel.priority}`);
    console.log(`Cost per 1K tokens: $${bestModel.costPerToken}`);

    // Use this model for analysis
    // const result = await callModel(bestModel, asset, context);
  } else {
    console.error('No models available!');
  }
}

/**
 * Example 4: Validate Configuration
 * 
 * Check if all model configurations are valid before deployment.
 */
export function example4_ValidateConfiguration() {
  const { valid, modelErrors } = validateModelConfigs();

  if (!valid) {
    console.error('Configuration errors found:');
    for (const [modelId, errors] of Object.entries(modelErrors)) {
      console.error(`\n${modelId}:`);
      for (const error of errors) {
        console.error(`  - ${error}`);
      }
    }
    process.exit(1);
  }

  console.log('✓ All configurations are valid');
}

/**
 * Example 5: Get Model Statistics
 * 
 * Retrieve statistics about configured models for monitoring.
 */
export function example5_GetStatistics() {
  const stats = getModelStatistics();

  console.log('Model Statistics:');
  console.log(`  Total models: ${stats.totalModels}`);
  console.log(`  Enabled models: ${stats.enabledModels}`);
  console.log(`  By provider:`, stats.modelsByProvider);
  console.log(`  By priority:`, stats.modelsByPriority);

  // Calculate potential cost savings
  const primaryCosts = Object.entries(stats.modelsByProvider)
    .filter(([provider]) => provider === 'openai')
    .reduce((sum, [, count]) => sum + count, 0);

  console.log(`\nEstimated primary models: ${primaryCosts}`);
}

/**
 * Example 6: Runtime Model Management
 * 
 * Enable/disable models at runtime for dynamic load balancing.
 */
export function example6_RuntimeModelManagement() {
  // Disable a model that's hitting rate limits
  modelFactory.setModelEnabled('deepseek', false);
  console.log('DeepSeek disabled due to rate limits');

  // Promote a fallback model to primary
  modelFactory.setModelPriority('gemini', 'primary');
  console.log('Gemini promoted to primary priority');

  // Reload configuration (picks up file/env changes)
  modelFactory.reload();
  console.log('Configuration reloaded');
}

/**
 * Example 7: Token Crisis Management
 * 
 * Handle token quota exhaustion by switching to cheaper models.
 */
export async function example7_TokenCrisisManagement() {
  // Scenario: Primary models are out of quota
  const quotaExhausted = ['deepseek', 'kimi'];

  // Get fallback models
  const availableModels = getAllEnabledModels()
    .filter(m => !quotaExhausted.includes(m.id));

  // Sort by cost (cheapest first)
  availableModels.sort((a, b) => 
    (a.costPerToken ?? Number.MAX_VALUE) - (b.costPerToken ?? Number.MAX_VALUE)
  );

  if (availableModels.length > 0) {
    const cheapestModel = availableModels[0];
    console.log(`Using cheapest available model: ${cheapestModel.name}`);
    console.log(`Cost: $${cheapestModel.costPerToken} per 1K tokens`);

    // Use this model instead
    // const result = await callModel(cheapestModel, asset, context);
  }
}

/**
 * Example 8: A/B Testing
 * 
 * Compare different models by enabling/disabling them.
 */
export async function example8_ABTesting() {
  // Test configuration A: Use only DeepSeek
  console.log('Testing Configuration A (DeepSeek only)');
  modelFactory.setModelEnabled('deepseek', true);
  modelFactory.setModelEnabled('kimi', false);
  modelFactory.setModelEnabled('minimax', false);
  modelFactory.setModelEnabled('glm', false);
  modelFactory.setModelEnabled('gemini', false);

  // Run analysis with Configuration A
  // const resultsA = await runConsensusAnalysis(asset, context);

  // Test configuration B: Use only Kimi
  console.log('Testing Configuration B (Kimi only)');
  modelFactory.setModelEnabled('deepseek', false);
  modelFactory.setModelEnabled('kimi', true);

  // Run analysis with Configuration B
  // const resultsB = await runConsensusAnalysis(asset, context);

  // Compare results
  // console.log('Config A consensus:', resultsA.consensus);
  // console.log('Config B consensus:', resultsB.consensus);
}

/**
 * Example 9: Fallback Chain Management
 * 
 * Get and use fallback chains for resilient model selection.
 */
export function example9_FallbackChainManagement() {
  // Get fallback chain for a model
  const chain = modelFactory.getFallbackChain('deepseek');
  console.log('Fallback chain for deepseek:', chain);

  // Simulate trying each model in the chain
  for (const fallbackId of chain) {
    const fallbackModel = getModelConfig(fallbackId);
    if (fallbackModel && modelFactory.hasApiKey(fallbackModel)) {
      console.log(`Trying fallback: ${fallbackModel.name}`);
      
      // Try to use this model
      // const result = await callModel(fallbackModel, asset, context);
      // if (result.success) break;
    }
  }
}

/**
 * Example 10: Environment-Based Configuration
 * 
 * Demonstrate how environment variables override defaults.
 */
export function example10_EnvironmentOverrides() {
  // These can be set via environment variables:
  //
  // export MODEL_DEEPSEEK_ENABLED=false
  // export MODEL_DEEPSEEK_PRIORITY=fallback
  // export MODEL_DEEPSEEK_MODEL=deepseek-chat-v2
  //
  // The factory automatically picks up these overrides

  modelFactory.reload(); // Reload to pick up env changes

  const deepseek = getModelConfig('deepseek');
  console.log('DeepSeek config after env override:');
  console.log(`  Enabled: ${deepseek?.enabled}`);
  console.log(`  Priority: ${deepseek?.priority}`);
  console.log(`  Model: ${deepseek?.model}`);
}

/**
 * Example 11: Integration with Consensus Engine
 * 
 * Use the model factory within the consensus engine for dynamic selection.
 */
export async function example11_ConsensusEngineIntegration() {
  const asset = 'BTC';
  const context = 'Recent price surge';

  // Get all enabled models
  const models = getAllEnabledModels();

  // Filter models based on criteria
  const availableModels = models.filter(m => {
    // Must have API key
    if (!modelFactory.hasApiKey(m)) return false;

    // Must be enabled
    if (m.enabled === false) return false;

    // Optional: Priority filter
    // return m.priority === 'primary';

    return true;
  });

  console.log(`Using ${availableModels.length} models for consensus`);

  // Run consensus with filtered models
  // const results = await runConsensusAnalysis(asset, context);
}

/**
 * Example 12: Cost Monitoring
 * 
 * Track and optimize costs across all models.
 */
export function example12_CostMonitoring() {
  const models = getAllEnabledModels();

  let totalCostPer1K = 0;
  const costBreakdown: Record<string, number> = {};

  for (const model of models) {
    const cost = model.costPerToken || 0;
    totalCostPer1K += cost;
    costBreakdown[model.id] = cost;
  }

  console.log('Cost Analysis (per 1K tokens):');
  console.log(`  Total: $${totalCostPer1K.toFixed(4)}`);
  console.log('  Breakdown:', costBreakdown);

  // Identify most expensive model
  const mostExpensive = models.reduce((max, m) => 
    (m.costPerToken || 0) > (max.costPerToken || 0) ? m : max
  );

  console.log(`\nMost expensive: ${mostExpensive.name} ($${mostExpensive.costPerToken}/1K)`);

  // Identify cheapest model
  const cheapest = models.reduce((min, m) => 
    (m.costPerToken || Number.MAX_VALUE) < (min.costPerToken || Number.MAX_VALUE) ? m : min
  );

  console.log(`Cheapest: ${cheapest.name} ($${cheapest.costPerToken}/1K)`);
}

/**
 * Example 13: Regional Deployment
 * 
 * Configure models for different geographic regions.
 */
export function example13_RegionalDeployment() {
  // Get models for specific region
  const models = getAllEnabledModels();
  const euModels = models.filter(m => m.region === 'eu');

  if (euModels.length > 0) {
    console.log(`Using ${euModels.length} EU-region models for GDPR compliance`);
    // Use EU models for European users
  } else {
    console.log('No EU-specific models configured, using defaults');
  }
}

/**
 * Example 14: Health Check Integration
 * 
 * Use model factory for health monitoring endpoints.
 */
export function example14_HealthCheck() {
  const stats = getModelStatistics();
  const validation = validateModelConfigs();

  const health = {
    status: validation.valid ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    statistics: stats,
    validation: validation,
  };

  return health;
}

// Export all examples for testing
export const examples = {
  example1_BasicModelRetrieval,
  example2_GetAllEnabledModels,
  example3_CostOptimizedSelection,
  example4_ValidateConfiguration,
  example5_GetStatistics,
  example6_RuntimeModelManagement,
  example7_TokenCrisisManagement,
  example8_ABTesting,
  example9_FallbackChainManagement,
  example10_EnvironmentOverrides,
  example11_ConsensusEngineIntegration,
  example12_CostMonitoring,
  example13_RegionalDeployment,
  example14_HealthCheck,
};
