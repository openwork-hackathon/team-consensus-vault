'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as ChatMessageType, ChatPhase, MessageSentiment, ChatRoomState } from '@/lib/chatroom/types';
import {
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
  clearCachedSummary,
  TimeGapInfo,
  formatTimeGap,
  getMissedMessagesForSummary,
  getCachedSummary,
  cacheSummary
} from '@/lib/chatroom/local-storage';

interface TypingPersona {
  id: string;
  handle: string;
  avatar: string;
  durationMs?: number;  // CVAULT-178: Expected typing duration from server
  expectedLength?: number;  // CVAULT-178: Expected message length
}

interface ChatroomStreamState {
  messages: ChatMessageType[];
  phase: ChatPhase;
  typingPersona: TypingPersona | null;
  consensusDirection: MessageSentiment | null;
  consensusStrength: number;
  cooldownEndsAt: number | null;
  isConnected: boolean;
  systemError: string | null;
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

interface ChatroomStreamActions {
  clearHistory: () => void;
  dismissTimeGap: () => void;
  refreshStorageInfo: () => void;
}

/**
 * CVAULT-179: Enhanced Chatroom Stream Hook with Persistence
 * 
 * Manages real-time SSE connection to chatroom with full localStorage persistence.
 * Handles time gap detection, missed message summaries, and graceful reconnection.
 */
export function useChatroomStream(): ChatroomStreamState & ChatroomStreamActions {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('DEBATE');
  const [typingPersona, setTypingPersona] = useState<TypingPersona | null>(null);
  const [consensusDirection, setConsensusDirection] = useState<MessageSentiment | null>(null);
  const [consensusStrength, setConsensusStrength] = useState(0);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [timeGapInfo, setTimeGapInfo] = useState<TimeGapInfo | null>(null);
  const [showTimeGapIndicator, setShowTimeGapIndicator] = useState(false);
  const [missedSummary, setMissedSummary] = useState<string | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    hasData: false,
    messageCount: 0,
    estimatedSize: 0,
  });

  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const lastSavedStateRef = useRef<ChatRoomState | null>(null);
  const storageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((msg: ChatMessageType) => {
    // Deduplicate by message ID
    if (messageIdsRef.current.has(msg.id)) return;
    messageIdsRef.current.add(msg.id);
    setMessages(prev => {
      const newMessages = [...prev, msg];
      
      // Save to localStorage when new message arrives
      try {
        const currentState: ChatRoomState = {
          phase,
          phaseStartedAt: Date.now(), // This should come from server state
          cooldownEndsAt,
          lastMessageAt: msg.timestamp,
          lastSpeakerId: msg.personaId,
          messageCount: newMessages.length,
          nextSpeakerId: null, // This should come from server state
          consensusDirection,
          consensusStrength,
          recentSpeakers: [], // This should come from server state
        };
        
        // Only save if state has changed significantly
        if (!lastSavedStateRef.current || 
            lastSavedStateRef.current.phase !== currentState.phase ||
            lastSavedStateRef.current.consensusDirection !== currentState.consensusDirection ||
            lastSavedStateRef.current.consensusStrength !== currentState.consensusStrength) {
          
          saveChatHistory(newMessages, currentState);
          lastSavedStateRef.current = currentState;
          // Update storage info after save
          updateStorageInfo();
        }
      } catch (error) {
        console.error('[chatroom] Failed to save to localStorage:', error);
      }
      
      return newMessages;
    });
    
    // Clear typing when message arrives
    setTypingPersona(null);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [phase, cooldownEndsAt, consensusDirection, consensusStrength]);

  // Update storage info
  const updateStorageInfo = useCallback(() => {
    try {
      const stored = localStorage.getItem('cvault-chatroom-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setStorageInfo({
          hasData: true,
          messageCount: parsed.messages?.length || 0,
          estimatedSize: stored.length,
        });
      } else {
        setStorageInfo({ hasData: false, messageCount: 0, estimatedSize: 0 });
      }
    } catch (error) {
      console.error('[chatroom] Failed to get storage info:', error);
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const { messages: storedMessages, state: storedState, timeGapInfo: storedTimeGapInfo } = loadChatHistory();
    let timeGapTimeoutId: NodeJS.Timeout | null = null;

    if (storedMessages.length > 0) {
      setMessages(storedMessages);
      messageIdsRef.current = new Set(storedMessages.map(m => m.id));

      if (storedState) {
        setPhase(storedState.phase);
        setCooldownEndsAt(storedState.cooldownEndsAt);
        setConsensusDirection(storedState.consensusDirection);
        setConsensusStrength(storedState.consensusStrength);
        lastSavedStateRef.current = storedState;
      }

      setTimeGapInfo(storedTimeGapInfo);

      // Show time gap indicator if there's a significant gap
      if (storedTimeGapInfo.hasGap && storedTimeGapInfo.lastVisitTime) {
        setShowTimeGapIndicator(true);
        // Auto-hide after 10 seconds
        timeGapTimeoutId = setTimeout(() => {
          setShowTimeGapIndicator(false);
        }, 10000);

        // Fetch summary if there are missed messages
        fetchMissedSummaryIfNeeded(storedTimeGapInfo.lastVisitTime, storedMessages, storedState);
      }
    }

    updateStorageInfo();

    // Set up periodic storage info updates
    storageCheckIntervalRef.current = setInterval(updateStorageInfo, 30000); // Every 30 seconds

    return () => {
      if (storageCheckIntervalRef.current) {
        clearInterval(storageCheckIntervalRef.current);
      }
      if (timeGapTimeoutId) {
        clearTimeout(timeGapTimeoutId);
      }
    };
  }, [updateStorageInfo]);

  // Fetch missed conversation summary
  const fetchMissedSummaryIfNeeded = async (
    lastVisitTimestamp: number,
    currentMessages: ChatMessageType[],
    currentState: ChatRoomState | null
  ) => {
    try {
      // Check cache first
      const cachedSummary = getCachedSummary(lastVisitTimestamp);
      if (cachedSummary) {
        console.log('[chatroom] Using cached summary');
        setMissedSummary(cachedSummary);
        return;
      }

      // Check if there are enough missed messages to warrant a summary
      const missedMessages = getMissedMessagesForSummary(lastVisitTimestamp, currentMessages, 5);
      if (!missedMessages || missedMessages.length === 0) {
        console.log('[chatroom] Not enough missed messages for summary');
        return;
      }

      console.log(`[chatroom] Fetching summary for ${missedMessages.length} missed messages`);
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
        console.error('[chatroom] Failed to fetch summary:', response.status);
        return;
      }

      const data = await response.json();
      if (data.summary) {
        console.log('[chatroom] Summary fetched successfully');
        setMissedSummary(data.summary);
        // Cache the summary
        cacheSummary(data.summary, lastVisitTimestamp, missedMessages.length);
      }
    } catch (error) {
      console.error('[chatroom] Error fetching summary:', error);
    } finally {
      setIsFetchingSummary(false);
    }
  };

  // Clear history action
  const clearHistory = useCallback(() => {
    try {
      clearChatHistory();
      clearCachedSummary();
      setMessages([]);
      setPhase('DEBATE');
      setCooldownEndsAt(null);
      setConsensusDirection(null);
      setConsensusStrength(0);
      setTimeGapInfo(null);
      setShowTimeGapIndicator(false);
      setMissedSummary(null);
      messageIdsRef.current.clear();
      lastSavedStateRef.current = null;
      setStorageInfo({ hasData: false, messageCount: 0, estimatedSize: 0 });
      console.log('[chatroom] History cleared successfully');
    } catch (error) {
      console.error('[chatroom] Failed to clear history:', error);
    }
  }, []);

  // Dismiss time gap indicator
  const dismissTimeGap = useCallback(() => {
    setShowTimeGapIndicator(false);
  }, []);

  // Refresh storage info
  const refreshStorageInfo = useCallback(() => {
    updateStorageInfo();
  }, [updateStorageInfo]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource('/api/chatroom/stream');
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setIsConnected(true);
        retryCountRef.current = 0;
      });

      es.addEventListener('history', (event) => {
        try {
          const data = JSON.parse(event.data);
          const historyMessages: ChatMessageType[] = data.messages || [];
          
          // Merge with localStorage messages (prefer server messages for duplicates)
          const storedData = loadChatHistory();
          const mergedMessages = [...storedData.messages];
          const mergedIds = new Set(mergedMessages.map(m => m.id));
          
          for (const msg of historyMessages) {
            if (!mergedIds.has(msg.id)) {
              mergedMessages.push(msg);
              mergedIds.add(msg.id);
            }
          }
          
          // Sort by timestamp
          mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
          
          // Reset messages with merged history
          messageIdsRef.current = new Set(mergedMessages.map(m => m.id));
          setMessages(mergedMessages);
          
          if (data.phase) setPhase(data.phase);
          if (data.cooldownEndsAt) setCooldownEndsAt(data.cooldownEndsAt);
          
          // Save merged state
          if (data.phase && data.cooldownEndsAt) {
            const currentState: ChatRoomState = {
              phase: data.phase,
              phaseStartedAt: Date.now(),
              cooldownEndsAt: data.cooldownEndsAt,
              lastMessageAt: mergedMessages.length > 0 ? mergedMessages[mergedMessages.length - 1].timestamp : Date.now(),
              lastSpeakerId: mergedMessages.length > 0 ? mergedMessages[mergedMessages.length - 1].personaId : null,
              messageCount: mergedMessages.length,
              nextSpeakerId: null,
              consensusDirection,
              consensusStrength,
              recentSpeakers: [],
            };
            saveChatHistory(mergedMessages, currentState);
            lastSavedStateRef.current = currentState;
            updateStorageInfo();
          }
        } catch (e) {
          console.error('[chatroom] Failed to parse history:', e);
        }
      });

      es.addEventListener('message', (event) => {
        try {
          const msg: ChatMessageType = JSON.parse(event.data);
          addMessage(msg);
        } catch (e) {
          console.error('[chatroom] Failed to parse message:', e);
        }
      });

      es.addEventListener('typing', (event) => {
        try {
          const data: TypingPersona = JSON.parse(event.data);
          setTypingPersona(data);
          
          // CVAULT-178: Use server-provided duration or fallback to 30s safety net
          // The server calculates realistic typing duration based on message length and persona
          const durationMs = data.durationMs ?? 30_000;
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingPersona(null);
          }, durationMs);
        } catch (e) {
          console.error('[chatroom] Failed to parse typing:', e);
        }
      });

      es.addEventListener('phase_change', (event) => {
        try {
          const data = JSON.parse(event.data);
          setPhase(data.to);
          if (data.cooldownEndsAt) setCooldownEndsAt(data.cooldownEndsAt);
          if (data.to === 'DEBATE') {
            setCooldownEndsAt(null);
            setConsensusDirection(null);
            setConsensusStrength(0);
          }
          
          // Save updated state to localStorage
          const currentState: ChatRoomState = {
            phase: data.to,
            phaseStartedAt: Date.now(),
            cooldownEndsAt: data.cooldownEndsAt || null,
            lastMessageAt: messages.length > 0 ? messages[messages.length - 1].timestamp : Date.now(),
            lastSpeakerId: messages.length > 0 ? messages[messages.length - 1].personaId : null,
            messageCount: messages.length,
            nextSpeakerId: null,
            consensusDirection,
            consensusStrength,
            recentSpeakers: [],
          };
          saveChatHistory(messages, currentState);
          lastSavedStateRef.current = currentState;
          updateStorageInfo();
        } catch (e) {
          console.error('[chatroom] Failed to parse phase_change:', e);
        }
      });

      es.addEventListener('consensus_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.direction !== undefined) setConsensusDirection(data.direction);
          if (data.strength !== undefined) setConsensusStrength(data.strength);
          
          // Save updated state to localStorage
          const currentState: ChatRoomState = {
            phase,
            phaseStartedAt: Date.now(),
            cooldownEndsAt,
            lastMessageAt: messages.length > 0 ? messages[messages.length - 1].timestamp : Date.now(),
            lastSpeakerId: messages.length > 0 ? messages[messages.length - 1].personaId : null,
            messageCount: messages.length,
            nextSpeakerId: null,
            consensusDirection: data.direction !== undefined ? data.direction : consensusDirection,
            consensusStrength: data.strength !== undefined ? data.strength : consensusStrength,
            recentSpeakers: [],
          };
          saveChatHistory(messages, currentState);
          lastSavedStateRef.current = currentState;
          updateStorageInfo();
        } catch (e) {
          console.error('[chatroom] Failed to parse consensus_update:', e);
        }
      });

      // CVAULT-184: Error events are no longer sent to the client - errors are handled silently server-side
      // No error event listeners should be registered

      // CVAULT-185: Listen for stance change events
      es.addEventListener('stance_change', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[chatroom] Stance change detected:', {
            persona: data.handle,
            from: data.from,
            to: data.to,
            convictionScore: data.convictionScore,
            timestamp: new Date().toISOString(),
          });
          
          // Add a system message to show the stance change
          const stanceChangeMessage: ChatMessageType = {
            id: `stance_${Date.now()}_${data.personaId}`,
            personaId: 'system',
            handle: 'System',
            avatar: '🔄',
            content: `${data.handle} has shifted stance from ${data.from} to ${data.to} (conviction: ${data.convictionScore}/100)`,
            timestamp: Date.now(),
            phase,
          };
          
          addMessage(stanceChangeMessage);
        } catch (e) {
          console.error('[chatroom] Failed to parse stance_change:', e);
        }
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();

        if (retryCountRef.current < maxRetries) {
          const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30_000);
          retryCountRef.current++;
          console.log(`[chatroom] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          reconnectTimeout = setTimeout(connect, delay);
        } else {
          console.error('[chatroom] Max retries reached');
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [addMessage]);

  return {
    messages,
    phase,
    typingPersona,
    consensusDirection,
    consensusStrength,
    cooldownEndsAt,
    isConnected,
    systemError,
    timeGapInfo,
    showTimeGapIndicator,
    missedSummary,
    isFetchingSummary,
    storageInfo,
    clearHistory,
    dismissTimeGap,
    refreshStorageInfo,
  };
}
