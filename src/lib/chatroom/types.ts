export type ChatPhase = 'DEBATE' | 'CONSENSUS' | 'COOLDOWN';

export type MessageSentiment = 'bullish' | 'bearish' | 'neutral';

export interface ChatMessage {
  id: string;
  personaId: string;
  handle: string;
  avatar: string;
  content: string;
  sentiment?: MessageSentiment;
  confidence?: number;
  timestamp: number;
  phase: ChatPhase;
  error?: {
    type: string;
    message: string;
    recoveryGuidance: string;
  };
  // CVAULT-185: Track if message acknowledges opposing view
  acknowledgesOpposingView?: boolean;
  // CVAULT-185: Market data referenced in message
  marketDataRefs?: string[];
}

// CVAULT-185: Persuasion state per persona
export interface PersonaPersuasionState {
  currentStance: MessageSentiment;
  convictionLevel: 'strong' | 'moderate' | 'weak' | 'wavering';
  convictionScore: number; // 0-100
  stanceChanges: number;
  lastStanceChangeAt?: number;
}

// CVAULT-185: Extended chat room state with persuasion tracking
export interface ChatRoomStateWithPersuasion extends ChatRoomState {
  persuasionStates: Record<string, PersonaPersuasionState>;
  debateTopic?: string;
  marketDataSnapshot?: string;
}

export interface ChatRoomState {
  phase: ChatPhase;
  phaseStartedAt: number;
  cooldownEndsAt: number | null;
  lastMessageAt: number;
  lastSpeakerId: string | null;
  messageCount: number;
  nextSpeakerId: string | null;
  consensusDirection: MessageSentiment | null;
  consensusStrength: number;
  recentSpeakers: string[];
  // CVAULT-184: Track temporarily unavailable personas (failed API calls)
  unavailablePersonas?: string[];
  // CVAULT-184: Retry counter to prevent infinite loops
  retryCount?: number;
  // CVAULT-185: Market data integration
  currentAsset?: string;
  persuasionStates?: Record<string, any>;
}

export interface Persona {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  bio: string;
  modelId: string;
  personalityPrompt: string;
  color: string;
  conviction_threshold: number; // 0-100: how much opposing evidence needed to shift position
  stubbornness: number; // 0-100: higher = more resistant to persuasion
}

export type ChatSSEEventType =
  | 'history'
  | 'message'
  | 'typing'
  | 'phase_change'
  | 'consensus_update'
  | 'connected'
  | 'stance_change'; // CVAULT-185: Notify when persona changes stance

export interface ChatSSEEvent {
  type: ChatSSEEventType;
  data: unknown;
}

// CVAULT-185: Stance change event data
export interface StanceChangeEvent {
  personaId: string;
  handle: string;
  from: MessageSentiment;
  to: MessageSentiment;
  convictionScore: number;
}
