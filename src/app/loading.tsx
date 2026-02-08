import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div>
                <SkeletonBox height="h-5" className="w-40 mb-1" />
                <SkeletonBox height="h-3" className="w-48" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <SkeletonBox height="h-4" className="w-16 mb-1" />
                <SkeletonBox height="h-5" className="w-20" />
              </div>
              <div className="hidden sm:block">
                <SkeletonBox height="h-4" className="w-12 mb-1" />
                <SkeletonBox height="h-5" className="w-20" />
              </div>
              <SkeletonBox height="h-10" className="w-32" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Vault Stats Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card rounded-xl p-6 border border-border"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <SkeletonBox height="h-3" className="w-32 mb-2" />
                <SkeletonBox height="h-7" className="w-40" />
              </div>
              <div>
                <SkeletonBox height="h-3" className="w-28 mb-2" />
                <SkeletonBox height="h-7" className="w-36" />
              </div>
            </div>
            <div className="flex gap-3">
              <SkeletonBox height="h-12" className="w-28" />
              <SkeletonBox height="h-12" className="w-28" />
            </div>
          </div>
        </motion.div>

        {/* Trade Signal Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 bg-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <SkeletonBox height="h-4" className="w-24 mb-2" />
              <SkeletonBox height="h-8" className="w-32" />
            </div>
            <div className="text-right">
              <SkeletonBox height="h-4" className="w-20 mb-2 ml-auto" />
              <SkeletonBox height="h-6" className="w-24 ml-auto" />
            </div>
          </div>
        </motion.div>

        {/* Consensus Meter Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 mb-6 border border-border"
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
          <div className="flex justify-between text-xs">
            <SkeletonBox height="h-3" className="w-16" />
            <SkeletonBox height="h-3" className="w-16" />
          </div>
        </motion.div>

        {/* Consensus vs Contrarian Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 bg-card rounded-xl p-6 border border-border"
        >
          <SkeletonBox height="h-6" className="w-56 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SkeletonBox height="h-5" className="w-32 mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <SkeletonBox height="h-4" className="w-24" />
                    <SkeletonBox height="h-4" className="w-16" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SkeletonBox height="h-5" className="w-32 mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <SkeletonBox height="h-4" className="w-24" />
                    <SkeletonBox height="h-4" className="w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Analysts Section Skeleton */}
        <div className="mb-4">
          <SkeletonBox height="h-7" className="w-48 mb-1" />
          <SkeletonBox height="h-4" className="w-80" />
        </div>

        {/* Analyst Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
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
          ))}
        </div>

        {/* Trading Performance Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-6 border border-border mb-6"
        >
          <SkeletonBox height="h-6" className="w-40 mb-2" />
          <SkeletonBox height="h-4" className="w-64 mb-6" />

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-background/50 rounded-lg p-4">
                <SkeletonBox height="h-3" className="w-20 mb-2" />
                <SkeletonBox height="h-6" className="w-24" />
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[...Array(8)].map((_, i) => (
                    <th key={i} className="text-left py-2 px-2">
                      <SkeletonBox height="h-4" className="w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-2 px-2">
                        <SkeletonBox height="h-4" className="w-12" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Signal History Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <SkeletonBox height="h-6" className="w-36 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <SkeletonBox height="h-4" className="w-32" />
                  <SkeletonBox height="h-5" className="w-16" />
                </div>
                <SkeletonBox height="h-3" className="w-full mb-1" />
                <SkeletonBox height="h-3" className="w-3/4" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer Info Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <SkeletonBox height="h-4" className="w-80 mx-auto mb-1" />
          <SkeletonBox height="h-4" className="w-64 mx-auto" />
        </motion.div>
      </div>
    </main>
  );
}
