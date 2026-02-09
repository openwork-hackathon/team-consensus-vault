'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatMessage as ChatMessageType, ChatPhase } from '@/lib/chatroom/types';
import { TimeGapInfo, formatTimeGap } from '@/lib/chatroom/local-storage';
import { PERSONAS } from '@/lib/chatroom/personas';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import PhaseIndicator from './PhaseIndicator';

interface ChatRoomProps {
  messages: ChatMessageType[];
  phase: ChatPhase;
  typingPersona: { id: string; handle: string; avatar: string } | null;
  cooldownEndsAt: number | null;
  isConnected: boolean;
  timeGapInfo?: TimeGapInfo | null;
  showTimeGapIndicator?: boolean;
  onQuoteMessage?: (messageId: string) => void;
}

export default function ChatRoom({
  messages,
  phase,
  typingPersona,
  cooldownEndsAt,
  isConnected,
  onQuoteMessage,
}: ChatRoomProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number>(-1);
  const messageRefs = useRef<(HTMLElement | null)[]>([]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingPersona]);

  // Track if user has scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Consider "at bottom" if within 100px (increased for mobile)
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    // Show scroll button if not at bottom
    setShowScrollButton(!isAutoScrollRef.current);
  };

  // Scroll to bottom button handler
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      isAutoScrollRef.current = true;
      setShowScrollButton(false);
    }
  };

  // Keyboard navigation for messages
  const handleMessageKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (messages.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (index < messages.length - 1) {
          const nextIndex = index + 1;
          setFocusedMessageIndex(nextIndex);
          messageRefs.current[nextIndex]?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevIndex = index - 1;
          setFocusedMessageIndex(prevIndex);
          messageRefs.current[prevIndex]?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedMessageIndex(0);
        messageRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        setFocusedMessageIndex(messages.length - 1);
        messageRefs.current[messages.length - 1]?.focus();
        break;
    }
  }, [messages.length]);

  // Reset focused index when messages change
  useEffect(() => {
    setFocusedMessageIndex(-1);
    messageRefs.current = messageRefs.current.slice(0, messages.length);
  }, [messages.length]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col" role="region" aria-label="AI Debate Chatroom">
      {/* Phase indicator bar */}
      <PhaseIndicator phase={phase} cooldownEndsAt={cooldownEndsAt} />

      {/* Connection status */}
      {!isConnected && (
        <div
          className="px-3 py-2 sm:py-1 bg-yellow-500/10 border-b border-yellow-500/20 text-xs sm:text-xs text-yellow-400"
          role="status"
          aria-live="polite"
        >
          Reconnecting...
        </div>
      )}

      {/* Message area - Responsive height */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[400px] sm:h-[500px] md:h-[600px] overflow-y-auto overflow-x-hidden py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scrollable"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm px-4 text-center">
            Waiting for the conversation to start...
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id}
            ref={el => { messageRefs.current[index] = el; }}
            tabIndex={0}
            onKeyDown={(e) => handleMessageKeyDown(e, index)}
            className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded"
            role="article"
            aria-label={`Message from ${msg.handle}, ${msg.sentiment} sentiment`}
          >
            <ChatMessage message={msg} onQuote={onQuoteMessage} />
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingPersona && (
            <TypingIndicator
              personaId={typingPersona.id}
              handle={typingPersona.handle}
              avatar={typingPersona.avatar}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-16 right-4 sm:right-6 bg-primary text-primary-foreground p-2 rounded-full shadow-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-primary/90 transition-colors z-10"
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-3 py-2 sm:py-2 border-t border-border flex items-center justify-between text-xs sm:text-[11px]" role="status" aria-live="polite">
        <span className="text-muted-foreground" aria-label={`${messages.length} messages in chat`}>
          {messages.length} messages
        </span>
        <span className="text-muted-foreground hidden sm:inline" aria-label={`${PERSONAS.length} AI personalities debating the market`}>
          {PERSONAS.length} AI personalities debating the market
        </span>
        <span className="text-muted-foreground sm:hidden" aria-label={`${PERSONAS.length} AI debating`}>
          {PERSONAS.length} AI debating
        </span>
      </div>
    </div>
  );
}
