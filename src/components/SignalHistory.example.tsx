/**
 * Example usage of SignalHistory component
 *
 * This file demonstrates how to integrate SignalHistory into a page
 */

import { useState, useEffect } from 'react';
import SignalHistory, { SignalHistoryEntry } from './SignalHistory';

// Example signal data
const exampleSignals: SignalHistoryEntry[] = [
  {
    id: '1',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    query: 'BTC/USD market analysis',
    asset: 'BTC/USD',
    signalType: 'BUY',
    confidence: 85,
    reasoning: 'Strong bullish momentum detected across multiple timeframes. Price action shows consistent higher highs and higher lows. Volume profile indicates institutional accumulation.'
  },
  {
    id: '2',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    query: 'ETH/USD sentiment check',
    asset: 'ETH/USD',
    signalType: 'HOLD',
    confidence: 62,
    reasoning: 'Market is consolidating near key support level. Mixed signals from technical indicators. Recommend waiting for clear breakout direction before entering position.'
  },
  {
    id: '3',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    query: 'SOL/USD risk assessment',
    asset: 'SOL/USD',
    signalType: 'SELL',
    confidence: 78,
    reasoning: 'Bearish divergence on RSI. Price approaching resistance with declining volume. Risk/reward ratio favors taking profits or exiting positions.'
  }
];

// Example: Basic usage
export function BasicExample() {
  return <SignalHistory signals={exampleSignals} />;
}

// Example: Custom max entries
export function CustomMaxExample() {
  return <SignalHistory signals={exampleSignals} maxEntries={5} />;
}

// Example: With custom className
export function StyledExample() {
  return <SignalHistory signals={exampleSignals} className="shadow-lg" />;
}

// Example: Integrated in dashboard
export function DashboardExample() {
  // In a real implementation, you would fetch signals from an API or state management
  const [signals, setSignals] = useState<SignalHistoryEntry[]>([]);

  // Fetch signals from API
  useEffect(() => {
    async function fetchSignals() {
      try {
        const response = await fetch('/api/signals/history');
        const data = await response.json();
        if (data.success) {
          setSignals(data.signals);
        }
      } catch (error) {
        console.error('Failed to fetch signal history:', error);
      }
    }

    fetchSignals();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other dashboard components */}
      <SignalHistory signals={signals} maxEntries={10} />
    </div>
  );
}

// Example: Adding new signals dynamically
export function DynamicExample() {
  const [signals, setSignals] = useState<SignalHistoryEntry[]>(exampleSignals);

  const addNewSignal = (newSignal: SignalHistoryEntry) => {
    setSignals(prev => [...prev, newSignal]);
  };

  // When consensus analysis completes, add the signal to history
  const handleConsensusComplete = (consensusData: any) => {
    const newSignal: SignalHistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      query: `${consensusData.asset} analysis`,
      asset: consensusData.asset,
      signalType: consensusData.recommendation,
      confidence: consensusData.consensusLevel,
      reasoning: consensusData.reasoning || 'Consensus reached by AI models'
    };

    addNewSignal(newSignal);
  };

  return <SignalHistory signals={signals} />;
}
