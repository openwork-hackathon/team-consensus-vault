/**
 * DeepSeek Momentum Hunter API Endpoint
 * Dedicated endpoint for DeepSeek Momentum Hunter role in Consensus Vault
 *
 * DeepSeek's role: Momentum Hunter - Technical Analysis & Trend Detection
 *
 * GET /api/deepseek?asset=BTC&context=optional_context
 * POST /api/deepseek with { asset: string, context?: string }
 *
 * Response format: { signal: 'bullish'|'bearish'|'neutral', confidence: 0-100, reasoning: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ANALYST_MODELS } from '@/lib/models';

// Timeout for DeepSeek API calls (30 seconds)
const DEEPSEEK_TIMEOUT = 30000;

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
 * Convert DeepSeek's internal response format to task requirements
 * Maps buy/sell/hold to bullish/bearish/neutral
 */
function convertDeepSeekResponse(
  signal: string,
  confidence: number
): { signal: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
  const normalizedSignal = signal.toLowerCase().trim();

  if (normalizedSignal === 'buy') {
    return { signal: 'bullish', confidence };
  } else if (normalizedSignal === 'sell') {
    return { signal: 'bearish', confidence };
  } else {
    return { signal: 'neutral', confidence };
  }
}

/**
 * Call DeepSeek API directly
 */
async function callDeepSeekAPI(
  asset: string,
  context?: string
): Promise<{
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  const config = ANALYST_MODELS.find(m => m.id === 'deepseek');
  if (!config) {
    throw new Error('DeepSeek configuration not found');
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  const systemPrompt = config.systemPrompt;

  const userPrompt = context
    ? `Analyze ${asset.toUpperCase()} for a trading signal.\n\nAdditional Context: ${context}\n\nProvide your expert technical analysis.`
    : `Analyze ${asset.toUpperCase()} for a trading signal. Provide your expert analysis based on current market conditions.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `DeepSeek API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      throw new Error('Empty response from DeepSeek API');
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in DeepSeek response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.signal || parsed.confidence === undefined || !parsed.reasoning) {
      throw new Error('Missing required fields in DeepSeek response');
    }

    // Convert to task format with 0-100 confidence scale
    const converted = convertDeepSeekResponse(
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
 * GET endpoint for DeepSeek Momentum Hunter analysis
 * Query params: asset (required), context (optional)
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

    const analysisResult = await callDeepSeekAPI(asset, context || undefined);

    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'deepseek',
          name: 'DeepSeek',
          role: 'Momentum Hunter - Technical Analysis & Trend Detection',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('DeepSeek API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'deepseek',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST endpoint for DeepSeek Momentum Hunter analysis
 * Body: { asset: string, context?: string }
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

    const analysisResult = await callDeepSeekAPI(asset, context);

    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'deepseek',
          name: 'DeepSeek',
          role: 'Momentum Hunter - Technical Analysis & Trend Detection',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('DeepSeek API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'deepseek',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
