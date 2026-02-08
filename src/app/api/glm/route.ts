/**
 * GLM On-Chain Oracle API Endpoint
 * Dedicated endpoint for GLM On-Chain Oracle role in Consensus Vault
 *
 * GLM's role: On-Chain Oracle - analyzing on-chain metrics, TVL changes, protocol activity
 *
 * GET /api/glm?asset=BTC&context=optional_context
 * POST /api/glm with { asset: string, context?: string }
 *
 * Response format: { signal: 'bullish'|'bearish'|'neutral', confidence: 0-100, reasoning: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGLMConfig } from '@/lib/glm-config';

// Timeout for GLM API calls (30 seconds)
const GLM_TIMEOUT = 30000;

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Convert GLM's internal response format to task requirements
 * Maps buy/sell/hold to bullish/bearish/neutral
 */
function convertGLMResponse(
  glmSignal: string,
  confidence: number
): { signal: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
  const normalizedSignal = glmSignal.toLowerCase().trim();

  // Map GLM signals to consensus signals as per task requirements
  if (normalizedSignal === 'buy') {
    return { signal: 'bullish', confidence };
  } else if (normalizedSignal === 'sell') {
    return { signal: 'bearish', confidence };
  } else {
    return { signal: 'neutral', confidence };
  }
}

/**
 * Call GLM API directly
 */
async function callGLMAPI(
  asset: string,
  context?: string
): Promise<{
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  const config = getGLMConfig();

  // Build system prompt for GLM On-Chain Oracle
  const systemPrompt = `You are the On-Chain Oracle, an expert in blockchain analytics and on-chain metrics for crypto markets.

Your expertise includes:
- Total Value Locked (TVL) analysis
- Active addresses and network growth
- Transaction volume and velocity
- NVT ratio and network value metrics
- DeFi protocol flows and liquidity
- Gas usage and network activity
- Staking ratios and token economics

When analyzing ${asset.toUpperCase()}, focus on:
1. TVL trends (growing/shrinking/stable)
2. Network activity and adoption metrics
3. Token velocity and holder behavior
4. Protocol revenue and sustainability
5. Cross-chain flows and bridge activity

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your on-chain analysis in 1-2 sentences"}

Be concise but insightful. On-chain data reveals fundamental health - weight accordingly.`;

  // Build user prompt with context
  const userPrompt = context
    ? `Analyze ${asset.toUpperCase()} for a trading signal.\n\nAdditional Context: ${context}\n\nProvide your expert on-chain analysis.`
    : `Analyze ${asset.toUpperCase()} for a trading signal. Provide your expert analysis based on current on-chain metrics and market conditions.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GLM_TIMEOUT);

  try {
    const response = await fetch(`${config.base_url}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.api_key,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `GLM API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    if (!text) {
      throw new Error('Empty response from GLM API');
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in GLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.signal || parsed.confidence === undefined || !parsed.reasoning) {
      throw new Error('Missing required fields in GLM response');
    }

    // Convert to task format with 0-100 confidence scale
    const converted = convertGLMResponse(
      parsed.signal,
      Math.round(Number(parsed.confidence))
    );

    return {
      signal: converted.signal,
      confidence: converted.confidence,
      reasoning: String(parsed.reasoning).trim(),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET endpoint for GLM On-Chain Oracle analysis
 * Query params: asset (required), context (optional)
 *
 * Returns: { signal: 'bullish'|'bearish'|'neutral', confidence: 0-100, reasoning: string, ... }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset');
    const context = searchParams.get('context');

    if (!asset) {
      return NextResponse.json(
        { error: 'Missing required parameter: asset' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Call GLM API directly
    const analysisResult = await callGLMAPI(asset, context || undefined);

    // Return structured response matching task requirements
    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'glm',
          name: 'GLM',
          role: 'On-Chain Oracle - On-Chain Metrics & TVL Analysis',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GLM API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'glm',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST endpoint for GLM On-Chain Oracle analysis
 * Body: { asset: string, context?: string }
 *
 * Returns: { signal: 'bullish'|'bearish'|'neutral', confidence: 0-100, reasoning: string, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, context } = body;

    if (!asset || typeof asset !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: asset' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Call GLM API directly
    const analysisResult = await callGLMAPI(asset, context);

    // Return structured response matching task requirements
    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'glm',
          name: 'GLM',
          role: 'On-Chain Oracle - On-Chain Metrics & TVL Analysis',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GLM API error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'glm',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
