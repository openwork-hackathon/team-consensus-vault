'use client';

import { motion } from 'framer-motion';
import { HumanChatMessage as HumanChatMessageType } from '@/lib/human-chat/types';

interface HumanChatMessageProps {
  message: HumanChatMessageType;
  isOwnMessage?: boolean;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return formatTime(timestamp);
}

export default function HumanChatMessage({ message, isOwnMessage = false }: HumanChatMessageProps) {
  const avatar = message.avatar || '👤';
  const displayName = message.handle;

  const messageAriaLabel = `${displayName} says: ${message.content}. ${formatRelativeTime(message.timestamp)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-1.5 group ${
        isOwnMessage ? 'bg-primary/5' : 'hover:bg-white/[0.02]'
      }`}
      role="article"
      aria-label={messageAriaLabel}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xl sm:text-lg flex-shrink-0 bg-card border border-border"
        aria-hidden="true"
      >
        {avatar}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-semibold text-sm sm:text-sm ${
              isOwnMessage ? 'text-primary' : 'text-foreground'
            }`}
          >
            {displayName}
            {isOwnMessage && (
              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(You)</span>
            )}
          </span>
          <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>
        <p className="text-sm sm:text-sm text-foreground/90 mt-0.5 leading-relaxed break-words">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
