'use client';

import { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { useConsensusStream } from '@/lib/useConsensusStream';
import { useAutoTrading } from '@/lib/useAutoTrading';
import AnalystCard from '@/components/AnalystCard';
import ConsensusMeter from '@/components/ConsensusMeter';
import TradeSignal from '@/components/TradeSignal';
import SignalHistory, { SignalHistoryEntry } from '@/components/SignalHistory';
import DepositModal from '@/components/DepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import SwapWidget from '@/components/SwapWidget';
import TokenOnboardingWizard from '@/components/TokenOnboardingWizard';
import ToastContainer, { ToastData } from '@/components/ToastContainer';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import PartialFailureBanner from '@/components/PartialFailureBanner';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useVault } from '@/contexts/VaultContext';
import { TokenBalance } from '@/components/TokenBalance';
import { useOpenworkBalance } from '@/hooks/useOpenworkBalance';
import { useTradingHistory } from '@/hooks/useTradingHistory';

// Lazy load heavy components to reduce initial bundle size
const ConsensusVsContrarian = lazy(() =>
  import('@/components/ConsensusVsContrarian').then(m => ({ default: m.default }))
);
const TradingPerformance = lazy(() =>
  import('@/components/TradingPerformance').then(m => ({ default: m.default }))
);

export default function Dashboard() {
  const consensusData = useConsensusStream();
  const { address, isConnected } = useAccount();
  const { addDeposit, removeDeposit, totalValueLocked, getDepositsByAddress } = useVault();
  const { formatted: openworkBalance, isLoading: balanceLoading } = useOpenworkBalance(address);
  const { data: tradingHistoryData } = useTradingHistory();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSwapWidgetOpen, setIsSwapWidgetOpen] = useState(false);
  const [isOnboardingWizardOpen, setIsOnboardingWizardOpen] = useState(false);
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const lcpRef = useRef<HTMLDivElement>(null);

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

    // LCP tracking only in development
    if (process.env.NODE_ENV === 'development' && lcpRef.current) {
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

  // Detect zero OPENWORK balance and trigger onboarding
  useEffect(() => {
    if (!isClient || !isConnected || balanceLoading) return;

    const hasOpenworkBalance = parseFloat(openworkBalance) > 0;

    // Show onboarding if user has zero OPENWORK balance and hasn't skipped
    if (!hasOpenworkBalance && !hasSkippedOnboarding) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setIsOnboardingWizardOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isClient, isConnected, balanceLoading, openworkBalance, hasSkippedOnboarding]);

  // Convert real trading history to signal history format
  const signalHistory: SignalHistoryEntry[] = tradingHistoryData?.trades.map(trade => ({
    id: trade.id,
    timestamp: new Date(trade.timestamp).getTime(),
    query: `${trade.direction.toUpperCase()} ${trade.asset} - ${trade.consensusStrength} consensus`,
    signalType: trade.direction === 'long' ? 'BUY' : trade.direction === 'short' ? 'SELL' : 'HOLD',
    confidence: trade.consensusStrength === '5/5' ? 100 : 80,
    reasoning: `Trade executed based on ${trade.consensusStrength} AI consensus. ${trade.direction.toUpperCase()} signal triggered at ${trade.entryPrice}.`,
    asset: trade.asset,
    tradeExecuted: true,
    tradeId: trade.id,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    pnl: trade.pnl,
    pnlPercentage: trade.pnlPercentage,
    tradeStatus: trade.status as 'pending' | 'open' | 'closed' | 'cancelled'
  })) || [];

  const addToast = useCallback((message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Retry handler for individual failed models with enhanced error handling
  const handleRetryModel = useCallback(async (modelId: string) => {
    setIsRetrying(true);
    try {
      addToast(`Retrying ${modelId}...`, 'info');
      
      // Make a direct API call to retry the specific model
      const response = await fetch('/api/consensus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `Retry analysis for ${modelId}`,
          retryModelId: modelId,
        }),
      });
      
      if (response.ok) {
        addToast(`${modelId} retry successful!`, 'success');
        // Small delay to let the UI update
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        
        if (response.status === 503) {
          addToast(`AI models temporarily unavailable. Please try again in 2-5 minutes.`, 'error');
        } else if (response.status === 429) {
          addToast(`Too many requests. Please wait before retrying.`, 'error');
        } else {
          addToast(`Retry failed: ${errorData.error || 'Unknown error'}`, 'error');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        addToast('Network error - unable to connect to AI service. Please check your connection and try again.', 'error');
      } else {
        addToast(`Retry failed for ${modelId}`, 'error');
      }
    } finally {
      setIsRetrying(false);
    }
  }, [addToast]);

  // Retry handler for all failed models with enhanced error handling
  const handleRetryFailed = useCallback(async () => {
    setIsRetrying(true);
    try {
      addToast('Retrying all failed models...', 'info');
      
      // Make a direct API call to retry all failed models
      const response = await fetch('/api/consensus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Retry all failed models',
          retryAll: true,
        }),
      });
      
      if (response.ok) {
        addToast('Retry complete! Fresh analysis started.', 'success');
        // Small delay to let the UI update
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        
        if (response.status === 503) {
          addToast('AI proxy service is temporarily unavailable. Please try again in 2-5 minutes.', 'error');
        } else if (response.status === 429) {
          addToast('Too many requests. Please wait 60 seconds before retrying.', 'error');
        } else {
          addToast(`Retry failed: ${errorData.error || 'Unknown error'}`, 'error');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        addToast('Network error - unable to connect to AI service. Please check your connection and try again.', 'error');
      } else {
        addToast('Retry failed. Please try again later.', 'error');
      }
    } finally {
      setIsRetrying(false);
    }
  }, [addToast]);

  // Auto-trading hook with callbacks
  const handleTradeSuccess = useCallback((trade: any) => {
    addToast(
      `Auto-trade executed: ${trade.direction.toUpperCase()} BTC/USD at $${trade.entryPrice.toLocaleString()}`,
      'success'
    );
  }, [addToast]);

  const handleTradeError = useCallback((error: string) => {
    addToast(`Auto-trade failed: ${error}`, 'error');
  }, [addToast]);

  const { isExecutingTrade } = useAutoTrading(
    consensusData,
    autoTradingEnabled,
    handleTradeSuccess,
    handleTradeError
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleDeposit = useCallback(async (amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Simulate deposit transaction (in real implementation, this would interact with smart contract)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Add deposit to vault state
    addDeposit(amount, address);

    // Show success toast
    addToast(`Successfully deposited ${amount} ETH`, 'success');
  }, [address, addDeposit, addToast]);

  const handleWithdraw = useCallback(async (amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Simulate withdrawal transaction with 2-second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 90% success rate for demo purposes
    const shouldSucceed = Math.random() < 0.9;

    if (!shouldSucceed) {
      addToast('Withdrawal failed. Please try again.', 'error');
      throw new Error('Transaction failed');
    }

    // Remove deposit from vault state
    removeDeposit(amount, address);

    // Show success toast
    addToast(`Successfully withdrew ${amount} ETH`, 'success');
  }, [address, removeDeposit, addToast]);

  const userDeposits = address ? getDepositsByAddress(address) : [];
  const userTotalDeposited = userDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(6);

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Consensus Vault Dashboard">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={handleDeposit}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onWithdraw={handleWithdraw}
        depositedBalance={userTotalDeposited}
      />

      {/* Swap Widget for OPENWORK */}
      <SwapWidget
        isOpen={isSwapWidgetOpen}
        onClose={() => setIsSwapWidgetOpen(false)}
      />

      {/* Token Onboarding Wizard */}
      <TokenOnboardingWizard
        isOpen={isOnboardingWizardOpen}
        onClose={() => setIsOnboardingWizardOpen(false)}
        onSkip={() => setHasSkippedOnboarding(true)}
      />

      <div id="main-content" className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Vault Stats + Deposit Button */}
        <section
          className="mb-6 bg-card rounded-xl p-6 border border-border"
          aria-labelledby="vault-stats-heading"
        >
          <h2 id="vault-stats-heading" className="sr-only">Vault Statistics and Actions</h2>
          
          {/* Zero OPENWORK Balance Banner */}
          {isConnected && !balanceLoading && parseFloat(openworkBalance) === 0 && !hasSkippedOnboarding && (
            <div className="mb-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Get OPENWORK Tokens to Get Started</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You need OPENWORK tokens to participate in prediction markets and earn rewards.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsOnboardingWizardOpen(true)}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                    >
                      Start Guided Setup
                    </button>
                    <button
                      onClick={() => setIsSwapWidgetOpen(true)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors text-sm border border-primary/30"
                    >
                      Get OPENWORK Directly
                    </button>
                    <button
                      onClick={() => setHasSkippedOnboarding(true)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors text-sm"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Paper Trading Mode Indicator */}
          <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 w-fit" role="status" aria-live="polite">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Paper Trading Mode</span>
            <span className="text-xs text-amber-600/70 dark:text-amber-400/70">- Simulated transactions only</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-6">
              <div role="status" aria-live="polite">
                <div className="text-xs text-muted-foreground mb-1">Total Value Locked</div>
                <div className="text-2xl font-bold" aria-label={`${totalValueLocked} ETH locked`}>
                  {totalValueLocked} ETH
                </div>
              </div>
              {isConnected && (
                <>
                  <div role="status" aria-live="polite">
                    <div className="text-xs text-muted-foreground mb-1">Your Deposits</div>
                    <div 
                      className="text-2xl font-bold text-bullish" 
                      aria-label={`${userTotalDeposited} ETH deposited`}
                    >
                      {userTotalDeposited} ETH
                    </div>
                  </div>
                  <div role="status" aria-live="polite" className="hidden sm:block">
                    <div className="text-xs text-muted-foreground mb-1">CONSENSUS Balance</div>
                    <TokenBalance className="text-2xl font-bold text-accent" showRefresh={false} showSymbol={true} />
                  </div>
                  <div role="status" aria-live="polite" className="hidden sm:block">
                    <div className="text-xs text-muted-foreground mb-1">OPENWORK Balance</div>
                    <div className="text-2xl font-bold text-primary">
                      {balanceLoading ? (
                        <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                      ) : (
                        <span aria-label={`${openworkBalance} OPENWORK tokens`}>
                          {openworkBalance} OPENWORK
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setIsDepositModalOpen(true)}
                disabled={!isConnected}
                className="px-6 py-3 bg-bullish text-white rounded-lg font-semibold hover:bg-bullish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 touch-manipulation min-h-[44px]"
                aria-label="Open deposit modal to add funds to your vault"
                aria-describedby="deposit-button-description"
              >
                <span className="text-lg" aria-hidden="true">+</span>
                <span>Deposit</span>
              </button>
              <span id="deposit-button-description" className="sr-only">
                Opens a modal dialog to deposit cryptocurrency into your vault
              </span>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={!isConnected || parseFloat(userTotalDeposited) <= 0}
                className="px-6 py-3 bg-bearish text-white rounded-lg font-semibold hover:bg-bearish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 touch-manipulation min-h-[44px]"
                aria-label="Open withdraw modal to remove funds from your vault"
                aria-describedby="withdraw-button-description"
              >
                <span className="text-lg" aria-hidden="true">−</span>
                <span>Withdraw</span>
              </button>
              <span id="withdraw-button-description" className="sr-only">
                Opens a modal dialog to withdraw cryptocurrency from your vault
              </span>
              <button
                onClick={() => setIsSwapWidgetOpen(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 touch-manipulation min-h-[44px] border-2 border-accent"
                aria-label="Get OPENWORK tokens"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Get OPENWORK</span>
              </button>
            </div>
          </div>
        </section>

        {/* Trade Signal - Critical LCP Element */}
        <section
          className="mb-6"
          aria-labelledby="trade-signal-heading"
        >
          <h2 id="trade-signal-heading" className="sr-only">Current Trade Signal</h2>
          
          {/* Partial Failure Banner */}
          <PartialFailureBanner
            partialFailures={consensusData.partialFailures}
            onRetry={handleRetryFailed}
            isRetrying={isRetrying}
          />
          
          <div ref={lcpRef} data-lcp="true">
            <TradeSignal
              recommendation={consensusData.recommendation}
              consensusLevel={consensusData.consensusLevel}
              threshold={consensusData.threshold}
              onExecuteTrade={() => {
                // Manually trigger trade execution
                const executeTrade = async () => {
                  try {
                    addToast('Manually executing trade...', 'info');
                    const response = await fetch('/api/trading/execute', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ asset: 'BTC/USD' }),
                    });

                    const data = await response.json();
                    if (data.success) {
                      addToast(
                        `Trade executed: ${data.trade.direction.toUpperCase()} BTC/USD at $${data.trade.entryPrice.toLocaleString()}`,
                        'success'
                      );
                    } else {
                      addToast(`Trade execution failed: ${data.message || data.error}`, 'error');
                    }
                  } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Network error';
                    addToast(`Trade execution error: ${errorMsg}`, 'error');
                  }
                };
                executeTrade();
              }}
            />
          </div>
        </section>

        {/* Consensus Meter */}
        <section
          className="bg-card rounded-xl p-6 mb-6 border border-border"
          aria-labelledby="consensus-meter-heading"
        >
          <h2 id="consensus-meter-heading" className="sr-only">Consensus Meter</h2>
          <ConsensusMeter
            level={consensusData.consensusLevel}
            threshold={consensusData.threshold}
          />
        </section>

        {/* Consensus vs Contrarian Dashboard */}
        <Suspense fallback={<LoadingSkeleton />}>
          <section
            className="mb-6"
            aria-labelledby="consensus-dashboard-heading"
          >
            <h2 id="consensus-dashboard-heading" className="sr-only">Consensus vs Contrarian Analysis</h2>
            <ConsensusVsContrarian />
          </section>
        </Suspense>

        {/* AI Analysts Section */}
        <section className="mb-4" aria-labelledby="analysts-heading">
          <h2 id="analysts-heading" className="text-xl font-bold mb-1">
            AI Analyst Council
          </h2>
          <p className="text-sm sm:text-sm text-muted-foreground">
            Five specialized AI models analyzing the market from different perspectives
          </p>
        </section>

        {/* Analyst Cards Grid */}
        <section className="mb-6" aria-labelledby="analyst-cards-heading">
          <h3 id="analyst-cards-heading" className="sr-only">AI Analyst Cards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {consensusData.analysts.map((analyst, index) => (
              <div
                key={analyst.id}
                role="article"
                aria-labelledby={`analyst-${analyst.id}-heading`}
              >
                <AnalystCard
                  analyst={analyst}
                  index={index}
                  onRetry={handleRetryModel}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Trading Performance Section */}
        <Suspense fallback={<LoadingSkeleton />}>
          <TradingPerformance className="mb-6" />
        </Suspense>

        {/* Signal History Section */}
        <section
          className="mb-6"
          aria-labelledby="signal-history-heading"
        >
          <SignalHistory
            signals={signalHistory}
            maxEntries={5}
            isDemoData={!tradingHistoryData || tradingHistoryData.trades.length === 0}
          />
        </section>

        {/* Footer Info */}
        <footer
          className="mt-8 text-center text-sm text-muted-foreground"
          role="contentinfo"
        >
          <p className="text-sm sm:text-sm">
            Real-time consensus powered by DeepSeek, Kimi, MiniMax, GLM, and Gemini
          </p>
          <p className="mt-1 text-sm sm:text-sm">
            Trade executes automatically when consensus threshold is reached
          </p>
        </footer>
      </div>
    </main>
  );
}
