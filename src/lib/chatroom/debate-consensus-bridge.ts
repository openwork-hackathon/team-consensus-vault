/**
 * Debate-to-Consensus Bridge
 * CVAULT-190: Wire Debate Arguments into Consensus Round Prompts
 * 
 * This module bridges the debate arena with the consensus phase by:
 * 1. Capturing key arguments from all participating personas during DEBATE phase
 * 2. Summarizing positions taken (bullish, bearish, cautious, etc.)
 * 3. Injecting structured debate context into consensus phase prompts
 * 4. Influencing consensus weighting based on argument quality/engagement
 */

import { ChatMessage, MessageSentiment, DebateSummary, StanceChangeSummary } from './types';
import { PersuasionState } from './persuasion';

// Configuration for argument quality scoring
const ARGUMENT_QUALITY_CONFIG = {
  MIN_CONFIDENCE_FOR_IMPACT: 60,        // Minimum confidence to be considered impactful
  HIGH_CONFIDENCE_THRESHOLD: 80,        // High confidence bonus threshold
  DATA_BACKED_BONUS: 15,                // Bonus for messages with specific data
  ACKNOWLEDGMENT_BONUS: 10,             // Bonus for acknowledging opposing views
  ENGAGEMENT_WEIGHT_FACTOR: 0.3,        // How much engagement affects weight
  MAX_ARGUMENTS_IN_PROMPT: 5,           // Maximum arguments to include in prompt
  MAX_STANCE_CHANGES_IN_PROMPT: 3,      // Maximum stance changes to include
};

/**
 * Represents a scored argument from the debate
 */
export interface ScoredArgument {
  personaId: string;
  handle: string;
  content: string;
  sentiment: MessageSentiment;
  confidence: number;
  qualityScore: number;           // 0-100 calculated quality score
  dataPoints: string[];           // Specific data points referenced
  engagementScore: number;        // Based on responses/reactions
  isAcknowledgingOpposingView: boolean;
  timestamp: number;
}

/**
 * Structured debate context for consensus prompts
 */
export interface DebateContextForConsensus {
  summary: {
    totalMessages: number;
    debateDuration: number;         // in milliseconds
    dominantSentiment: MessageSentiment;
    sentimentDistribution: {
      bullish: number;
      bearish: number;
      neutral: number;
    };
  };
  keyArguments: {
    bullish: ScoredArgument[];
    bearish: ScoredArgument[];
    neutral: ScoredArgument[];
  };
  pointsOfAgreement: string[];      // Areas where both sides agree
  pointsOfDisagreement: string[];   // Key contentious points
  stanceChanges: StanceChangeSummary[];
  mostCompellingBullish: ScoredArgument | null;
  mostCompellingBearish: ScoredArgument | null;
  dataPointsReferenced: string[];   // All unique data points mentioned
  consensusInfluencers: string[];   // Personas whose arguments had highest impact
}

/**
 * Calculate quality score for a debate message
 * Higher scores indicate more impactful, well-reasoned arguments
 */
export function calculateArgumentQuality(
  message: ChatMessage,
  allMessages: ChatMessage[],
  persuasionStates?: Record<string, PersuasionState>
): number {
  let score = 0;

  // Base score from confidence
  const confidence = message.confidence || 50;
  score += confidence * 0.4; // 40% weight on confidence

  // High confidence bonus
  if (confidence >= ARGUMENT_QUALITY_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    score += 10;
  }

  // Data-backed arguments score higher
  if (hasSpecificData(message.content)) {
    score += ARGUMENT_QUALITY_CONFIG.DATA_BACKED_BONUS;
  }

  // Acknowledging opposing views shows nuanced thinking
  if (message.acknowledgesOpposingView) {
    score += ARGUMENT_QUALITY_CONFIG.ACKNOWLEDGMENT_BONUS;
  }

  // Check if this message caused any stance changes (highest impact)
  if (persuasionStates && causedStanceChange(message, persuasionStates)) {
    score += 25;
  }

  // Engagement score based on responses
  const engagementScore = calculateEngagementScore(message, allMessages);
  score += engagementScore * ARGUMENT_QUALITY_CONFIG.ENGAGEMENT_WEIGHT_FACTOR;

  return Math.min(100, Math.max(0, score));
}

/**
 * Check if message contains specific data/numbers
 */
function hasSpecificData(content: string): boolean {
  const dataPatterns = [
    /\d+%/,           // Percentages
    /\$[\d,]+/,       // Dollar amounts
    /\d+\s*(k|m|b)/i, // Large numbers
    /\d+h|\d+d/i,     // Timeframes
    /support|resistance|volume|market.?cap/i,
    /RSI|MACD|EMA|SMA/i, // Technical indicators
    /\d+\.?\d*\s*(million|billion|m|b)/i, // Large figures
  ];

  return dataPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if a message caused a stance change in any persona
 */
function causedStanceChange(
  message: ChatMessage,
  persuasionStates: Record<string, PersuasionState>
): boolean {
  for (const [personaId, state] of Object.entries(persuasionStates)) {
    if (personaId === message.personaId) continue;
    
    const recentChange = state.stanceHistory?.find(
      (entry: { triggeredBy?: string; timestamp: number }) =>
        entry.triggeredBy === message.id
    );
    
    if (recentChange) return true;
  }
  return false;
}

/**
 * Calculate engagement score for a message
 * Based on how many responses it generated and their sentiment
 */
function calculateEngagementScore(message: ChatMessage, allMessages: ChatMessage[]): number {
  const messageIndex = allMessages.findIndex(m => m.id === message.id);
  if (messageIndex === -1) return 0;

  // Look at next 5 messages for responses
  const subsequentMessages = allMessages.slice(messageIndex + 1, messageIndex + 6);
  
  let engagementScore = 0;
  
  for (const response of subsequentMessages) {
    // Direct responses (acknowledging the message) count more
    if (response.content.toLowerCase().includes(message.handle.toLowerCase())) {
      engagementScore += 15;
    }
    
    // Any response within window counts
    engagementScore += 5;
    
    // Responses with opposing views show the message was thought-provoking
    if (response.sentiment && response.sentiment !== message.sentiment) {
      engagementScore += 10;
    }
  }

  return Math.min(50, engagementScore); // Cap at 50
}

/**
 * Extract all scored arguments from debate messages
 */
export function extractScoredArguments(
  messages: ChatMessage[],
  persuasionStates?: Record<string, PersuasionState>
): ScoredArgument[] {
  const debateMessages = messages.filter(m => 
    m.phase === 'DEBATE' && 
    m.sentiment && 
    m.confidence !== undefined
  );

  return debateMessages.map(msg => ({
    personaId: msg.personaId,
    handle: msg.handle,
    content: cleanMessageContent(msg.content),
    sentiment: msg.sentiment!,
    confidence: msg.confidence || 50,
    qualityScore: calculateArgumentQuality(msg, messages, persuasionStates),
    dataPoints: extractDataPoints(msg.content),
    engagementScore: calculateEngagementScore(msg, messages),
    isAcknowledgingOpposingView: msg.acknowledgesOpposingView || false,
    timestamp: msg.timestamp,
  }));
}

/**
 * Clean message content for argument extraction
 */
function cleanMessageContent(content: string): string {
  return content
    .replace(/\[SENTIMENT:[^\]]+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract specific data points mentioned in content
 */
function extractDataPoints(content: string): string[] {
  const dataPoints: string[] = [];
  
  // Extract percentages
  const percentages = content.match(/\d+%/g);
  if (percentages) dataPoints.push(...percentages);
  
  // Extract prices
  const prices = content.match(/\$[\d,]+(?:\.\d+)?/g);
  if (prices) dataPoints.push(...prices.slice(0, 2));
  
  // Extract large numbers
  const largeNumbers = content.match(/\d+\.?\d*\s*(million|billion|m|b)/gi);
  if (largeNumbers) dataPoints.push(...largeNumbers.slice(0, 2));
  
  return [...new Set(dataPoints)]; // Remove duplicates
}

/**
 * Identify points of agreement between opposing sides
 */
function findPointsOfAgreement(arguments_: ScoredArgument[]): string[] {
  const agreements: string[] = [];
  
  const bullishArgs = arguments_.filter(a => a.sentiment === 'bullish');
  const bearishArgs = arguments_.filter(a => a.sentiment === 'bearish');
  
  // Check for shared data points (both sides referencing same metrics)
  const bullishDataPoints = new Set(bullishArgs.flatMap(a => a.dataPoints));
  const bearishDataPoints = new Set(bearishArgs.flatMap(a => a.dataPoints));
  
  for (const point of bullishDataPoints) {
    if (bearishDataPoints.has(point)) {
      agreements.push(`Both sides referenced ${point}`);
    }
  }
  
  // Check for shared concerns (e.g., both mention volatility)
  const sharedKeywords = ['volatility', 'volume', 'support', 'resistance'];
  for (const keyword of sharedKeywords) {
    const bullishMentions = bullishArgs.some(a => 
      a.content.toLowerCase().includes(keyword)
    );
    const bearishMentions = bearishArgs.some(a => 
      a.content.toLowerCase().includes(keyword)
    );
    if (bullishMentions && bearishMentions) {
      agreements.push(`Both sides acknowledge ${keyword} as a key factor`);
    }
  }
  
  return agreements.slice(0, 3);
}

/**
 * Identify key points of disagreement
 */
function findPointsOfDisagreement(arguments_: ScoredArgument[]): string[] {
  const disagreements: string[] = [];
  
  const bullishArgs = arguments_.filter(a => a.sentiment === 'bullish');
  const bearishArgs = arguments_.filter(a => a.sentiment === 'bearish');
  
  // Find high-quality opposing arguments
  const topBullish = bullishArgs
    .filter(a => a.qualityScore >= ARGUMENT_QUALITY_CONFIG.MIN_CONFIDENCE_FOR_IMPACT)
    .sort((a, b) => b.qualityScore - a.qualityScore)[0];
    
  const topBearish = bearishArgs
    .filter(a => a.qualityScore >= ARGUMENT_QUALITY_CONFIG.MIN_CONFIDENCE_FOR_IMPACT)
    .sort((a, b) => b.qualityScore - a.qualityScore)[0];
  
  if (topBullish && topBearish) {
    disagreements.push(`Bullish view: "${summarizeArgument(topBullish.content)}"`);
    disagreements.push(`Bearish view: "${summarizeArgument(topBearish.content)}"`);
  }
  
  return disagreements;
}

/**
 * Summarize an argument concisely
 */
function summarizeArgument(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}

/**
 * Build comprehensive debate context for consensus phase
 */
export function buildDebateContextForConsensus(
  messages: ChatMessage[],
  debateSummary: DebateSummary,
  persuasionStates?: Record<string, PersuasionState>
): DebateContextForConsensus {
  const scoredArguments = extractScoredArguments(messages, persuasionStates);
  
  // Calculate sentiment distribution
  const sentimentDistribution = {
    bullish: scoredArguments.filter(a => a.sentiment === 'bullish').length,
    bearish: scoredArguments.filter(a => a.sentiment === 'bearish').length,
    neutral: scoredArguments.filter(a => a.sentiment === 'neutral').length,
  };
  
  const total = scoredArguments.length;
  const dominantSentiment: MessageSentiment = 
    sentimentDistribution.bullish > sentimentDistribution.bearish ? 'bullish' :
    sentimentDistribution.bearish > sentimentDistribution.bullish ? 'bearish' : 'neutral';
  
  // Get top arguments by quality score
  const sortedByQuality = [...scoredArguments].sort((a, b) => b.qualityScore - a.qualityScore);
  
  const topBullish = scoredArguments
    .filter(a => a.sentiment === 'bullish')
    .sort((a, b) => b.qualityScore - a.qualityScore)[0] || null;
    
  const topBearish = scoredArguments
    .filter(a => a.sentiment === 'bearish')
    .sort((a, b) => b.qualityScore - a.qualityScore)[0] || null;
  
  // Get consensus influencers (personas with highest quality arguments)
  const influencerMap = new Map<string, number>();
  for (const arg of sortedByQuality.slice(0, 10)) {
    const current = influencerMap.get(arg.handle) || 0;
    influencerMap.set(arg.handle, current + arg.qualityScore);
  }
  const consensusInfluencers = Array.from(influencerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([handle]) => handle);
  
  // Calculate debate duration
  const debateMessages = messages.filter(m => m.phase === 'DEBATE');
  const debateDuration = debateMessages.length > 1 
    ? debateMessages[debateMessages.length - 1].timestamp - debateMessages[0].timestamp
    : 0;
  
  return {
    summary: {
      totalMessages: debateMessages.length,
      debateDuration,
      dominantSentiment,
      sentimentDistribution,
    },
    keyArguments: {
      bullish: scoredArguments
        .filter(a => a.sentiment === 'bullish')
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, ARGUMENT_QUALITY_CONFIG.MAX_ARGUMENTS_IN_PROMPT),
      bearish: scoredArguments
        .filter(a => a.sentiment === 'bearish')
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, ARGUMENT_QUALITY_CONFIG.MAX_ARGUMENTS_IN_PROMPT),
      neutral: scoredArguments
        .filter(a => a.sentiment === 'neutral')
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 2),
    },
    pointsOfAgreement: findPointsOfAgreement(scoredArguments),
    pointsOfDisagreement: findPointsOfDisagreement(scoredArguments),
    stanceChanges: debateSummary.stanceChanges.slice(0, ARGUMENT_QUALITY_CONFIG.MAX_STANCE_CHANGES_IN_PROMPT),
    mostCompellingBullish: topBullish,
    mostCompellingBearish: topBearish,
    dataPointsReferenced: [...new Set(scoredArguments.flatMap(a => a.dataPoints))].slice(0, 8),
    consensusInfluencers,
  };
}

/**
 * Format debate context for inclusion in consensus prompts
 */
export function formatDebateContextForPrompt(context: DebateContextForConsensus): string {
  const lines: string[] = [];
  
  lines.push('=== DEBATE CONTEXT ===');
  lines.push('');
  
  // Summary
  lines.push(`Debate Summary: ${context.summary.totalMessages} messages, ${context.summary.debateDuration / 1000 / 60} minutes`);
  lines.push(`Sentiment Distribution: ${context.summary.sentimentDistribution.bullish} bullish, ${context.summary.sentimentDistribution.bearish} bearish, ${context.summary.sentimentDistribution.neutral} neutral`);
  lines.push('');
  
  // Key Arguments
  if (context.keyArguments.bullish.length > 0) {
    lines.push('Key Bullish Arguments:');
    context.keyArguments.bullish.forEach((arg, i) => {
      lines.push(`  ${i + 1}. ${arg.handle}: "${summarizeArgument(arg.content)}" (quality: ${Math.round(arg.qualityScore)})`);
    });
    lines.push('');
  }
  
  if (context.keyArguments.bearish.length > 0) {
    lines.push('Key Bearish Arguments:');
    context.keyArguments.bearish.forEach((arg, i) => {
      lines.push(`  ${i + 1}. ${arg.handle}: "${summarizeArgument(arg.content)}" (quality: ${Math.round(arg.qualityScore)})`);
    });
    lines.push('');
  }
  
  // Points of agreement
  if (context.pointsOfAgreement.length > 0) {
    lines.push('Points of Agreement:');
    context.pointsOfAgreement.forEach(point => {
      lines.push(`  • ${point}`);
    });
    lines.push('');
  }
  
  // Points of disagreement
  if (context.pointsOfDisagreement.length > 0) {
    lines.push('Key Disagreements:');
    context.pointsOfDisagreement.forEach(point => {
      lines.push(`  • ${point}`);
    });
    lines.push('');
  }
  
  // Stance changes
  if (context.stanceChanges.length > 0) {
    lines.push('Notable Stance Changes:');
    context.stanceChanges.forEach(change => {
      lines.push(`  • ${change.handle}: ${change.from} → ${change.to}`);
    });
    lines.push('');
  }
  
  // Data points
  if (context.dataPointsReferenced.length > 0) {
    lines.push(`Key Data Referenced: ${context.dataPointsReferenced.join(', ')}`);
    lines.push('');
  }
  
  // Influencers
  if (context.consensusInfluencers.length > 0) {
    lines.push(`Most Influential Voices: ${context.consensusInfluencers.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Calculate consensus influence weights based on argument quality
 * Returns a map of persona IDs to influence weights (0-1)
 */
export function calculateConsensusInfluenceWeights(
  messages: ChatMessage[],
  persuasionStates?: Record<string, PersuasionState>
): Map<string, number> {
  const scoredArguments = extractScoredArguments(messages, persuasionStates);
  const weights = new Map<string, number>();
  
  // Group arguments by persona
  const argsByPersona = new Map<string, ScoredArgument[]>();
  for (const arg of scoredArguments) {
    const existing = argsByPersona.get(arg.personaId) || [];
    existing.push(arg);
    argsByPersona.set(arg.personaId, existing);
  }
  
  // Calculate weight for each persona
  for (const [personaId, args] of argsByPersona) {
    // Average quality score
    const avgQuality = args.reduce((sum, a) => sum + a.qualityScore, 0) / args.length;
    
    // Bonus for number of high-quality contributions
    const highQualityCount = args.filter(a => a.qualityScore >= 70).length;
    const quantityBonus = Math.min(20, highQualityCount * 5);
    
    // Bonus for causing stance changes
    const stanceChangeBonus = args.some(a => a.qualityScore > 90) ? 15 : 0;
    
    const totalWeight = Math.min(100, avgQuality + quantityBonus + stanceChangeBonus) / 100;
    weights.set(personaId, totalWeight);
  }
  
  return weights;
}

/**
 * Apply influence weights to consensus calculation
 * Returns adjusted consensus strength based on argument quality
 */
export function applyInfluenceWeighting(
  baseConsensusStrength: number,
  messages: ChatMessage[],
  persuasionStates?: Record<string, PersuasionState>
): number {
  const weights = calculateConsensusInfluenceWeights(messages, persuasionStates);
  
  if (weights.size === 0) return baseConsensusStrength;
  
  // Calculate average influence weight
  const avgWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0) / weights.size;
  
  // Adjust consensus strength: higher quality arguments = more confident consensus
  // Scale factor: 0.8 to 1.2 based on average argument quality
  const scaleFactor = 0.8 + (avgWeight * 0.4);
  
  return Math.min(100, Math.round(baseConsensusStrength * scaleFactor));
}

/**
 * Build enhanced consensus prompt with debate context
 */
export function buildConsensusPromptWithDebateContext(
  personaHandle: string,
  consensusDirection: MessageSentiment,
  consensusStrength: number,
  debateContext: DebateContextForConsensus,
  recentMessages: string
): { systemPrompt: string; userPrompt: string } {
  const debateContextText = formatDebateContextForPrompt(debateContext);
  
  const systemPrompt = `You are ${personaHandle}, participating in the consensus phase of a crypto market debate.

The room has reached a ${consensusDirection.toUpperCase()} consensus with ${consensusStrength}% agreement strength.

${debateContextText}

Your role now is to:
1. Acknowledge the consensus that emerged from the debate
2. Reference specific arguments made during the debate that influenced this outcome
3. Note any points where you agreed or disagreed with the majority
4. Provide a brief, character-appropriate reaction to the final consensus

Stay in character. Be concise (1-2 sentences). Reference specific data points or arguments from the debate context above when relevant.

End with [SENTIMENT: ${consensusDirection}, CONFIDENCE: ${consensusStrength}]`;

  const userPrompt = `Recent discussion:
${recentMessages}

The debate has concluded with a ${consensusDirection.toUpperCase()} consensus (${consensusStrength}% strength).

React to this outcome based on the debate context provided. Did the consensus align with your arguments? Did any particular argument change your mind or reinforce your position? Keep it brief and in character.`;

  return { systemPrompt, userPrompt };
}

// Export configuration for testing
export { ARGUMENT_QUALITY_CONFIG };