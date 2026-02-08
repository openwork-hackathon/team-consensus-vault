"use client";

import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";

interface ConsensusGaugeProps {
  agentCount: number;
  agreedCount: number;
  consensusSignal?: string;
  className?: string;
  isLoading?: boolean;
}

export function ConsensusGauge({
  agentCount,
  agreedCount,
  consensusSignal,
  className,
  isLoading = false,
}: ConsensusGaugeProps) {
  // Calculate consensus percentage
  const consensusPercentage = (agreedCount / agentCount) * 100;
  const hasConsensus = agreedCount >= 3;

  // Determine color based on agreement count
  const getColorClasses = () => {
    if (agreedCount === 5) {
      return {
        bg: "bg-green-500",
        text: "text-green-500",
        ring: "ring-green-500/20",
        glow: "shadow-green-500/50",
      };
    } else if (agreedCount === 4) {
      return {
        bg: "bg-lime-500",
        text: "text-lime-500",
        ring: "ring-lime-500/20",
        glow: "shadow-lime-500/50",
      };
    } else if (agreedCount === 3) {
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-500",
        ring: "ring-yellow-500/20",
        glow: "shadow-yellow-500/50",
      };
    } else {
      return {
        bg: "bg-red-500",
        text: "text-red-500",
        ring: "ring-red-500/20",
        glow: "shadow-red-500/50",
      };
    }
  };

  const colors = getColorClasses();

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn("space-y-4", className)}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Loading Spinner in Center */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
              {/* Background track */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-zinc-200 dark:text-zinc-800"
              />
              {/* Animated loading arc */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="60 326.7"
                className="text-blue-500 animate-spin"
                style={{ transformOrigin: "center", animationDuration: "2s" }}
              />
            </svg>

            {/* Center Loading Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <LoadingSpinner size="sm" />
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                Loading
              </div>
            </div>
          </div>

          {/* Status Badge Skeleton */}
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>

        {/* Signal Display Skeleton */}
        <div className="rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Agent Indicators Skeleton */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: agentCount }).map((_, index) => (
            <Skeleton key={index} className="size-3 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Circular Gauge */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Background Circle */}
          <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-zinc-200 dark:text-zinc-800"
            />
            {/* Progress arc */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${consensusPercentage * 3.267} 326.7`}
              className={cn(
                "transition-all duration-700 ease-out",
                colors.text
              )}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={cn(
                "text-3xl font-bold transition-colors duration-500",
                colors.text
              )}
            >
              {agreedCount}/{agentCount}
            </div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              AGENTS
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-500",
            colors.bg,
            "text-white ring-4",
            colors.ring,
            hasConsensus && "shadow-lg",
            hasConsensus && colors.glow
          )}
        >
          {hasConsensus ? "CONSENSUS REACHED" : "NO CONSENSUS"}
        </div>
      </div>

      {/* Consensus Signal Display */}
      {hasConsensus && consensusSignal && (
        <div
          className={cn(
            "rounded-lg border-2 p-4 transition-all duration-500",
            "bg-zinc-50 dark:bg-zinc-900",
            "border-current",
            colors.text
          )}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
            Consensus Signal
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {consensusSignal}
          </div>
        </div>
      )}

      {/* Agent Agreement Indicators */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: agentCount }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "size-3 rounded-full transition-all duration-500",
              index < agreedCount
                ? cn(colors.bg, "scale-100")
                : "bg-zinc-300 dark:bg-zinc-700 scale-75"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton loading state for the gauge
export function ConsensusGaugeSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading consensus gauge"
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="size-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <div className="rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-4 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="size-3 rounded-full" />
        ))}
      </div>
    </div>
  );
}
