'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS_BY_ID } from '@/lib/chatroom/personas';

interface EnhancedStreamingIndicatorProps {
  isConnected: boolean;
  typingPersona: { id: string; handle: string; avatar: string } | null;
  className?: string;
}

export default function EnhancedStreamingIndicator({ 
  isConnected,
  typingPersona,
  className = ''
}: EnhancedStreamingIndicatorProps) {
  const getPersonaColor = (personaId: string) => {
    const persona = PERSONAS_BY_ID[personaId];
    return persona?.color || '#888';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Streaming Status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between px-4 py-3 rounded-lg border backdrop-blur-sm ${
          isConnected 
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20' 
            : 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className="relative">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </motion.div>
            
            {/* Pulsing ring for connected state */}
            {isConnected && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400/30"
                animate={{
                  scale: [1, 1.3, 1],
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

          {/* Status Text */}
          <div>
            <div className="font-medium text-sm">
              {isConnected ? 'Live Streaming Active' : 'Connecting to Stream'}
            </div>
            <div className={`text-xs ${isConnected ? 'text-green-400/70' : 'text-yellow-400/70'}`}>
              {isConnected ? 'Real-time AI debate in progress' : 'Establishing connection...'}
            </div>
          </div>
        </div>

        {/* Data Flow Indicator */}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className={`w-1 h-4 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-yellow-400'
              }`}
              animate={isConnected ? {
                height: ['8px', '16px', '8px'],
                opacity: [0.4, 1, 0.4]
              } : {
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: isConnected ? 1.2 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Agent Typing Indicator */}
      <AnimatePresence>
        {typingPersona && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg backdrop-blur-sm"
            style={{
              borderLeftColor: getPersonaColor(typingPersona.id),
              borderLeftWidth: '4px'
            }}
          >
            {/* Agent Avatar */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-md"
                style={{ 
                  backgroundColor: getPersonaColor(typingPersona.id) + '20', 
                  border: `2px solid ${getPersonaColor(typingPersona.id)}60`,
                  color: getPersonaColor(typingPersona.id)
                }}
              >
                {typingPersona.avatar}
              </div>
              
              {/* Typing Animation */}
              <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPersonaColor(typingPersona.id) }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="text-sm font-semibold"
                  style={{ color: getPersonaColor(typingPersona.id) }}
                >
                  {typingPersona.handle}
                </span>
                <span className="text-xs text-muted-foreground">is responding</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getPersonaColor(typingPersona.id) }}
                  initial={{ width: '0%' }}
                  animate={{ width: ['0%', '30%', '70%', '100%'] }}
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
              animate={{
                rotate: [0, 10, -10, 0],
                y: [0, -2, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-5 h-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-optimized compact view */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between text-xs px-3 py-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
              {isConnected ? 'Live' : 'Connecting'}
            </span>
          </div>
          
          {typingPersona && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-primary/80 truncate max-w-[80px]">
                {typingPersona.handle}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}