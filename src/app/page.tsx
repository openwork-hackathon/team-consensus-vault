'use client';

import { useState, useCallback } from 'react';
import { useConsensusStream } from '@/lib/useConsensusStream';
import { useAutoTrading } from '@/lib/useAutoTrading';
import AnalystCard from '@/components/AnalystCard';
import ConsensusMeter from '@/components/ConsensusMeter';
import ConsensusVsContrarian from '@/components/ConsensusVsContrarian';
import TradeSignal from '@/components/TradeSignal';
import TradingPerformance from '@/components/TradingPerformance';
import SignalHistory, { SignalHistoryEntry } from '@/components/SignalHistory';
import DepositModal from '@/components/DepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import ToastContainer, { ToastData } from '@/components/ToastContainer';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useVault } from '@/contexts/VaultContext';

export default function Dashboard() {
  const consensusData = useConsensusStream();
  const { address, isConnected } = useAccount();
  const { addDeposit, removeDeposit, totalValueLocked, getDepositsByAddress } = useVault();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(true);

  // Mock signal history data for demonstration
  const signalHistory: SignalHistoryEntry[] = [
    {
      id: '1',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      query: 'BTC analysis on current market conditions',
      signalType: 'BUY',
      confidence: 87,
      reasoning: 'Strong bullish momentum detected across multiple indicators. RSI shows oversold conditions recovering, MACD crossover confirmed, and volume profile supports upward movement. Market sentiment analysis indicates retail FOMO building.',
      asset: 'BTC/USD',
      tradeExecuted: true,
      tradeId: 'trade_001',
      entryPrice: 45234,
      exitPrice: 46125,
      pnl: 891,
      pnlPercentage: 1.97,
      tradeStatus: 'closed'
    },
    {
      id: '2',
      timestamp: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
      query: 'ETH technical analysis for short term',
      signalType: 'SELL',
      confidence: 92,
      reasoning: 'Bearish divergence spotted on 4H chart. Failed to break resistance at $2,850 level three times. Volume decreasing on bounces, suggesting exhaustion. Short-term correction expected.',
      asset: 'ETH/USD',
      tradeExecuted: true,
      tradeId: 'trade_002',
      entryPrice: 2847,
      exitPrice: 2789,
      pnl: -58,
      pnlPercentage: -2.04,
      tradeStatus: 'closed'
    },
    {
      id: '3',
      timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
      query: 'Market outlook for major cryptocurrencies',
      signalType: 'HOLD',
      confidence: 65,
      reasoning: 'Mixed signals across different timeframes. While daily trend remains bullish, 4H showing signs of consolidation. Waiting for clearer directional bias before taking position. Risk management suggests patience.',
      asset: 'BTC/USD',
      tradeExecuted: false,
      tradeStatus: 'cancelled'
    },
    {
      id: '4',
      timestamp: Date.now() - 1000 * 60 * 360, // 6 hours ago
      query: 'Bitcoin momentum analysis',
      signalType: 'BUY',
      confidence: 78,
      reasoning: 'Accumulation phase detected. Whale wallet activity increasing, exchange inflows decreasing, and on-chain metrics show strong hands holding. Next leg up likely to begin soon.',
      asset: 'BTC/USD',
      tradeExecuted: true,
      tradeId: 'trade_003',
      entryPrice: 44156,
      exitPrice: 45234,
      pnl: 1078,
      pnlPercentage: 2.44,
      tradeStatus: 'closed'
    },
    {
      id: '5',
      timestamp: Date.now() - 1000 * 60 * 720, // 12 hours ago
      query: 'ETH/BTC pair analysis',
      signalType: 'HOLD',
      confidence: 71,
      reasoning: 'ETH/BTC ratio in accumulation zone. Both assets showing independent strength. No clear alpha opportunity between the pairs. Better to wait for divergence.',
      asset: 'ETH/BTC',
      tradeExecuted: false,
      tradeStatus: 'cancelled'
    }
  ];

  const addToast = useCallback((message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

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
    <main className="min-h-screen bg-background">
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

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🦞</span>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">Consensus Vault</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">AI Multi-Model Trading Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-muted-foreground">Asset</div>
                <div className="font-semibold">BTC/USD</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-muted-foreground">Price</div>
                <div className="font-semibold text-bullish">$45,234</div>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Vault Stats + Deposit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card rounded-xl p-6 border border-border"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Value Locked</div>
                <div className="text-2xl font-bold">{totalValueLocked} ETH</div>
              </div>
              {isConnected && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Your Deposits</div>
                  <div className="text-2xl font-bold text-bullish">{userTotalDeposited} ETH</div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDepositModalOpen(true)}
                disabled={!isConnected}
                className="px-6 py-3 bg-bullish text-white rounded-lg font-semibold hover:bg-bullish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 touch-manipulation min-h-[44px]"
              >
                <span className="text-lg">+</span>
                <span>Deposit</span>
              </button>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={!isConnected || parseFloat(userTotalDeposited) <= 0}
                className="px-6 py-3 bg-bearish text-white rounded-lg font-semibold hover:bg-bearish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 touch-manipulation min-h-[44px]"
              >
                <span className="text-lg">−</span>
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Trade Signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <TradeSignal
            recommendation={consensusData.recommendation}
            consensusLevel={consensusData.consensusLevel}
            threshold={consensusData.threshold}
          />
        </motion.div>

        {/* Consensus Meter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 mb-6 border border-border"
        >
          <ConsensusMeter
            level={consensusData.consensusLevel}
            threshold={consensusData.threshold}
          />
        </motion.div>

        {/* Consensus vs Contrarian Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <ConsensusVsContrarian />
        </motion.div>

        {/* AI Analysts Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1">AI Analyst Council</h2>
          <p className="text-sm sm:text-sm text-muted-foreground">
            Five specialized AI models analyzing the market from different perspectives
          </p>
        </div>

        {/* Analyst Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {consensusData.analysts.map((analyst, index) => (
            <AnalystCard key={analyst.id} analyst={analyst} index={index} />
          ))}
        </div>

        {/* Trading Performance Section */}
        <TradingPerformance className="mb-6" />

        {/* Signal History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <SignalHistory signals={signalHistory} maxEntries={5} />
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p className="text-sm sm:text-sm">
            Real-time consensus powered by DeepSeek, Kimi, MiniMax, GLM, and Gemini
          </p>
          <p className="mt-1 text-sm sm:text-sm">
            Trade executes automatically when consensus threshold is reached
          </p>
        </motion.div>
      </div>
    </main>
  );
}
