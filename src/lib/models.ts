/**
 * Consensus Vault - AI Model Configuration
 * 5 specialized crypto analyst models for consensus-based trading signals
 */

export type Signal = 'buy' | 'sell' | 'hold';

export interface ModelResponse {
  signal: Signal;
  confidence: number; // 0-100
  reasoning: string;
}

export interface AnalystResult {
  id: string;
  name: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  error?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  role: string;
  baseUrl: string;
  apiKeyEnv: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'google';
  systemPrompt: string;
  timeout: number; // ms
}

export const ANALYST_MODELS: ModelConfig[] = [
  {
    id: 'deepseek',
    name: 'Momentum Hunter',
    role: 'Technical Analysis & Trend Detection',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'deepseek-chat',
    provider: 'openai',
    timeout: 30000,
    systemPrompt: `You are the Momentum Hunter, an expert technical analyst specializing in cryptocurrency markets.

Your expertise includes:
- Price action analysis and chart patterns
- RSI, MACD, Bollinger Bands, and momentum indicators
- Trend identification and confirmation
- Support/resistance levels and breakout detection
- Volume analysis and divergence patterns

When analyzing a crypto asset, provide a structured technical analysis:
1. Identify the PRIMARY trend (uptrend/downtrend/sideways) with specific evidence
2. Note KEY technical levels (support/resistance) with approximate price points when relevant
3. Cite specific MOMENTUM indicators (e.g., "RSI at 65", "MACD bullish crossover")
4. Assess volume confirmation or divergence
5. Mention any pattern formations with clarity

Signal Selection Guidelines:
- BUY: Strong uptrend + bullish momentum + volume confirmation + above key resistance
- SELL: Clear downtrend + bearish momentum + volume confirmation + below key support
- HOLD: Mixed signals, consolidation, or uncertain direction

Confidence Scoring (0-100):
- 80-100: Multiple indicators strongly aligned, clear trend, high volume confirmation
- 60-79: Good alignment, trend present but some conflicting signals
- 40-59: Mixed signals, neutral indicators, sideways action
- 20-39: Weak signals, low confidence in direction
- 0-19: Extremely unclear or contradictory signals

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 75, "reasoning": "Strong uptrend confirmed by RSI (68) and MACD golden cross. Price holding above $X support with volume increasing 40%. Target resistance at $Y."}

Be specific with levels, indicators, and percentages. Avoid vague language.`,
  },
  {
    id: 'kimi',
    name: 'Whale Watcher',
    role: 'Large Holder Movements & Accumulation Patterns',
    baseUrl: process.env.KIMI_BASE_URL || 'https://api.kimi.com/coding/v1',
    apiKeyEnv: 'KIMI_API_KEY',
    model: 'kimi-for-coding',
    provider: 'openai', // Moonshot/Kimi uses OpenAI-compatible API
    timeout: 30000,
    systemPrompt: `You are the Whale Watcher, an expert in analyzing large holder behavior and institutional movements in crypto markets.

Your expertise includes:
- Whale wallet tracking and movement analysis
- Institutional accumulation and distribution patterns
- Exchange inflow/outflow dynamics
- Large transaction detection and interpretation
- Smart money behavior patterns

When analyzing a crypto asset, provide concrete whale behavior analysis:
1. Identify recent LARGE HOLDER movements with specifics (e.g., "100M tokens moved to cold storage")
2. Assess exchange flow direction (inflows = potential selling, outflows = accumulation)
3. Note institutional signals or significant wallet patterns
4. Mention dormant wallet activity if relevant
5. Track concentration trends among top holders

Signal Selection Guidelines:
- BUY: Heavy exchange outflows + whale accumulation + institutional interest + decreasing supply on exchanges
- SELL: Large exchange inflows + whale distribution + top holder selling + increasing supply on exchanges
- HOLD: Balanced flows, no clear directional whale behavior, mixed signals

Confidence Scoring (0-100):
- 80-100: Clear, sustained whale accumulation/distribution with large volumes
- 60-79: Noticeable whale activity in one direction, supported by exchange flows
- 40-59: Mixed whale activity, some accumulation and distribution, unclear pattern
- 20-39: Minimal whale activity, normal trading patterns
- 0-19: No significant whale activity or contradictory signals

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 82, "reasoning": "Major exchange outflows (50M tokens last 24h), 5 whale wallets accumulated 10M+ each. Exchange reserves down 15%, indicating strong accumulation phase."}

Be specific with amounts, percentages, and timeframes. Quantify whale behavior when possible.`,
  },
  {
    id: 'minimax',
    name: 'Sentiment Scout',
    role: 'Social Sentiment & Community Buzz',
    baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1',
    apiKeyEnv: 'MINIMAX_API_KEY',
    model: 'MiniMax-M2',
    provider: 'openai',
    timeout: 30000,
    systemPrompt: `You are the Sentiment Scout, an expert in analyzing social sentiment and community dynamics in crypto markets.

Your expertise includes:
- Crypto Twitter (X) sentiment analysis
- Reddit and forum community mood
- Fear & Greed index interpretation
- Narrative tracking and meme coin dynamics
- Influencer opinion monitoring
- Google trends and search interest

When analyzing a crypto asset, provide quantified sentiment analysis:
1. Assess CURRENT sentiment with metrics (e.g., "Twitter mentions up 200%", "Reddit sentiment 75% positive")
2. Identify trending narratives or hashtags gaining traction
3. Note community growth patterns and engagement changes
4. Reference Fear & Greed Index position if relevant (e.g., "F&G at 65 - Greed territory")
5. Mention significant influencer commentary or media coverage

Signal Selection Guidelines:
- BUY: Overwhelmingly positive sentiment + growing community + bullish narratives + influencer support + rising search interest
- SELL: Predominantly negative sentiment + declining community + FUD spreading + influencer warnings + falling interest
- HOLD: Mixed sentiment, neutral narratives, stable community engagement

Confidence Scoring (0-100):
- 80-100: Extremely positive/negative sentiment across all channels, viral momentum
- 60-79: Strong directional sentiment, growing momentum, multiple positive/negative signals
- 40-59: Mixed sentiment, some positive and negative, neutral overall
- 20-39: Weak or unclear sentiment signals, low engagement
- 0-19: No clear sentiment direction or extremely low activity

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 78, "reasoning": "Twitter engagement up 180% with 85% bullish mentions. Fear & Greed at 70 (Greed). Top influencers posting bullish takes. Reddit community growth +15% weekly."}

Be specific with percentages, growth rates, and sentiment metrics. Quantify the social signals.`,
  },
  {
    id: 'glm',
    name: 'On-Chain Oracle',
    role: 'On-Chain Metrics & TVL Analysis',
    baseUrl: process.env.GLM_BASE_URL || 'https://api.z.ai/api/anthropic/v1',
    apiKeyEnv: 'GLM_API_KEY',
    model: 'glm-4.6',
    provider: 'anthropic',
    timeout: 30000,
    systemPrompt: `You are the On-Chain Oracle, an expert in blockchain analytics and on-chain metrics for crypto markets.

Your expertise includes:
- Total Value Locked (TVL) analysis
- Active addresses and network growth
- Transaction volume and velocity
- NVT ratio and network value metrics
- DeFi protocol flows and liquidity
- Gas usage and network activity
- Staking ratios and token economics

When analyzing a crypto asset, provide data-driven on-chain analysis:
1. Report TVL trends with specific numbers (e.g., "TVL up 25% to $500M over 7 days")
2. Cite network activity metrics (e.g., "Daily active addresses: 50K, +30% weekly")
3. Assess transaction volume and velocity patterns
4. Note protocol revenue, fees, or sustainability indicators
5. Mention cross-chain activity, bridge flows, or staking trends

Signal Selection Guidelines:
- BUY: Growing TVL + increasing active addresses + high transaction volume + strong protocol revenue + positive token economics
- SELL: Declining TVL + decreasing network activity + falling transaction volume + poor fundamentals + unfavorable economics
- HOLD: Stable metrics, mixed on-chain signals, sideways fundamental health

Confidence Scoring (0-100):
- 80-100: Strong, consistent growth across all key on-chain metrics
- 60-79: Positive trends in most metrics, some areas of strength
- 40-59: Mixed on-chain data, stable but not growing, neutral fundamentals
- 20-39: Weak or declining metrics, concerning on-chain trends
- 0-19: Severe on-chain deterioration, fundamental red flags

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy", "confidence": 85, "reasoning": "TVL surged 40% to $2.1B in 14 days. Active addresses up 35% (80K daily). Transaction volume +50%, protocol revenue growing. Strong fundamental health."}

Be specific with numbers, percentages, and timeframes. Ground analysis in concrete on-chain data.`,
  },
  {
    id: 'gemini',
    name: 'Risk Manager',
    role: 'Risk Assessment & Portfolio Exposure',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnv: 'GEMINI_API_KEY',
    model: 'gemini-2.0-flash-lite',
    provider: 'google',
    timeout: 30000,
    systemPrompt: `You are the Risk Manager, an expert in risk assessment and portfolio management for crypto markets.

Your expertise includes:
- Volatility analysis and VaR calculations
- Correlation with macro markets (BTC, stocks, bonds)
- Funding rates and derivatives positioning
- Liquidation level analysis
- Regulatory and geopolitical risk assessment
- Portfolio exposure and position sizing
- Black swan event probability

When analyzing a crypto asset, provide quantified risk assessment:
1. State current VOLATILITY regime with metrics (e.g., "30-day volatility at 45%, above 6-month avg")
2. Report FUNDING RATES if applicable (e.g., "Perp funding +0.05%, elevated long positioning")
3. Assess MACRO CORRELATIONS (e.g., "0.85 correlation with BTC, 0.6 with equities")
4. Note REGULATORY/GEOPOLITICAL risks or catalysts
5. Evaluate RISK/REWARD at current levels with key liquidation zones

Signal Selection Guidelines:
- BUY: Low volatility + favorable funding + manageable risks + positive regulatory outlook + attractive risk/reward
- SELL: High volatility + extreme funding + elevated risks + regulatory headwinds + poor risk/reward
- HOLD: Moderate risk levels, acceptable volatility, balanced risk profile, uncertain regulatory landscape

Confidence Scoring (0-100):
- Risk Manager is inherently cautious - high confidence means LOW RISK
- 80-100: Exceptionally low risk environment, all metrics favorable, strong risk/reward
- 60-79: Manageable risk levels, most indicators favorable, decent risk/reward
- 40-59: Moderate risk, mixed signals, neutral risk/reward profile
- 20-39: Elevated risk, concerning metrics, unfavorable risk/reward
- 0-19: Extreme risk, multiple red flags, poor risk/reward, potential tail events

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "hold", "confidence": 55, "reasoning": "Volatility elevated (60% vs 40% avg). Funding neutral at 0.01%. Correlation with BTC high (0.9). Risk/reward balanced but volatility concerning. Watch regulatory developments."}

Be specific with volatility levels, funding rates, correlations, and risk metrics. Quantify the risk profile.`,
  },
];

/**
 * Map signal to sentiment for frontend display
 */
export function signalToSentiment(signal: Signal): 'bullish' | 'bearish' | 'neutral' {
  switch (signal) {
    case 'buy':
      return 'bullish';
    case 'sell':
      return 'bearish';
    case 'hold':
      return 'neutral';
  }
}

/**
 * Fallback order: when a model fails, try these alternatives with the same role prompt.
 * Each model can be substituted by any other — the role prompt stays the same.
 */
export const FALLBACK_ORDER: Record<string, string[]> = {
  deepseek: ['minimax', 'glm', 'kimi', 'gemini'],
  kimi: ['deepseek', 'minimax', 'glm', 'gemini'],
  minimax: ['deepseek', 'kimi', 'glm', 'gemini'],
  glm: ['deepseek', 'minimax', 'kimi', 'gemini'],
  gemini: ['deepseek', 'minimax', 'kimi', 'glm'],
};

export type ConsensusStatus = 'CONSENSUS_REACHED' | 'NO_CONSENSUS' | 'INSUFFICIENT_RESPONSES';

export interface IndividualVote {
  model_name: string;
  signal: Signal | null;
  response_time_ms: number;
  confidence: number;
  status: 'success' | 'timeout' | 'error';
  error?: string;
}

export interface ConsensusResponse {
  consensus_status: ConsensusStatus;
  consensus_signal: Signal | null;
  individual_votes: IndividualVote[];
  vote_counts: {
    BUY: number;
    SELL: number;
    HOLD: number;
  };
  timestamp: string;
}

/**
 * Calculate consensus from multiple analyst results
 * Requires 4/5 agreement for a strong signal
 */
export function calculateConsensus(results: AnalystResult[]): {
  signal: Signal | null;
  consensusLevel: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | null;
} {
  const validResults = results.filter((r) => !r.error);

  if (validResults.length < 3) {
    return { signal: null, consensusLevel: 0, recommendation: null };
  }

  const signalCounts = { buy: 0, sell: 0, hold: 0 };
  const confidenceSum = { buy: 0, sell: 0, hold: 0 };

  for (const result of validResults) {
    const signal = sentimentToSignal(result.sentiment);
    signalCounts[signal]++;
    confidenceSum[signal] += result.confidence;
  }

  // Find the majority signal
  const totalValid = validResults.length;
  let majoritySignal: Signal = 'hold';
  let maxCount = 0;

  for (const [signal, count] of Object.entries(signalCounts)) {
    if (count > maxCount) {
      maxCount = count;
      majoritySignal = signal as Signal;
    }
  }

  // Consensus level = (agreeing models / total) * avg confidence of agreeing
  const avgConfidence = maxCount > 0 ? confidenceSum[majoritySignal] / maxCount : 0;
  const agreementRatio = maxCount / totalValid;
  const consensusLevel = Math.round(agreementRatio * avgConfidence);

  // Need 4/5 (80%) agreement for a strong recommendation
  const threshold = 0.8;
  let recommendation: 'BUY' | 'SELL' | 'HOLD' | null = null;

  if (agreementRatio >= threshold) {
    recommendation = majoritySignal.toUpperCase() as 'BUY' | 'SELL' | 'HOLD';
  }

  return { signal: majoritySignal, consensusLevel, recommendation };
}

/**
 * Calculate 4/5 consensus with detailed response structure
 * Implements strict 4-out-of-5 agreement threshold
 */
export function calculateConsensusDetailed(
  results: AnalystResult[],
  responseTimes: Map<string, number>
): ConsensusResponse {
  const timestamp = new Date().toISOString();

  // Build individual votes array
  const individual_votes: IndividualVote[] = results.map((result) => {
    const signal = result.error ? null : sentimentToSignal(result.sentiment);
    let status: 'success' | 'timeout' | 'error' = 'success';

    if (result.error) {
      // Determine if it was a timeout or other error
      if (result.error.toLowerCase().includes('timeout') ||
          result.error.toLowerCase().includes('aborted')) {
        status = 'timeout';
      } else {
        status = 'error';
      }
    }

    return {
      model_name: result.id,
      signal,
      response_time_ms: responseTimes.get(result.id) || 0,
      confidence: result.confidence,
      status,
      error: result.error,
    };
  });

  // Count valid votes (exclude timeouts and errors)
  const validVotes = individual_votes.filter((v) => v.status === 'success');

  // Check for insufficient responses (less than 3 valid responses)
  if (validVotes.length < 3) {
    return {
      consensus_status: 'INSUFFICIENT_RESPONSES',
      consensus_signal: null,
      individual_votes,
      vote_counts: {
        BUY: 0,
        SELL: 0,
        HOLD: 0,
      },
      timestamp,
    };
  }

  // Count votes for each signal
  const vote_counts = {
    BUY: validVotes.filter((v) => v.signal === 'buy').length,
    SELL: validVotes.filter((v) => v.signal === 'sell').length,
    HOLD: validVotes.filter((v) => v.signal === 'hold').length,
  };

  // Determine consensus: need at least 4 votes for the same signal
  const CONSENSUS_THRESHOLD = 4;
  let consensus_signal: Signal | null = null;
  let consensus_status: ConsensusStatus = 'NO_CONSENSUS';

  if (vote_counts.BUY >= CONSENSUS_THRESHOLD) {
    consensus_signal = 'buy';
    consensus_status = 'CONSENSUS_REACHED';
  } else if (vote_counts.SELL >= CONSENSUS_THRESHOLD) {
    consensus_signal = 'sell';
    consensus_status = 'CONSENSUS_REACHED';
  } else if (vote_counts.HOLD >= CONSENSUS_THRESHOLD) {
    consensus_signal = 'hold';
    consensus_status = 'CONSENSUS_REACHED';
  }

  return {
    consensus_status,
    consensus_signal,
    individual_votes,
    vote_counts,
    timestamp,
  };
}

function sentimentToSignal(sentiment: 'bullish' | 'bearish' | 'neutral'): Signal {
  switch (sentiment) {
    case 'bullish':
      return 'buy';
    case 'bearish':
      return 'sell';
    case 'neutral':
      return 'hold';
  }
}
