import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            <SkeletonBox height="h-7" className="w-64" />
          </div>
          <SkeletonBox height="h-4" className="w-96" />
          
          {/* Input Form Skeleton */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SkeletonBox height="h-4" className="w-24 mb-2" />
              <SkeletonBox height="h-10" className="w-full" />
            </div>
            <div>
              <SkeletonBox height="h-4" className="w-32 mb-2" />
              <SkeletonBox height="h-10" className="w-full" />
            </div>
          </div>
          
          <SkeletonBox height="h-12" className="w-full mt-4" />
        </motion.div>

        {/* Alignment Overview Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <SkeletonBox height="h-6" className="w-40" />
            <SkeletonBox height="h-8" className="w-24" />
          </div>
          <SkeletonBox height="h-4" className="w-full mb-2" />
          <SkeletonBox height="h-4" className="w-5/6 mb-2" />
          <SkeletonBox height="h-4" className="w-4/6" />
          
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <SkeletonBox height="h-4" className="w-full mb-1" />
            <SkeletonBox height="h-4" className="w-3/4" />
          </div>
        </motion.div>

        {/* Two-column layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Council Skeleton */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl shadow p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <SkeletonBox height="h-6" className="w-56" />
            </div>

            {/* Council Signal Skeleton */}
            <div className="p-4 bg-muted/30 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <SkeletonBox height="h-5" className="w-48 mb-1" />
                  <SkeletonBox height="h-4" className="w-32" />
                </div>
              </div>
            </div>

            {/* Analyst Breakdown Skeleton */}
            <SkeletonBox height="h-5" className="w-32 mb-2" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <SkeletonBox height="h-4" className="w-24" />
                    <SkeletonBox height="h-6" className="w-20" />
                  </div>
                  <SkeletonBox height="h-3" className="w-full mb-1" />
                  <SkeletonBox height="h-3" className="w-5/6" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Chatroom Consensus Skeleton */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl shadow p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <SkeletonBox height="h-6" className="w-40" />
            </div>

            {/* Chatroom Signal Skeleton */}
            <div className="p-4 bg-muted/30 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <SkeletonBox height="h-5" className="w-32 mb-1" />
                  <SkeletonBox height="h-4" className="w-24" />
                </div>
              </div>
              <SkeletonBox height="h-5" className="w-24 mt-2" />
            </div>

            {/* Chatroom Details Skeleton */}
            <SkeletonBox height="h-5" className="w-32 mb-2" />
            <div className="p-3 border border-border rounded-lg space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonBox height="h-4" className="w-20" />
                  <SkeletonBox height="h-4" className="w-16" />
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <SkeletonBox height="h-3" className="w-full mb-1" />
              <SkeletonBox height="h-3" className="w-5/6" />
            </div>
          </motion.div>
        </div>

        {/* Metadata Footer Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl shadow p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <SkeletonBox height="h-4" className="w-20 mb-1" />
                <SkeletonBox height="h-5" className="w-32" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}