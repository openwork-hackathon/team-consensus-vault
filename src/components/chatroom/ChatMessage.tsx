'use client';

import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/lib/chatroom/types';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
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

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium border ${colorClass} touch-manipulation`}>
      {label}
      {confidence !== undefined && (
        <span className="opacity-70">{confidence}%</span>
      )}
    </span>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const persona = PERSONAS_BY_ID[message.personaId];
  const color = persona?.color || '#888';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-1.5 hover:bg-white/[0.02] active:bg-white/[0.05] group"
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
          <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
