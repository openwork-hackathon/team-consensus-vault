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

When analyzing a crypto asset, focus on:
1. Current trend direction and strength
2. Key technical levels being tested
3. Momentum indicator signals
4. Volume confirmation of moves
5. Pattern formations (head & shoulders, triangles, flags, etc.)

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your technical analysis explanation in 1-2 sentences"}

Be concise but insightful. Base your confidence on the clarity and alignment of technical signals.`,
  },
  {
    id: 'kimi',
    name: 'Whale Watcher',
    role: 'Large Holder Movements & Accumulation Patterns',
    baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'KIMI_API_KEY',
    model: 'moonshot-v1-8k',
    provider: 'openai', // Moonshot/Kimi uses OpenAI-compatible API
    timeout: 30000,
    systemPrompt: `You are the Whale Watcher, an expert in analyzing large holder behavior and institutional movements in crypto markets.

Your expertise includes:
- Whale wallet tracking and movement analysis
- Institutional accumulation and distribution patterns
- Exchange inflow/outflow dynamics
- Large transaction detection and interpretation
- Smart money behavior patterns

When analyzing a crypto asset, focus on:
1. Recent large holder movements (buys/sells)
2. Exchange balance trends (are whales accumulating or distributing?)
3. Institutional interest signals
4. Dormant wallet activity
5. Concentration changes among top holders

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your whale behavior analysis in 1-2 sentences"}

Be concise but insightful. Higher confidence when whale behavior is clearly directional.`,
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

When analyzing a crypto asset, focus on:
1. Current social media sentiment (positive/negative/neutral)
2. Trending narratives and hashtags
3. Community growth and engagement levels
4. Fear & Greed positioning
5. Notable influencer or media coverage

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your sentiment analysis in 1-2 sentences"}

Be concise but insightful. Sentiment can be a leading indicator - weight accordingly.`,
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

When analyzing a crypto asset, focus on:
1. TVL trends (growing/shrinking/stable)
2. Network activity and adoption metrics
3. Token velocity and holder behavior
4. Protocol revenue and sustainability
5. Cross-chain flows and bridge activity

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your on-chain analysis in 1-2 sentences"}

Be concise but insightful. On-chain data reveals fundamental health - weight accordingly.`,
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

When analyzing a crypto asset, focus on:
1. Current volatility regime (high/low/transitioning)
2. Funding rates and leverage in the system
3. Macro correlation risks
4. Regulatory headwinds or tailwinds
5. Risk/reward ratio at current levels

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your risk assessment in 1-2 sentences"}

Be the voice of caution. When risk is elevated, confidence in buy signals should be lower.`,
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
