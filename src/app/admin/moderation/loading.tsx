import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <SkeletonBox height="h-8" className="w-64 mb-2" />
          <SkeletonBox height="h-4" className="w-96" />
        </motion.div>

        {/* Stats Cards Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border">
              <SkeletonBox height="h-4" className="w-24 mb-2" />
              <SkeletonBox height="h-8" className="w-16" />
            </div>
          ))}
        </motion.div>

        {/* Tabs Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6"
        >
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} height="h-10" className="w-24" />
          ))}
        </motion.div>

        {/* Content Area Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {/* Table Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <SkeletonBox height="h-5" className="w-32" />
              <SkeletonBox height="h-8" className="w-40" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <SkeletonBox height="h-4" className="w-48 mb-2" />
                  <SkeletonBox height="h-3" className="w-32" />
                </div>
                <SkeletonBox height="h-6" className="w-20" />
                <SkeletonBox height="h-8" className="w-24" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
