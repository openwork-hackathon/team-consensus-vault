'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HumanChatMessage as HumanChatMessageType } from '@/lib/human-chat/types';
import HumanChatMessage from './HumanChatMessage';
import HumanSentimentMeter from '@/components/chatroom/HumanSentimentMeter';

interface HumanChatRoomProps {
  messages: HumanChatMessageType[];
  currentUserId?: string;
  isConnected: boolean;
  activeUsers: number;
}

export default function HumanChatRoom({
  messages,
  currentUserId,
  isConnected,
  activeUsers,
}: HumanChatRoomProps) {
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
  }, [messages]);

  // Track if user has scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Consider "at bottom" if within 100px
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    // Show scroll button if not at bottom
    setShowScrollButton(!isAutoScrollRef.current);
  };

  // Scroll to bottom button handler
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      isAutoScrollRef.current = true;
      setShowScrollButton(false);
    }
  };

  // Keyboard navigation for messages
  const handleMessageKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
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
    },
    [messages.length]
  );

  // Reset focused index when messages change
  useEffect(() => {
    setFocusedMessageIndex(-1);
    messageRefs.current = messageRefs.current.slice(0, messages.length);
  }, [messages.length]);

  // Group messages by date for potential date separators
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Human Sentiment Meter - Display Only */}
      <HumanSentimentMeter messages={messages} />

      {/* Chat Room */}
      <div
        className="bg-card rounded-xl border border-border overflow-hidden flex flex-col relative"
        role="region"
        aria-label="Human Chat Room"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Human Chat</h3>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {activeUsers} online
            </span>
            <span>{messages.length} messages</span>
          </div>
        </div>

      {/* Connection status */}
      {!isConnected && (
        <div
          className="px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-400"
          role="status"
          aria-live="polite"
        >
          Reconnecting...
        </div>
      )}

      {/* Message area */}
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
          overscrollBehavior: 'contain',
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4 text-center gap-3">
            <div className="text-4xl" aria-hidden="true">
              💬
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Be the first to start the conversation!</p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id}
            ref={(el) => {
              messageRefs.current[index] = el;
            }}
            tabIndex={0}
            onKeyDown={(e) => handleMessageKeyDown(e, index)}
            className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 rounded"
            role="article"
            aria-label={`Message from ${msg.handle}`}
          >
            <HumanChatMessage
              message={msg}
              isOwnMessage={msg.userId === currentUserId}
            />
          </div>
        ))}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 sm:right-6 bg-primary text-primary-foreground p-2 rounded-full shadow-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-primary/90 transition-colors z-10"
            aria-label="Scroll to bottom"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
