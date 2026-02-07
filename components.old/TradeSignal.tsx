"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Signal } from "@/lib/models";

interface TradeSignalProps {
  signal: Signal | null;
  consensusCount: number;
  totalAnalysts: number;
  confidenceAverage: number;
  hasConsensus: boolean;
}

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

function getSignalBadge(signal: Signal | null): BadgeVariant {
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

function getSignalColor(signal: Signal | null): string {
  switch (signal) {
    case "BUY":
      return "from-green-500 to-emerald-600";
    case "SELL":
      return "from-red-500 to-rose-600";
    case "HOLD":
      return "from-yellow-500 to-amber-600";
    default:
      return "from-zinc-400 to-zinc-500";
  }
}

function getSignalEmoji(signal: Signal | null): string {
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

function getSignalMessage(signal: Signal | null): string {
  switch (signal) {
    case "BUY":
      return "Strong Buy Signal";
    case "SELL":
      return "Strong Sell Signal";
    case "HOLD":
      return "Hold Position";
    default:
      return "No Consensus";
  }
}

function getSignalDescription(signal: Signal | null, consensusCount: number): string {
  switch (signal) {
    case "BUY":
      return `${consensusCount} out of 5 AI analysts recommend buying. The opportunity outweighs the risk.`;
    case "SELL":
      return `${consensusCount} out of 5 AI analysts recommend selling or shorting. Consider exiting the position.`;
    case "HOLD":
      return `${consensusCount} out of 5 AI analysts recommend holding. Waiting is the best strategy right now.`;
    default:
      return "Analysts have not reached sufficient agreement. Consider waiting or gathering more information.";
  }
}

export function TradeSignal({
  signal,
  consensusCount,
  totalAnalysts,
  confidenceAverage,
  hasConsensus,
}: TradeSignalProps) {
  if (!hasConsensus || !signal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"
      >
        <div className="text-4xl mb-3">⏳</div>
        <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">
          No Consensus Yet
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          {getSignalDescription(signal, consensusCount)}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Animated Background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${getSignalColor(signal)} opacity-10`}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${getSignalColor(signal)} blur-2xl opacity-20`}
        animate={{
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="relative bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl p-8">
        {/* Signal Badge */}
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
          >
            <Badge variant={getSignalBadge(signal)} className="text-5xl px-6 py-3 shadow-lg">
              {getSignalEmoji(signal)}
            </Badge>
          </motion.div>
        </div>

        {/* Signal Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2"
        >
          {getSignalMessage(signal)}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-zinc-600 dark:text-zinc-400 mb-6 max-w-xl mx-auto"
        >
          {getSignalDescription(signal, consensusCount)}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="text-3xl font-bold text-zinc-900 dark:text-zinc-100"
            >
              {consensusCount}/{totalAnalysts}
            </motion.div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Consensus
            </div>
          </div>

          <div className="w-px bg-zinc-200 dark:bg-zinc-700" />

          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="text-3xl font-bold text-zinc-900 dark:text-zinc-100"
            >
              {confidenceAverage}%
            </motion.div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Confidence
            </div>
          </div>
        </motion.div>

        {/* Pulse Effect for BUY/SELL */}
        {(signal === "BUY" || signal === "SELL") && (
          <motion.div
            className={`absolute inset-0 rounded-2xl border-4 ${
              signal === "BUY" ? "border-green-500" : "border-red-500"
            }`}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
