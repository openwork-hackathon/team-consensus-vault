/**
 * Argument Extractor for Chatroom Debate Summaries
 * CVAULT-190: Extracts key arguments from debate for context in next round
 */

import { ChatMessage, MessageSentiment, DebateSummary, StanceChangeSummary } from './types';
import { PersuasionState } from './persuasion';

// Minimum confidence threshold for considering a message impactful
const HIGH_CONFIDENCE_THRESHOLD = 70;

// Maximum number of arguments to include per side
const MAX_ARGUMENTS_PER_SIDE = 3;

// Maximum number of stance changes to include
const MAX_STANCE_CHANGES = 3;

// Maximum summary length in words
const MAX_SUMMARY_WORDS = 200;

/**
 * Extract key arguments from a completed debate round
 * Focuses on:
 * - High-confidence messages (confidence > 70)
 * - Messages that caused stance changes
 * - Data-backed arguments (contain specific numbers/metrics)
 */
export function extractDebateSummary(
  messages: ChatMessage[],
  persuasionStates: Record<string, PersuasionState>,
  roundNumber: number,
  consensusDirection: MessageSentiment,
  consensusStrength: number
): DebateSummary {
  // Filter to debate-phase messages only
  const debateMessages = messages.filter(m => m.phase === 'DEBATE');

  // Extract bullish arguments
  const bullishArguments = extractArgumentsForSide(
    debateMessages,
    'bullish',
    persuasionStates
  );

  // Extract bearish arguments
  const bearishArguments = extractArgumentsForSide(
    debateMessages,
    'bearish',
    persuasionStates
  );

  // Extract stance changes
  const stanceChanges = extractStanceChanges(persuasionStates);

  // Extract key data points mentioned
  const topDataPoints = extractTopDataPoints(debateMessages);

  return {
    roundNumber,
    timestamp: Date.now(),
    consensusDirection,
    consensusStrength,
    keyBullishArguments: bullishArguments.slice(0, MAX_ARGUMENTS_PER_SIDE),
    keyBearishArguments: bearishArguments.slice(0, MAX_ARGUMENTS_PER_SIDE),
    stanceChanges: stanceChanges.slice(0, MAX_STANCE_CHANGES),
    topDataPoints: topDataPoints.slice(0, 5),
    messageCount: debateMessages.length,
  };
}

/**
 * Extract the most impactful arguments for a given sentiment side
 */
function extractArgumentsForSide(
  messages: ChatMessage[],
  sentiment: MessageSentiment,
  persuasionStates: Record<string, PersuasionState>
): string[] {
  const sideMessages = messages.filter(m => m.sentiment === sentiment);

  // Score each message for impact
  const scoredMessages = sideMessages.map(msg => {
    let score = 0;

    // High confidence boosts score
    if (msg.confidence && msg.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
      score += msg.confidence;
    }

    // Data-backed arguments score higher
    if (hasSpecificData(msg.content)) {
      score += 20;
    }

    // Messages that caused stance changes get highest priority
    if (causedStanceChange(msg, persuasionStates)) {
      score += 50;
    }

    // Acknowledging opposing view shows thoughtful analysis
    if (msg.acknowledgesOpposingView) {
      score += 10;
    }

    return { msg, score };
  });

  // Sort by score descending
  scoredMessages.sort((a, b) => b.score - a.score);

  // Extract concise argument summaries
  return scoredMessages
    .slice(0, MAX_ARGUMENTS_PER_SIDE)
    .map(({ msg }) => summarizeArgument(msg.content));
}

/**
 * Check if a message contains specific data/numbers
 */
function hasSpecificData(content: string): boolean {
  // Look for percentages, dollar amounts, timeframes, specific numbers
  const dataPatterns = [
    /\d+%/,           // Percentages
    /\$[\d,]+/,       // Dollar amounts
    /\d+\s*(k|m|b)/i, // Large numbers (k, m, b)
    /\d+h|\d+d/i,     // Timeframes
    /support|resistance|volume|market.?cap/i, // Technical terms
  ];

  return dataPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if a message caused a stance change
 */
function causedStanceChange(
  message: ChatMessage,
  persuasionStates: Record<string, PersuasionState>
): boolean {
  for (const [personaId, state] of Object.entries(persuasionStates)) {
    if (personaId === message.personaId) continue;

    // Check if this persona has a stance change triggered by this message
    const recentChange = state.stanceHistory?.find(
      (entry: { triggeredBy?: string; timestamp: number }) =>
        entry.triggeredBy === message.id
    );

    if (recentChange) return true;
  }
  return false;
}

/**
 * Summarize an argument to be concise
 */
function summarizeArgument(content: string): string {
  // Remove sentiment tags
  let cleaned = content.replace(/\[SENTIMENT:[^\]]+\]/gi, '').trim();

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Truncate if too long (aim for ~100 chars)
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 117) + '...';
  }

  return cleaned;
}

/**
 * Extract stance changes from persuasion states
 */
function extractStanceChanges(
  persuasionStates: Record<string, PersuasionState>
): StanceChangeSummary[] {
  const changes: StanceChangeSummary[] = [];

  for (const [personaId, state] of Object.entries(persuasionStates)) {
    if (!state.stanceHistory || state.stanceHistory.length < 2) continue;

    // Get the most recent stance change
    const history = state.stanceHistory;
    for (let i = 1; i < history.length; i++) {
      const current = history[i];
      const previous = history[i - 1];

      if (current.stance !== previous.stance) {
        changes.push({
          personaId,
          handle: state.personaId || personaId, // Will be replaced with actual handle
          from: previous.stance,
          to: current.stance,
          reason: current.reason,
        });
      }
    }
  }

  // Sort by recency (most recent first)
  changes.sort((a, b) => {
    const stateA = persuasionStates[a.personaId];
    const stateB = persuasionStates[b.personaId];
    const timeA = stateA?.stanceHistory?.slice(-1)[0]?.timestamp || 0;
    const timeB = stateB?.stanceHistory?.slice(-1)[0]?.timestamp || 0;
    return timeB - timeA;
  });

  return changes;
}

/**
 * Extract top data points mentioned in debate
 */
function extractTopDataPoints(messages: ChatMessage[]): string[] {
  const dataPoints = new Set<string>();

  for (const msg of messages) {
    // Extract percentages
    const percentages = msg.content.match(/\d+%/g);
    if (percentages) {
      percentages.forEach(p => dataPoints.add(p));
    }

    // Extract price levels
    const prices = msg.content.match(/\$[\d,]+(?:\.\d+)?/g);
    if (prices) {
      prices.slice(0, 2).forEach(p => dataPoints.add(p));
    }

    // Extract volume mentions
    const volumeMatch = msg.content.match(/(\$?[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M)\s*(?:volume)?)/i);
    if (volumeMatch) {
      dataPoints.add(volumeMatch[1]);
    }
  }

  return Array.from(dataPoints).slice(0, 5);
}

/**
 * Format debate summary for inclusion in prompts
 * Returns a concise text summary (< 200 words)
 */
export function formatDebateSummaryForPrompt(summary: DebateSummary | undefined): string {
  if (!summary) {
    return '';
  }

  const parts: string[] = [];

  // Header
  parts.push(`Previous Round (#${summary.roundNumber}) Result: ${summary.consensusDirection.toUpperCase()} (${summary.consensusStrength}% consensus)`);
  parts.push('');

  // Key bullish arguments
  if (summary.keyBullishArguments.length > 0) {
    parts.push('Key Bullish Arguments:');
    summary.keyBullishArguments.forEach((arg, i) => {
      parts.push(`  ${i + 1}. ${arg}`);
    });
    parts.push('');
  }

  // Key bearish arguments
  if (summary.keyBearishArguments.length > 0) {
    parts.push('Key Bearish Arguments:');
    summary.keyBearishArguments.forEach((arg, i) => {
      parts.push(`  ${i + 1}. ${arg}`);
    });
    parts.push('');
  }

  // Notable stance changes
  if (summary.stanceChanges.length > 0) {
    parts.push('Notable Stance Changes:');
    summary.stanceChanges.forEach(change => {
      parts.push(`  - ${change.handle || change.personaId}: ${change.from} → ${change.to}`);
    });
    parts.push('');
  }

  // Key data points
  if (summary.topDataPoints.length > 0) {
    parts.push(`Key Data Points Referenced: ${summary.topDataPoints.join(', ')}`);
  }

  const fullText = parts.join('\n');

  // Ensure we stay under word limit
  const words = fullText.split(/\s+/);
  if (words.length > MAX_SUMMARY_WORDS) {
    return words.slice(0, MAX_SUMMARY_WORDS).join(' ') + '...';
  }

  return fullText;
}

/**
 * Update persona handles in stance changes after summary creation
 * (since persuasion states don't store handles)
 */
export function updateStanceChangeHandles(
  summary: DebateSummary,
  handleMap: Record<string, string>
): DebateSummary {
  return {
    ...summary,
    stanceChanges: summary.stanceChanges.map(change => ({
      ...change,
      handle: handleMap[change.personaId] || change.personaId,
    })),
  };
}
