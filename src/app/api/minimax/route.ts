/**
 * MiniMax Sentiment Scout API Endpoint
 * Dedicated endpoint for MiniMax Sentiment Scout role in Consensus Vault
 *
 * MiniMax's role: Sentiment Scout - Social Sentiment & Community Buzz
 *
 * GET /api/minimax?asset=BTC&context=optional_context
 * POST /api/minimax with { asset: string, context?: string }
 *
 * Response format: { signal: 'bullish'|'bearish'|'neutral', confidence: 0-100, reasoning: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ANALYST_MODELS } from '@/lib/models';

// Timeout for MiniMax API calls (30 seconds)
const MINIMAX_TIMEOUT = 30000;

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
 * Convert MiniMax's internal response format to task requirements
 * Maps buy/sell/hold to bullish/bearish/neutral
 */
function convertMiniMaxResponse(
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
 * Call MiniMax API directly
 */
async function callMiniMaxAPI(
  asset: string,
  context?: string
): Promise<{
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  const config = ANALYST_MODELS.find(m => m.id === 'minimax');
  if (!config) {
    throw new Error('MiniMax configuration not found');
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  const systemPrompt = config.systemPrompt;

  const userPrompt = context
    ? `Analyze ${asset.toUpperCase()} for a trading signal.\n\nAdditional Context: ${context}\n\nProvide your expert sentiment analysis.`
    : `Analyze ${asset.toUpperCase()} for a trading signal. Provide your expert analysis based on current market conditions.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MINIMAX_TIMEOUT);

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
        `MiniMax API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      throw new Error('Empty response from MiniMax API');
    }

    // Strip <think> tags if present (MiniMax M2 reasoning model)
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    text = text.trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in MiniMax response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.signal || parsed.confidence === undefined || !parsed.reasoning) {
      throw new Error('Missing required fields in MiniMax response');
    }

    // Convert to task format with 0-100 confidence scale
    const converted = convertMiniMaxResponse(
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
 * GET endpoint for MiniMax Sentiment Scout analysis
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

    const analysisResult = await callMiniMaxAPI(asset, context || undefined);

    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'minimax',
          name: 'MiniMax',
          role: 'Sentiment Scout - Social Sentiment & Community Buzz',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('MiniMax API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'minimax',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST endpoint for MiniMax Sentiment Scout analysis
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

    const analysisResult = await callMiniMaxAPI(asset, context);

    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'minimax',
          name: 'MiniMax',
          role: 'Sentiment Scout - Social Sentiment & Community Buzz',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('MiniMax API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'minimax',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
