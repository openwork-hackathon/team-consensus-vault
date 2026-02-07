export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface Analyst {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  avatar: string;
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
  isTyping: boolean;
}

export interface ConsensusData {
  consensusLevel: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | null;
  threshold: number;
  analysts: Analyst[];
}
