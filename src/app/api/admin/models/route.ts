/**
 * Model Management API
 * CVAULT-236: Dynamic Model Selection
 * 
 * Admin endpoints for runtime model management:
 * - View model statistics
 * - Enable/disable models
 * - Change model priorities
 * - Reload configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { modelFactory, getModelStatistics, validateModelConfigs } from '@/lib/model-factory';

/**
 * GET /api/admin/models
 * 
 * Returns detailed statistics and configuration for all models.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeValidation = searchParams.get('validate') === 'true';

    // Initialize factory
    modelFactory.initialize();

    // Get statistics
    const statistics = getModelStatistics();

    // Get all models (including disabled)
    const allModels = Array.from(modelFactory['configCache'].values()).map(model => ({
      id: model.id,
      name: model.name,
      role: model.role,
      provider: model.provider,
      enabled: model.enabled !== false,
      priority: model.priority || 'primary',
      hasApiKey: modelFactory.hasApiKey(model),
      baseUrl: model.baseUrl,
      model: model.model,
      timeout: model.timeout,
      maxTokens: model.maxTokens,
      costPerToken: model.costPerToken,
      region: model.region,
    }));

    // Get validation results if requested
    let validation;
    if (includeValidation) {
      validation = validateModelConfigs();
    }

    // Get fallback chains
    const fallbackChains: Record<string, string[]> = {};
    for (const model of allModels) {
      fallbackChains[model.id] = modelFactory.getFallbackChain(model.id);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics,
      models: allModels,
      fallbackChains,
      ...(validation && { validation }),
    });

  } catch (error) {
    console.error('[ModelAdmin] GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/models
 * 
 * Update model configuration at runtime.
 * Body: { modelId: string, updates: { enabled?: boolean, priority?: string } }
 * 
 * Example:
 * { "modelId": "deepseek", "updates": { "enabled": false, "priority": "fallback" } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, updates } = body;

    if (!modelId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: modelId',
      }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid field: updates',
      }, { status: 400 });
    }

    // Initialize factory
    modelFactory.initialize();

    // Check if model exists
    const model = modelFactory.getModel(modelId);
    if (!model) {
      return NextResponse.json({
        success: false,
        error: `Model not found: ${modelId}`,
      }, { status: 404 });
    }

    // Apply updates
    const changes: string[] = [];

    if ('enabled' in updates) {
      if (typeof updates.enabled !== 'boolean') {
        return NextResponse.json({
          success: false,
          error: 'Invalid value for enabled: must be boolean',
        }, { status: 400 });
      }
      modelFactory.setModelEnabled(modelId, updates.enabled);
      changes.push(`enabled=${updates.enabled}`);
    }

    if ('priority' in updates) {
      const validPriorities = ['primary', 'secondary', 'fallback', 'emergency'];
      if (!validPriorities.includes(updates.priority)) {
        return NextResponse.json({
          success: false,
          error: `Invalid priority: ${updates.priority}. Must be one of: ${validPriorities.join(', ')}`,
        }, { status: 400 });
      }
      modelFactory.setModelPriority(modelId, updates.priority);
      changes.push(`priority=${updates.priority}`);
    }

    // Get updated model
    const updatedModel = modelFactory.getModel(modelId);

    return NextResponse.json({
      success: true,
      message: `Model ${modelId} updated: ${changes.join(', ')}`,
      model: updatedModel,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[ModelAdmin] PATCH error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/models/reload
 * 
 * Reload model configuration from disk and environment variables.
 * Useful for picking up changes without restarting the server.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === 'reload') {
      // Reload configuration
      modelFactory.reload();

      // Get new statistics
      const statistics = getModelStatistics();

      return NextResponse.json({
        success: true,
        message: 'Configuration reloaded successfully',
        timestamp: new Date().toISOString(),
        statistics,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: { "action": "reload" }',
    }, { status: 400 });

  } catch (error) {
    console.error('[ModelAdmin] POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
