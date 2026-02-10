'use client';

import { motion } from 'framer-motion';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

interface MobileStreamingIndicatorProps {
  personaId: string;
  handle: string;
  avatar: string;
  isActive?: boolean;
}

export default function MobileStreamingIndicator({ 
  personaId, 
  handle, 
  avatar, 
  isActive = true 
}: MobileStreamingIndicatorProps) {
  const persona = PERSONAS_BY_ID[personaId];
  const color = persona?.color || '#888';

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-3 py-3 mx-2 sm:mx-4 bg-gradient-to-r from-background/90 to-muted/30 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg touch-manipulation"
      style={{
        borderLeftColor: color,
        borderLeftWidth: '4px'
      }}
    >
      {/* Compact avatar for mobile */}
      <div className="relative flex-shrink-0">
        <motion.div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
          style={{ 
            backgroundColor: color + '25', 
            border: `2px solid ${color}70`,
            color: color
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {avatar}
        </motion.div>
        
        {/* Status pulse */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Compact text for mobile */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-sm font-semibold truncate"
            style={{ color }}
          >
            {handle}
          </span>
          <span className="text-xs text-muted-foreground">typing</span>
        </div>
        
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}