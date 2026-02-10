'use client';

import { useState } from 'react';

interface AnalystResult {
  id: string;
  name: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  error?: string;
}

interface CouncilResult {
  signal: 'buy' | 'sell' | 'hold';
  recommendation: string;
  consensusLevel: number;
  analysts: AnalystResult[];
  partialFailures: any | null;
}

interface ChatroomResult {
  direction: 'bullish' | 'bearish' | 'neutral' | null;
  strength: number;
  phase: string;
  messageCount: number;
  summary: string;
  isSignificant: boolean;
}

interface AlignmentResult {
  score: number;
  commentary: string;
  agreement: 'strong' | 'moderate' | 'weak' | 'disagreement';
}

interface EnhancedConsensusResponse {
  council: CouncilResult;
  chatroom: ChatroomResult | null;
  alignment: AlignmentResult;
  metadata: {
    asset: string;
    timestamp: number;
    chatroomAvailable: boolean;
    contextUsed: boolean;
  };
}

export default function EnhancedConsensusView() {
  const [asset, setAsset] = useState('BTC');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhancedConsensusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ asset });
      if (context) params.append('context', context);

      const abortController = new AbortController();
      const response = await fetch(`/api/consensus-enhanced?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      // Ignore abort errors (component unmounted or request cancelled)
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return '○';
    if (sentiment === 'bullish' || sentiment === 'buy') return '↑';
    if (sentiment === 'bearish' || sentiment === 'sell') return '↓';
    return '—';
  };

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'text-gray-500';
    if (sentiment === 'bullish' || sentiment === 'buy') return 'text-green-600';
    if (sentiment === 'bearish' || sentiment === 'sell') return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          🧠 Enhanced Consensus Analysis
        </h1>
        <p className="text-gray-600 text-sm">
          Combining multi-persona chatroom debate with 5-agent trading council analysis
        </p>

        {/* Input Form */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="asset" className="block text-sm font-medium text-gray-700 mb-2">
              Asset Symbol
            </label>
            <input
              id="asset"
              type="text"
              value={asset}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsset(e.target.value.toUpperCase())}
              placeholder="BTC"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            />
          </div>
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (optional)
            </label>
            <input
              id="context"
              type="text"
              value={context}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContext(e.target.value)}
              placeholder="e.g., Recent halving event"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
        >
          {loading ? '⏳ Analyzing...' : '▶ Run Enhanced Analysis'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}
      </div>

      {result && (
        <>
          {/* Alignment Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">System Alignment</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.alignment.agreement === 'strong'
                    ? 'bg-green-100 text-green-800'
                    : result.alignment.agreement === 'moderate'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.alignment.score}% Alignment
              </span>
            </div>
            <p className="text-gray-700">{result.alignment.commentary}</p>
            {result.chatroom && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{result.chatroom.summary}</p>
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trading Council */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🧠 Trading Council (5 Analysts)
              </h2>

              {/* Council Signal */}
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-3xl ${getSentimentColor(result.council.signal)}`}
                  >
                    {getSentimentIcon(result.council.signal)}
                  </span>
                  <div>
                    <p className="font-bold text-lg">{result.council.recommendation}</p>
                    <p className="text-sm text-gray-600">
                      {result.council.consensusLevel}% consensus
                    </p>
                  </div>
                </div>
              </div>

              {/* Analyst Breakdown */}
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Analyst Votes:</h3>
              <div className="space-y-3">
                {result.council.analysts.map((analyst) => (
                  <div key={analyst.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{analyst.name}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          analyst.sentiment === 'bullish'
                            ? 'bg-green-100 text-green-800'
                            : analyst.sentiment === 'bearish'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {analyst.sentiment} ({analyst.confidence}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{analyst.reasoning}</p>
                    {analyst.error && (
                      <p className="text-xs text-red-600 mt-1">⚠️ {analyst.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chatroom Consensus */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                👥 Chatroom Debate
              </h2>

              {result.chatroom ? (
                <>
                  {/* Chatroom Signal */}
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-3xl ${getSentimentColor(result.chatroom.direction || undefined)}`}
                      >
                        {getSentimentIcon(result.chatroom.direction || undefined)}
                      </span>
                      <div>
                        <p className="font-bold text-lg">
                          {result.chatroom.direction?.toUpperCase() || 'NEUTRAL'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.chatroom.strength}% strength
                        </p>
                      </div>
                    </div>
                    <span
                      className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                        result.chatroom.isSignificant
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result.chatroom.isSignificant ? 'Significant' : 'Low confidence'}
                    </span>
                  </div>

                  {/* Chatroom Details */}
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Debate Status:</h3>
                  <div className="p-3 border border-gray-200 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phase:</span>
                      <span className="font-medium">{result.chatroom.phase}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Messages:</span>
                      <span className="font-medium">{result.chatroom.messageCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Consensus Strength:</span>
                      <span className="font-medium">{result.chatroom.strength}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg mt-3">
                    {result.chatroom.summary}
                  </p>
                </>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    ⚠️ Chatroom consensus not available. The debate may still be in early
                    stages or in cooldown.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Asset</p>
                <p className="font-mono font-semibold">{result.metadata.asset}</p>
              </div>
              <div>
                <p className="text-gray-600">Timestamp</p>
                <p className="font-mono">
                  {new Date(result.metadata.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Chatroom Status</p>
                <p className="font-medium">
                  {result.metadata.chatroomAvailable ? '✅ Active' : '⭕ Inactive'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Context Used</p>
                <p className="font-medium">
                  {result.metadata.contextUsed ? '✅ Yes' : '⭕ No'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
