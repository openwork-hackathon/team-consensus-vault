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
  // CVAULT-188: Moderation metadata
  moderation?: ModerationMetadata;
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
  // CVAULT-190: Previous debate summary for context in next round
  previousDebateSummary?: DebateSummary;
  // CVAULT-208: Argument tracker for anti-repetition
  argumentTracker?: any;
}

// CVAULT-190: Summary of a completed debate round for context in next round
export interface DebateSummary {
  roundNumber: number;
  timestamp: number;
  consensusDirection: MessageSentiment;
  consensusStrength: number;
  keyBullishArguments: string[];
  keyBearishArguments: string[];
  stanceChanges: StanceChangeSummary[];
  topDataPoints: string[];
  messageCount: number;
}

// CVAULT-217: Consensus snapshot for messages that age out of 1-hour window
export interface ConsensusSnapshot {
  id: string;
  timestamp: number;
  timestampRange: {
    start: number;
    end: number;
  };
  consensusDirection: MessageSentiment;
  consensusStrength: number;
  keyArgumentsSummary: {
    bullish: string[];
    bearish: string[];
    neutral?: string[];
  };
  topPersonaContributions: Array<{
    personaId: string;
    handle: string;
    messageCount: number;
    primaryStance: MessageSentiment;
    keyPoints: string[];
  }>;
  messageCount: number;
  snapshotReason: 'time_window_rollover' | 'manual' | 'consensus_reached';
}

// CVAULT-190: Summary of a stance change during debate
export interface StanceChangeSummary {
  personaId: string;
  handle: string;
  from: MessageSentiment;
  to: MessageSentiment;
  reason?: string;
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
  | 'stance_change' // CVAULT-185: Notify when persona changes stance
  | 'debate_context'; // CVAULT-190: Broadcast when debate context is captured

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

// CVAULT-178: Typing indicator event data with duration
export interface TypingEvent {
  id: string;
  handle: string;
  avatar: string;
  durationMs: number;  // How long the typing indicator should show
  expectedLength?: number;  // Expected message length (for UI animation timing)
}

// CVAULT-188: Moderation types
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'removed';
export type ViolationType = 'spam' | 'hate_speech' | 'harassment' | 'manipulation' | 'inappropriate_content' | 'other';

export interface ModerationResult {
  status: ModerationStatus;
  violations: ViolationType[];
  confidence: number;
  reasoning: string;
  flaggedAt?: number;
  moderatorId?: string;
}

export interface ModerationMetadata {
  moderationResult?: ModerationResult;
  isUserGenerated?: boolean; // true if message from human user, false if from AI persona
  userId?: string; // for user-generated messages
}

export interface MutedUser {
  userId: string;
  handle: string;
  mutedAt: number;
  mutedUntil: number | null; // null = permanent mute
  reason: string;
  moderatorId: string;
}

export interface BannedUser {
  userId: string;
  handle: string;
  bannedAt: number;
  reason: string;
  moderatorId: string;
}

export interface ModerationAction {
  type: 'mute' | 'unmute' | 'ban' | 'unban';
  targetUserId: string;
  targetHandle: string;
  duration?: number; // for mute actions (in milliseconds)
  reason: string;
  moderatorId: string;
  timestamp: number;
}

export interface ModerationStore {
  mutedUsers: Record<string, MutedUser>;
  bannedUsers: Record<string, BannedUser>;
  moderationLog: ModerationAction[];
}

// CVAULT-217: Rolling history configuration
export const ROLLING_HISTORY_CONFIG = {
  // Messages older than this are pruned from rolling history
  MAX_MESSAGE_AGE_MS: 60 * 60 * 1000, // 1 hour
  // Maximum number of messages to keep (safety limit)
  MAX_MESSAGES: 200,
  // How often to run cleanup (ms)
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  // Maximum number of consensus snapshots to keep
  MAX_SNAPSHOTS: 24, // ~24 hours worth at 1 snapshot per hour
} as const;
