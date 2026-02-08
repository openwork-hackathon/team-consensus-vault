'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatMessage as ChatMessageType, ChatPhase } from '@/lib/chatroom/types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import PhaseIndicator from './PhaseIndicator';

interface ChatRoomProps {
  messages: ChatMessageType[];
  phase: ChatPhase;
  typingPersona: { id: string; handle: string; avatar: string } | null;
  cooldownEndsAt: number | null;
  isConnected: boolean;
}

export default function ChatRoom({
  messages,
  phase,
  typingPersona,
  cooldownEndsAt,
  isConnected,
}: ChatRoomProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

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
    // Consider "at bottom" if within 80px
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
      {/* Phase indicator bar */}
      <PhaseIndicator phase={phase} cooldownEndsAt={cooldownEndsAt} />

      {/* Connection status */}
      {!isConnected && (
        <div className="px-3 py-1 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-400">
          Reconnecting...
        </div>
      )}

      {/* Message area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[500px] overflow-y-auto py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Waiting for the conversation to start...
          </div>
        )}

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
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

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {messages.length} messages
        </span>
        <span className="text-[11px] text-muted-foreground">
          17 AI personalities debating the market
        </span>
      </div>
    </div>
  );
}
