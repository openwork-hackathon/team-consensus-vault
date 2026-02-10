import { motion } from 'framer-motion';
import { SkeletonBox } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center" role="main" aria-label="Chatroom - Loading">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
        </div>
        
        <SkeletonBox height="h-6" className="w-48 mx-auto mb-3" />
        <SkeletonBox height="h-4" className="w-64 mx-auto mb-2" />
        <SkeletonBox height="h-4" className="w-56 mx-auto" />
        
        <div className="mt-8 space-y-3">
          <SkeletonBox height="h-3" className="w-full" />
          <SkeletonBox height="h-3" className="w-5/6 mx-auto" />
          <SkeletonBox height="h-3" className="w-4/6 mx-auto" />
        </div>
      </motion.div>
    </main>
  );
}