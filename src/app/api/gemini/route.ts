/**
 * Gemini Risk Manager API Endpoint
 * Dedicated endpoint for Gemini Risk Manager role in Consensus Vault
 *
 * Gemini's role: Risk Manager - Risk Assessment & Portfolio Exposure
 *
 * GET /api/gemini?asset=BTC&context=optional_context
 * POST /api/gemini with { asset: string, context?: string }
 *
 * Response format: { signal: 'bullish'|'bearish'|'neutral', confidence: 0-100, reasoning: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ANALYST_MODELS } from '@/lib/models';

// Timeout for Gemini API calls (30 seconds)
const GEMINI_TIMEOUT = 30000;

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
 * Convert Gemini's internal response format to task requirements
 * Maps buy/sell/hold to bullish/bearish/neutral
 */
function convertGeminiResponse(
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
 * Call Gemini API directly
 */
async function callGeminiAPI(
  asset: string,
  context?: string
): Promise<{
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  const config = ANALYST_MODELS.find(m => m.id === 'gemini');
  if (!config) {
    throw new Error('Gemini configuration not found');
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  const systemPrompt = config.systemPrompt;

  const userPrompt = context
    ? `Analyze ${asset.toUpperCase()} for a trading signal.\n\nAdditional Context: ${context}\n\nProvide your expert risk assessment analysis.`
    : `Analyze ${asset.toUpperCase()} for a trading signal. Provide your expert analysis based on current market conditions.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT);

  try {
    const response = await fetch(
      `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.signal || parsed.confidence === undefined || !parsed.reasoning) {
      throw new Error('Missing required fields in Gemini response');
    }

    // Convert to task format with 0-100 confidence scale
    const converted = convertGeminiResponse(
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
 * GET endpoint for Gemini Risk Manager analysis
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

    const analysisResult = await callGeminiAPI(asset, context || undefined);

    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'gemini',
          name: 'Gemini',
          role: 'Risk Manager - Risk Assessment & Portfolio Exposure',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'gemini',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST endpoint for Gemini Risk Manager analysis
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

    const analysisResult = await callGeminiAPI(asset, context);

    return NextResponse.json(
      {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        asset: asset.toUpperCase(),
        analyst: {
          id: 'gemini',
          name: 'Gemini',
          role: 'Risk Manager - Risk Assessment & Portfolio Exposure',
        },
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Gemini API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analyst: 'gemini',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
