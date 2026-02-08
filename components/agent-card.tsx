"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type AgentSignal = "bull" | "bear" | "neutral";

export interface AgentCardProps {
  name: string;
  role: string;
  signal: AgentSignal;
  confidence: number; // 0-100
  reasoning: string;
  isLoading?: boolean;
  className?: string;
}

export function AgentCard({
  name,
  role,
  signal,
  confidence,
  reasoning,
  isLoading = false,
  className,
}: AgentCardProps) {
  if (isLoading) {
    return <AgentCardSkeleton className={className} />;
  }

  // Get signal-specific styling and icon
  const getSignalConfig = (signal: AgentSignal) => {
    switch (signal) {
      case "bull":
        return {
          icon: TrendingUp,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          badgeVariant: "default" as const,
          label: "BULL",
        };
      case "bear":
        return {
          icon: TrendingDown,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          badgeVariant: "destructive" as const,
          label: "BEAR",
        };
      case "neutral":
        return {
          icon: Minus,
          color: "text-zinc-500",
          bgColor: "bg-zinc-500/10",
          borderColor: "border-zinc-500/20",
          badgeVariant: "secondary" as const,
          label: "NEUTRAL",
        };
    }
  };

  const signalConfig = getSignalConfig(signal);
  const SignalIcon = signalConfig.icon;

  // Get confidence level color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-lg",
        "border-2",
        signalConfig.borderColor,
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              signalConfig.bgColor
            )}
          >
            <SignalIcon className={cn("size-6", signalConfig.color)} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signal Badge and Confidence */}
        <div className="flex items-center justify-between gap-3">
          <Badge variant={signalConfig.badgeVariant} className="font-semibold">
            {signalConfig.label}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span
              className={cn(
                "text-sm font-bold",
                getConfidenceColor(confidence)
              )}
            >
              {confidence}%
            </span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className={cn(
                "h-full transition-all duration-700 ease-out",
                signalConfig.color.replace("text-", "bg-")
              )}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Reasoning */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reasoning
          </p>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loading state
export function AgentCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-2", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="size-12 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signal Badge and Confidence */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Progress Bar */}
        <Skeleton className="h-2 w-full rounded-full" />

        {/* Reasoning */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
