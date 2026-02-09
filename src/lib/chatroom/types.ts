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
  | 'connected';

export interface ChatSSEEvent {
  type: ChatSSEEventType;
  data: unknown;
}
