/**
 * Model configuration and types for the consensus engine
 */

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface AnalystResponse {
  agentId: string;
  agentName: string;
  role: string;
  signal: Signal;
  confidence: number; // 0-100
  reasoning: string;
  timestamp: number;
  error?: string;
}

export interface ConsensusResult {
  query: string;
  timestamp: number;
  signals: AnalystResponse[];
  consensus: Signal | null;
  consensusCount: number;
  totalResponses: number;
  confidenceAverage: number;
  hasConsensus: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  role: string;
  roleDescription: string;
  provider: 'openai' | 'anthropic' | 'google';
  baseUrl: string;
  model: string;
  envKey: string;
}

// Model configurations for the 5 analyst agents
export const MODELS: ModelConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    role: 'Momentum Hunter',
    roleDescription: 'Technical analysis expert focusing on price momentum, trend signals, and chart patterns',
    provider: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    role: 'Whale Watcher',
    roleDescription: 'Tracks large holder movements, accumulation/distribution patterns, and smart money flows',
    provider: 'openai',
    baseUrl: 'https://api.kimi.com/coding/v1',
    model: 'kimi',
    envKey: 'KIMI_API_KEY',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    role: 'Sentiment Scout',
    roleDescription: 'Analyzes social sentiment, news trends, fear/greed indicators, and market psychology',
    provider: 'openai',
    baseUrl: 'https://api.minimax.io/v1',
    model: 'MiniMax-M2',
    envKey: 'MINIMAX_API_KEY',
  },
  {
    id: 'glm',
    name: 'GLM',
    role: 'On-Chain Oracle',
    roleDescription: 'Monitors on-chain metrics, TVL changes, protocol activity, and network fundamentals',
    provider: 'anthropic',
    baseUrl: 'https://api.z.ai/api/anthropic/v1',
    model: 'glm-4.6',
    envKey: 'GLM_API_KEY',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    role: 'Risk Manager',
    roleDescription: 'Assesses portfolio risk, recommends position sizing, sets stop-loss levels, and evaluates risk/reward',
    provider: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash',
    envKey: 'GEMINI_API_KEY',
  },
];

// Consensus threshold: 4 out of 5 models must agree
export const CONSENSUS_THRESHOLD = 4;
export const TIMEOUT_MS = 30000; // 30 seconds per model
