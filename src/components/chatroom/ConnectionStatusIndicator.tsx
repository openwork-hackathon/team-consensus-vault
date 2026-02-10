'use client';

import { motion } from 'framer-motion';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isVisible?: boolean;
  className?: string;
}

export default function ConnectionStatusIndicator({ 
  isConnected, 
  isVisible = true,
  className = ''
}: ConnectionStatusIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border backdrop-blur-sm ${
        isConnected 
          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
      } ${className}`}
    >
      {/* Connection status dot */}
      <motion.div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-yellow-400'
        }`}
        animate={{
          scale: isConnected ? [1, 1.2, 1] : [1, 1, 1],
          opacity: isConnected ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: isConnected ? 2 : 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Status text */}
      <span>
        {isConnected ? (
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Live
            </motion.span>
            <span className="text-green-400/60">•</span>
            <span className="text-green-400/80">Streaming</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              Reconnecting
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              ...
            </motion.span>
          </span>
        )}
      </span>

      {/* Data flow indicator for connected state */}
      {isConnected && (
        <motion.div className="flex gap-1 ml-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-green-400/60 rounded-full"
              animate={{
                y: [0, -3, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}