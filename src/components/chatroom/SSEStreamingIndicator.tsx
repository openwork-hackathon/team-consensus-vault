'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

interface SSEStreamingIndicatorProps {
  isConnected: boolean;
  typingPersona: { id: string; handle: string; avatar: string; durationMs?: number } | null;
  className?: string;
}

/**
 * CVAULT-215: SSE Streaming Indicator Component
 * 
 * Displays real-time streaming status and active agent typing indicators.
 * Designed to be visible at all mobile breakpoints (320px-768px).
 * 
 * Features:
 * - Connection status indicator with pulsing animation
 * - Agent-specific typing indicators with persona colors
 * - Mobile-responsive design with compact and expanded views
 * - Smooth animations using Framer Motion
 */
export default function SSEStreamingIndicator({ 
  isConnected,
  typingPersona,
  className = ''
}: SSEStreamingIndicatorProps) {
  const getPersonaColor = (personaId: string) => {
    const persona = PERSONAS_BY_ID[personaId];
    return persona?.color || '#888';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Connection Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between px-3 py-2 rounded-lg border backdrop-blur-sm ${
          isConnected 
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20' 
            : 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/20'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Status Icon with Animation */}
          <div className="relative">
            <motion.div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isConnected ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}
              animate={isConnected ? {
                rotate: [0, 360],
              } : {}}
              transition={isConnected ? {
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              } : {}}
            >
              {isConnected ? (
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </motion.div>
            
            {/* Pulsing ring for connected state */}
            {isConnected && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400/30"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>

          {/* Status Text - Responsive */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              {isConnected ? 'Live' : 'Connecting'}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isConnected ? '• AI debate streaming' : '• Establishing connection...'}
            </span>
          </div>
        </div>

        {/* Data Flow Animation - Hidden on smallest screens */}
        <div className="hidden xs:flex items-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-0.5 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-yellow-400'
              }`}
              animate={isConnected ? {
                height: ['6px', '14px', '6px'],
                opacity: [0.4, 1, 0.4]
              } : {
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: isConnected ? 1 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Agent Typing Indicator */}
      <AnimatePresence mode="wait">
        {typingPersona && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg backdrop-blur-sm"
            style={{
              borderLeftColor: getPersonaColor(typingPersona.id),
              borderLeftWidth: '3px'
            }}
          >
            {/* Agent Avatar with Typing Animation */}
            <div className="relative flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shadow-sm"
                style={{ 
                  backgroundColor: getPersonaColor(typingPersona.id) + '20', 
                  border: `2px solid ${getPersonaColor(typingPersona.id)}60`,
                  color: getPersonaColor(typingPersona.id)
                }}
              >
                {typingPersona.avatar}
              </div>
              
              {/* Typing dots animation */}
              <div className="absolute -bottom-0.5 -right-0.5 flex gap-px">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: getPersonaColor(typingPersona.id) }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.15
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Agent Info - Responsive text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span 
                  className="text-xs font-semibold truncate"
                  style={{ color: getPersonaColor(typingPersona.id) }}
                >
                  {typingPersona.handle}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">is responding</span>
                <span className="text-xs text-muted-foreground sm:hidden">typing...</span>
              </div>
              
              {/* Progress bar - Hidden on very small screens */}
              <div className="hidden sm:block w-full h-1 bg-primary/10 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getPersonaColor(typingPersona.id) }}
                  initial={{ width: '0%' }}
                  animate={{ width: ['0%', '30%', '60%', '90%', '60%', '90%'] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </div>

            {/* Message Icon */}
            <motion.div
              className="flex-shrink-0"
              animate={{
                y: [0, -2, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-4 h-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-optimized compact indicator */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-1.5">
            <motion.div 
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
              animate={isConnected ? {
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className={isConnected ? 'text-green-400/80' : 'text-yellow-400/80'}>
              {isConnected ? 'Streaming' : 'Connecting'}
            </span>
          </div>
          
          {typingPersona && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-px">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-primary/70"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
              <span 
                className="truncate max-w-[80px] text-xs"
                style={{ color: getPersonaColor(typingPersona.id) }}
              >
                {typingPersona.handle}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
