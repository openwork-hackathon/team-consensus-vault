/**
 * Enhanced Chatroom Engine with Market Data and Persuasion
 * CVAULT-185: Real market data integration and persuadable personas
 */

import { ChatMessage, ChatRoomState, ChatPhase, MessageSentiment } from './types';
import { PERSONAS, PERSONAS_BY_ID } from './personas';
import { callModelRaw } from './model-caller';
import { ChatroomError, createUserFacingError } from './error-types';
import { buildDebatePrompt, buildCooldownPrompt, buildModeratorPrompt } from './prompts';
import { calculateRollingConsensus } from './consensus-calc';
import { fetchMarketData, MarketData } from './market-data';
import { 
  PersuasionStore, 
  PersuasionState, 
  calculatePersuasionImpact,
  applyPersuasion,
  updateStance,
  shouldAcknowledgeOpposingView,
  generateAcknowledgmentPrompt
} from './persuasion';

const CONSENSUS_THRESHOLD = 80;
const COOLDOWN_MIN_MINUTES = 15;
const COOLDOWN_MAX_MINUTES = 30;
const RECENT_SPEAKERS_LIMIT = 5;

interface EnhancedGenerationResult {
  message: ChatMessage;
  state: EnhancedChatRoomState;
  persuasionState: PersuasionState;
  consensusUpdate?: { direction: MessageSentiment | null; strength: number };
  phaseChange?: { from: ChatPhase; to: ChatPhase };
  stanceChanged?: boolean;
  previousStance?: MessageSentiment;
}

interface EnhancedChatRoomState extends ChatRoomState {
  persuasionStore: PersuasionStore;
  lastMarketData?: MarketData;
  marketDataTimestamp?: number;
}

/**
 * Initialize enhanced chatroom state with persuasion tracking
 */
export function initializeEnhancedState(): EnhancedChatRoomState {
  const store = new PersuasionStore(`debate_${Date.now()}`);
  
  // Initialize all personas with neutral stance
  PERSONAS.forEach(persona => {
    store.initializePersona(persona.id, 'neutral');
  });

  return {
    phase: 'DEBATE',
    phaseStartedAt: Date.now(),
    cooldownEndsAt: null,
    lastMessageAt: Date.now(),
    lastSpeakerId: null,
    messageCount: 0,
    nextSpeakerId: null,
    consensusDirection: null,
    consensusStrength: 0,
    recentSpeakers: [],
    persuasionStore: store,
  };
}

/**
 * Generate next message with market data and persuasion
 */
export async function generateNextMessageEnhanced(
  history: ChatMessage[],
  state: EnhancedChatRoomState,
  asset: string = 'BTC'
): Promise<EnhancedGenerationResult> {
  let currentState = { ...state };
  let phaseChange: EnhancedGenerationResult['phaseChange'] | undefined;
  let stanceChanged = false;
  let previousStance: MessageSentiment | undefined;

  // 1. Check cooldown expiration
  if (currentState.phase === 'COOLDOWN' && currentState.cooldownEndsAt) {
    if (Date.now() >= currentState.cooldownEndsAt) {
      phaseChange = { from: 'COOLDOWN', to: 'DEBATE' };
      currentState.phase = 'DEBATE';
      currentState.phaseStartedAt = Date.now();
      currentState.cooldownEndsAt = null;
      currentState.consensusDirection = null;
      currentState.consensusStrength = 0;
      
      // Reset persuasion store for new debate
      currentState.persuasionStore.reset();
      PERSONAS.forEach(p => currentState.persuasionStore.initializePersona(p.id, 'neutral'));
    }
  }

  // 2. Fetch fresh market data (cached)
  let marketData: MarketData | undefined;
  try {
    marketData = await fetchMarketData(asset);
    currentState.lastMarketData = marketData;
    currentState.marketDataTimestamp = Date.now();
  } catch (error) {
    console.warn('[chatroom-enhanced] Failed to fetch market data:', error);
    marketData = currentState.lastMarketData;
  }

  // 3. Pick next speaker
  const speakerId = await pickNextSpeakerEnhanced(history, currentState);
  const persona = PERSONAS_BY_ID[speakerId];
  if (!persona) {
    throw new Error(`Unknown persona: ${speakerId}`);
  }

  // 4. Get persuasion state for this persona
  let persuasionState = currentState.persuasionStore.getState(speakerId);
  if (!persuasionState) {
    persuasionState = currentState.persuasionStore.initializePersona(speakerId, 'neutral');
  }

  // 5. Process persuasion from recent messages
  const recentMessages = history.slice(-10);
  for (const msg of recentMessages) {
    if (msg.personaId === speakerId) continue;
    
    const impact = calculatePersuasionImpact(msg, persuasionState, recentMessages);
    if (impact) {
      const newState = applyPersuasion(persuasionState, impact);
      currentState.persuasionStore.updateState(speakerId, newState);
      persuasionState = newState;
    }
  }

  // 6. Check if stance should change based on persuasion
  if (persuasionState.convictionScore < 30 && recentMessages.length > 0) {
    // Find the most persuasive recent opposing message
    const currentStance = persuasionState.currentStance;
    const opposingMessages = recentMessages.filter(
      m => m.sentiment && m.sentiment !== currentStance
    );
    
    if (opposingMessages.length > 0) {
      // Pick the one with highest confidence
      const mostPersuasive = opposingMessages.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );
      
      if (mostPersuasive.sentiment && mostPersuasive.confidence && mostPersuasive.confidence > 70) {
        previousStance = persuasionState.currentStance;
        const newState = updateStance(
          persuasionState, 
          mostPersuasive.sentiment,
          `Persuaded by ${mostPersuasive.handle}'s data-backed argument`,
          mostPersuasive.id
        );
        currentState.persuasionStore.updateState(speakerId, newState);
        persuasionState = newState;
        stanceChanged = true;
      }
    }
  }

  // 7. Build prompt with market data and persuasion context
  let promptData: { systemPrompt: string; userPrompt: string };

  if (currentState.phase === 'COOLDOWN') {
    promptData = JSON.parse(buildCooldownPrompt(persona, history));
  } else {
    promptData = JSON.parse(buildDebatePrompt(persona, history, marketData, persuasionState, asset));
  }

  // 8. Call model
  // CVAULT-184: Handle silent failures - return null if model call fails
  const rawResponse = await callModelRaw(
    persona.modelId,
    promptData.systemPrompt,
    promptData.userPrompt,
    250
  );

  // If model call failed, silently skip this persona and return special result
  if (!rawResponse) {
    console.warn(`[chatroom-enhanced] Silent failure for persona ${persona.id}, skipping to next speaker`);
    
    // Update persuasion state to reflect temporary unavailability
    currentState.persuasionStore.updateState(speakerId, {
      ...persuasionState,
      lastUpdated: Date.now(),
    });
    const updatedState = currentState.persuasionStore.getState(speakerId);
    
    // Return a special result that indicates this persona should be skipped
    return {
      message: {
        id: `skip_${Date.now()}_${speakerId}`,
        personaId: speakerId,
        handle: persona.handle,
        avatar: persona.avatar,
        content: '',
        timestamp: Date.now(),
        phase: currentState.phase,
        skipped: true, // Special flag to indicate this was skipped
      } as ChatMessage,
      state: currentState,
      persuasionState: updatedState || persuasionState,
    };
  }

  // 9. Parse response
  let content = rawResponse.trim();
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  content = content.replace(/<think>[\s\S]*/gi, '').trim();
  
  let sentiment: MessageSentiment | undefined;
  let confidence: number | undefined;
  let acknowledgesOpposingView = false;

  if (currentState.phase === 'DEBATE') {
    const sentimentMatch = content.match(
      /\[SENTIMENT:\s*(bullish|bearish|neutral)\s*,\s*CONFIDENCE:\s*(\d+)\s*\]/i
    );
    if (sentimentMatch) {
      sentiment = sentimentMatch[1].toLowerCase() as MessageSentiment;
      confidence = Math.min(100, Math.max(0, parseInt(sentimentMatch[2], 10)));
      content = content.replace(sentimentMatch[0], '').trim();
    } else {
      sentiment = 'neutral';
      confidence = 50;
    }

    // Check if message acknowledges opposing view
    const lastOpposing = recentMessages
      .slice(-3)
      .reverse()
      .find(m => m.sentiment && m.sentiment !== sentiment);
    
    if (lastOpposing && shouldAcknowledgeOpposingView(persuasionState, lastOpposing)) {
      acknowledgesOpposingView = true;
    }
  }

  // 10. Extract market data references
  const marketDataRefs: string[] = [];
  if (marketData) {
    // Check for price references
    if (content.includes(marketData.price.toFixed(0)) || 
        content.includes('$' + Math.floor(marketData.price / 1000) + 'k')) {
      marketDataRefs.push('price');
    }
    // Check for volume references
    if (/\d+\s*(b|m|k)\s*(volume|vol)/i.test(content) || 
        content.includes('volume')) {
      marketDataRefs.push('volume');
    }
    // Check for percentage references
    if (/\d+\.?\d*%/.test(content)) {
      marketDataRefs.push('percentage_change');
    }
  }

  // 11. Create message
  // CVAULT-184: No error field - errors are handled silently
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
    acknowledgesOpposingView,
    marketDataRefs: marketDataRefs.length > 0 ? marketDataRefs : undefined,
  };

  // 12. Update persuasion store with this message
  currentState.persuasionStore.processMessage(message, [...history, message]);

  // 13. Update state
  currentState.lastMessageAt = message.timestamp;
  currentState.lastSpeakerId = persona.id;
  currentState.messageCount++;
  currentState.recentSpeakers = [
    persona.id,
    ...currentState.recentSpeakers.filter(id => id !== persona.id),
  ].slice(0, RECENT_SPEAKERS_LIMIT);

  // 14. Calculate consensus
  let consensusUpdate: EnhancedGenerationResult['consensusUpdate'] | undefined;

  if (currentState.phase === 'DEBATE' || currentState.phase === 'CONSENSUS') {
    const allMessages = [...history, message];
    const consensus = calculateRollingConsensus(allMessages);
    currentState.consensusDirection = consensus.direction;
    currentState.consensusStrength = consensus.strength;
    consensusUpdate = consensus;

    // Check consensus threshold
    if (
      currentState.phase === 'DEBATE' &&
      consensus.strength >= CONSENSUS_THRESHOLD &&
      consensus.direction &&
      consensus.direction !== 'neutral'
    ) {
      phaseChange = { from: 'DEBATE', to: 'CONSENSUS' };
      currentState.phase = 'CONSENSUS';
      currentState.phaseStartedAt = Date.now();

      const cooldownMinutes = COOLDOWN_MIN_MINUTES +
        Math.random() * (COOLDOWN_MAX_MINUTES - COOLDOWN_MIN_MINUTES);
      currentState.cooldownEndsAt = Date.now() + cooldownMinutes * 60 * 1000;
    }

    // Auto-transition after 2 consensus messages
    if (currentState.phase === 'CONSENSUS') {
      const consensusMessages = [...history, message].filter(m => m.phase === 'CONSENSUS');
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

  // 15. Pre-select next speaker
  try {
    const nextSpeaker = await pickNextSpeakerEnhanced([...history, message], currentState);
    currentState.nextSpeakerId = nextSpeaker;
  } catch {
    currentState.nextSpeakerId = null;
  }

  return {
    message,
    state: currentState,
    persuasionState,
    consensusUpdate,
    phaseChange,
    stanceChanged,
    previousStance,
  };
}

/**
 * Enhanced speaker picker with persuasion context
 */
async function pickNextSpeakerEnhanced(
  history: ChatMessage[],
  state: EnhancedChatRoomState
): Promise<string> {
  const personaIds = PERSONAS.map(p => p.id);
  const personaHandles: Record<string, string> = {};
  for (const p of PERSONAS) {
    personaHandles[p.id] = p.handle;
  }

  // Build persuasion states for moderator context
  const persuasionStates: Record<string, PersuasionState> = {};
  for (const id of personaIds) {
    const ps = state.persuasionStore.getState(id);
    if (ps) persuasionStates[id] = ps;
  }

  const promptData = JSON.parse(
    buildModeratorPrompt(personaIds, personaHandles, history, state.recentSpeakers, persuasionStates)
  );

  try {
    const response = await callModelRaw(
      'deepseek',
      promptData.systemPrompt,
      promptData.userPrompt,
      60
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.nextSpeakerId && personaIds.includes(parsed.nextSpeakerId)) {
        return parsed.nextSpeakerId;
      }
    }
  } catch (error) {
    console.warn('[chatroom-enhanced] Moderator failed:', error);
  }

  // Fallback: weighted random based on persuasion states
  // Prefer personas who haven't spoken recently and have wavering conviction
  const candidates = personaIds.filter(
    id => id !== state.lastSpeakerId && !state.recentSpeakers.slice(0, 2).includes(id)
  );
  
  const pool = candidates.length > 0 ? candidates : personaIds;
  
  // Weight wavering personas higher (they need to clarify their stance)
  const weights = pool.map(id => {
    const ps = state.persuasionStore.getState(id);
    if (ps?.conviction === 'wavering') return 3;
    if (ps?.conviction === 'weak') return 2;
    return 1;
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < pool.length; i++) {
    random -= weights[i];
    if (random <= 0) return pool[i];
  }
  
  return pool[0];
}

/**
 * Get debate statistics
 */
export function getDebateStats(state: EnhancedChatRoomState) {
  return state.persuasionStore.getDebateStats();
}

/**
 * Serialize enhanced state for storage
 */
export function serializeEnhancedState(state: EnhancedChatRoomState): string {
  const { persuasionStore, ...serializableState } = state;
  return JSON.stringify({
    ...serializableState,
    persuasionStates: persuasionStore.getAllStates(),
  });
}

/**
 * Deserialize enhanced state from storage
 */
export function deserializeEnhancedState(serialized: string): EnhancedChatRoomState {
  const parsed = JSON.parse(serialized);
  const store = new PersuasionStore(parsed.debateId || 'restored');
  
  // Restore persuasion states
  if (parsed.persuasionStates) {
    for (const [id, state] of Object.entries(parsed.persuasionStates)) {
      store.updateState(id, state as PersuasionState);
    }
  }
  
  return {
    ...parsed,
    persuasionStore: store,
  };
}
