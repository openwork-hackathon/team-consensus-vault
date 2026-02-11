/**
 * Model Health Check API
 * CVAULT-236: Dynamic Model Selection
 * 
 * Provides health status and configuration validation for all models.
 * Useful for monitoring, debugging, and deployment verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { modelFactory, getModelStatistics, validateModelConfigs } from '@/lib/model-factory';
import { ANALYST_MODELS } from '@/lib/models';

/**
 * GET /api/health/models
 * 
 * Returns comprehensive health status for all configured models.
 * 
 * Query Parameters:
 * - validate=true: Perform full validation (slower)
 * - includeDefaults=true: Include default model configurations
 * 
 * Response:
 * {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   statistics: { ... },
 *   models: [ ... ],
 *   validation?: { ... }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validate = searchParams.get('validate') === 'true';
    const includeDefaults = searchParams.get('includeDefaults') === 'true';

    // Initialize factory if not already done
    modelFactory.initialize();

    // Get statistics
    const statistics = getModelStatistics();

    // Get all enabled models
    const enabledModels = modelFactory.getEnabledModels();

    // Check API key availability
    const usingProxy = process.env.PROXY_ENABLED === 'true';
    const modelsWithKeys: string[] = [];
    const modelsWithoutKeys: string[] = [];

    for (const model of enabledModels) {
      if (usingProxy || modelFactory.hasApiKey(model)) {
        modelsWithKeys.push(model.id);
      } else {
        modelsWithoutKeys.push(model.id);
      }
    }

    // Build model status list
    const modelStatuses = enabledModels.map(model => ({
      id: model.id,
      name: model.name,
      role: model.role,
      provider: model.provider,
      enabled: model.enabled !== false,
      priority: model.priority || 'primary',
      hasApiKey: usingProxy || modelFactory.hasApiKey(model),
      baseUrl: model.baseUrl,
      model: model.model,
      timeout: model.timeout,
      maxTokens: model.maxTokens,
      costPerToken: model.costPerToken,
    }));

    // Perform validation if requested
    let validation;
    if (validate) {
      validation = validateModelConfigs();
    }

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (modelsWithoutKeys.length === 0 && enabledModels.length >= 3) {
      status = 'healthy';
    } else if (enabledModels.length >= 2 && modelsWithoutKeys.length <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    // If validation was requested and failed, mark as unhealthy
    if (validation && !validation.valid) {
      status = 'unhealthy';
    }

    const response = {
      status,
      timestamp: new Date().toISOString(),
      statistics: {
        ...statistics,
        modelsWithKeys: modelsWithKeys.length,
        modelsWithoutKeys: modelsWithoutKeys.length,
        usingProxy,
      },
      models: modelStatuses,
      modelsWithoutKeys,
      ...(includeDefaults && {
        defaultModels: ANALYST_MODELS.map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
        }))
      }),
      ...(validation && { validation }),
    };

    return NextResponse.json(response, {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Model-Health': status,
      },
    });

  } catch (error) {
    console.error('[ModelHealth] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
