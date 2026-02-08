import { ChatMessage, ChatRoomState, ChatPhase, MessageSentiment } from './types';
import { PERSONAS, PERSONAS_BY_ID } from './personas';
import { callModelRaw } from './model-caller';
import { buildDebatePrompt, buildCooldownPrompt, buildModeratorPrompt } from './prompts';
import { calculateRollingConsensus } from './consensus-calc';

const CONSENSUS_THRESHOLD = 80;
const COOLDOWN_MIN_MINUTES = 15;
const COOLDOWN_MAX_MINUTES = 30;
const RECENT_SPEAKERS_LIMIT = 5;

interface GenerationResult {
  message: ChatMessage;
  state: ChatRoomState;
  consensusUpdate?: { direction: MessageSentiment | null; strength: number };
  phaseChange?: { from: ChatPhase; to: ChatPhase };
}

/**
 * Generate the next chat message. Core engine logic.
 */
export async function generateNextMessage(
  history: ChatMessage[],
  state: ChatRoomState
): Promise<GenerationResult> {
  let currentState = { ...state };
  let phaseChange: GenerationResult['phaseChange'] | undefined;

  // 1. Check if COOLDOWN has expired → transition to DEBATE
  if (currentState.phase === 'COOLDOWN' && currentState.cooldownEndsAt) {
    if (Date.now() >= currentState.cooldownEndsAt) {
      phaseChange = { from: 'COOLDOWN', to: 'DEBATE' };
      currentState.phase = 'DEBATE';
      currentState.phaseStartedAt = Date.now();
      currentState.cooldownEndsAt = null;
      currentState.consensusDirection = null;
      currentState.consensusStrength = 0;
    }
  }

  // 2. Pick next speaker via moderator
  const speakerId = await pickNextSpeaker(history, currentState);
  const persona = PERSONAS_BY_ID[speakerId];
  if (!persona) {
    throw new Error(`Unknown persona: ${speakerId}`);
  }

  // 3. Build prompt based on phase
  let promptData: { systemPrompt: string; userPrompt: string };

  if (currentState.phase === 'COOLDOWN') {
    promptData = JSON.parse(buildCooldownPrompt(persona, history));
  } else {
    promptData = JSON.parse(buildDebatePrompt(persona, history));
  }

  // 4. Call persona's model
  const rawResponse = await callModelRaw(
    persona.modelId,
    promptData.systemPrompt,
    promptData.userPrompt,
    250
  );

  // 5. Parse sentiment tag and strip from display content
  let content = rawResponse.trim();
  let sentiment: MessageSentiment | undefined;
  let confidence: number | undefined;

  if (currentState.phase === 'DEBATE') {
    const sentimentMatch = content.match(
      /\[SENTIMENT:\s*(bullish|bearish|neutral)\s*,\s*CONFIDENCE:\s*(\d+)\s*\]/i
    );
    if (sentimentMatch) {
      sentiment = sentimentMatch[1].toLowerCase() as MessageSentiment;
      confidence = Math.min(100, Math.max(0, parseInt(sentimentMatch[2], 10)));
      // Strip the tag from display content
      content = content.replace(sentimentMatch[0], '').trim();
    } else {
      // Default to neutral if no tag
      sentiment = 'neutral';
      confidence = 50;
    }
  }

  // 6. Create message
  const message: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    personaId: persona.id,
    handle: persona.handle,
    avatar: persona.avatar,
    content,
    sentiment,
    confidence,
    timestamp: Date.now(),
    phase: currentState.phase,
  };

  // 7. Update state
  currentState.lastMessageAt = message.timestamp;
  currentState.lastSpeakerId = persona.id;
  currentState.messageCount++;
  currentState.recentSpeakers = [
    persona.id,
    ...currentState.recentSpeakers.filter(id => id !== persona.id),
  ].slice(0, RECENT_SPEAKERS_LIMIT);

  // 8. If DEBATE: calculate rolling consensus
  let consensusUpdate: GenerationResult['consensusUpdate'] | undefined;

  if (currentState.phase === 'DEBATE' || currentState.phase === 'CONSENSUS') {
    const allMessages = [...history, message];
    const consensus = calculateRollingConsensus(allMessages);
    currentState.consensusDirection = consensus.direction;
    currentState.consensusStrength = consensus.strength;
    consensusUpdate = consensus;

    // Check if consensus threshold reached
    if (
      currentState.phase === 'DEBATE' &&
      consensus.strength >= CONSENSUS_THRESHOLD &&
      consensus.direction &&
      consensus.direction !== 'neutral'
    ) {
      // Transition: DEBATE → CONSENSUS → COOLDOWN
      phaseChange = { from: 'DEBATE', to: 'CONSENSUS' };
      currentState.phase = 'CONSENSUS';
      currentState.phaseStartedAt = Date.now();

      // Set cooldown timer (15-30 minutes)
      const cooldownMinutes = COOLDOWN_MIN_MINUTES +
        Math.random() * (COOLDOWN_MAX_MINUTES - COOLDOWN_MIN_MINUTES);
      currentState.cooldownEndsAt = Date.now() + cooldownMinutes * 60 * 1000;
    }

    // Auto-transition from CONSENSUS to COOLDOWN after 2 messages in consensus phase
    if (currentState.phase === 'CONSENSUS') {
      const consensusMessages = [...history, message].filter(
        m => m.phase === 'CONSENSUS'
      );
      if (consensusMessages.length >= 2) {
        currentState.phase = 'COOLDOWN';
        currentState.phaseStartedAt = Date.now();
        if (!currentState.cooldownEndsAt) {
          const cooldownMinutes = COOLDOWN_MIN_MINUTES +
            Math.random() * (COOLDOWN_MAX_MINUTES - COOLDOWN_MIN_MINUTES);
          currentState.cooldownEndsAt = Date.now() + cooldownMinutes * 60 * 1000;
        }
        phaseChange = { from: 'CONSENSUS', to: 'COOLDOWN' };
      }
    }
  }

  // 9. Pre-select next speaker for typing indicator
  try {
    const nextSpeaker = await pickNextSpeaker([...history, message], currentState);
    currentState.nextSpeakerId = nextSpeaker;
  } catch {
    currentState.nextSpeakerId = null;
  }

  return { message, state: currentState, consensusUpdate, phaseChange };
}

/**
 * Use DeepSeek as moderator to pick the next speaker.
 */
async function pickNextSpeaker(
  history: ChatMessage[],
  state: ChatRoomState
): Promise<string> {
  const personaIds = PERSONAS.map(p => p.id);
  const personaHandles: Record<string, string> = {};
  for (const p of PERSONAS) {
    personaHandles[p.id] = p.handle;
  }

  const promptData = JSON.parse(
    buildModeratorPrompt(personaIds, personaHandles, history, state.recentSpeakers)
  );

  try {
    const response = await callModelRaw(
      'deepseek',
      promptData.systemPrompt,
      promptData.userPrompt,
      60
    );

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.nextSpeakerId && personaIds.includes(parsed.nextSpeakerId)) {
        return parsed.nextSpeakerId;
      }
    }
  } catch (error) {
    console.warn('[chatroom-engine] Moderator failed, picking randomly:', error);
  }

  // Fallback: pick randomly, avoiding recent speakers
  const candidates = personaIds.filter(
    id => id !== state.lastSpeakerId && !state.recentSpeakers.slice(0, 2).includes(id)
  );
  const pool = candidates.length > 0 ? candidates : personaIds;
  return pool[Math.floor(Math.random() * pool.length)];
}
