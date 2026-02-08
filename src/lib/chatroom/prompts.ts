import { Persona, ChatMessage } from './types';

function formatRecentMessages(messages: ChatMessage[], limit: number = 10): string {
  const recent = messages.slice(-limit);
  if (recent.length === 0) return '(No messages yet — you are starting the conversation.)';

  return recent
    .map(m => {
      const sentiment = m.sentiment ? ` [${m.sentiment}]` : '';
      return `${m.handle}: ${m.content}${sentiment}`;
    })
    .join('\n');
}

export function buildDebatePrompt(persona: Persona, recentMessages: ChatMessage[]): string {
  const systemPrompt = `${persona.personalityPrompt}

You are in a live crypto chat room debating the current market. Stay in character at all times. Respond naturally as if chatting — no greetings, no "I think", just jump into your take.

IMPORTANT: End your message with a sentiment tag in this exact format:
[SENTIMENT: bullish|bearish|neutral, CONFIDENCE: 0-100]

The sentiment tag should reflect YOUR genuine assessment based on your persona's perspective. The confidence is how strongly you feel about it.

Example response:
BTC holding 44k support cleanly, volume profile showing accumulation. Next leg up targets 48k if we clear the 45.5k resistance.
[SENTIMENT: bullish, CONFIDENCE: 72]`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages)}

Your turn to speak. React to what others have said, add your perspective, or bring up something new. Stay concise (2-4 sentences max). Remember to end with [SENTIMENT: ..., CONFIDENCE: ...].`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

export function buildCooldownPrompt(persona: Persona, recentMessages: ChatMessage[]): string {
  const systemPrompt = `${persona.personalityPrompt}

You are in a crypto chat room during a chill period. A trade signal just fired and the room is winding down. No market analysis needed — just hang out. Talk about crypto culture, memes, past experiences, hot takes, or banter with others. Keep it fun and casual. Stay in character. No sentiment tags needed.`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages)}

Your turn. Keep it casual and fun. 1-3 sentences. No market analysis or sentiment tags.`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

export function buildModeratorPrompt(
  personaIds: string[],
  personaHandles: Record<string, string>,
  recentMessages: ChatMessage[],
  recentSpeakers: string[]
): string {
  const availablePersonas = personaIds
    .map(id => `- ${id} (${personaHandles[id]})`)
    .join('\n');

  const recentSpeakerList = recentSpeakers.length > 0
    ? recentSpeakers.map(id => personaHandles[id] || id).join(', ')
    : 'none';

  const systemPrompt = `You are a chat room moderator. Your ONLY job is to pick who speaks next. Consider:
1. Don't let the same person speak twice in a row
2. Favor personas who haven't spoken recently
3. Pick someone whose perspective would add to or challenge what was just said
4. Mix up the models/viewpoints for variety

Available personas:
${availablePersonas}

Recently spoke (most recent first): ${recentSpeakerList}

Respond with ONLY a JSON object: {"nextSpeakerId": "persona_id", "reason": "brief reason"}`;

  const userPrompt = `Recent chat:
${formatRecentMessages(recentMessages, 5)}

Who should speak next? Respond with ONLY valid JSON.`;

  return JSON.stringify({ systemPrompt, userPrompt });
}
