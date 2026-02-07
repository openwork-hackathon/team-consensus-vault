'use client';

import { useState, useEffect, useCallback } from 'react';
import { Analyst, ConsensusData } from './types';

// Mock analyst data - will be replaced with actual SSE endpoint
const MOCK_ANALYSTS: Analyst[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek Quant',
    color: '#3B82F6',
    borderColor: '#60A5FA',
    bgColor: '#1E3A8A',
    avatar: '📊',
    sentiment: 'neutral',
    confidence: 0,
    reasoning: '',
    isTyping: true,
  },
  {
    id: 'kimi',
    name: 'Kimi Macro',
    color: '#8B5CF6',
    borderColor: '#A78BFA',
    bgColor: '#5B21B6',
    avatar: '🌍',
    sentiment: 'neutral',
    confidence: 0,
    reasoning: '',
    isTyping: true,
  },
  {
    id: 'minimax',
    name: 'MiniMax Sentiment',
    color: '#EC4899',
    borderColor: '#F472B6',
    bgColor: '#9F1239',
    avatar: '💭',
    sentiment: 'neutral',
    confidence: 0,
    reasoning: '',
    isTyping: true,
  },
  {
    id: 'glm',
    name: 'GLM Technical',
    color: '#10B981',
    borderColor: '#34D399',
    bgColor: '#065F46',
    avatar: '📈',
    sentiment: 'neutral',
    confidence: 0,
    reasoning: '',
    isTyping: true,
  },
  {
    id: 'gemini',
    name: 'Gemini Risk',
    color: '#F59E0B',
    borderColor: '#FBBF24',
    bgColor: '#92400E',
    avatar: '⚖️',
    sentiment: 'neutral',
    confidence: 0,
    reasoning: '',
    isTyping: true,
  },
];

export function useConsensusStream(apiEndpoint: string = '/api/consensus') {
  const [consensusData, setConsensusData] = useState<ConsensusData>({
    consensusLevel: 0,
    recommendation: null,
    threshold: 80,
    analysts: MOCK_ANALYSTS,
  });
  const [useSSE, setUseSSE] = useState(false);

  const calculateConsensus = useCallback((analysts: Analyst[]) => {
    const completedAnalysts = analysts.filter(a => !a.isTyping);
    if (completedAnalysts.length === 0) return 0;

    // Calculate agreement based on sentiment alignment
    const sentiments = completedAnalysts.map(a => a.sentiment);
    const counts = {
      bullish: sentiments.filter(s => s === 'bullish').length,
      bearish: sentiments.filter(s => s === 'bearish').length,
      neutral: sentiments.filter(s => s === 'neutral').length,
    };

    const maxCount = Math.max(counts.bullish, counts.bearish, counts.neutral);
    const agreementRatio = maxCount / completedAnalysts.length;
    
    // Weight by average confidence
    const avgConfidence = completedAnalysts.reduce((sum, a) => sum + a.confidence, 0) / completedAnalysts.length;
    
    return Math.round(agreementRatio * avgConfidence);
  }, []);

  const getRecommendation = useCallback((analysts: Analyst[], consensusLevel: number, threshold: number) => {
    if (consensusLevel < threshold) return null;

    const completedAnalysts = analysts.filter(a => !a.isTyping);
    const sentiments = completedAnalysts.map(a => a.sentiment);
    const counts = {
      bullish: sentiments.filter(s => s === 'bullish').length,
      bearish: sentiments.filter(s => s === 'bearish').length,
      neutral: sentiments.filter(s => s === 'neutral').length,
    };

    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) return 'BUY';
    if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) return 'SELL';
    return 'HOLD';
  }, []);

  // SSE Connection Effect
  useEffect(() => {
    if (!useSSE) return;

    const eventSource = new EventSource(apiEndpoint);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        setConsensusData(prev => {
          const updatedAnalysts = prev.analysts.map(analyst =>
            analyst.id === data.id
              ? {
                  ...analyst,
                  sentiment: data.sentiment,
                  confidence: data.confidence,
                  reasoning: data.reasoning,
                  isTyping: false,
                }
              : analyst
          );

          const consensusLevel = calculateConsensus(updatedAnalysts);
          const recommendation = getRecommendation(updatedAnalysts, consensusLevel, prev.threshold);

          return {
            ...prev,
            analysts: updatedAnalysts,
            consensusLevel,
            recommendation,
          };
        });
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error, falling back to mock data');
      eventSource.close();
      setUseSSE(false);
    };

    return () => eventSource.close();
  }, [apiEndpoint, useSSE, calculateConsensus, getRecommendation]);

  // Mock Streaming Effect (fallback when SSE is not available)
  useEffect(() => {
    if (useSSE) return;

    const simulateStream = async () => {
      const responses = [
        {
          id: 'deepseek',
          sentiment: 'bullish' as const,
          confidence: 85,
          reasoning: 'Technical indicators show strong upward momentum. RSI cooling from overbought levels, MACD golden cross confirmed.',
          delay: 1500,
        },
        {
          id: 'kimi',
          sentiment: 'bullish' as const,
          confidence: 78,
          reasoning: 'Macro environment favorable with dovish Fed stance. Institutional accumulation detected on-chain.',
          delay: 2200,
        },
        {
          id: 'minimax',
          sentiment: 'bullish' as const,
          confidence: 82,
          reasoning: 'Social sentiment extremely positive across crypto Twitter and Reddit. Fear & Greed index entering greed zone.',
          delay: 1800,
        },
        {
          id: 'glm',
          sentiment: 'bullish' as const,
          confidence: 91,
          reasoning: 'Break above key resistance at $45k with high volume. Fibonacci extension targets $52k next.',
          delay: 2500,
        },
        {
          id: 'gemini',
          sentiment: 'neutral' as const,
          confidence: 65,
          reasoning: 'While technicals are bullish, regulatory headwinds and high funding rates suggest caution. Risk/reward ratio adequate but not exceptional.',
          delay: 3000,
        },
      ];

      for (const response of responses) {
        await new Promise(resolve => setTimeout(resolve, response.delay));

        setConsensusData(prev => {
          const updatedAnalysts = prev.analysts.map(analyst =>
            analyst.id === response.id
              ? {
                  ...analyst,
                  sentiment: response.sentiment,
                  confidence: response.confidence,
                  reasoning: response.reasoning,
                  isTyping: false,
                }
              : analyst
          );

          const consensusLevel = calculateConsensus(updatedAnalysts);
          const recommendation = getRecommendation(updatedAnalysts, consensusLevel, prev.threshold);

          return {
            ...prev,
            analysts: updatedAnalysts,
            consensusLevel,
            recommendation,
          };
        });
      }
    };

    // Start simulation after a brief delay
    const timer = setTimeout(simulateStream, 1000);
    return () => clearTimeout(timer);
  }, [useSSE, calculateConsensus, getRecommendation]);

  // Try to detect if SSE endpoint is available on mount
  useEffect(() => {
    fetch(apiEndpoint, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          setUseSSE(true);
        }
      })
      .catch(() => {
        // SSE endpoint not available, use mock data
        console.log('SSE endpoint not available, using mock data');
      });
  }, [apiEndpoint]);

  return consensusData;
}
