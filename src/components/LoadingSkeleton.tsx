'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export function SkeletonBox({ className = '', height = 'h-4' }: { className?: string; height?: string }) {
  return (
    <motion.div
      className={`${height} bg-muted/30 rounded animate-pulse ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function SkeletonCircle({ className = '', size = 'w-10 h-10' }: { className?: string; size?: string }) {
  return (
    <motion.div
      className={`${size} bg-muted/30 rounded-full animate-pulse ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-6 border border-border ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size="w-10 h-10" />
        <div className="flex-1">
          <SkeletonBox height="h-5" className="w-32 mb-2" />
          <SkeletonBox height="h-3" className="w-24" />
        </div>
      </div>
      <SkeletonBox height="h-4" className="w-full mb-2" />
      <SkeletonBox height="h-4" className="w-5/6 mb-2" />
      <SkeletonBox height="h-4" className="w-4/6" />
    </motion.div>
  );
}

export function AnalystCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-4 border border-border ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <SkeletonCircle size="w-10 h-10" />
        <div>
          <SkeletonBox height="h-4" className="w-24 mb-1" />
          <SkeletonBox height="h-3" className="w-20" />
        </div>
      </div>
      <div className="mb-3">
        <SkeletonBox height="h-3" className="w-full mb-2" />
        <SkeletonBox height="h-3" className="w-4/5" />
      </div>
      <div className="flex items-center justify-between">
        <SkeletonBox height="h-5" className="w-16" />
        <SkeletonBox height="h-6" className="w-12" />
      </div>
    </motion.div>
  );
}

export function ChatMessageSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex gap-3 mb-4 ${className}`}
    >
      <SkeletonCircle size="w-8 h-8" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <SkeletonBox height="h-3" className="w-20" />
          <SkeletonBox height="h-3" className="w-16" />
        </div>
        <SkeletonBox height="h-4" className="w-full mb-1" />
        <SkeletonBox height="h-4" className="w-3/4" />
      </div>
    </motion.div>
  );
}

export function ConsensusMeterSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-6 border border-border ${className}`}
    >
      <SkeletonBox height="h-5" className="w-40 mb-4" />
      <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-bearish via-neutral to-bullish opacity-50"
          initial={{ width: '0%' }}
          animate={{ width: '75%' }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between">
        <SkeletonBox height="h-3" className="w-16" />
        <SkeletonBox height="h-3" className="w-16" />
      </div>
    </motion.div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="bg-background/50 rounded-lg p-4">
      <SkeletonBox height="h-3" className="w-20 mb-2" />
      <SkeletonBox height="h-6" className="w-24" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/50">
      <td className="py-2 px-2"><SkeletonBox className="w-16" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-20" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-12" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-16" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-16" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-20" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-12" /></td>
      <td className="py-2 px-2"><SkeletonBox className="w-12" /></td>
    </tr>
  );
}

export function TradingPerformanceSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-6 border border-border ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <SkeletonBox height="h-6" className="w-48 mb-2" />
        <SkeletonBox height="h-4" className="w-64" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>

      {/* Table Header */}
      <div className="mb-3">
        <SkeletonBox height="h-5" className="w-32" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2"><SkeletonBox className="w-12" /></th>
              <th className="text-left py-2 px-2"><SkeletonBox className="w-16" /></th>
              <th className="text-left py-2 px-2"><SkeletonBox className="w-16" /></th>
              <th className="text-right py-2 px-2"><SkeletonBox className="w-12" /></th>
              <th className="text-right py-2 px-2"><SkeletonBox className="w-12" /></th>
              <th className="text-right py-2 px-2"><SkeletonBox className="w-12" /></th>
              <th className="text-center py-2 px-2"><SkeletonBox className="w-16" /></th>
              <th className="text-center py-2 px-2"><SkeletonBox className="w-12" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function LoadingSkeleton({ className = '', count = 1, height = 'h-4' }: LoadingSkeletonProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <SkeletonBox key={i} className={className} height={height} />
      ))}
    </>
  );
}
