/**
 * Debate-to-Consensus Context Bridge
 * CVAULT-190: Injects chatroom debate arguments into consensus round prompts
 * 
 * This module provides a clean integration between the chatroom debate system
 * and the consensus engine, allowing debate insights to influence trading decisions.
 */

import { DebateSummary, MessageSentiment } from './types';
import { getDebateSummary } from './kv-store';
import { formatDebateSummaryForPrompt } from './argument-extractor';

// Minimum consensus strength required to include debate context
const MIN_DEBATE_STRENGTH_THRESHOLD = 60;

// Maximum age of debate summary to consider relevant (30 minutes)
const MAX_DEBATE_AGE_MS = 30 * 60 * 1000;

/**
 * Context injection result for consensus prompts
 */
export interface DebateContextInjection {
  /** Whether debate context should be included */
  shouldInclude: boolean;
  /** Formatted context string for prompt injection */
  contextString: string;
  /** Raw debate summary data */
  debateSummary?: DebateSummary;
  /** Metadata about the injection decision */
  metadata: {
    reason: string;
    debateStrength: number;
    debateDirection: MessageSentiment | null;
    ageMs: number;
  };
}

/**
 * Fetch and format debate context for consensus prompts
 * 
 * This function retrieves the latest debate summary and determines
 * whether it should be included in the consensus prompt based on:
 * - Consensus strength (must be >= threshold)
 * - Age of debate (must be recent)
 * - Non-neutral direction
 * 
 * @returns DebateContextInjection with formatted context and metadata
 */
export async function getDebateContextForConsensus(): Promise<DebateContextInjection> {
  try {
    const summary = await getDebateSummary();
    
    if (!summary) {
      return {
        shouldInclude: false,
        contextString: '',
        metadata: {
          reason: 'No debate summary available',
          debateStrength: 0,
          debateDirection: null,
          ageMs: Infinity,
        },
      };
    }

    const ageMs = Date.now() - summary.timestamp;
    
    // Check if debate is too old
    if (ageMs > MAX_DEBATE_AGE_MS) {
      return {
        shouldInclude: false,
        contextString: '',
        debateSummary: summary,
        metadata: {
          reason: `Debate summary too old (${Math.round(ageMs / 60000)}m > ${MAX_DEBATE_AGE_MS / 60000}m)`,
          debateStrength: summary.consensusStrength,
          debateDirection: summary.consensusDirection,
          ageMs,
        },
      };
    }

    // Check if consensus is neutral
    if (!summary.consensusDirection || summary.consensusDirection === 'neutral') {
      return {
        shouldInclude: false,
        contextString: '',
        debateSummary: summary,
        metadata: {
          reason: 'Debate consensus is neutral',
          debateStrength: summary.consensusStrength,
          debateDirection: summary.consensusDirection,
          ageMs,
        },
      };
    }

    // Check if consensus strength is below threshold
    if (summary.consensusStrength < MIN_DEBATE_STRENGTH_THRESHOLD) {
      return {
        shouldInclude: false,
        contextString: '',
        debateSummary: summary,
        metadata: {
          reason: `Debate consensus strength (${summary.consensusStrength}%) below threshold (${MIN_DEBATE_STRENGTH_THRESHOLD}%)`,
          debateStrength: summary.consensusStrength,
          debateDirection: summary.consensusDirection,
          ageMs,
        },
      };
    }

    // Format the debate summary for inclusion in consensus prompts
    const formattedContext = formatConsensusContext(summary);

    return {
      shouldInclude: true,
      contextString: formattedContext,
      debateSummary: summary,
      metadata: {
        reason: 'Debate context included',
        debateStrength: summary.consensusStrength,
        debateDirection: summary.consensusDirection,
        ageMs,
      },
    };

  } catch (error) {
    console.error('[CVAULT-190] Error fetching debate context:', error);
    
    // Return safe fallback - don't break consensus if debate fetch fails
    return {
      shouldInclude: false,
      contextString: '',
      metadata: {
        reason: 'Error fetching debate context',
        debateStrength: 0,
        debateDirection: null,
        ageMs: Infinity,
      },
    };
  }
}

/**
 * Format debate summary specifically for consensus engine prompts
 * 
 * This creates a concise, impactful context string that trading analysts
 * can use to inform their decisions without being overwhelmed.
 */
function formatConsensusContext(summary: DebateSummary): string {
  const parts: string[] = [];

  // Header with clear labeling
  parts.push('=== AI PANEL DEBATE INSIGHTS ===');
  parts.push(`The 17-persona AI chatroom recently reached ${summary.consensusStrength}% ${summary.consensusDirection.toUpperCase()} consensus.`);
  parts.push('');

  // Key arguments from the winning side
  const winningArgs = summary.consensusDirection === 'bullish' 
    ? summary.keyBullishArguments 
    : summary.keyBearishArguments;
  
  if (winningArgs.length > 0) {
    parts.push(`Key ${summary.consensusDirection} arguments from the debate:`);
    winningArgs.forEach((arg, i) => {
      parts.push(`  ${i + 1}. ${arg}`);
    });
    parts.push('');
  }

  // Notable counter-arguments (from opposing side)
  const counterArgs = summary.consensusDirection === 'bullish' 
    ? summary.keyBearishArguments 
    : summary.keyBullishArguments;
  
  if (counterArgs.length > 0) {
    parts.push('Notable counter-arguments to consider:');
    counterArgs.slice(0, 2).forEach((arg, i) => { // Limit to top 2
      parts.push(`  ${i + 1}. ${arg}`);
    });
    parts.push('');
  }

  // Stance changes indicate strong persuasion
  if (summary.stanceChanges.length > 0) {
    parts.push('Persuasion indicators:');
    summary.stanceChanges.slice(0, 2).forEach(change => {
      parts.push(`  - ${change.handle || change.personaId} shifted from ${change.from} to ${change.to}`);
    });
    parts.push('');
  }

  // Key data points referenced
  if (summary.topDataPoints.length > 0) {
    parts.push(`Data points emphasized: ${summary.topDataPoints.join(', ')}`);
    parts.push('');
  }

  // Guidance for analysts
  parts.push('Consider these debate insights alongside your technical and on-chain analysis.');
  parts.push('=== END DEBATE INSIGHTS ===');

  return parts.join('\n');
}

/**
 * Merge debate context with user-provided context
 * 
 * Creates a combined context string that preserves both the user's
 * input and the debate insights, with clear separation.
 */
export function mergeDebateContextWithUserContext(
  debateContext: string,
  userContext?: string
): string {
  const parts: string[] = [];

  // Always include debate context first (establishes market sentiment)
  if (debateContext) {
    parts.push(debateContext);
    parts.push('');
  }

  // Add user context if provided
  if (userContext && userContext.trim()) {
    parts.push('=== ADDITIONAL CONTEXT ===');
    parts.push(userContext.trim());
    parts.push('=== END ADDITIONAL CONTEXT ===');
  }

  return parts.join('\n');
}

/**
 * Quick check if debate context is available and significant
 * 
 * Use this for UI indicators or conditional rendering.
 */
export async function hasSignificantDebateContext(): Promise<boolean> {
  try {
    const summary = await getDebateSummary();
    if (!summary) return false;
    
    const ageMs = Date.now() - summary.timestamp;
    
    return (
      summary.consensusStrength >= MIN_DEBATE_STRENGTH_THRESHOLD &&
      ageMs <= MAX_DEBATE_AGE_MS &&
      summary.consensusDirection !== 'neutral' &&
      !!summary.consensusDirection
    );
  } catch {
    return false;
  }
}

/**
 * Get debate context statistics for logging/monitoring
 */
export async function getDebateContextStats(): Promise<{
  hasContext: boolean;
  strength: number;
  direction: MessageSentiment | null;
  ageMinutes: number;
  argumentCount: number;
  stanceChangeCount: number;
} | null> {
  try {
    const summary = await getDebateSummary();
    if (!summary) return null;

    return {
      hasContext: true,
      strength: summary.consensusStrength,
      direction: summary.consensusDirection,
      ageMinutes: Math.round((Date.now() - summary.timestamp) / 60000),
      argumentCount: summary.keyBullishArguments.length + summary.keyBearishArguments.length,
      stanceChangeCount: summary.stanceChanges.length,
    };
  } catch {
    return null;
  }
}

/**
 * Configuration for debate context injection
 */
export const DEBATE_CONTEXT_CONFIG = {
  MIN_DEBATE_STRENGTH_THRESHOLD,
  MAX_DEBATE_AGE_MS,
  MAX_DEBATE_AGE_MINUTES: MAX_DEBATE_AGE_MS / 60000,
} as const;
