'use client';

import { useState, useCallback } from 'react';
import { useConsensusStream } from '@/lib/useConsensusStream';
import { useAutoTrading } from '@/lib/useAutoTrading';
import AnalystCard from '@/components/AnalystCard';
import ConsensusMeter from '@/components/ConsensusMeter';
import TradeSignal from '@/components/TradeSignal';
import TradingPerformance from '@/components/TradingPerformance';
import DepositModal from '@/components/DepositModal';
import ToastContainer, { ToastData } from '@/components/ToastContainer';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useVault } from '@/contexts/VaultContext';

export default function Dashboard() {
  const consensusData = useConsensusStream();
  const { address, isConnected } = useAccount();
  const { addDeposit, totalValueLocked, getDepositsByAddress } = useVault();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(true);

  // Auto-trading hook
  const { isExecutingTrade } = useAutoTrading(consensusData, autoTradingEnabled);

  const addToast = useCallback((message: string, type: ToastData['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

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

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🦞</span>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">Consensus Vault</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">AI Multi-Model Trading Intelligence</p>
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
            <button
              onClick={() => setIsDepositModalOpen(true)}
              disabled={!isConnected}
              className="px-6 py-3 bg-bullish text-white rounded-lg font-semibold hover:bg-bullish/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              <span>Deposit</span>
            </button>
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

        {/* AI Analysts Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1">AI Analyst Council</h2>
          <p className="text-sm text-muted-foreground">
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

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p>
            Real-time consensus powered by DeepSeek, Kimi, MiniMax, GLM, and Gemini
          </p>
          <p className="mt-1">
            Trade executes automatically when consensus threshold is reached
          </p>
        </motion.div>
      </div>
    </main>
  );
}
