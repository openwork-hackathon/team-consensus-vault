'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatroomStream } from '@/hooks/useChatroomStream';
import ChatRoom from '@/components/chatroom/ChatRoom';
import { PERSONAS, getModelDistribution } from '@/lib/chatroom/personas';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useVault } from '@/contexts/VaultContext';
import ToastContainer, { ToastData } from '@/components/ToastContainer';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Model display names mapping
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  deepseek: 'DeepSeek',
  kimi: 'Kimi',
  minimax: 'MiniMax',
  glm: 'GLM',
  gemini: 'Gemini',
};

export default function ChatroomPage() {
  const chatroomData = useChatroomStream();
  const { address, isConnected } = useAccount();
  const { getDepositsByAddress } = useVault();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const lcpRef = useRef<HTMLDivElement>(null);

  // Get dynamic persona counts
  const personaCount = PERSONAS.length;
  const modelDistribution = getModelDistribution();

  // Mark as client-side rendered
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Performance optimization: Preload critical resources
  useEffect(() => {
    // Preload RainbowKit CSS to prevent layout shift
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'style';
    preloadLink.href = '/_next/static/css/app/layout.css';
    document.head.appendChild(preloadLink);

    // Mark LCP element for performance tracking
    if (lcpRef.current) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as PerformanceEntry & { element?: Element }).element === lcpRef.current) {
            console.log('LCP element measured:', entry.startTime);
          }
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      return () => observer.disconnect();
    }
  }, []);

  const addToast = (message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Handle clear history with toast notification
  const handleClearHistory = () => {
    chatroomData.clearHistory();
    addToast('Chat history cleared successfully', 'success');
  };

  const userDeposits = address ? getDepositsByAddress(address) : [];
  const userTotalDeposited = userDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(6);

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Crypto Chatroom Debate Arena">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Page Header */}
        <section className="mb-6" aria-labelledby="chatroom-header-heading">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 id="chatroom-header-heading" className="text-2xl font-bold mb-2">
                AI Debate Arena
              </h2>
              <p className="text-muted-foreground">
                Watch {personaCount} AI personalities debate market trends in real-time. Three-phase system: 
                <span className="font-semibold text-bullish"> DEBATE</span> → 
                <span className="font-semibold text-blue-500"> CONSENSUS</span> (80% threshold) → 
                <span className="font-semibold text-purple-500"> COOLDOWN</span>
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right" role="complementary" aria-label="Connection status">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className={`font-semibold ${chatroomData.isConnected ? 'text-green-500' : 'text-yellow-500'}`} aria-label={chatroomData.isConnected ? 'Connected to chatroom' : 'Connecting to chatroom'}>
                  {chatroomData.isConnected ? 'Connected' : 'Connecting...'}
                </div>
              </div>
              <div className="text-right" role="complementary" aria-label="Current phase">
                <div className="text-xs text-muted-foreground">Phase</div>
                <div className="font-semibold" aria-label={`Current phase: ${chatroomData.phase}`}>
                  {chatroomData.phase}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Chatroom */}
        <section className="mb-6" aria-labelledby="chatroom-main-heading">
          <h3 id="chatroom-main-heading" className="sr-only">Main Chatroom</h3>
          <div ref={lcpRef} data-lcp="true">
            <ChatRoom
              messages={chatroomData.messages}
              phase={chatroomData.phase}
              typingPersona={chatroomData.typingPersona}
              cooldownEndsAt={chatroomData.cooldownEndsAt}
              isConnected={chatroomData.isConnected}
              timeGapInfo={chatroomData.timeGapInfo}
              showTimeGapIndicator={chatroomData.showTimeGapIndicator}
              missedSummary={chatroomData.missedSummary}
              isFetchingSummary={chatroomData.isFetchingSummary}
              storageInfo={chatroomData.storageInfo}
              onClearHistory={handleClearHistory}
              onDismissTimeGap={chatroomData.dismissTimeGap}
            />
          </div>
        </section>

        {/* Consensus Information */}
        {chatroomData.consensusDirection && (
          <section 
            className="mb-6 bg-card rounded-xl p-6 border border-border"
            aria-labelledby="consensus-info-heading"
          >
            <h3 id="consensus-info-heading" className="text-lg font-bold mb-2">
              Current Consensus
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {chatroomData.consensusDirection === 'bullish' ? '📈' : 
                 chatroomData.consensusDirection === 'bearish' ? '📉' : '⚖️'}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Direction</div>
                <div className={`text-xl font-bold ${
                  chatroomData.consensusDirection === 'bullish' ? 'text-bullish' : 
                  chatroomData.consensusDirection === 'bearish' ? 'text-bearish' : 'text-gray-500'
                }`}>
                  {chatroomData.consensusDirection.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Strength</div>
                <div className="text-xl font-bold">
                  {Math.round(chatroomData.consensusStrength * 100)}%
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Persistence Info */}
        {chatroomData.storageInfo.hasData && (
          <section 
            className="mb-6 bg-muted/30 rounded-xl p-4 border border-border"
            aria-labelledby="persistence-info-heading"
          >
            <h3 id="persistence-info-heading" className="text-sm font-semibold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Session Persistence
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Stored Messages:</span>{' '}
                <span className="font-medium">{chatroomData.storageInfo.messageCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Storage Used:</span>{' '}
                <span className="font-medium">
                  {(chatroomData.storageInfo.estimatedSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Visit:</span>{' '}
                <span className="font-medium">
                  {chatroomData.timeGapInfo?.lastVisitTime 
                    ? new Date(chatroomData.timeGapInfo.lastVisitTime).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your chat history is stored locally on this device. Use the &quot;Clear&quot; button in the chat footer to remove stored data.
            </p>
          </section>
        )}

        {/* System Information */}
        <section 
          className="bg-card rounded-xl p-6 border border-border"
          aria-labelledby="system-info-heading"
        >
          <h3 id="system-info-heading" className="text-lg font-bold mb-4">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">AI Models ({personaCount} total personas)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {Object.entries(modelDistribution).map(([modelId, count]) => (
                  <li key={modelId}>• {MODEL_DISPLAY_NAMES[modelId] || modelId} ({count} personas)</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Phase Details</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <span className="font-semibold text-bullish">DEBATE:</span> Free discussion</li>
                <li>• <span className="font-semibold text-blue-500">CONSENSUS:</span> 80% agreement required</li>
                <li>• <span className="font-semibold text-purple-500">COOLDOWN:</span> 5-minute pause</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <footer
          className="mt-8 text-center text-sm text-muted-foreground"
          role="contentinfo"
        >
          <p className="text-sm sm:text-sm">
            Real-time AI debate powered by SSE streaming from /api/chatroom/stream
          </p>
          <p className="mt-1 text-sm sm:text-sm">
            Messages stream in real-time as AI personalities debate market trends
          </p>
          <p className="mt-1 text-xs opacity-75">
            CVAULT-179: Chat history persists across page loads with graceful time gap handling
          </p>
        </footer>
      </div>
    </main>
  );
}
