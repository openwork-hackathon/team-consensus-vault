import { ChatMessage, ChatRoomState, ChatPhase, MessageSentiment, DebateSummary } from './types';
import { PERSONAS, PERSONAS_BY_ID } from './personas';
import { callModelRaw } from './model-caller';
import { ChatroomError, ChatroomErrorType, createUserFacingError } from './error-types';
import { buildDebatePrompt, buildCooldownPrompt, buildModeratorPrompt } from './prompts';
import { calculateRollingConsensus } from './consensus-calc';
import { fetchMarketData, MarketData } from './market-data';
import { PersuasionStore, initializePersuasionState, PersuasionState } from './persuasion';
import { extractDebateSummary, updateStanceChangeHandles } from './argument-extractor';

const CONSENSUS_THRESHOLD = 80;
const COOLDOWN_MIN_MINUTES = 15;
const COOLDOWN_MAX_MINUTES = 30;
const RECENT_SPEAKERS_LIMIT = 5;

// CVAULT-190: Track debate round number for summary context
let debateRoundCounter = 0;

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
      // CVAULT-190: Increment round counter when starting new debate
      debateRoundCounter++;
    }
  }

  // 2. Pick next speaker via moderator
  const speakerId = await pickNextSpeaker(history, currentState);
  const persona = PERSONAS_BY_ID[speakerId];
  if (!persona) {
    throw new Error(`Unknown persona: ${speakerId}`);
  }

  // 3. Fetch market data and prepare persuasion state
  let marketData: MarketData | undefined;
  let persuasionState: PersuasionState | undefined;

  if (currentState.phase === 'DEBATE' || currentState.phase === 'CONSENSUS') {
    // Fetch market data for the current asset
    const asset = currentState.currentAsset || 'BTC';
    try {
      marketData = await fetchMarketData(asset);
    } catch (error) {
      console.warn('[chatroom-engine] Failed to fetch market data:', error);
      // Continue without market data if fetch fails
    }

    // Initialize persuasion states if not present
    if (!currentState.persuasionStates) {
      currentState.persuasionStates = {};
      // Initialize all personas with neutral stance
      for (const p of PERSONAS) {
        currentState.persuasionStates[p.id] = initializePersuasionState(p.id, 'neutral', 50);
      }
    }

    // Get this persona's persuasion state
    persuasionState = currentState.persuasionStates[speakerId];
    if (!persuasionState) {
      persuasionState = initializePersuasionState(speakerId, 'neutral', 50);
      currentState.persuasionStates[speakerId] = persuasionState;
    }
  }

  // 4. Build prompt based on phase
  let promptData: { systemPrompt: string; userPrompt: string };

  if (currentState.phase === 'COOLDOWN') {
    promptData = JSON.parse(buildCooldownPrompt(persona, history));
  } else {
    promptData = JSON.parse(buildDebatePrompt(
      persona,
      history,
      marketData,
      persuasionState,
      currentState.currentAsset || 'BTC',
      currentState.previousDebateSummary
    ));
  }

  // 5. Call persona's model with error handling - silently skip on failure
  let rawResponse: string;
  
  try {
    rawResponse = await callModelRaw(
      persona.modelId,
      promptData.systemPrompt,
      promptData.userPrompt,
      250
    );
  } catch (error) {
    // Log detailed error information for debugging (INTERNAL ONLY - not exposed to frontend)
    if (error instanceof ChatroomError) {
      console.error(`[chatroom-engine] Model call failed for ${persona.handle} - SKIPPING TO NEXT SPEAKER:`, {
        modelId: error.personaId,
        errorType: error.type,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`[chatroom-engine] Unexpected error calling ${persona.handle} - SKIPPING TO NEXT SPEAKER:`, {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }

    // CRITICAL: Silently skip this failed persona and retry with a different one
    // We do this by recursively calling generateNextMessage with updated state
    // that marks the current persona as temporarily unavailable
    const unavailablePersonas = new Set(currentState.unavailablePersonas || []);
    unavailablePersonas.add(speakerId);
    
    // If ALL personas have failed, reset and extend cooldown
    const allPersonaIds = PERSONAS.map(p => p.id);
    if (unavailablePersonas.size >= allPersonaIds.length) {
      console.error('[chatroom-engine] ALL PERSONAS FAILED - entering extended cooldown');
      
      // Reset unavailable personas after extended cooldown
      const extendedCooldownMinutes = 5; // 5 minute extended cooldown
      currentState.phase = 'COOLDOWN';
      currentState.cooldownEndsAt = Date.now() + extendedCooldownMinutes * 60 * 1000;
      currentState.unavailablePersonas = [];
      
      phaseChange = { 
        from: currentState.phase, 
        to: 'COOLDOWN' 
      };
      
      // Return empty message with state update to trigger cooldown
      return {
        message: {
          id: `sys_${Date.now()}`,
          personaId: 'system',
          handle: 'System',
          avatar: '⚙️',
          content: '',
          timestamp: Date.now(),
          phase: currentState.phase,
        },
        state: currentState,
        phaseChange,
      };
    }
    
    // Mark current speaker as unavailable and retry with next speaker
    currentState.unavailablePersonas = Array.from(unavailablePersonas);
    
    // Recursively try next speaker (with depth protection)
    const retryCount = currentState.retryCount || 0;
    if (retryCount >= PERSONAS.length) {
      // Too many retries, give up and return to cooldown
      console.error('[chatroom-engine] Max retries exceeded - entering cooldown');
      currentState.phase = 'COOLDOWN';
      currentState.cooldownEndsAt = Date.now() + 2 * 60 * 1000; // 2 min cooldown
      currentState.unavailablePersonas = [];
      currentState.retryCount = 0;
      
      return {
        message: {
          id: `sys_${Date.now()}`,
          personaId: 'system',
          handle: 'System',
          avatar: '⚙️',
          content: '',
          timestamp: Date.now(),
          phase: currentState.phase,
        },
        state: currentState,
        phaseChange: { from: phaseChange?.from || 'DEBATE', to: 'COOLDOWN' },
      };
    }
    
    currentState.retryCount = retryCount + 1;
    
    // Retry generation with next available speaker
    return generateNextMessage(history, currentState);
  }

  // 6. Strip model reasoning tags (e.g. DeepSeek <think>...</think>) and parse sentiment
  let content = rawResponse.trim();
  // Remove <think>...</think> blocks (DeepSeek chain-of-thought)
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Remove any unclosed <think> block (model hit token limit mid-thought)
  content = content.replace(/<think>[\s\S]*/gi, '').trim();
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

  // 7. Create message
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

  // 8. Process persuasion updates
  if (currentState.persuasionStates && message.sentiment) {
    const persuasionStore = new PersuasionStore('current-debate');

    // Load all current states into the store
    for (const [pid, state] of Object.entries(currentState.persuasionStates)) {
      persuasionStore.updateState(pid, state as PersuasionState);
    }

    // Process this message's impact on all personas
    persuasionStore.processMessage(message, [...history, message]);

    // Save updated states back to currentState
    currentState.persuasionStates = persuasionStore.getAllStates();
  }

  // 9. Update state
  currentState.lastMessageAt = message.timestamp;
  currentState.lastSpeakerId = persona.id;
  currentState.messageCount++;
  currentState.recentSpeakers = [
    persona.id,
    ...currentState.recentSpeakers.filter(id => id !== persona.id),
  ].slice(0, RECENT_SPEAKERS_LIMIT);

  // 10. If DEBATE: calculate rolling consensus
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

        // CVAULT-190: Generate debate summary when entering COOLDOWN
        if (currentState.persuasionStates) {
          const summary = extractDebateSummary(
            [...history, message],
            currentState.persuasionStates,
            debateRoundCounter,
            currentState.consensusDirection || 'neutral',
            currentState.consensusStrength
          );

          // Update handles in stance changes
          const handleMap = Object.fromEntries(
            PERSONAS.map(p => [p.id, p.handle])
          );
          currentState.previousDebateSummary = updateStanceChangeHandles(summary, handleMap);

          console.log('[chatroom-engine] Generated debate summary for round', debateRoundCounter, {
            consensus: summary.consensusDirection,
            strength: summary.consensusStrength,
            bullishArgs: summary.keyBullishArguments.length,
            bearishArgs: summary.keyBearishArguments.length,
            stanceChanges: summary.stanceChanges.length,
          });
        }
      }
    }
  }

  // 11. Pre-select next speaker for typing indicator
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
 * CVAULT-184: Enhanced to avoid unavailable personas.
 */
async function pickNextSpeaker(
  history: ChatMessage[],
  state: ChatRoomState
): Promise<string> {
  const unavailableSet = new Set(state.unavailablePersonas || []);
  const personaIds = PERSONAS.map(p => p.id).filter(id => !unavailableSet.has(id));
  
  // If all personas are unavailable, clear the list and try again
  if (personaIds.length === 0) {
    console.warn('[chatroom-engine] All personas unavailable, resetting unavailable list');
    state.unavailablePersonas = [];
    return pickNextSpeaker(history, state);
  }
  
  const personaHandles: Record<string, string> = {};
  for (const p of PERSONAS) {
    if (!unavailableSet.has(p.id)) {
      personaHandles[p.id] = p.handle;
    }
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
    if (error instanceof ChatroomError) {
      console.warn('[chatroom-engine] Moderator failed (ChatroomError):', {
        errorType: error.type,
        personaId: error.personaId,
        message: error.message,
      });
    } else {
      console.warn('[chatroom-engine] Moderator failed (unexpected):', error);
    }
  }

  // Fallback: pick randomly, avoiding recent speakers AND unavailable personas
  const candidates = personaIds.filter(
    id => id !== state.lastSpeakerId && !state.recentSpeakers.slice(0, 2).includes(id)
  );
  const pool = candidates.length > 0 ? candidates : personaIds;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  
  console.log(`[chatroom-engine] Fallback speaker selection: ${selected} (pool size: ${pool.length})`);
  return selected;
}
