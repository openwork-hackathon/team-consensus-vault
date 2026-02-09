/**
 * Persuasion System for Chatroom Personas
 * Tracks conviction levels and allows stance shifts based on compelling arguments
 * CVAULT-185: Persuadability Logic
 */

import { ChatMessage, MessageSentiment } from './types';

// Conviction levels represent how strongly a persona holds their view
export type ConvictionLevel = 'strong' | 'moderate' | 'weak' | 'wavering';

export interface PersuasionState {
  personaId: string;
  currentStance: MessageSentiment;
  conviction: ConvictionLevel;
  convictionScore: number; // 0-100
  stanceHistory: StanceEntry[];
  persuasionFactors: PersuasionFactor[];
  lastUpdated: number;
}

export interface StanceEntry {
  stance: MessageSentiment;
  conviction: number;
  timestamp: number;
  triggeredBy?: string; // Message ID that caused change
  reason?: string;
}

export interface PersuasionFactor {
  type: 'data_quality' | 'contradiction' | 'agreement' | 'novelty' | 'authority';
  sourcePersonaId: string;
  messageId: string;
  impact: number; // -10 to +10
  timestamp: number;
  description: string;
}

// Thresholds for conviction changes
const CONVICTION_THRESHOLDS = {
  strong: 75,
  moderate: 50,
  weak: 25,
};

// Persuasion thresholds - how much impact needed to shift stance
const PERSUASION_THRESHOLDS = {
  strong: 15,    // Hard to persuade
  moderate: 10,  // Moderately persuadable
  weak: 5,       // Easy to persuade
  wavering: 3,   // Very easy to persuade
};

// Maximum conviction score
const MAX_CONVICTION = 100;
const MIN_CONVICTION = 0;

/**
 * Initialize persuasion state for a persona
 */
export function initializePersuasionState(
  personaId: string,
  initialStance: MessageSentiment = 'neutral',
  initialConviction: number = 50
): PersuasionState {
  return {
    personaId,
    currentStance: initialStance,
    conviction: scoreToLevel(initialConviction),
    convictionScore: initialConviction,
    stanceHistory: [{
      stance: initialStance,
      conviction: initialConviction,
      timestamp: Date.now(),
    }],
    persuasionFactors: [],
    lastUpdated: Date.now(),
  };
}

/**
 * Convert numeric score to conviction level
 */
function scoreToLevel(score: number): ConvictionLevel {
  if (score >= CONVICTION_THRESHOLDS.strong) return 'strong';
  if (score >= CONVICTION_THRESHOLDS.moderate) return 'moderate';
  if (score >= CONVICTION_THRESHOLDS.weak) return 'weak';
  return 'wavering';
}

/**
 * Calculate persuasion impact from a message
 */
export function calculatePersuasionImpact(
  message: ChatMessage,
  recipientState: PersuasionState,
  recentMessages: ChatMessage[]
): PersuasionFactor | null {
  // Skip if no sentiment or same stance
  if (!message.sentiment || message.sentiment === recipientState.currentStance) {
    return null;
  }

  const factors: Partial<PersuasionFactor> = {
    sourcePersonaId: message.personaId,
    messageId: message.id,
    timestamp: Date.now(),
  };

  let impact = 0;
  let type: PersuasionFactor['type'] = 'data_quality';
  let description = '';

  // Factor 1: Data quality - messages with specific numbers/data are more persuasive
  const hasSpecificData = /\d+%|\$[\d,]+|\d+\s*(k|m|b|million|billion)/i.test(message.content);
  const hasTimeframe = /\d+h|\d+d|24h|7d|weekly|daily/i.test(message.content);
  
  if (hasSpecificData && hasTimeframe) {
    impact += 4;
    type = 'data_quality';
    description = 'Strong data-backed argument with specific metrics and timeframe';
  } else if (hasSpecificData) {
    impact += 2;
    type = 'data_quality';
    description = 'Data-backed argument with specific numbers';
  }

  // Factor 2: Confidence of the speaker
  if (message.confidence) {
    if (message.confidence >= 80) {
      impact += 3;
      description += '; High confidence speaker (80%+)';
    } else if (message.confidence >= 60) {
      impact += 1;
      description += '; Moderate confidence';
    }
  }

  // Factor 3: Contradiction detection - if message contradicts recipient's view strongly
  if (message.sentiment !== recipientState.currentStance) {
    impact += 2;
    type = 'contradiction';
    description += '; Direct challenge to current stance';
  }

  // Factor 4: Agreement momentum - if multiple recent messages agree with this view
  const recentAgreeing = recentMessages.filter(
    m => m.sentiment === message.sentiment && m.id !== message.id
  ).length;
  if (recentAgreeing >= 3) {
    impact += 3;
    type = 'agreement';
    description += `; ${recentAgreeing} recent messages support this view`;
  } else if (recentAgreeing >= 1) {
    impact += 1;
    description += '; Some recent agreement';
  }

  // Factor 5: Novelty - new information not previously mentioned
  const isNovel = !recentMessages.some(m => 
    m.id !== message.id && 
    m.content.toLowerCase().includes(message.content.toLowerCase().substring(0, 20))
  );
  if (isNovel) {
    impact += 2;
    type = 'novelty';
    description += '; Novel perspective or data point';
  }

  // No significant impact
  if (impact <= 0) return null;

  return {
    ...factors,
    type,
    impact,
    description: description.trim(),
  } as PersuasionFactor;
}

/**
 * Apply persuasion factor to update state
 */
export function applyPersuasion(
  state: PersuasionState,
  factor: PersuasionFactor
): PersuasionState {
  const newState = { ...state };
  
  // Add factor to history
  newState.persuasionFactors = [...state.persuasionFactors, factor].slice(-20); // Keep last 20
  
  // Calculate persuasion threshold based on current conviction
  const threshold = PERSUASION_THRESHOLDS[state.conviction];
  
  // Determine if stance should shift
  const shouldShiftStance = factor.impact >= threshold;
  
  if (shouldShiftStance) {
    // Find the message to determine new stance
    const lastFactor = newState.persuasionFactors[newState.persuasionFactors.length - 1];
    
    // Conviction decreases when persuaded against current stance
    const convictionChange = -factor.impact * 2;
    newState.convictionScore = Math.max(MIN_CONVICTION, 
      Math.min(MAX_CONVICTION, state.convictionScore + convictionChange)
    );
    
    // If conviction drops too low, stance shifts
    if (newState.convictionScore < 30) {
      // Stance would shift - but we need to know the new stance from the message
      // This is handled by the caller who has access to the message
      newState.convictionScore = 40; // Reset to moderate on shift
    }
  } else {
    // Small conviction boost for resisting persuasion (confirmation bias)
    newState.convictionScore = Math.min(MAX_CONVICTION, state.convictionScore + 1);
  }
  
  newState.conviction = scoreToLevel(newState.convictionScore);
  newState.lastUpdated = Date.now();
  
  return newState;
}

/**
 * Update stance explicitly (when a persona changes their view)
 */
export function updateStance(
  state: PersuasionState,
  newStance: MessageSentiment,
  reason?: string,
  triggeredBy?: string
): PersuasionState {
  if (newStance === state.currentStance) return state;
  
  const newState = { ...state };
  
  // Record stance change in history
  newState.stanceHistory = [...state.stanceHistory, {
    stance: newStance,
    conviction: state.convictionScore,
    timestamp: Date.now(),
    triggeredBy,
    reason,
  }].slice(-10); // Keep last 10 stance changes
  
  newState.currentStance = newStance;
  // Reset conviction to moderate on stance change
  newState.convictionScore = 50;
  newState.conviction = 'moderate';
  newState.lastUpdated = Date.now();
  
  return newState;
}

/**
 * Boost conviction when evidence supports current stance
 */
export function reinforceStance(
  state: PersuasionState,
  amount: number = 5
): PersuasionState {
  const newState = { ...state };
  newState.convictionScore = Math.min(MAX_CONVICTION, state.convictionScore + amount);
  newState.conviction = scoreToLevel(newState.convictionScore);
  newState.lastUpdated = Date.now();
  return newState;
}

/**
 * Get persuasion summary for prompt injection
 */
export function getPersuasionSummary(state: PersuasionState): string {
  const stanceChanges = state.stanceHistory.length - 1;
  const recentFactors = state.persuasionFactors.slice(-3);
  
  let summary = `Your current conviction: ${state.conviction} (${state.convictionScore}/100)`;
  
  if (stanceChanges > 0) {
    summary += `. You've shifted stance ${stanceChanges} time${stanceChanges > 1 ? 's' : ''} in this debate.`;
  }
  
  if (recentFactors.length > 0) {
    const totalImpact = recentFactors.reduce((sum, f) => sum + Math.abs(f.impact), 0);
    summary += ` Recent persuasion pressure: ${totalImpact} points.`;
  }
  
  // Add guidance based on conviction
  if (state.conviction === 'wavering') {
    summary += ` You're open to changing your view if presented with compelling data.`;
  } else if (state.conviction === 'weak') {
    summary += ` You might acknowledge good points from opposing views.`;
  } else if (state.conviction === 'strong') {
    summary += ` You're confident in your position but should still engage with data.`;
  }
  
  return summary;
}

/**
 * Determine if a persona should acknowledge an opposing view
 */
export function shouldAcknowledgeOpposingView(
  state: PersuasionState,
  opposingMessage: ChatMessage
): boolean {
  // Only acknowledge if conviction is weak or wavering
  if (state.convictionScore >= CONVICTION_THRESHOLDS.moderate) return false;
  
  // Check if message has strong data
  const hasStrongData = /\d+%|\$[\d,]+(k|m|b)/i.test(opposingMessage.content);
  
  // Higher chance if message has data and confidence
  if (hasStrongData && (opposingMessage.confidence || 0) > 70) {
    return Math.random() < 0.7; // 70% chance
  }
  
  return Math.random() < 0.3; // 30% base chance
}

/**
 * Generate acknowledgment text for prompts
 */
export function generateAcknowledgmentPrompt(
  state: PersuasionState,
  opposingMessage: ChatMessage
): string {
  const acknowledgments = [
    `You notice ${opposingMessage.handle} made a compelling point.`,
    `You find yourself considering ${opposingMessage.handle}'s argument.`,
    `The data ${opposingMessage.handle} shared gives you pause.`,
    `You're struck by the strength of ${opposingMessage.handle}'s analysis.`,
  ];
  
  const randomAck = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  
  return `${randomAck} While you still lean ${state.currentStance}, you should acknowledge the validity of their data or reasoning in your response. Don't completely flip your stance yet, but show you're considering it.`;
}

/**
 * Store for managing all persona persuasion states
 */
export class PersuasionStore {
  private states: Map<string, PersuasionState> = new Map();
  private debateId: string;
  
  constructor(debateId: string = 'default') {
    this.debateId = debateId;
  }
  
  getState(personaId: string): PersuasionState | undefined {
    return this.states.get(personaId);
  }
  
  initializePersona(personaId: string, initialStance: MessageSentiment): PersuasionState {
    const state = initializePersuasionState(personaId, initialStance);
    this.states.set(personaId, state);
    return state;
  }
  
  updateState(personaId: string, state: PersuasionState): void {
    this.states.set(personaId, state);
  }
  
  processMessage(message: ChatMessage, allMessages: ChatMessage[]): void {
    if (!message.sentiment) return;
    
    // Update the sender's state (reinforce their stance)
    const senderState = this.states.get(message.personaId);
    if (senderState) {
      const reinforced = reinforceStance(senderState, 2);
      this.states.set(message.personaId, reinforced);
    }
    
    // Check persuasion impact on other personas
    for (const [personaId, state] of this.states) {
      if (personaId === message.personaId) continue;
      
      const impact = calculatePersuasionImpact(message, state, allMessages);
      if (impact) {
        const newState = applyPersuasion(state, impact);
        this.states.set(personaId, newState);
      }
    }
  }
  
  getAllStates(): Record<string, PersuasionState> {
    return Object.fromEntries(this.states);
  }
  
  reset(): void {
    this.states.clear();
  }
  
  getDebateStats(): {
    totalStanceChanges: number;
    averageConviction: number;
    mostPersuadable: string | null;
    mostStubborn: string | null;
  } {
    let totalChanges = 0;
    let totalConviction = 0;
    let minConviction = 100;
    let maxConviction = 0;
    let mostPersuadable: string | null = null;
    let mostStubborn: string | null = null;
    
    for (const [id, state] of this.states) {
      totalChanges += Math.max(0, state.stanceHistory.length - 1);
      totalConviction += state.convictionScore;
      
      if (state.convictionScore < minConviction) {
        minConviction = state.convictionScore;
        mostPersuadable = id;
      }
      
      if (state.convictionScore > maxConviction) {
        maxConviction = state.convictionScore;
        mostStubborn = id;
      }
    }
    
    const count = this.states.size;
    return {
      totalStanceChanges: totalChanges,
      averageConviction: count > 0 ? totalConviction / count : 0,
      mostPersuadable,
      mostStubborn,
    };
  }
}

// Global store instance (can be replaced per-debate)
let globalPersuasionStore: PersuasionStore | null = null;

export function getGlobalPersuasionStore(): PersuasionStore {
  if (!globalPersuasionStore) {
    globalPersuasionStore = new PersuasionStore('global');
  }
  return globalPersuasionStore;
}

export function resetGlobalPersuasionStore(): void {
  globalPersuasionStore = null;
}
