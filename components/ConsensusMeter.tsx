"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Signal } from "@/lib/models";

interface ConsensusMeterProps {
  totalAnalysts: number;
  responsesReceived: number;
  consensusCount: number;
  hasConsensus: boolean;
  consensus?: Signal | null;
  confidenceAverage?: number;
  isLoading: boolean;
}

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

function getSignalBadge(signal: Signal | undefined | null): BadgeVariant {
  switch (signal) {
    case "BUY":
      return "default";
    case "SELL":
      return "destructive";
    case "HOLD":
      return "secondary";
    default:
      return "outline";
  }
}

function getSignalEmoji(signal: Signal | undefined | null): string {
  switch (signal) {
    case "BUY":
      return "📈";
    case "SELL":
      return "📉";
    case "HOLD":
      return "➡️";
    default:
      return "⏳";
  }
}

export function ConsensusMeter({
  totalAnalysts,
  responsesReceived,
  consensusCount,
  hasConsensus,
  consensus,
  confidenceAverage,
  isLoading,
}: ConsensusMeterProps) {
  const requiredConsensus = 4;
  const progressPercentage = (responsesReceived / totalAnalysts) * 100;
  const consensusPercentage = (consensusCount / totalAnalysts) * 100;

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Consensus Status
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isLoading
              ? `${responsesReceived}/${totalAnalysts} analysts responded`
              : `All ${totalAnalysts} analysts analyzed`}
          </p>
        </div>

        {!isLoading && hasConsensus && consensus && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Badge variant={getSignalBadge(consensus)} className="text-2xl px-4 py-2">
              {getSignalEmoji(consensus)} {consensus}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Progress Bar - Shows responses received */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>Response Progress</span>
          <span>{responsesReceived}/{totalAnalysts}</span>
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-blue-500"
          />
        </div>
      </div>

      {/* Consensus Meter - Shows agreement level */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>Agreement Level</span>
          <span>{consensusCount}/{totalAnalysts} agree</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalAnalysts }).map((_, index) => {
            const isActive = index < consensusCount;
            const isThreshold = index === requiredConsensus - 1;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 relative"
              >
                <motion.div
                  className={`h-6 rounded transition-all ${
                    isActive
                      ? hasConsensus
                        ? "bg-green-500 shadow-md"
                        : "bg-yellow-500 shadow-sm"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                  animate={{
                    scale: isActive && isLoading ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isActive && isLoading ? Infinity : 0,
                  }}
                />
                {isThreshold && (
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-zinc-500 whitespace-nowrap">
                    ↑ Need {requiredConsensus}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Consensus Result */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-lg p-4 border-2 ${
            hasConsensus
              ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
              : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {hasConsensus ? "✓ Consensus Reached" : "✗ No Consensus"}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {hasConsensus
                  ? `${consensusCount}/${totalAnalysts} analysts agree on ${consensus}`
                  : `Need ${requiredConsensus - consensusCount} more agreement (${consensusCount}/${requiredConsensus} required)`}
              </p>
            </div>
            {confidenceAverage !== undefined && (
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {confidenceAverage}%
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Avg. Confidence</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-zinc-600 dark:text-zinc-400 italic"
        >
          Waiting for all analysts to respond...
        </motion.div>
      )}
    </div>
  );
}
