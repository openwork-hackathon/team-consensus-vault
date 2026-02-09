import { ChatMessage, ChatRoomState, ChatPhase } from './types';

const STORAGE_KEY = 'cvault-chatroom-history';
const MAX_MESSAGES = 500; // CVAULT-179: Increased to 500 messages for better history
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB - increased to accommodate more messages
const TIME_GAP_THRESHOLD_HOUR = 60 * 60 * 1000; // 1 hour in ms
const TIME_GAP_THRESHOLD_DAY = 24 * 60 * 60 * 1000; // 24 hours in ms

export interface StoredChatHistory {
  messages: ChatMessage[];
  state: ChatRoomState;
  lastVisitTimestamp: number;
  version: string;
}

export interface TimeGapInfo {
  hasGap: boolean;
  gapHours?: number;
  gapDays?: number;
  lastVisitTime?: number;
}

export interface MissedMessagesInfo {
  hasMissedMessages: boolean;
  missedMessageCount: number;
  lastVisitTimestamp: number;
  firstMissedMessageTimestamp?: number;
  lastMissedMessageTimestamp?: number;
}

const CURRENT_VERSION = '1.0.0';

/**
 * Save chat history to localStorage with size limits and error handling
 */
export function saveChatHistory(messages: ChatMessage[], state: ChatRoomState): boolean {
  try {
    const history: StoredChatHistory = {
      messages: messages.slice(-MAX_MESSAGES), // Keep only recent messages
      state,
      lastVisitTimestamp: Date.now(),
      version: CURRENT_VERSION,
    };

    const serialized = JSON.stringify(history);
    
    // Check if we're about to exceed quota
    if (serialized.length > MAX_STORAGE_SIZE) {
      console.warn('[chatroom-storage] History too large, truncating...');
      
      // Try to save with even fewer messages
      const truncatedMessages = messages.slice(-Math.floor(MAX_MESSAGES / 2));
      const truncatedHistory: StoredChatHistory = {
        messages: truncatedMessages,
        state,
        lastVisitTimestamp: Date.now(),
        version: CURRENT_VERSION,
      };
      
      const truncatedSerialized = JSON.stringify(truncatedHistory);
      if (truncatedSerialized.length > MAX_STORAGE_SIZE) {
        console.error('[chatroom-storage] History still too large after truncation');
        return false;
      }
      
      localStorage.setItem(STORAGE_KEY, truncatedSerialized);
      return true;
    }
    
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('[chatroom-storage] Failed to save chat history:', error);
    
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[chatroom-storage] Storage quota exceeded, clearing old data');
      clearChatHistory();
      
      // Try one more time with minimal data
      try {
        const minimalHistory: StoredChatHistory = {
          messages: messages.slice(-50), // Keep only last 50 messages
          state,
          lastVisitTimestamp: Date.now(),
          version: CURRENT_VERSION,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory));
        return true;
      } catch (retryError) {
        console.error('[chatroom-storage] Failed to save even minimal history:', retryError);
      }
    }
    
    return false;
  }
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): {
  messages: ChatMessage[];
  state: ChatRoomState | null;
  timeGapInfo: TimeGapInfo;
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { messages: [], state: null, timeGapInfo: { hasGap: false } };
    }

    const parsed = JSON.parse(stored) as StoredChatHistory;
    
    // Check version compatibility
    if (parsed.version !== CURRENT_VERSION) {
      console.warn(`[chatroom-storage] Version mismatch: ${parsed.version} vs ${CURRENT_VERSION}, clearing history`);
      clearChatHistory();
      return { messages: [], state: null, timeGapInfo: { hasGap: false } };
    }

    const now = Date.now();
    const timeSinceLastVisit = now - parsed.lastVisitTimestamp;
    
    const timeGapInfo: TimeGapInfo = {
      hasGap: timeSinceLastVisit > TIME_GAP_THRESHOLD_HOUR,
      lastVisitTime: parsed.lastVisitTimestamp,
    };

    if (timeSinceLastVisit > TIME_GAP_THRESHOLD_DAY) {
      timeGapInfo.gapDays = Math.floor(timeSinceLastVisit / TIME_GAP_THRESHOLD_DAY);
    } else if (timeSinceLastVisit > TIME_GAP_THRESHOLD_HOUR) {
      timeGapInfo.gapHours = Math.floor(timeSinceLastVisit / TIME_GAP_THRESHOLD_HOUR);
    }

    return {
      messages: parsed.messages || [],
      state: parsed.state || null,
      timeGapInfo,
    };
  } catch (error) {
    console.error('[chatroom-storage] Failed to load chat history:', error);
    // Clear corrupted data
    clearChatHistory();
    return { messages: [], state: null, timeGapInfo: { hasGap: false } };
  }
}

/**
 * Clear chat history from localStorage
 */
export function clearChatHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[chatroom-storage] Failed to clear chat history:', error);
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  hasData: boolean;
  messageCount: number;
  estimatedSize: number;
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { hasData: false, messageCount: 0, estimatedSize: 0 };
    }

    const parsed = JSON.parse(stored) as StoredChatHistory;
    return {
      hasData: true,
      messageCount: parsed.messages?.length || 0,
      estimatedSize: stored.length,
    };
  } catch (error) {
    console.error('[chatroom-storage] Failed to get storage info:', error);
    return { hasData: false, messageCount: 0, estimatedSize: 0 };
  }
}

/**
 * Check if time gap requires special handling
 */
export function shouldShowTimeGapIndicator(lastVisitTimestamp: number): boolean {
  const now = Date.now();
  const timeSinceLastVisit = now - lastVisitTimestamp;
  return timeSinceLastVisit > TIME_GAP_THRESHOLD_HOUR;
}

/**
 * Format time gap for display
 */
export function formatTimeGap(lastVisitTimestamp: number): string {
  const now = Date.now();
  const timeSinceLastVisit = now - lastVisitTimestamp;
  
  if (timeSinceLastVisit > TIME_GAP_THRESHOLD_DAY) {
    const days = Math.floor(timeSinceLastVisit / TIME_GAP_THRESHOLD_DAY);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (timeSinceLastVisit > TIME_GAP_THRESHOLD_HOUR) {
    const hours = Math.floor(timeSinceLastVisit / TIME_GAP_THRESHOLD_HOUR);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const minutes = Math.floor(timeSinceLastVisit / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Detect missed messages based on last visit timestamp and server messages
 * Returns information about messages that were sent during user's absence
 */
export function detectMissedMessages(
  lastVisitTimestamp: number,
  serverMessages: ChatMessage[],
  minGapMs: number = TIME_GAP_THRESHOLD_HOUR
): MissedMessagesInfo {
  const now = Date.now();
  const timeSinceLastVisit = now - lastVisitTimestamp;
  
  // Only consider it a gap if it's been more than the threshold
  if (timeSinceLastVisit < minGapMs) {
    return {
      hasMissedMessages: false,
      missedMessageCount: 0,
      lastVisitTimestamp,
    };
  }

  // Find messages that occurred after last visit
  const missedMessages = serverMessages.filter(
    msg => msg.timestamp > lastVisitTimestamp
  );

  if (missedMessages.length === 0) {
    return {
      hasMissedMessages: false,
      missedMessageCount: 0,
      lastVisitTimestamp,
    };
  }

  // Sort by timestamp to get first and last
  const sorted = [...missedMessages].sort((a, b) => a.timestamp - b.timestamp);

  return {
    hasMissedMessages: true,
    missedMessageCount: missedMessages.length,
    lastVisitTimestamp,
    firstMissedMessageTimestamp: sorted[0].timestamp,
    lastMissedMessageTimestamp: sorted[sorted.length - 1].timestamp,
  };
}

/**
 * Get missed messages that need summarization (more than threshold)
 */
export function getMissedMessagesForSummary(
  lastVisitTimestamp: number,
  serverMessages: ChatMessage[],
  minMessagesThreshold: number = 5
): ChatMessage[] | null {
  const info = detectMissedMessages(lastVisitTimestamp, serverMessages);
  
  if (!info.hasMissedMessages || info.missedMessageCount < minMessagesThreshold) {
    return null;
  }

  return serverMessages.filter(msg => msg.timestamp > lastVisitTimestamp);
}

const SUMMARY_CACHE_KEY = 'cvault-chatroom-summary-cache';
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedSummary {
  summary: string;
  generatedAt: number;
  lastVisitTimestamp: number;
  messageCount: number;
}

/**
 * Get cached summary if still valid
 */
export function getCachedSummary(lastVisitTimestamp: number): string | null {
  try {
    const stored = localStorage.getItem(SUMMARY_CACHE_KEY);
    if (!stored) return null;

    const cached: CachedSummary = JSON.parse(stored);
    const now = Date.now();
    
    // Check if cache is still valid (within TTL and for same visit gap)
    if (
      now - cached.generatedAt < SUMMARY_CACHE_TTL_MS &&
      cached.lastVisitTimestamp === lastVisitTimestamp
    ) {
      return cached.summary;
    }
    
    return null;
  } catch (error) {
    console.error('[chatroom-storage] Failed to get cached summary:', error);
    return null;
  }
}

/**
 * Cache a summary to avoid regenerating on quick reconnects
 */
export function cacheSummary(
  summary: string,
  lastVisitTimestamp: number,
  messageCount: number
): void {
  try {
    const cached: CachedSummary = {
      summary,
      generatedAt: Date.now(),
      lastVisitTimestamp,
      messageCount,
    };
    localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('[chatroom-storage] Failed to cache summary:', error);
  }
}

/**
 * Clear cached summary
 */
export function clearCachedSummary(): void {
  try {
    localStorage.removeItem(SUMMARY_CACHE_KEY);
  } catch (error) {
    console.error('[chatroom-storage] Failed to clear cached summary:', error);
  }
}