import { ChatMessage, MessageSentiment } from './types';

interface ConsensusResult {
  direction: MessageSentiment | null;
  strength: number; // 0-100
}

/**
 * Calculate rolling consensus from the last N debate-phase messages that have sentiment.
 * Weight recent messages higher (exponential decay).
 * Scale by confidence.
 */
export function calculateRollingConsensus(
  messages: ChatMessage[],
  windowSize: number = 15
): ConsensusResult {
  // Filter to debate-phase messages with sentiment
  const debateMessages = messages
    .filter(m => m.phase === 'DEBATE' && m.sentiment && m.confidence)
    .slice(-windowSize);

  if (debateMessages.length < 3) {
    return { direction: null, strength: 0 };
  }

  // Exponential decay: most recent message gets weight 1.0, each older message decays by 0.85
  const DECAY = 0.85;

  let bullishScore = 0;
  let bearishScore = 0;
  let neutralScore = 0;
  let totalWeight = 0;

  for (let i = 0; i < debateMessages.length; i++) {
    const msg = debateMessages[i];
    const age = debateMessages.length - 1 - i; // 0 for most recent
    const timeWeight = Math.pow(DECAY, age);
    const confidenceWeight = (msg.confidence || 50) / 100;
    const weight = timeWeight * confidenceWeight;

    totalWeight += weight;

    switch (msg.sentiment) {
      case 'bullish':
        bullishScore += weight;
        break;
      case 'bearish':
        bearishScore += weight;
        break;
      case 'neutral':
        neutralScore += weight;
        break;
    }
  }

  if (totalWeight === 0) {
    return { direction: null, strength: 0 };
  }

  // Find dominant direction
  const scores = {
    bullish: bullishScore / totalWeight,
    bearish: bearishScore / totalWeight,
    neutral: neutralScore / totalWeight,
  };

  let direction: MessageSentiment = 'neutral';
  let maxScore = 0;

  for (const [sentiment, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      direction = sentiment as MessageSentiment;
    }
  }

  // Strength = how dominant the leading sentiment is (0-100)
  // 100% agreement at max confidence = 100
  // Scale: dominance ratio * 100
  const strength = Math.round(maxScore * 100);

  return { direction, strength };
}
