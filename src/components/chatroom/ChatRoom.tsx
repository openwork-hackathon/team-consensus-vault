'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatMessage as ChatMessageType, ChatPhase } from '@/lib/chatroom/types';
import { TimeGapInfo, formatTimeGap } from '@/lib/chatroom/local-storage';
import { PERSONAS } from '@/lib/chatroom/personas';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import PhaseIndicator from './PhaseIndicator';
import TimeGapIndicator from './TimeGapIndicator';
import ChatroomControls from './ChatroomControls';

interface ChatRoomProps {
  messages: ChatMessageType[];
  phase: ChatPhase;
  typingPersona: { id: string; handle: string; avatar: string } | null;
  cooldownEndsAt: number | null;
  isConnected: boolean;
  timeGapInfo?: TimeGapInfo | null;
  showTimeGapIndicator?: boolean;
  missedSummary?: string | null;
  isFetchingSummary?: boolean;
  storageInfo?: {
    hasData: boolean;
    messageCount: number;
    estimatedSize: number;
  };
  onQuoteMessage?: (messageId: string) => void;
  onClearHistory?: () => void;
  onDismissTimeGap?: () => void;
}

export default function ChatRoom({
  messages,
  phase,
  typingPersona,
  cooldownEndsAt,
  isConnected,
  timeGapInfo,
  showTimeGapIndicator,
  missedSummary,
  isFetchingSummary,
  storageInfo,
  onQuoteMessage,
  onClearHistory,
  onDismissTimeGap,
}: ChatRoomProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number>(-1);
  const messageRefs = useRef<(HTMLElement | null)[]>([]);
  const [showTimeGap, setShowTimeGap] = useState(showTimeGapIndicator || false);
  const [displayedMessageCount, setDisplayedMessageCount] = useState(100); // Start with last 100 messages
  const [showLoadMore, setShowLoadMore] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.slice(-5), typingPersona]); // Only scroll on last 5 messages or typing

  // Track if user has scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Consider "at bottom" if within 100px (increased for mobile)
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    // Show scroll button if not at bottom
    setShowScrollButton(!isAutoScrollRef.current);

    // Check if we should show load more button (near top)
    if (scrollTop < 100 && messages.length > displayedMessageCount) {
      setShowLoadMore(true);
    } else {
      setShowLoadMore(false);
    }
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

  // Load more messages handler
  const handleLoadMore = () => {
    setDisplayedMessageCount(prev => Math.min(prev + 50, messages.length));
    // Keep scroll position after loading more
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollTop + 200; // Adjust for new content
        }
      }, 50);
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

  // Handle time gap indicator display
  useEffect(() => {
    if (showTimeGapIndicator && timeGapInfo?.hasGap) {
      setShowTimeGap(true);
      // Auto-hide after 15 seconds for medium/high severity gaps
      if (timeGapInfo.gapHours || timeGapInfo.gapDays) {
        const timeout = setTimeout(() => {
          setShowTimeGap(false);
          onDismissTimeGap?.();
        }, 15000);
        return () => clearTimeout(timeout);
      }
    }
  }, [showTimeGapIndicator, timeGapInfo, onDismissTimeGap]);

  // Group messages by time gaps (>5 minutes)
  const getMessageGroups = () => {
    // Use only the displayed messages (pagination)
    const displayedMessages = messages.slice(-displayedMessageCount);
    
    if (displayedMessages.length === 0) return [];
    
    const groups: { messages: ChatMessageType[], hasTimeGap: boolean, gapMinutes?: number }[] = [];
    let currentGroup: ChatMessageType[] = [];
    let lastTimestamp = displayedMessages[0].timestamp;
    
    for (const message of displayedMessages) {
      const timeDiff = message.timestamp - lastTimestamp;
      const gapMinutes = Math.floor(timeDiff / (60 * 1000));
      
      // If gap is >5 minutes, start a new group
      if (gapMinutes > 5 && currentGroup.length > 0) {
        groups.push({ 
          messages: currentGroup, 
          hasTimeGap: true, 
          gapMinutes 
        });
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
      
      lastTimestamp = message.timestamp;
    }
    
    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({ 
        messages: currentGroup, 
        hasTimeGap: false 
      });
    }
    
    return groups;
  };

  const messageGroups = getMessageGroups();
  const hasMoreMessages = messages.length > displayedMessageCount;

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
        className="h-[350px] sm:h-[400px] md:h-[480px] overflow-y-auto overflow-x-hidden py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scrollable"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Load more button */}
        {hasMoreMessages && (
          <div className="flex justify-center py-3">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Load {Math.min(50, messages.length - displayedMessageCount)} more messages
              <span className="text-muted-foreground">
                ({messages.length - displayedMessageCount} hidden)
              </span>
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm px-4 text-center">
            Waiting for the conversation to start...
          </div>
        )}

        {/* Time gap indicator */}
        <AnimatePresence>
          {showTimeGap && timeGapInfo && (
            <TimeGapIndicator
              timeGapInfo={timeGapInfo}
              missedSummary={missedSummary}
              isLoadingSummary={isFetchingSummary}
              onDismiss={() => {
                setShowTimeGap(false);
                onDismissTimeGap?.();
              }}
            />
          )}
        </AnimatePresence>

        {messageGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="space-y-0.5">
            {/* Time gap separator */}
            {group.hasTimeGap && group.gapMinutes && (
              <div className="relative my-4 mx-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground rounded-full border border-border">
                    {group.gapMinutes} minute{group.gapMinutes !== 1 ? 's' : ''} later
                  </span>
                </div>
              </div>
            )}
            
            {/* Messages in group */}
            {group.messages.map((msg, index) => {
              const messageIndex = messages.indexOf(msg);
              return (
                <div
                  key={msg.id}
                  ref={el => { messageRefs.current[messageIndex] = el; }}
                  tabIndex={0}
                  onKeyDown={(e) => handleMessageKeyDown(e, messageIndex)}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded"
                  role="article"
                  aria-label={`Message from ${msg.handle}, ${msg.sentiment} sentiment`}
                >
                  <ChatMessage message={msg} onQuote={onQuoteMessage} />
                </div>
              );
            })}
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

      {/* Footer with controls */}
      <div className="px-3 py-2 sm:py-2 border-t border-border flex items-center justify-between" role="status" aria-live="polite">
        <span className="text-muted-foreground text-xs sm:text-[11px]" aria-label={`${messages.length} messages in chat`}>
          {messages.length} messages
          {hasMoreMessages && (
            <span className="text-muted-foreground/60 ml-1">
              ({displayedMessageCount} showing)
            </span>
          )}
        </span>
        
        {/* Chatroom Controls */}
        <ChatroomControls
          messageCount={storageInfo?.messageCount || 0}
          estimatedSize={storageInfo?.estimatedSize || 0}
          hasStoredData={storageInfo?.hasData || false}
          onClearHistory={onClearHistory || (() => {})}
          isConnected={isConnected}
          phase={phase}
        />
      </div>
    </div>
  );
}
