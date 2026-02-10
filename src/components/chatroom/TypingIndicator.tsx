'use client';

import { motion } from 'framer-motion';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

interface TypingIndicatorProps {
  personaId: string;
  handle: string;
  avatar: string;
}

export default function TypingIndicator({ personaId, handle, avatar }: TypingIndicatorProps) {
  const persona = PERSONAS_BY_ID[personaId];
  const color = persona?.color || '#888';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-2.5 px-3 py-2 bg-muted/30 backdrop-blur-sm border border-border/30 rounded-lg mx-4"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color + '30', border: `1.5px solid ${color}50` }}
      >
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-muted-foreground">
          <span style={{ color }} className="font-medium">{handle}</span>
          {' is typing'}
          <span className="inline-flex ml-1">
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
            >.</motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
            >.</motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
            >.</motion.span>
          </span>
        </span>
      </div>
      {/* Mobile-friendly pulse indicator */}
      <motion.div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}
