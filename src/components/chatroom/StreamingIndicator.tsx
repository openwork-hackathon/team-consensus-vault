'use client';

import { motion } from 'framer-motion';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

interface StreamingIndicatorProps {
  personaId: string;
  handle: string;
  avatar: string;
  isActive?: boolean;
  className?: string;
}

export default function StreamingIndicator({ 
  personaId, 
  handle, 
  avatar, 
  isActive = true,
  className = ''
}: StreamingIndicatorProps) {
  const persona = PERSONAS_BY_ID[personaId];
  const color = persona?.color || '#888';

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg ${className}`}
      style={{
        borderLeftColor: color,
        borderLeftWidth: '3px'
      }}
    >
      {/* Avatar with pulsing border */}
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-md"
          style={{ 
            backgroundColor: color + '20', 
            border: `2px solid ${color}60`,
            color: color
          }}
        >
          {avatar}
        </div>
        {/* Pulsing animation ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}40` }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.2, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Status and typing indicator */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-sm font-semibold truncate"
            style={{ color }}
          >
            {handle}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0
              }}
            />
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            />
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            AI is responding
          </span>
          <motion.div
            className="w-1 h-1 bg-muted-foreground/60 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0
            }}
          />
          <motion.div
            className="w-1 h-1 bg-muted-foreground/60 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
          />
          <motion.div
            className="w-1 h-1 bg-muted-foreground/60 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4
            }}
          />
        </div>
      </div>

      {/* Streaming pulse indicator */}
      <motion.div
        className="flex-shrink-0"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </motion.div>
    </motion.div>
  );
}