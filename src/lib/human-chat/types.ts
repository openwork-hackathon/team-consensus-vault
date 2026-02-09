/**
 * Human Chat Types
 * 
 * Types for the wallet-gated human-to-human chatroom feature.
 * Separate from the AI Debate Arena chatroom.
 */

import { ModerationMetadata } from '@/lib/chatroom/types';

export interface HumanChatMessage {
  id: string;
  userId: string; // wallet address
  handle: string; // truncated wallet or ENS name if available
  avatar?: string; // optional emoji avatar
  content: string;
  timestamp: number;
  moderation?: ModerationMetadata;
}

export interface HumanChatUser {
  userId: string; // wallet address
  handle: string;
  avatar?: string;
  lastSeenAt: number;
  messageCount: number;
  joinedAt: number;
}

export interface HumanChatState {
  messageCount: number;
  activeUsers: number;
  lastMessageAt: number | null;
}

export type HumanChatEventType =
  | 'connected'
  | 'history'
  | 'message'
  | 'user_joined'
  | 'user_left'
  | 'user_typing';

export interface HumanChatEvent {
  type: HumanChatEventType;
  data: unknown;
}

export interface RateLimitInfo {
  allowed: boolean;
  remainingTimeMs: number;
  lastPostTime: number;
}

// Rate limit: 1 message per 5 seconds per user
export const RATE_LIMIT_MS = 5000;

// Maximum message length
export const MAX_MESSAGE_LENGTH = 500;

// Maximum messages to store in history
export const MAX_HUMAN_CHAT_MESSAGES = 100;
