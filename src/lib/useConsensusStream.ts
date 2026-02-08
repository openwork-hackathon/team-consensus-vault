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
  const [sseError, setSSEError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progressUpdates, setProgressUpdates] = useState<Map<string, string>>(new Map());
  const maxRetries = 3;

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

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(apiEndpoint);
        setSSEError(null);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setRetryCount(0); // Reset retry count on successful message

            // Handle different event types
            if (data.type === 'progress') {
              // Update progress for slow models
              setProgressUpdates(prev => {
                const next = new Map(prev);
                next.set(data.modelId, data.message);
                return next;
              });
              return;
            }

            if (data.type === 'partial_failure') {
              // Show partial failure warning
              setSSEError(`Warning: ${data.message}`);
              return;
            }

            if (data.type === 'consensus' || data.type === 'complete') {
              // Handle consensus/completion events
              if (data.partialFailures) {
                setConsensusData(prev => ({
                  ...prev,
                  partialFailures: data.partialFailures,
                }));
              }
              return;
            }

            // Handle analyst result
            setConsensusData(prev => {
              const updatedAnalysts = prev.analysts.map(analyst =>
                analyst.id === data.id
                  ? {
                      ...analyst,
                      sentiment: data.sentiment || analyst.sentiment,
                      confidence: data.confidence || analyst.confidence,
                      reasoning: data.reasoning || analyst.reasoning,
                      isTyping: false,
                      error: data.error,
                      userFacingError: data.userFacingError,
                      progress: data.progress,
                    }
                  : analyst
              );

              const consensusLevel = calculateConsensus(updatedAnalysts);
              const recommendation = getRecommendation(updatedAnalysts, consensusLevel, prev.threshold);

              // Clear progress for this model
              setProgressUpdates(prev => {
                const next = new Map(prev);
                next.delete(data.id);
                return next;
              });

              return {
                ...prev,
                analysts: updatedAnalysts,
                consensusLevel,
                recommendation,
              };
            });
          } catch (error) {
            console.error('Failed to parse SSE data:', error);
            setSSEError('Failed to parse server data');
          }
        };

        eventSource.onerror = () => {
          console.error('SSE connection error');
          eventSource?.close();

          if (retryCount < maxRetries) {
            setSSEError(`Connection lost. Retrying... (${retryCount + 1}/${maxRetries})`);
            setRetryCount(prev => prev + 1);

            // Exponential backoff: 2s, 4s, 8s
            const delay = Math.min(2000 * Math.pow(2, retryCount), 8000);
            reconnectTimeout = setTimeout(connectSSE, delay);
          } else {
            setSSEError('Connection failed. Using simulated data.');
            setUseSSE(false);
          }
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        setSSEError('Failed to connect to server');
        setUseSSE(false);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [apiEndpoint, useSSE, retryCount, calculateConsensus, getRecommendation]);

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

  return { ...consensusData, sseError, progressUpdates };
}
