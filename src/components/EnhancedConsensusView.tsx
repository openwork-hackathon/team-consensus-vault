'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, TrendingDown, Minus, Users, Brain } from 'lucide-react';

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
      const params = new URLSearchParams({
        asset,
        ...(context && { context }),
      });

      const response = await fetch(`/api/consensus-enhanced?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced Consensus Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Combining 17-persona chatroom debate with 5-agent trading council analysis
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset">Asset Symbol</Label>
              <Input
                id="asset"
                value={asset}
                onChange={(e) => setAsset(e.target.value.toUpperCase())}
                placeholder="BTC"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="context">Additional Context (optional)</Label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., Recent halving event"
              />
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Enhanced Analysis'
            )}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Alignment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Alignment</span>
                <Badge
                  variant={
                    result.alignment.agreement === 'strong'
                      ? 'default'
                      : result.alignment.agreement === 'moderate'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {result.alignment.score}% Alignment
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {result.alignment.commentary}
              </p>
              {result.chatroom && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {result.chatroom.summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-column layout for Council and Chatroom */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trading Council Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Trading Council (5 Analysts)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Council Signal */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {result.council.signal === 'buy' && (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                    {result.council.signal === 'sell' && (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                    {result.council.signal === 'hold' && (
                      <Minus className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-semibold">{result.council.recommendation}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.council.consensusLevel}% consensus
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analyst Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Analyst Votes:</h4>
                  {result.council.analysts.map((analyst) => (
                    <div
                      key={analyst.id}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{analyst.name}</p>
                        <Badge
                          variant={
                            analyst.sentiment === 'bullish'
                              ? 'default'
                              : analyst.sentiment === 'bearish'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {analyst.sentiment} ({analyst.confidence}%)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analyst.reasoning}
                      </p>
                      {analyst.error && (
                        <p className="text-xs text-destructive">{analyst.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chatroom Consensus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Chatroom Debate (17 Personas)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.chatroom ? (
                  <>
                    {/* Chatroom Consensus */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        {result.chatroom.direction === 'bullish' && (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        )}
                        {result.chatroom.direction === 'bearish' && (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                        {result.chatroom.direction === 'neutral' && (
                          <Minus className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {result.chatroom.direction?.toUpperCase() || 'NEUTRAL'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.chatroom.strength}% strength
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          result.chatroom.isSignificant ? 'default' : 'secondary'
                        }
                      >
                        {result.chatroom.isSignificant
                          ? 'Significant'
                          : 'Low confidence'}
                      </Badge>
                    </div>

                    {/* Chatroom Details */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Debate Status:</h4>
                      <div className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Phase:</span>
                          <span className="font-medium">
                            {result.chatroom.phase}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Messages:</span>
                          <span className="font-medium">
                            {result.chatroom.messageCount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Consensus Strength:
                          </span>
                          <span className="font-medium">
                            {result.chatroom.strength}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                        {result.chatroom.summary}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Chatroom consensus not available. The debate may still be in
                      early stages or in cooldown.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Metadata Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Asset</p>
                  <p className="font-mono font-semibold">{result.metadata.asset}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-mono">
                    {new Date(result.metadata.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Chatroom Status</p>
                  <p className="font-medium">
                    {result.metadata.chatroomAvailable ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Context Used</p>
                  <p className="font-medium">
                    {result.metadata.contextUsed ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
