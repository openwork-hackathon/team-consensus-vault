import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Prediction Market - Loading">
      {/* Toast Container Skeleton */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-lg border border-border p-4 w-64"
          >
            <SkeletonBox height="h-4" className="w-3/4" />
            <SkeletonBox height="h-3" className="w-1/2 mt-2" />
          </motion.div>
        ))}
      </div>

      {/* Header Skeleton */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div id="main-content" className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonBox height="h-8" className="w-64 mb-2" />
              <SkeletonBox height="h-4" className="w-96" />
            </div>
            <SkeletonBox height="h-10" className="w-32" />
          </div>

          {/* Connection Status Skeleton */}
          <div className="mt-4 flex items-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted rounded-full animate-pulse" />
                <SkeletonBox height="h-3" className="w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Display Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-muted/30 border border-border rounded-lg"
        >
          <SkeletonBox height="h-4" className="w-64" />
        </motion.div>

        {/* How It Works Section Skeleton */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 overflow-hidden"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <SkeletonBox height="h-6" className="w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1">
                    <SkeletonBox height="h-5" className="w-32 mb-2" />
                    <SkeletonBox height="h-3" className="w-full mb-1" />
                    <SkeletonBox height="h-3" className="w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Round Status Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <SkeletonBox height="h-6" className="w-48 mb-2" />
                <SkeletonBox height="h-4" className="w-64" />
              </div>
              <SkeletonBox height="h-8" className="w-32" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-background/50 rounded-lg p-4">
                  <SkeletonBox height="h-3" className="w-20 mb-2" />
                  <SkeletonBox height="h-5" className="w-24" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Phase Content Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Scanning Phase Skeleton */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🔍</span>
              </div>
            </div>
            <SkeletonBox height="h-6" className="w-64 mt-6 mb-2" />
            <SkeletonBox height="h-4" className="w-96 mb-1" />
            <SkeletonBox height="h-4" className="w-80" />
          </div>

          {/* AI Council Consensus Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <SkeletonBox height="h-6" className="w-48 mb-4" />
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full animate-pulse mx-auto mb-4" />
              <SkeletonBox height="h-7" className="w-32 mx-auto mb-2" />
              <SkeletonBox height="h-4" className="w-48 mx-auto" />
            </div>
          </motion.div>

          {/* Betting Panel Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <SkeletonBox height="h-6" className="w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <SkeletonBox height="h-5" className="w-32" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <SkeletonBox height="h-4" className="w-24" />
                      <SkeletonBox height="h-4" className="w-16" />
                    </div>
                  ))}
                </div>
                <SkeletonBox height="h-12" className="w-full" />
              </div>
              <div className="space-y-4">
                <SkeletonBox height="h-5" className="w-32" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <SkeletonBox height="h-4" className="w-24" />
                      <SkeletonBox height="h-4" className="w-16" />
                    </div>
                  ))}
                </div>
                <SkeletonBox height="h-12" className="w-full" />
              </div>
            </div>
          </motion.div>

          {/* Live P&L Tracker Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <SkeletonBox height="h-6" className="w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SkeletonBox height="h-5" className="w-40 mb-2" />
                <SkeletonBox height="h-8" className="w-32" />
                <div className="mt-4 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <SkeletonBox height="h-4" className="w-24" />
                      <SkeletonBox height="h-4" className="w-20" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SkeletonBox height="h-5" className="w-40 mb-2" />
                <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}