import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
        className
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
      <span className="sr-only">Loading{text ? `: ${text}` : "..."}</span>
    </div>
  );

  return spinner;
}

// Inline spinner for buttons and small spaces
export function InlineSpinner({
  className,
  text,
}: {
  className?: string;
  text?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-busy="true"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </span>
  );
}

// Skeleton loading state for cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 space-y-4",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-3 w-4/6 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

// Page-level loading state
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

// Shimmer effect for loading content
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded bg-muted",
        className
      )}
      role="status"
      aria-busy="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
