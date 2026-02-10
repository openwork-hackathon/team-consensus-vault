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
  
  // Calculate time difference in minutes
  const diffMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
  
  // Show relative time for very recent messages (within 1 hour)
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  
  // Calculate difference in hours
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  // Reset time portions to compare dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Calculate difference in days
  const diffTime = today.getTime() - messageDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format time portion using Intl.DateTimeFormat for better timezone support
  const timeStr = messageDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  
  // Format based on when the message was sent
  if (diffDays === 0) {
    // Today - just show time (e.g., "2:34 PM")
    return timeStr;
  } else if (diffDays < 7) {
    // Within last week - show abbreviated day and time (e.g., "Mon, 2:34 PM")
    const dayOfWeek = messageDate.toLocaleDateString([], { 
      weekday: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return `${dayOfWeek}, ${timeStr}`;
  } else if (diffDays < 365) {
    // Within last year - show month, day and time (e.g., "Feb 9, 2:34 PM")
    const dateStr = messageDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return `${dateStr}, ${timeStr}`;
  } else {
    // Older than a year - show full date and time
    const dateStr = messageDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      className={`flex gap-2.5 sm:gap-3 px-3 sm:px-4 py-5 sm:py-5 hover:bg-white/[0.02] active:bg-white/[0.05] group ${onQuote ? 'cursor-pointer hover:bg-accent/10' : ''}`}
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
          <span className="text-[10px] text-muted-foreground/50 font-normal" title={new Date(message.timestamp).toLocaleString()}>
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
