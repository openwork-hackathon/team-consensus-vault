'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HumanChatMessage, HumanChatState } from '@/lib/human-chat/types';

interface HumanChatUser {
  userId: string;
  handle: string;
  avatar?: string;
}

interface HumanChatHookState {
  messages: HumanChatMessage[];
  isConnected: boolean;
  activeUsers: number;
  state: HumanChatState | null;
  error: string | null;
  isRateLimited: boolean;
  rateLimitRemainingMs: number;
}

interface HumanChatHookActions {
  sendMessage: (content: string) => Promise<void>;
  retryConnection: () => void;
}

export function useHumanChat(
  userId: string | undefined,
  handle: string | undefined,
  avatar?: string
): HumanChatHookState & HumanChatHookActions {
  const [messages, setMessages] = useState<HumanChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [state, setState] = useState<HumanChatState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitRemainingMs, setRateLimitRemainingMs] = useState(0);

  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((msg: HumanChatMessage) => {
    // Deduplicate by message ID
    if (messageIdsRef.current.has(msg.id)) return;
    messageIdsRef.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL with user info if available
    let url = '/api/human-chat/stream';
    if (userId && handle) {
      const params = new URLSearchParams();
      params.set('userId', userId);
      params.set('handle', handle);
      if (avatar) params.set('avatar', avatar);
      url += `?${params.toString()}`;
    }

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setIsConnected(true);
      setError(null);
      retryCountRef.current = 0;
    });

    es.addEventListener('history', (event) => {
      try {
        const data = JSON.parse(event.data);
        const historyMessages: HumanChatMessage[] = data.messages || [];
        
        // Reset messages with history
        messageIdsRef.current = new Set(historyMessages.map((m: HumanChatMessage) => m.id));
        setMessages(historyMessages);
        
        if (data.state) setState(data.state);
        if (data.activeUsers !== undefined) setActiveUsers(data.activeUsers);
      } catch (e) {
        console.error('[human-chat] Failed to parse history:', e);
      }
    });

    es.addEventListener('message', (event) => {
      try {
        const msg: HumanChatMessage = JSON.parse(event.data);
        addMessage(msg);
      } catch (e) {
        console.error('[human-chat] Failed to parse message:', e);
      }
    });

    es.addEventListener('user_joined', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.activeUsers !== undefined) setActiveUsers(data.activeUsers);
      } catch (e) {
        console.error('[human-chat] Failed to parse user_joined:', e);
      }
    });

    es.addEventListener('user_left', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.activeUsers !== undefined) setActiveUsers(data.activeUsers);
      } catch (e) {
        console.error('[human-chat] Failed to parse user_left:', e);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30_000);
        retryCountRef.current++;
        console.log(
          `[human-chat] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`
        );
        setTimeout(connect, delay);
      } else {
        setError('Connection lost. Please refresh the page.');
      }
    };
  }, [userId, handle, avatar, addMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
    };
  }, [connect]);

  const sendMessage = async (content: string) => {
    if (!userId || !handle) {
      setError('Please connect your wallet to send messages');
      return;
    }

    if (isRateLimited) {
      setError(`Please wait ${Math.ceil(rateLimitRemainingMs / 1000)} seconds`);
      return;
    }

    try {
      const response = await fetch('/api/human-chat/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          handle,
          avatar,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited
          setIsRateLimited(true);
          setRateLimitRemainingMs(data.retryAfterMs || 5000);
          setError(data.message || 'Rate limit exceeded');

          // Clear rate limit after timer
          if (rateLimitTimerRef.current) {
            clearTimeout(rateLimitTimerRef.current);
          }
          rateLimitTimerRef.current = setTimeout(() => {
            setIsRateLimited(false);
            setRateLimitRemainingMs(0);
            setError(null);
          }, data.retryAfterMs || 5000);
        } else {
          setError(data.error || 'Failed to send message');
        }
        return;
      }

      // Message sent successfully
      setError(null);
      
      // Apply rate limit locally
      setIsRateLimited(true);
      setRateLimitRemainingMs(5000);
      
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
      rateLimitTimerRef.current = setTimeout(() => {
        setIsRateLimited(false);
        setRateLimitRemainingMs(0);
      }, 5000);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('[human-chat] Send message error:', err);
    }
  };

  const retryConnection = () => {
    retryCountRef.current = 0;
    setError(null);
    connect();
  };

  return {
    messages,
    isConnected,
    activeUsers,
    state,
    error,
    isRateLimited,
    rateLimitRemainingMs,
    sendMessage,
    retryConnection,
  };
}
