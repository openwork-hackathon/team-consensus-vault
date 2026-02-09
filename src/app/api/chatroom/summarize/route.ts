import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/chatroom/types';
import { callModelRaw } from '@/lib/chatroom/model-caller';

/**
 * CVAULT-180: Missed Conversation Summarization API
 * 
 * Generates a brief AI summary of missed chat messages when users reconnect
 * after multi-hour gaps. Uses DeepSeek for cost efficiency.
 */

const SUMMARY_SYSTEM_PROMPT = `You are a conversation summarizer for a crypto trading chatroom where AI personas debate market trends.

Your task is to create a brief, informative summary (2-3 sentences) of missed conversation that captures:
1. Key topics discussed (market trends, price movements, technical analysis)
2. Any consensus reached or significant stance changes by personas
3. Current phase and sentiment direction (bullish/bearish/neutral)

Guidelines:
- Be concise but informative
- Focus on actionable insights and market sentiment shifts
- Mention specific personas only if they made significant points
- Note any major price levels or market events discussed
- Indicate if consensus was reached or if debate is ongoing

Respond with ONLY the summary text, no JSON formatting, no preamble.`;

interface SummarizeRequest {
  messages: ChatMessage[];
  lastVisitTimestamp: number;
  currentPhase?: string;
  currentConsensus?: {
    direction: string;
    strength: number;
  } | null;
}

interface SummarizeResponse {
  summary: string;
  messageCount: number;
  generatedAt: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Format messages for the summarization prompt
 */
function formatMessagesForSummary(messages: ChatMessage[]): string {
  return messages
    .map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const sentiment = msg.sentiment ? `[${msg.sentiment.toUpperCase()}] ` : '';
      return `[${time}] ${msg.handle}: ${sentiment}${msg.content}`;
    })
    .join('\n');
}

/**
 * Build the user prompt for summarization
 */
function buildSummaryPrompt(
  messages: ChatMessage[],
  currentPhase?: string,
  currentConsensus?: { direction: string; strength: number } | null
): string {
  const formattedMessages = formatMessagesForSummary(messages);
  
  let context = '';
  if (currentPhase) {
    context += `\nCurrent Phase: ${currentPhase}`;
  }
  if (currentConsensus) {
    context += `\nCurrent Consensus: ${currentConsensus.direction.toUpperCase()} (${Math.round(currentConsensus.strength * 100)}% strength)`;
  }

  return `Please summarize the following ${messages.length} messages from the crypto trading debate chatroom:${context}

MESSAGES:
${formattedMessages}

Provide a 2-3 sentence summary focusing on key topics, any consensus or stance changes, and the overall sentiment direction.`;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SummarizeResponse | ErrorResponse>> {
  try {
    const body: SummarizeRequest = await request.json();
    const { messages, lastVisitTimestamp, currentPhase, currentConsensus } = body;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided for summarization' },
        { status: 400 }
      );
    }

    if (!lastVisitTimestamp || typeof lastVisitTimestamp !== 'number') {
      return NextResponse.json(
        { error: 'Invalid lastVisitTimestamp' },
        { status: 400 }
      );
    }

    // Filter messages to only those after last visit
    const missedMessages = messages.filter(
      msg => msg.timestamp > lastVisitTimestamp
    );

    if (missedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No missed messages found' },
        { status: 400 }
      );
    }

    // Sort by timestamp
    missedMessages.sort((a, b) => a.timestamp - b.timestamp);

    // Build prompt
    const userPrompt = buildSummaryPrompt(missedMessages, currentPhase, currentConsensus);

    // Call DeepSeek for summarization (cost-effective)
    console.log(`[CVAULT-180] Generating summary for ${missedMessages.length} missed messages`);
    
    const summaryText = await callModelRaw(
      'deepseek', // Use DeepSeek for cost efficiency
      SUMMARY_SYSTEM_PROMPT,
      userPrompt,
      150 // Short summary, don't need many tokens
    );

    if (!summaryText) {
      console.error('[CVAULT-180] Failed to generate summary - model returned null');
      return NextResponse.json(
        { error: 'Failed to generate summary', details: 'AI model unavailable' },
        { status: 503 }
      );
    }

    // Clean up the summary (remove quotes if present, trim)
    const cleanedSummary = summaryText
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim();

    const response: SummarizeResponse = {
      summary: cleanedSummary,
      messageCount: missedMessages.length,
      generatedAt: Date.now(),
    };

    console.log(`[CVAULT-180] Summary generated successfully: ${cleanedSummary.substring(0, 100)}...`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[CVAULT-180] Error generating summary:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET(): Promise<NextResponse<{ status: string }>> {
  return NextResponse.json({ status: 'ok' });
}
