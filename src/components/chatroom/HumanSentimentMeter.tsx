'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HumanChatMessage } from '@/lib/human-chat/types';

interface HumanSentimentMeterProps {
  messages: HumanChatMessage[];
  className?: string;
}

interface SentimentScore {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
}

// Simple keyword-based sentiment analysis
const BULLISH_KEYWORDS = [
  'buy', 'moon', 'pump', 'bullish', 'long', 'up', 'rise', 'rally',
  'gain', 'profit', 'win', 'strong', ' breakout', 'rocket', 'diamond',
  'hands', 'hodl', 'accumulate', 'support', 'resistance', 'bull',
  'higher', 'growth', 'surge', 'soar', 'climb', 'bounce', 'recover',
  'bullrun', 'ath', 'all-time high', 'dip', 'buying opportunity'
];

const BEARISH_KEYWORDS = [
  'sell', 'dump', 'bearish', 'short', 'down', 'fall', 'drop', 'crash',
  'loss', 'bad', 'weak', 'breakdown', 'bear', 'lower', 'decline',
  'plunge', 'collapse', 'panic', 'fear', 'capitulation', 'resistance',
  'rejection', 'overbought', 'correction', 'retrace', 'bear market',
  'death cross', 'bubble', 'ponzi', 'scam', 'trap', 'shorting'
];

export default function HumanSentimentMeter({ messages, className = '' }: HumanSentimentMeterProps) {
  const [sentiment, setSentiment] = useState<SentimentScore>({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    total: 0
  });
  const [sentimentValue, setSentimentValue] = useState(0); // -100 (bearish) to +100 (bullish)
  const [messageCount, setMessageCount] = useState(0);

  // Analyze sentiment of a single message
  const analyzeMessage = useCallback((message: string): { bullish: number; bearish: number; neutral: number } => {
    const lowerMessage = message.toLowerCase();
    
    let bullishCount = 0;
    let bearishCount = 0;

    // Count bullish keywords
    for (const keyword of BULLISH_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        bullishCount++;
      }
    }

    // Count bearish keywords
    for (const keyword of BEARISH_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        bearishCount++;
      }
    }

    // Determine sentiment based on keyword counts
    if (bullishCount > bearishCount) {
      return { bullish: 1, bearish: 0, neutral: 0 };
    } else if (bearishCount > bullishCount) {
      return { bullish: 0, bearish: 1, neutral: 0 };
    } else {
      return { bullish: 0, bearish: 0, neutral: 1 };
    }
  }, []);

  // Calculate aggregate sentiment from all messages
  useEffect(() => {
    if (messages.length === 0) {
      setSentiment({ bullish: 0, bearish: 0, neutral: 0, total: 0 });
      setSentimentValue(0);
      setMessageCount(0);
      return;
    }

    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;

    for (const msg of messages) {
      const result = analyzeMessage(msg.content);
      bullishCount += result.bullish;
      bearishCount += result.bearish;
      neutralCount += result.neutral;
    }

    const total = bullishCount + bearishCount + neutralCount;
    const newSentiment = {
      bullish: bullishCount,
      bearish: bearishCount,
      neutral: neutralCount,
      total
    };

    setSentiment(newSentiment);
    setMessageCount(messages.length);

    // Calculate sentiment value: -100 (fully bearish) to +100 (fully bullish)
    // Only count non-neutral messages in the calculation
    const nonNeutralTotal = bullishCount + bearishCount;
    if (nonNeutralTotal === 0) {
      setSentimentValue(0); // Neutral if no bullish/bearish messages
    } else {
      const bullishRatio = bullishCount / nonNeutralTotal;
      const bearishRatio = bearishCount / nonNeutralTotal;
      const value = Math.round((bullishRatio - bearishRatio) * 100);
      setSentimentValue(value);
    }
  }, [messages, analyzeMessage]);

  // Get color based on sentiment value
  const getSentimentColor = () => {
    if (sentimentValue > 20) return 'from-bullish to-bullish-light';
    if (sentimentValue < -20) return 'from-bearish to-bearish-light';
    return 'from-neutral to-neutral-light';
  };

  // Get sentiment label
  const getSentimentLabel = () => {
    if (messageCount === 0) return 'No Messages';
    if (sentimentValue > 50) return 'Very Bullish';
    if (sentimentValue > 20) return 'Bullish';
    if (sentimentValue < -50) return 'Very Bearish';
    if (sentimentValue < -20) return 'Bearish';
    return 'Neutral';
  };

  // Get emoji based on sentiment
  const getSentimentEmoji = () => {
    if (sentimentValue > 50) return '🚀';
    if (sentimentValue > 20) return '📈';
    if (sentimentValue < -50) return '🔻';
    if (sentimentValue < -20) return '📉';
    return '⚖️';
  };

  return (
    <div 
      className={`bg-card rounded-xl p-4 border border-border ${className}`}
      role="region"
      aria-label="Human Sentiment Meter"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{getSentimentEmoji()}</span>
          <div>
            <h3 className="font-bold text-sm">Human Sentiment</h3>
            <p className="text-xs text-muted-foreground">Display-only • Not fed to AI</p>
          </div>
        </div>
        <div className="text-right">
          <div 
            className="text-2xl font-bold tabular-nums" 
            aria-live="polite"
            aria-label={`Sentiment score: ${sentimentValue > 0 ? '+' : ''}${sentimentValue}`}
          >
            {sentimentValue > 0 ? '+' : ''}{sentimentValue}%
          </div>
          <div 
            className="text-xs text-muted-foreground" 
            aria-live="polite"
          >
            {getSentimentLabel()}
          </div>
        </div>
      </div>

      {/* Sentiment Meter Bar */}
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-3">
        {/* Center neutral zone */}
        <div 
          className="absolute top-0 bottom-0 bg-neutral/30 left-1/2 -translate-x-1/2 w-[20%]"
          aria-hidden="true"
        />

        {/* Bullish side (right) */}
        <div className="absolute top-0 bottom-0 left-1/2 right-0">
          <motion.div
            className={`h-full bg-gradient-to-l ${getSentimentColor()} origin-left`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: sentimentValue > 0 ? sentimentValue / 100 : 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </div>

        {/* Bearish side (left) */}
        <div className="absolute top-0 bottom-0 left-0 right-1/2">
          <motion.div
            className={`h-full bg-gradient-to-r ${getSentimentColor()} origin-right`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: sentimentValue < 0 ? Math.abs(sentimentValue) / 100 : 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'right' }}
          />
        </div>

        {/* Center marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-border"
          style={{ left: '50%' }}
          aria-hidden="true"
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3 px-1">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-secondary rounded p-2">
          <div className="text-lg font-bold text-bullish tabular-nums" aria-label={`${sentiment.bullish} bullish messages`}>
            {sentiment.bullish}
          </div>
          <div className="text-[10px] text-muted-foreground">Bullish</div>
        </div>
        <div className="bg-secondary rounded p-2">
          <div className="text-lg font-bold text-bearish tabular-nums" aria-label={`${sentiment.bearish} bearish messages`}>
            {sentiment.bearish}
          </div>
          <div className="text-[10px] text-muted-foreground">Bearish</div>
        </div>
        <div className="bg-secondary rounded p-2">
          <div className="text-lg font-bold text-neutral tabular-nums" aria-label={`${sentiment.neutral} neutral messages`}>
            {sentiment.neutral}
          </div>
          <div className="text-[10px] text-muted-foreground">Neutral</div>
        </div>
        <div className="bg-secondary rounded p-2">
          <div className="text-lg font-bold tabular-nums" aria-label={`${messageCount} total messages`}>
            {messageCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Simple keyword analysis • Does not affect AI consensus
      </p>
    </div>
  );
}
