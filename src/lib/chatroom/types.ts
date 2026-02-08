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
