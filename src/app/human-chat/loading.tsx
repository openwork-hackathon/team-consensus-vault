import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center" role="main" aria-label="Human Chat - Loading">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">👥</span>
          </div>
        </div>
        
        <SkeletonBox height="h-6" className="w-56 mx-auto mb-3" />
        <SkeletonBox height="h-4" className="w-72 mx-auto mb-2" />
        <SkeletonBox height="h-4" className="w-64 mx-auto" />
        
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="text-left">
              <SkeletonBox height="h-4" className="w-32 mb-1" />
              <SkeletonBox height="h-3" className="w-24" />
            </div>
          </div>
          
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <SkeletonBox height="h-4" className="w-full mb-2" />
            <SkeletonBox height="h-4" className="w-5/6 mb-2" />
            <SkeletonBox height="h-4" className="w-4/6" />
          </div>
        </div>
      </motion.div>
    </main>
  );
}