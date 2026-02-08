'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatPhase, MessageSentiment } from '@/lib/chatroom/types';

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
}

export function useChatroomStream(): ChatroomStreamState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>('DEBATE');
  const [typingPersona, setTypingPersona] = useState<TypingPersona | null>(null);
  const [consensusDirection, setConsensusDirection] = useState<MessageSentiment | null>(null);
  const [consensusStrength, setConsensusStrength] = useState(0);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const addMessage = useCallback((msg: ChatMessage) => {
    // Deduplicate by message ID
    if (messageIdsRef.current.has(msg.id)) return;
    messageIdsRef.current.add(msg.id);
    setMessages(prev => [...prev, msg]);
    // Clear typing when message arrives
    setTypingPersona(null);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
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
          // Reset messages with history
          messageIdsRef.current = new Set(historyMessages.map(m => m.id));
          setMessages(historyMessages);
          if (data.phase) setPhase(data.phase);
          if (data.cooldownEndsAt) setCooldownEndsAt(data.cooldownEndsAt);
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
        } catch (e) {
          console.error('[chatroom] Failed to parse phase_change:', e);
        }
      });

      es.addEventListener('consensus_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.direction !== undefined) setConsensusDirection(data.direction);
          if (data.strength !== undefined) setConsensusStrength(data.strength);
        } catch (e) {
          console.error('[chatroom] Failed to parse consensus_update:', e);
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
  };
}
