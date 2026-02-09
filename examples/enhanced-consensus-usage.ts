/**
 * Usage Examples: Enhanced Consensus Integration
 * CVAULT-177
 *
 * This file demonstrates how to use the chatroom-to-trading-council integration.
 */

// ============================================================================
// Example 1: Fetch Enhanced Consensus via API
// ============================================================================

async function fetchEnhancedConsensus(asset: string, context?: string) {
  const params = new URLSearchParams({ asset });
  if (context) params.append('context', context);

  const response = await fetch(`/api/consensus-enhanced?${params}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    // Trading council result
    councilSignal: data.council.signal, // 'buy' | 'sell' | 'hold'
    councilConfidence: data.council.consensusLevel, // 0-100

    // Chatroom result (may be null)
    chatroomDirection: data.chatroom?.direction, // 'bullish' | 'bearish' | 'neutral'
    chatroomStrength: data.chatroom?.strength, // 0-100

    // Alignment
    alignmentScore: data.alignment.score, // 0-100
    alignmentCommentary: data.alignment.commentary, // Human-readable
    agreement: data.alignment.agreement, // 'strong' | 'moderate' | 'weak' | 'disagreement'
  };
}

// Usage
const result = await fetchEnhancedConsensus('BTC', 'Recent halving approaching');
console.log('Council says:', result.councilSignal);
console.log('Chatroom says:', result.chatroomDirection);
console.log('Alignment:', result.alignmentScore, result.agreement);

// ============================================================================
// Example 2: Use Bridge Functions Directly (Server-Side)
// ============================================================================

import {
  getChatroomConsensus,
  prepareCouncilContext,
  calculateAlignmentScore,
  isChatroomConsensusSignificant,
} from '@/lib/chatroom-consensus-bridge';
import { runConsensusAnalysis } from '@/lib/consensus-engine';

async function runEnhancedAnalysis(asset: string, userContext?: string) {
  // Step 1: Get chatroom consensus
  const chatroomConsensus = await getChatroomConsensus();

  if (chatroomConsensus) {
    console.log('Chatroom consensus:', {
      direction: chatroomConsensus.direction,
      strength: chatroomConsensus.strength,
      phase: chatroomConsensus.phaseState,
      messages: chatroomConsensus.messageCount,
    });
  }

  // Step 2: Prepare enhanced context
  const { combinedContext } = await prepareCouncilContext(userContext);

  // Step 3: Run trading council with chatroom context
  const { analysts, consensus } = await runConsensusAnalysis(
    asset,
    combinedContext || userContext
  );

  console.log('Council signal:', consensus.signal);
  console.log('Council confidence:', consensus.consensusLevel);

  // Step 4: Calculate alignment
  const alignmentScore = calculateAlignmentScore(
    chatroomConsensus,
    consensus.signal,
    consensus.consensusLevel
  );

  console.log('Alignment score:', alignmentScore);

  // Check if chatroom consensus is significant
  const isSignificant = isChatroomConsensusSignificant(chatroomConsensus);
  console.log('Chatroom consensus significant:', isSignificant);

  return {
    chatroomConsensus,
    councilAnalysis: consensus,
    alignmentScore,
    isSignificant,
  };
}

// ============================================================================
// Example 3: React Component Usage
// ============================================================================

import { useState, useEffect } from 'react';

function TradingDashboard() {
  const [enhancedData, setEnhancedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeAsset = async (asset: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/consensus-enhanced?asset=${asset}`);
      const data = await response.json();
      setEnhancedData(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!enhancedData) {
    return <button onClick={() => analyzeAsset('BTC')}>Analyze BTC</button>;
  }

  return (
    <div>
      <h2>Trading Council</h2>
      <p>Signal: {enhancedData.council.signal}</p>
      <p>Confidence: {enhancedData.council.consensusLevel}%</p>

      <h2>Chatroom Debate</h2>
      {enhancedData.chatroom ? (
        <>
          <p>Direction: {enhancedData.chatroom.direction}</p>
          <p>Strength: {enhancedData.chatroom.strength}%</p>
          <p>Phase: {enhancedData.chatroom.phase}</p>
        </>
      ) : (
        <p>No chatroom consensus available</p>
      )}

      <h2>Alignment</h2>
      <p>Score: {enhancedData.alignment.score}%</p>
      <p>{enhancedData.alignment.commentary}</p>
    </div>
  );
}

// ============================================================================
// Example 4: Decision Logic Based on Alignment
// ============================================================================

function makeTradingDecision(enhancedResult: any) {
  const {
    council,
    chatroom,
    alignment: { score, agreement },
  } = enhancedResult;

  // High alignment + strong signals = high confidence trade
  if (score >= 80 && council.consensusLevel >= 80) {
    return {
      action: council.signal,
      confidence: 'very_high',
      reasoning: 'Both systems strongly align with high confidence',
    };
  }

  // Good alignment + moderate signals = moderate confidence trade
  if (score >= 60 && council.consensusLevel >= 60) {
    return {
      action: council.signal,
      confidence: 'high',
      reasoning: 'Systems align with good confidence',
    };
  }

  // Disagreement = caution
  if (score < 40) {
    return {
      action: 'hold',
      confidence: 'low',
      reasoning: 'Systems disagree - wait for clearer signals',
    };
  }

  // Council strong but no chatroom consensus = trust council
  if (!chatroom && council.consensusLevel >= 80) {
    return {
      action: council.signal,
      confidence: 'moderate',
      reasoning: 'Strong council signal, no chatroom data',
    };
  }

  // Default: weak signal
  return {
    action: 'hold',
    confidence: 'low',
    reasoning: 'Weak or mixed signals across systems',
  };
}

// Usage
const result = await fetchEnhancedConsensus('ETH');
const decision = makeTradingDecision(result);
console.log('Decision:', decision.action);
console.log('Confidence:', decision.confidence);
console.log('Reasoning:', decision.reasoning);

// ============================================================================
// Example 5: Stream Updates and Recalculate Alignment
// ============================================================================

async function streamEnhancedConsensus(asset: string) {
  const eventSource = new EventSource(`/api/chatroom/stream`);

  // Listen for chatroom consensus updates
  eventSource.addEventListener('consensus_update', async (event) => {
    const chatroomUpdate = JSON.parse(event.data);

    // Fetch latest council analysis
    const response = await fetch(`/api/consensus-enhanced?asset=${asset}`);
    const data = await response.json();

    console.log('New alignment after chatroom update:', data.alignment.score);

    // Trigger UI update or notification
    if (data.alignment.agreement === 'disagreement') {
      alert('⚠️ Systems disagree! Review your position.');
    }
  });

  return () => eventSource.close();
}

// Usage: Start streaming, returns cleanup function
const stopStreaming = await streamEnhancedConsensus('BTC');

// Later: stop streaming
// stopStreaming();

// ============================================================================
// Example 6: Batch Analysis of Multiple Assets
// ============================================================================

async function analyzePortfolio(assets: string[]) {
  const results = await Promise.all(
    assets.map((asset) =>
      fetch(`/api/consensus-enhanced?asset=${asset}`)
        .then((res) => res.json())
        .then((data) => ({ asset, ...data }))
    )
  );

  // Find assets with strong alignment
  const strongSignals = results.filter(
    (r) => r.alignment.score >= 80 && r.council.consensusLevel >= 80
  );

  // Find assets with disagreement
  const conflictedSignals = results.filter((r) => r.alignment.score < 40);

  return {
    strongBuySignals: strongSignals.filter((r) => r.council.signal === 'buy'),
    strongSellSignals: strongSignals.filter((r) => r.council.signal === 'sell'),
    conflictedAssets: conflictedSignals.map((r) => r.asset),
  };
}

// Usage
const portfolio = await analyzePortfolio(['BTC', 'ETH', 'SOL', 'AVAX']);
console.log('Strong buy signals:', portfolio.strongBuySignals);
console.log('Conflicted assets:', portfolio.conflictedAssets);

// ============================================================================
// Notes on Performance
// ============================================================================

/**
 * Performance Characteristics:
 *
 * 1. API Response Time:
 *    - Chatroom fetch: ~10-50ms (KV store read)
 *    - Council analysis: ~2-5s (5 parallel AI calls)
 *    - Total: ~2-5s
 *
 * 2. Caching:
 *    - Chatroom consensus: Cached in Redis/KV (instant subsequent reads)
 *    - Council analysis: 60s TTL memoization (fast repeated requests)
 *    - Alignment calculation: Computed on-demand (< 1ms)
 *
 * 3. Rate Limiting:
 *    - 10 requests per minute per IP
 *    - Chatroom reads don't count against limit
 *
 * 4. Optimization Tips:
 *    - Cache results client-side for 30-60s
 *    - Use SSE streaming for real-time updates
 *    - Batch multiple assets in parallel (Promise.all)
 */
