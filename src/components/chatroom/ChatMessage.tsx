'use client';

import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/lib/chatroom/types';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';
import UserModerationStatus from './UserModerationStatus';

interface ChatMessageProps {
  message: ChatMessageType;
  onQuote?: (messageId: string) => void;
}

function formatTime(timestamp: number): string {
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  // Reset time portions to compare dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Calculate difference in days
  const diffTime = today.getTime() - messageDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format time portion
  const timeStr = messageDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Format based on when the message was sent
  if (diffDays === 0) {
    // Today - just show time
    return timeStr;
  } else if (diffDays === 1) {
    // Yesterday - show "Yesterday time"
    return `Yesterday ${timeStr}`;
  } else if (diffDays < 7) {
    // Within last week - show day of week
    const dayOfWeek = messageDate.toLocaleDateString([], { weekday: 'long' });
    return `${dayOfWeek} ${timeStr}`;
  } else {
    // Older - show date and time
    const dateStr = messageDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr}, ${timeStr}`;
  }
}

function SentimentBadge({ sentiment, confidence }: { sentiment: string; confidence?: number }) {
  const colors = {
    bullish: 'bg-bullish/20 text-bullish border-bullish/30',
    bearish: 'bg-bearish/20 text-bearish border-bearish/30',
    neutral: 'bg-neutral/20 text-neutral border-neutral/30',
  };

  const labels = {
    bullish: 'Bull',
    bearish: 'Bear',
    neutral: 'Neutral',
  };

  const colorClass = colors[sentiment as keyof typeof colors] || colors.neutral;
  const label = labels[sentiment as keyof typeof labels] || sentiment;

  const ariaLabel = confidence !== undefined
    ? `${label} sentiment with ${confidence}% confidence`
    : `${label} sentiment`;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium border ${colorClass} touch-manipulation`}
      role="status"
      aria-label={ariaLabel}
    >
      {label}
      {confidence !== undefined && (
        <span aria-label={`${confidence} percent`}>{confidence}%</span>
      )}
    </span>
  );
}

export default function ChatMessage({ message, onQuote }: ChatMessageProps) {
  const persona = PERSONAS_BY_ID[message.personaId];
  const color = persona?.color || '#888';

  const messageAriaLabel = `${message.handle} says: ${message.content}. Sentiment: ${message.sentiment || 'none'}. ${formatTime(message.timestamp)}`;

  const handleClick = () => {
    if (onQuote) {
      onQuote(message.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2.5 sm:gap-3 px-3 sm:px-4 py-4 sm:py-3 hover:bg-white/[0.02] active:bg-white/[0.05] group ${onQuote ? 'cursor-pointer hover:bg-accent/10' : ''}`}
      role="article"
      aria-label={messageAriaLabel}
      onClick={handleClick}
      tabIndex={onQuote ? 0 : undefined}
      onKeyDown={(e) => {
        if (onQuote && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Avatar - Larger touch target */}
      <div
        className="w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-base sm:text-sm flex-shrink-0"
        style={{ backgroundColor: color + '30', border: `1.5px solid ${color}50` }}
        aria-hidden="true"
      >
        {message.avatar}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-semibold text-sm sm:text-sm"
            style={{ color }}
          >
            {message.handle}
          </span>
          {message.moderation?.userId && (
            <UserModerationStatus
              userId={message.moderation.userId}
              isAI={false}
            />
          )}
          <span className="text-[11px] text-muted-foreground/70">
            {formatTime(message.timestamp)}
          </span>
          {message.sentiment && (
            <SentimentBadge
              sentiment={message.sentiment}
              confidence={message.confidence}
            />
          )}
        </div>
        <p className="text-sm sm:text-sm text-foreground/90 mt-0.5 leading-relaxed break-words">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
