"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { AnalystResponse, Signal } from "@/lib/models";

// Unique color schemes for each analyst
const ANALYST_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  deepseek: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    dot: "bg-blue-500",
  },
  kimi: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    dot: "bg-purple-500",
  },
  minimax: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-900 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  glm: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-900 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  gemini: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-900 dark:text-rose-100",
    dot: "bg-rose-500",
  },
};

function getSignalColor(signal: Signal | undefined): string {
  switch (signal) {
    case "BUY":
      return "bg-green-500";
    case "SELL":
      return "bg-red-500";
    case "HOLD":
      return "bg-yellow-500";
    default:
      return "bg-zinc-400";
  }
}

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

function getSignalBadge(signal: Signal | undefined): BadgeVariant {
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

function getSignalEmoji(signal: Signal | undefined): string {
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

interface AnalystCardProps {
  agentId: string;
  agentName: string;
  role: string;
  status: "idle" | "querying" | "completed";
  response?: AnalystResponse;
  index: number;
}

export function AnalystCard({ agentId, agentName, role, status, response, index }: AnalystCardProps) {
  const colors = ANALYST_COLORS[agentId] || ANALYST_COLORS.deepseek;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: status === "completed" ? index * 0.1 : 0,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className={`rounded-xl border-2 p-5 transition-all ${colors.bg} ${colors.border} ${
        status === "querying" ? "animate-pulse shadow-lg" : ""
      } ${status === "completed" ? "shadow-md" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-3 h-3 rounded-full ${colors.dot}`}
            animate={{
              scale: status === "querying" ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: status === "querying" ? Infinity : 0,
            }}
          />
          <div>
            <h3 className={`font-bold text-lg ${colors.text}`}>{agentName}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{role}</p>
          </div>
        </div>

        {status === "querying" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1"
          >
            <motion.div
              className="w-2 h-2 bg-zinc-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-zinc-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-zinc-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </motion.div>
        )}

        {status === "completed" && response && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex items-center gap-2"
          >
            <Badge variant={getSignalBadge(response.signal)} className="text-base">
              {getSignalEmoji(response.signal)} {response.signal}
            </Badge>
          </motion.div>
        )}

        {status === "idle" && (
          <Badge variant="outline" className="text-xs">
            Ready
          </Badge>
        )}
      </div>

      {/* Response Content */}
      {status === "completed" && response && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-2"
        >
          {/* Confidence Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Confidence</span>
              <span className={`font-semibold ${colors.text}`}>{response.confidence}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${response.confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${getSignalColor(response.signal)}`}
              />
            </div>
          </div>

          {/* Reasoning */}
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {response.reasoning}
          </p>

          {/* Error Display */}
          {response.error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
              Error: {response.error}
            </p>
          )}
        </motion.div>
      )}

      {/* Querying State */}
      {status === "querying" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-zinc-600 dark:text-zinc-400 italic"
        >
          Analyzing the market...
        </motion.div>
      )}

      {/* Idle State */}
      {status === "idle" && (
        <div className="text-sm text-zinc-500 dark:text-zinc-500">
          Waiting for query
        </div>
      )}
    </motion.div>
  );
}
