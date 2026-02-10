import { NextRequest, NextResponse } from 'next/server';
import { runConsensusAnalysis } from '@/lib/consensus-engine';
import { buildCouncilContext, recordCouncilResult } from '@/lib/chatroom-council-bridge';
import type { MessageSentiment } from '@/lib/chatroom/types';
import type { ConsensusData, Analyst } from '@/lib/types';

/**
 * Council Evaluation API
 *
 * POST /api/council/evaluate
 *
 * Triggers the 5-agent trading council evaluation, optionally with chatroom
 * consensus context. This endpoint is used by the chatroom-council bridge
 * when chatroom reaches strong consensus.
 *
 * Request body:
 * {
 *   asset: string;           // Asset to analyze (default: 'BTC')
 *   chatroomContext?: {      // Optional chatroom consensus context
 *     direction: 'bullish' | 'bearish' | 'neutral';
 *     strength: number;      // 0-100
 *   };
 *   triggeredBy?: 'chatroom' | 'manual';  // Source of trigger
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   consensus: ConsensusData;
 *   analysts: Analyst[];
 *   metadata: {
 *     totalTimeMs: number;
 *     modelCount: number;
 *     successCount: number;
 *     triggeredBy: 'chatroom' | 'manual';
 *     chatroomContext?: { direction, strength };
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      asset = 'BTC',
      chatroomContext,
      triggeredBy = 'manual',
    } = body as {
      asset?: string;
      chatroomContext?: { direction: MessageSentiment; strength: number };
      triggeredBy?: 'chatroom' | 'manual';
    };

    // Build context string if chatroom context provided
    let context: string | undefined;
    if (chatroomContext && chatroomContext.direction !== 'neutral') {
      context = buildCouncilContext(chatroomContext.direction, chatroomContext.strength);
    }

    console.log(`[council/evaluate] Starting evaluation for ${asset}`, {
      triggeredBy,
      hasChatroomContext: !!chatroomContext,
      chatroomDirection: chatroomContext?.direction,
      chatroomStrength: chatroomContext?.strength,
    });

    // Run the 5-agent consensus analysis
    const { analysts, consensus, partialFailures } = await runConsensusAnalysis(
      asset,
      context
    );

    // Transform analysts to UI format
    const analystResults: Analyst[] = analysts.map((a) => ({
      id: a.id,
      name: a.name || a.id,
      color: getAnalystColor(a.id),
      borderColor: getAnalystBorderColor(a.id),
      bgColor: getAnalystBgColor(a.id),
      avatar: getAnalystAvatar(a.id),
      sentiment: a.sentiment,
      confidence: a.confidence,
      reasoning: a.reasoning,
      isTyping: false,
      error: a.error,
      userFacingError: a.userFacingError,
    }));

    // Build consensus data
    const consensusData: ConsensusData = {
      consensusLevel: consensus.consensusLevel,
      recommendation: consensus.recommendation,
      threshold: 80, // 4/5 threshold
      analysts: analystResults,
      partialFailures,
    };

    // Record result in bridge state
    recordCouncilResult(consensusData, triggeredBy);

    const totalTimeMs = Date.now() - startTime;

    console.log(`[council/evaluate] Evaluation complete in ${totalTimeMs}ms`, {
      recommendation: consensus.recommendation,
      consensusLevel: consensus.consensusLevel,
      successCount: analysts.filter((a) => !a.error).length,
    });

    return NextResponse.json({
      success: true,
      consensus: consensusData,
      analysts: analystResults,
      metadata: {
        totalTimeMs,
        modelCount: analysts.length,
        successCount: analysts.filter((a) => !a.error).length,
        triggeredBy,
        chatroomContext: chatroomContext || null,
      },
    });
  } catch (error) {
    const totalTimeMs = Date.now() - startTime;
    console.error('[council/evaluate] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalTimeMs,
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions for analyst styling
function getAnalystColor(id: string): string {
  const colors: Record<string, string> = {
    deepseek: '#3B82F6', // blue
    kimi: '#8B5CF6', // purple
    minimax: '#F59E0B', // amber
    glm: '#10B981', // green
    gemini: '#EC4899', // pink
  };
  return colors[id] || '#6B7280';
}

function getAnalystBorderColor(id: string): string {
  const colors: Record<string, string> = {
    deepseek: 'border-blue-500',
    kimi: 'border-purple-500',
    minimax: 'border-amber-500',
    glm: 'border-green-500',
    gemini: 'border-pink-500',
  };
  return colors[id] || 'border-gray-500';
}

function getAnalystBgColor(id: string): string {
  const colors: Record<string, string> = {
    deepseek: 'bg-blue-500/10',
    kimi: 'bg-purple-500/10',
    minimax: 'bg-amber-500/10',
    glm: 'bg-green-500/10',
    gemini: 'bg-pink-500/10',
  };
  return colors[id] || 'bg-gray-500/10';
}

function getAnalystAvatar(id: string): string {
  const avatars: Record<string, string> = {
    deepseek: '/avatars/momentum-hunter.png',
    kimi: '/avatars/whale-watcher.png',
    minimax: '/avatars/sentiment-scout.png',
    glm: '/avatars/on-chain-oracle.png',
    gemini: '/avatars/risk-manager.png',
  };
  return avatars[id] || '/avatars/default.png';
}
