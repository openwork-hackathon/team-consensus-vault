import { Persona, ChatMessage, MessageSentiment, DebateSummary } from './types';
import { MarketData, formatMarketDataForPrompt, getMarketTalkingPoints } from './market-data';
import { PersuasionState, getPersuasionSummary, shouldAcknowledgeOpposingView, generateAcknowledgmentPrompt } from './persuasion';
import { formatDebateSummaryForPrompt } from './argument-extractor';

function formatRecentMessages(messages: ChatMessage[], limit: number = 10): string {
  const recent = messages.slice(-limit);
  if (recent.length === 0) return '(No messages yet — you are starting the conversation.)';

  return recent
    .map(m => {
      const sentiment = m.sentiment ? ` [${m.sentiment}]` : '';
      const confidence = m.confidence ? ` (${m.confidence}%)` : '';
      return `${m.handle}: ${m.content}${sentiment}${confidence}`;
    })
    .join('\n');
}

/**
 * Build debate prompt with market data, persuasion context, and previous debate summary
 * CVAULT-185: Enhanced with real market data and persuadability
 * CVAULT-190: Enhanced with previous debate context
 */
export function buildDebatePrompt(
  persona: Persona, 
  recentMessages: ChatMessage[],
  marketData?: MarketData,
  persuasionState?: PersuasionState,
  asset: string = 'BTC',
  previousDebateSummary?: DebateSummary
): string {
  // Build market data context
  let marketContext = '';
  if (marketData) {
    marketContext = formatMarketDataForPrompt(marketData, asset);
    
    // Add talking points specific to this persona's style
    const talkingPoints = getMarketTalkingPoints(marketData);
    if (talkingPoints.length > 0) {
      marketContext += '\nKey observations you might reference:\n';
      talkingPoints.slice(0, 3).forEach(point => {
        marketContext += `- ${point}\n`;
      });
    }
  }

  // Build persuasion context
  let persuasionContext = '';
  if (persuasionState) {
    persuasionContext = '\n' + getPersuasionSummary(persuasionState);
    
    // Check if we should acknowledge an opposing view
    const lastOpposingMessage = recentMessages
      .slice(-5)
      .reverse()
      .find(m => m.sentiment && m.sentiment !== persuasionState.currentStance);
    
    if (lastOpposingMessage && shouldAcknowledgeOpposingView(persuasionState, lastOpposingMessage)) {
      persuasionContext += '\n\n' + generateAcknowledgmentPrompt(persuasionState, lastOpposingMessage);
    }
  }

  // Build previous debate context (CVAULT-190)
  let previousDebateContext = '';
  if (previousDebateSummary) {
    previousDebateContext = '\n\n=== PREVIOUS DEBATE ROUND CONTEXT ===\n';
    previousDebateContext += formatDebateSummaryForPrompt(previousDebateSummary);
    previousDebateContext += '\n\nUse this context to build on strong arguments, counter weak ones, or bring new data that shifts the debate. You can reference specific points made previously or introduce fresh analysis.';
  }

  const systemPrompt = `${persona.personalityPrompt}

${marketContext}

You are in a live crypto chat room debating the current market. Stay in character at all times. Respond naturally as if chatting — no greetings, no "I think", just jump into your take.

CRITICAL: You MUST reference actual market data in your arguments. Use specific numbers, percentages, and metrics from the market data provided above. Instead of saying "I think it will go up", say something like "The 24h volume spike of 340% combined with holding above $45k support suggests..."

${persuasionContext}
${previousDebateContext}

IMPORTANT: End your message with a sentiment tag in this exact format:
[SENTIMENT: bullish|bearish|neutral, CONFIDENCE: 0-100]

The sentiment tag should reflect YOUR genuine assessment based on your persona's perspective AND the market data. The confidence is how strongly you feel about it (0-100).

Example response:
BTC holding 44k support cleanly, volume profile showing accumulation with $28B in 24h volume. Next leg up targets 48k if we clear the 45.5k resistance.
[SENTIMENT: bullish, CONFIDENCE: 72]`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages)}

Your turn to speak. React to what others have said, add your perspective using the market data provided, or bring up something new. Stay concise (2-4 sentences max). Remember to end with [SENTIMENT: ..., CONFIDENCE: ...].

Guidelines:
- Cite specific numbers from the market data (prices, percentages, volumes)
- If you disagree with someone, explain why using data
- If the data supports your view, highlight the key metrics
- Be willing to acknowledge strong arguments from others if your conviction is low
- If there's a previous debate summary, build on those arguments or counter them with new data`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

/**
 * Build cooldown prompt (casual chat, no market analysis)
 */
export function buildCooldownPrompt(persona: Persona, recentMessages: ChatMessage[]): string {
  const systemPrompt = `${persona.personalityPrompt}

You are in a crypto chat room during a chill period. A trade signal just fired and the room is winding down. No market analysis needed — just hang out. Talk about crypto culture, memes, past experiences, hot takes, or banter with others. Keep it fun and casual. Stay in character. No sentiment tags needed.`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages)}

Your turn. Keep it casual and fun. 1-3 sentences. No market analysis or sentiment tags.`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

/**
 * Build consensus phase prompt (acknowledging the consensus)
 */
export function buildConsensusPrompt(
  persona: Persona,
  recentMessages: ChatMessage[],
  consensusDirection: MessageSentiment,
  consensusStrength: number,
  marketData?: MarketData,
  asset: string = 'BTC'
): string {
  let marketContext = '';
  if (marketData) {
    marketContext = formatMarketDataForPrompt(marketData, asset);
  }

  const systemPrompt = `${persona.personalityPrompt}

${marketContext}

The chat room has reached a ${consensusDirection.toUpperCase()} consensus with ${consensusStrength}% agreement. The debate phase is concluding. React to the consensus — do you agree with the group's assessment? Did the market data support this conclusion? Stay in character. Be brief (1-2 sentences).

End with [SENTIMENT: ${consensusDirection}, CONFIDENCE: ${consensusStrength}]`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages)}

The room has reached consensus: ${consensusDirection.toUpperCase()} (${consensusStrength}% strength). Give your final thoughts on whether this consensus is justified by the data. 1-2 sentences max.`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

/**
 * Build moderator prompt for picking next speaker
 * Now considers persuasion dynamics and who should respond to whom
 */
export function buildModeratorPrompt(
  personaIds: string[],
  personaHandles: Record<string, string>,
  recentMessages: ChatMessage[],
  recentSpeakers: string[],
  persuasionStates?: Record<string, PersuasionState>
): string {
  const availablePersonas = personaIds
    .map(id => {
      const conviction = persuasionStates?.[id]?.conviction;
      const stance = persuasionStates?.[id]?.currentStance;
      const extra = conviction ? ` [${stance}, ${conviction} conviction]` : '';
      return `- ${id} (${personaHandles[id]})${extra}`;
    })
    .join('\n');

  const recentSpeakerList = recentSpeakers.length > 0
    ? recentSpeakers.map(id => personaHandles[id] || id).join(', ')
    : 'none';

  // Analyze recent conversation for context
  const lastMessage = recentMessages[recentMessages.length - 1];
  let conversationContext = '';
  if (lastMessage) {
    conversationContext = `\nLast message was from ${lastMessage.handle} (${lastMessage.sentiment}, ${lastMessage.confidence}% confidence).`;
    
    // Check if there's a contentious point that needs response
    const recentBullish = recentMessages.slice(-5).filter(m => m.sentiment === 'bullish').length;
    const recentBearish = recentMessages.slice(-5).filter(m => m.sentiment === 'bearish').length;
    
    if (recentBullish > recentBearish + 1) {
      conversationContext += ` The room is heavily bullish; consider selecting a bearish voice for balance.`;
    } else if (recentBearish > recentBullish + 1) {
      conversationContext += ` The room is heavily bearish; consider selecting a bullish voice for balance.`;
    }
  }

  const systemPrompt = `You are a chat room moderator. Your ONLY job is to pick who speaks next. Consider:
1. Don't let the same person speak twice in a row
2. Favor personas who haven't spoken recently
3. Pick someone whose perspective would add to or challenge what was just said
4. Mix up the models/viewpoints for variety
5. If someone made a strong data-backed argument, pick someone who might respond to it
6. Consider conviction levels - wavering personas might need to speak to clarify their stance

Available personas:
${availablePersonas}

Recently spoke (most recent first): ${recentSpeakerList}${conversationContext}

Respond with ONLY a JSON object: {"nextSpeakerId": "persona_id", "reason": "brief reason"}`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages, 5)}

Who should speak next? Consider the conversation flow and who would add the most value. Respond with ONLY valid JSON.`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

/**
 * Build a prompt for when a persona is changing stance
 * This creates a natural transition message
 */
export function buildStanceChangePrompt(
  persona: Persona,
  recentMessages: ChatMessage[],
  oldStance: MessageSentiment,
  newStance: MessageSentiment,
  reason: string,
  marketData?: MarketData,
  asset: string = 'BTC'
): string {
  let marketContext = '';
  if (marketData) {
    marketContext = formatMarketDataForPrompt(marketData, asset);
  }

  const systemPrompt = `${persona.personalityPrompt}

${marketContext}

You are in a live crypto chat room. You've been ${oldStance} on the market, but you're now shifting to ${newStance} based on: ${reason}

IMPORTANT: Acknowledge your change of view naturally. Don't be dramatic about it - just evolve your position based on the data. Reference specific metrics that changed your mind. Stay in character.

End with [SENTIMENT: ${newStance}, CONFIDENCE: 60]`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages)}

You've been ${oldStance}, but you're now shifting to ${newStance} because: ${reason}

Express this shift naturally in your character's voice. 2-3 sentences max. Reference the specific data that changed your mind.`;

  return JSON.stringify({ systemPrompt, userPrompt });
}
