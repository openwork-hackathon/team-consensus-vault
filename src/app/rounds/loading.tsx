import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Prediction Market Rounds - Loading">
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

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Header Skeleton */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <SkeletonBox height="h-8" className="w-64 mb-2" />
              <SkeletonBox height="h-4" className="w-96" />
            </div>
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded-lg bg-muted/30 border border-border">
                <SkeletonBox height="h-4" className="w-16 mb-1" />
                <SkeletonBox height="h-3" className="w-24" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Loading State Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Main Loading Skeleton */}
          <SkeletonBox height="h-24" className="w-full" />
          
          {/* Grid Loading Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <SkeletonBox height="h-6" className="w-40 mb-4" />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <SkeletonBox height="h-5" className="w-32" />
                  <SkeletonBox height="h-6" className="w-24" />
                </div>
                <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-background/50 rounded-lg p-3">
                      <SkeletonBox height="h-3" className="w-16 mb-2" />
                      <SkeletonBox height="h-5" className="w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <SkeletonBox height="h-6" className="w-48 mb-4" />
              <div className="space-y-4">
                <div>
                  <SkeletonBox height="h-4" className="w-24 mb-2" />
                  <SkeletonBox height="h-8" className="w-32" />
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <SkeletonBox height="h-4" className="w-20 mb-2" />
                  <SkeletonBox height="h-6" className="w-40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-background/50 rounded-lg p-3">
                      <SkeletonBox height="h-3" className="w-20 mb-2" />
                      <SkeletonBox height="h-4" className="w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Consensus Snapshot Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <SkeletonBox height="h-6" className="w-56 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-background/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                    <div>
                      <SkeletonBox height="h-4" className="w-20 mb-1" />
                      <SkeletonBox height="h-3" className="w-16" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <SkeletonBox height="h-5" className="w-12" />
                    <SkeletonBox height="h-6" className="w-16" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Round Details Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <SkeletonBox height="h-6" className="w-40 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <SkeletonBox height="h-3" className="w-20 mb-1" />
                  <SkeletonBox height="h-4" className="w-32" />
                </div>
              ))}
            </div>

            {/* Settlement Result Skeleton */}
            <div className="mt-6 p-4 bg-background rounded-lg border border-border">
              <SkeletonBox height="h-5" className="w-48 mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <SkeletonBox height="h-3" className="w-24 mb-1" />
                    <SkeletonBox height="h-5" className="w-32" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer Skeleton */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <SkeletonBox height="h-4" className="w-96 mx-auto" />
        </motion.footer>
      </div>
    </main>
  );
}