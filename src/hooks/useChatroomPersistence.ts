'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatRoomState, ChatPhase, MessageSentiment } from '@/lib/chatroom/types';
import {
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
  clearCachedSummary,
  getStorageInfo,
  TimeGapInfo,
  getMissedMessagesForSummary,
  getCachedSummary,
  cacheSummary,
  formatTimeGap,
} from '@/lib/chatroom/local-storage';

export interface PersistenceState {
  messages: ChatMessage[];
  state: ChatRoomState | null;
  timeGapInfo: TimeGapInfo | null;
  showTimeGapIndicator: boolean;
  missedSummary: string | null;
  isFetchingSummary: boolean;
  storageInfo: {
    hasData: boolean;
    messageCount: number;
    estimatedSize: number;
  };
}

export interface PersistenceActions {
  saveMessages: (messages: ChatMessage[], state: ChatRoomState) => void;
  clearHistory: () => void;
  dismissTimeGap: () => void;
  refreshStorageInfo: () => void;
}

/**
 * CVAULT-179: Chatroom Persistence Hook
 * 
 * Manages persistent storage of chatroom messages and state in localStorage.
 * Handles time gap detection, missed message summaries, and storage limits.
 * 
 * Features:
 * - Automatic persistence of messages and state
 * - Time gap detection on page load
 * - AI-generated summaries of missed conversations
 * - Storage limit enforcement (FIFO eviction)
 * - Clear history functionality
 */
export function useChatroomPersistence(): PersistenceState & PersistenceActions {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatRoomState | null>(null);
  const [timeGapInfo, setTimeGapInfo] = useState<TimeGapInfo | null>(null);
  const [showTimeGapIndicator, setShowTimeGapIndicator] = useState(false);
  const [missedSummary, setMissedSummary] = useState<string | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    hasData: false,
    messageCount: 0,
    estimatedSize: 0,
  });

  const lastSavedStateRef = useRef<ChatRoomState | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    const { messages: storedMessages, state: storedState, timeGapInfo: storedTimeGapInfo } = loadChatHistory();

    if (storedMessages.length > 0) {
      setMessages(storedMessages);
      messageIdsRef.current = new Set(storedMessages.map(m => m.id));

      if (storedState) {
        setState(storedState);
        lastSavedStateRef.current = storedState;
      }

      setTimeGapInfo(storedTimeGapInfo);

      // Show time gap indicator if there's a significant gap
      if (storedTimeGapInfo.hasGap && storedTimeGapInfo.lastVisitTime) {
        setShowTimeGapIndicator(true);
        
        // Auto-hide after 10 seconds for small gaps, 15 for larger
        const hideDelay = storedTimeGapInfo.gapHours || storedTimeGapInfo.gapDays ? 15000 : 10000;
        setTimeout(() => {
          setShowTimeGapIndicator(false);
        }, hideDelay);

        // Fetch summary if there are missed messages
        fetchMissedSummaryIfNeeded(storedTimeGapInfo.lastVisitTime, storedMessages, storedState);
      }
    }

    // Update storage info
    setStorageInfo(getStorageInfo());
  }, []);

  // Fetch missed conversation summary
  const fetchMissedSummaryIfNeeded = async (
    lastVisitTimestamp: number,
    currentMessages: ChatMessage[],
    currentState: ChatRoomState | null
  ) => {
    try {
      // Check cache first
      const cachedSummary = getCachedSummary(lastVisitTimestamp);
      if (cachedSummary) {
        console.log('[chatroom-persistence] Using cached summary');
        setMissedSummary(cachedSummary);
        return;
      }

      // Check if there are enough missed messages to warrant a summary
      const missedMessages = getMissedMessagesForSummary(lastVisitTimestamp, currentMessages, 5);
      if (!missedMessages || missedMessages.length === 0) {
        console.log('[chatroom-persistence] Not enough missed messages for summary');
        return;
      }

      console.log(`[chatroom-persistence] Fetching summary for ${missedMessages.length} missed messages`);
      setIsFetchingSummary(true);

      // Call the summarize API
      const response = await fetch('/api/chatroom/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: missedMessages,
          lastVisitTimestamp,
          currentPhase: currentState?.phase,
          currentConsensus: currentState?.consensusDirection
            ? {
                direction: currentState.consensusDirection,
                strength: currentState.consensusStrength || 0,
              }
            : null,
        }),
      });

      if (!response.ok) {
        console.error('[chatroom-persistence] Failed to fetch summary:', response.status);
        return;
      }

      const data = await response.json();
      if (data.summary) {
        console.log('[chatroom-persistence] Summary fetched successfully');
        setMissedSummary(data.summary);
        // Cache the summary
        cacheSummary(data.summary, lastVisitTimestamp, missedMessages.length);
      }
    } catch (error) {
      console.error('[chatroom-persistence] Error fetching summary:', error);
    } finally {
      setIsFetchingSummary(false);
    }
  };

  // Save messages to localStorage
  const saveMessages = useCallback((newMessages: ChatMessage[], newState: ChatRoomState) => {
    // Deduplicate by message ID
    const uniqueMessages = newMessages.filter(msg => {
      if (messageIdsRef.current.has(msg.id)) return false;
      messageIdsRef.current.add(msg.id);
      return true;
    });

    if (uniqueMessages.length === 0 && messages.length === newMessages.length) {
      // No new messages to save
      return;
    }

    const mergedMessages = [...messages, ...uniqueMessages];
    
    // Only save if state has changed significantly
    if (!lastSavedStateRef.current || 
        lastSavedStateRef.current.phase !== newState.phase ||
        lastSavedStateRef.current.consensusDirection !== newState.consensusDirection ||
        lastSavedStateRef.current.consensusStrength !== newState.consensusStrength ||
        mergedMessages.length > messages.length + 5) { // Save every 5 messages even without state change
      
      try {
        const success = saveChatHistory(mergedMessages, newState);
        if (success) {
          setMessages(mergedMessages);
          setState(newState);
          lastSavedStateRef.current = newState;
          setStorageInfo(getStorageInfo());
        }
      } catch (error) {
        console.error('[chatroom-persistence] Failed to save:', error);
      }
    }
  }, [messages]);

  // Clear history
  const clearHistory = useCallback(() => {
    try {
      clearChatHistory();
      clearCachedSummary();
      setMessages([]);
      setState(null);
      setTimeGapInfo(null);
      setShowTimeGapIndicator(false);
      setMissedSummary(null);
      messageIdsRef.current.clear();
      lastSavedStateRef.current = null;
      setStorageInfo({ hasData: false, messageCount: 0, estimatedSize: 0 });
      console.log('[chatroom-persistence] History cleared');
    } catch (error) {
      console.error('[chatroom-persistence] Failed to clear history:', error);
    }
  }, []);

  // Dismiss time gap indicator
  const dismissTimeGap = useCallback(() => {
    setShowTimeGapIndicator(false);
  }, []);

  // Refresh storage info
  const refreshStorageInfo = useCallback(() => {
    setStorageInfo(getStorageInfo());
  }, []);

  return {
    // State
    messages,
    state,
    timeGapInfo,
    showTimeGapIndicator,
    missedSummary,
    isFetchingSummary,
    storageInfo,
    // Actions
    saveMessages,
    clearHistory,
    dismissTimeGap,
    refreshStorageInfo,
  };
}

/**
 * Hook to track if user is returning after a significant time gap
 * Useful for showing welcome back messages or special UI
 */
export function useTimeGapDetection(): {
  isReturningUser: boolean;
  timeAway: string | null;
  gapSeverity: 'none' | 'low' | 'medium' | 'high';
} {
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [timeAway, setTimeAway] = useState<string | null>(null);
  const [gapSeverity, setGapSeverity] = useState<'none' | 'low' | 'medium' | 'high'>('none');

  useEffect(() => {
    const { timeGapInfo } = loadChatHistory();
    
    if (timeGapInfo.hasGap && timeGapInfo.lastVisitTime) {
      setIsReturningUser(true);
      setTimeAway(formatTimeGap(timeGapInfo.lastVisitTime));
      
      if (timeGapInfo.gapDays) {
        setGapSeverity('high');
      } else if (timeGapInfo.gapHours && timeGapInfo.gapHours >= 1) {
        setGapSeverity('medium');
      } else {
        setGapSeverity('low');
      }
    }
  }, []);

  return { isReturningUser, timeAway, gapSeverity };
}

/**
 * Hook to persist a single message
 * Useful for adding messages incrementally
 */
export function useMessagePersistence() {
  const persistMessage = useCallback((message: ChatMessage, currentState: ChatRoomState) => {
    try {
      const { messages: existingMessages } = loadChatHistory();
      
      // Check if message already exists
      if (existingMessages.some(m => m.id === message.id)) {
        return;
      }

      const updatedMessages = [...existingMessages, message];
      saveChatHistory(updatedMessages, currentState);
    } catch (error) {
      console.error('[chatroom-persistence] Failed to persist message:', error);
    }
  }, []);

  return { persistMessage };
}
