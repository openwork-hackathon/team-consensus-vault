'use client';

import { useConsensusStream } from '@/lib/useConsensusStream';
import AnalystCard from '@/components/AnalystCard';
import ConsensusMeter from '@/components/ConsensusMeter';
import TradeSignal from '@/components/TradeSignal';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const consensusData = useConsensusStream();

  return (
    <main className="min-h-screen bg-background">
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
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {consensusData.analysts.map((analyst, index) => (
            <AnalystCard key={analyst.id} analyst={analyst} index={index} />
          ))}
        </div>

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
