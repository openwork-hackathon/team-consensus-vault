import { NextRequest } from 'next/server';
import { runConsensusAnalysis } from '@/lib/consensus-engine';
import {
  prepareCouncilContext,
  getChatroomConsensus,
  calculateAlignmentScore,
  generateAlignmentCommentary,
  isChatroomConsensusSignificant,
} from '@/lib/chatroom-consensus-bridge';
import {
  checkRateLimit,
  createRateLimitResponse,
  CONSENSUS_RATE_LIMIT,
} from '@/lib/rate-limit';
import { createApiLogger } from '@/lib/api-logger';

/**
 * Enhanced Consensus API
 *
 * GET /api/consensus-enhanced?asset=BTC&context=optional
 *
 * Combines:
 * - Multi-persona chatroom consensus (community sentiment)
 * - 5-agent trading council analysis (expert signals)
 * - Alignment scoring between both systems
 *
 * Returns comprehensive analysis with both perspectives.
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger(request);

  try {
    logger.logRequest();

    // Check rate limit
    const rateLimitResult = await checkRateLimit(request, CONSENSUS_RATE_LIMIT);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
      return createRateLimitResponse(
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset
      );
    }

    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'BTC';
    const userContext = searchParams.get('context') || undefined;

    logger.info('Enhanced consensus analysis request', {
      asset,
      hasUserContext: !!userContext,
    });

    // Step 1: Fetch chatroom consensus
    const chatroomConsensus = await getChatroomConsensus();

    // Step 2: Prepare combined context for trading council
    const { combinedContext } = await prepareCouncilContext(userContext);

    // Step 3: Run trading council analysis with chatroom context
    const { analysts, consensus, partialFailures } =
      await runConsensusAnalysis(asset, combinedContext || userContext);

    // Step 4: Calculate alignment between chatroom and council
    const councilSignal = consensus.signal || 'hold';
    const alignmentScore = calculateAlignmentScore(
      chatroomConsensus,
      councilSignal,
      consensus.consensusLevel
    );

    const alignmentCommentary = generateAlignmentCommentary(
      alignmentScore,
      chatroomConsensus,
      councilSignal
    );

    // Step 5: Build response
    const response = {
      // Trading council results
      council: {
        signal: consensus.signal,
        recommendation: consensus.recommendation,
        consensusLevel: consensus.consensusLevel,
        analysts: analysts.map((a) => ({
          id: a.id,
          name: a.name,
          sentiment: a.sentiment,
          confidence: a.confidence,
          reasoning: a.reasoning,
          error: a.error,
        })),
        partialFailures: partialFailures || null,
      },

      // Chatroom consensus results
      chatroom: chatroomConsensus
        ? {
            direction: chatroomConsensus.direction,
            strength: chatroomConsensus.strength,
            phase: chatroomConsensus.phaseState,
            messageCount: chatroomConsensus.messageCount,
            summary: chatroomConsensus.summary,
            isSignificant: isChatroomConsensusSignificant(chatroomConsensus),
          }
        : null,

      // Alignment analysis
      alignment: {
        score: alignmentScore,
        commentary: alignmentCommentary,
        agreement:
          alignmentScore >= 80
            ? 'strong'
            : alignmentScore >= 60
            ? 'moderate'
            : alignmentScore >= 40
            ? 'weak'
            : 'disagreement',
      },

      // Metadata
      metadata: {
        asset,
        timestamp: Date.now(),
        requestId: logger.getRequestId(),
        chatroomAvailable: chatroomConsensus !== null,
        contextUsed: !!combinedContext,
      },
    };

    logger.info('Enhanced consensus analysis complete', {
      asset,
      councilSignal: consensus.signal,
      chatroomDirection: chatroomConsensus?.direction || 'none',
      alignmentScore,
      requestId: logger.getRequestId(),
    });

    return Response.json(response, {
      headers: {
        'X-Request-ID': logger.getRequestId(),
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    logger.logError(
      error instanceof Error ? error : new Error(String(error)),
      {
        endpoint: 'consensus-enhanced',
        method: 'GET',
      }
    );

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: logger.getRequestId(),
      },
      { status: 500 }
    );
  }
}
