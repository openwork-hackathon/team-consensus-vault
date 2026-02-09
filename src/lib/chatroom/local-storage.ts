import { ChatMessage, ChatRoomState, ChatPhase } from './types';

const STORAGE_KEY = 'cvault-chatroom-history';
const MAX_MESSAGES = 200;
const MAX_STORAGE_SIZE = 1024 * 1024; // 1MB
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