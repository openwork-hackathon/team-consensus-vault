'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back in history
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-xl text-center"
      >
        {/* 404 Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-4xl">🔍</span>
        </motion.div>

        {/* 404 Title */}
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>

        {/* Message */}
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The page may have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-manipulation inline-flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
          {canGoBack && (
            <button
              onClick={handleGoBack}
              className="flex-1 px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors touch-manipulation"
            >
              Go Back
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          If you believe this is an error, please contact support.
        </p>
      </motion.div>
    </div>
  );
}