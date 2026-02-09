'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatPhase, MessageSentiment, ChatRoomState } from '@/lib/chatroom/types';
import { 
  saveChatHistory, 
  loadChatHistory, 
  TimeGapInfo,
  formatTimeGap 
} from '@/lib/chatroom/local-storage';

interface TypingPersona {
  id: string;
  handle: string;
  avatar: string;
}

interface ChatroomStreamState {
  messages: ChatMessage[];
  phase: ChatPhase;
  typingPersona: TypingPersona | null;
  consensusDirection: MessageSentiment | null;
  consensusStrength: number;
  cooldownEndsAt: number | null;
  isConnected: boolean;
  timeGapInfo: TimeGapInfo | null;
  showTimeGapIndicator: boolean;
}

export function useChatroomStream(): ChatroomStreamState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('DEBATE');
  const [typingPersona, setTypingPersona] = useState<TypingPersona | null>(null);
  const [consensusDirection, setConsensusDirection] = useState<MessageSentiment | null>(null);
  const [consensusStrength, setConsensusStrength] = useState(0);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [timeGapInfo, setTimeGapInfo] = useState<TimeGapInfo | null>(null);
  const [showTimeGapIndicator, setShowTimeGapIndicator] = useState(false);

  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const lastSavedStateRef = useRef<ChatRoomState | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
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

  // Load from localStorage on mount
  useEffect(() => {
    const { messages: storedMessages, state: storedState, timeGapInfo: storedTimeGapInfo } = loadChatHistory();
    
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
        setTimeout(() => {
          setShowTimeGapIndicator(false);
        }, 10000);
      }
    }
  }, []);

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
          const historyMessages: ChatMessage[] = data.messages || [];
          
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
          }
        } catch (e) {
          console.error('[chatroom] Failed to parse history:', e);
        }
      });

      es.addEventListener('message', (event) => {
        try {
          const msg: ChatMessage = JSON.parse(event.data);
          addMessage(msg);
        } catch (e) {
          console.error('[chatroom] Failed to parse message:', e);
        }
      });

      es.addEventListener('typing', (event) => {
        try {
          const data: TypingPersona = JSON.parse(event.data);
          setTypingPersona(data);
          // Auto-clear typing after 30s (safety net)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingPersona(null);
          }, 30_000);
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
        } catch (e) {
          console.error('[chatroom] Failed to parse consensus_update:', e);
        }
      });

      es.addEventListener('generation_error', (event) => {
        try {
          const data = JSON.parse(event.data);
          setSystemError(`Generation error: ${data.error}`);
          // Clear error after 10 seconds
          setTimeout(() => setSystemError(null), 10000);
        } catch (e) {
          console.error('[chatroom] Failed to parse generation_error:', e);
        }
      });

      es.addEventListener('system_error', (event) => {
        try {
          const data = JSON.parse(event.data);
          setSystemError(data.message);
          // Clear error after 10 seconds
          setTimeout(() => setSystemError(null), 10000);
        } catch (e) {
          console.error('[chatroom] Failed to parse system_error:', e);
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
  };
}
