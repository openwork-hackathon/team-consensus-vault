import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Dual Arena - Loading">
      {/* Toast Notifications Skeleton */}
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

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-[1800px]">
        {/* Page Header Skeleton */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <SkeletonBox height="h-8" className="w-48 mb-2" />
              <SkeletonBox height="h-4" className="w-96" />
            </div>
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-right">
                  <SkeletonBox height="h-3" className="w-16 mb-1" />
                  <SkeletonBox height="h-5" className="w-20" />
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Dual Panel Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL: Agent Debate Skeleton */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <SkeletonBox height="h-6" className="w-32" />
              <div className="ml-auto">
                <SkeletonBox height="h-4" className="w-20" />
              </div>
            </div>
            
            {/* Chat Room Skeleton */}
            <div className="bg-card rounded-lg border border-border p-4 h-[400px] overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-4">
                <SkeletonBox height="h-4" className="w-24" />
                <SkeletonBox height="h-4" className="w-32" />
              </div>
              
              {/* Messages Area */}
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <SkeletonBox height="h-3" className="w-20" />
                        <SkeletonBox height="h-3" className="w-16" />
                      </div>
                      <SkeletonBox height="h-4" className="w-full mb-1" />
                      <SkeletonBox height="h-4" className="w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consensus Information Skeleton */}
            <div className="mt-4 bg-card rounded-lg p-4 border border-border">
              <SkeletonBox height="h-4" className="w-32 mb-2" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div>
                  <SkeletonBox height="h-5" className="w-24 mb-1" />
                  <SkeletonBox height="h-3" className="w-32" />
                </div>
              </div>
            </div>
          </motion.section>

          {/* RIGHT PANEL: Human Discussion Skeleton */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 rounded-xl border border-border p-4 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <SkeletonBox height="h-6" className="w-40" />
              <div className="ml-auto">
                <SkeletonBox height="h-4" className="w-24" />
              </div>
            </div>

            {/* Username Input Skeleton */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <SkeletonBox height="h-4" className="w-48 mb-2" />
              <div className="flex gap-2">
                <SkeletonBox height="h-10" className="flex-1" />
                <SkeletonBox height="h-10" className="w-20" />
              </div>
            </div>

            {/* Human Chat Messages Skeleton */}
            <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden flex flex-col max-h-[520px]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <SkeletonBox height="h-3" className="w-16" />
                      <SkeletonBox height="h-3" className="w-12" />
                      {i === 0 && <SkeletonBox height="h-3" className="w-8" />}
                    </div>
                    <SkeletonBox height="h-16" className={`w-3/4 ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                  </div>
                ))}
              </div>

              {/* Message Input Skeleton */}
              <div className="p-3 border-t border-border bg-muted/30">
                <div className="flex gap-2">
                  <SkeletonBox height="h-10" className="flex-1" />
                  <SkeletonBox height="h-10" className="w-20" />
                </div>
                <SkeletonBox height="h-3" className="w-48 mt-1" />
              </div>
            </div>
          </motion.section>
        </div>

        {/* System Information Skeleton */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-card rounded-xl p-6 border border-border"
        >
          <SkeletonBox height="h-6" className="w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <SkeletonBox height="h-5" className="w-32 mb-2" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted rounded-full" />
                      <SkeletonBox height="h-3" className="w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Footer Info Skeleton */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <SkeletonBox height="h-4" className="w-96 mx-auto mb-1" />
          <SkeletonBox height="h-4" className="w-64 mx-auto" />
        </motion.footer>
      </div>
    </main>
  );
}