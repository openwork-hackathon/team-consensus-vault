"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ConsensusResult, AnalystResponse, Signal } from "@/lib/models";

// Mock vault data
const mockVault = {
  id: "1",
  name: "Consensus Vault",
  description: "Multi-model AI consensus for trading decisions. 5 analysts, 4/5 required for signal.",
  tokenSymbol: "CONSENSUS",
  tvl: "2,873,453",
  signalCount: 0,
};

// Initial agent status (before any query)
const initialAgents = [
  { id: "deepseek", name: "DeepSeek", role: "Momentum Hunter", status: "idle" as const },
  { id: "kimi", name: "Kimi", role: "Whale Watcher", status: "idle" as const },
  { id: "minimax", name: "MiniMax", role: "Sentiment Scout", status: "idle" as const },
  { id: "glm", name: "GLM", role: "On-Chain Oracle", status: "idle" as const },
  { id: "gemini", name: "Gemini", role: "Risk Manager", status: "idle" as const },
];

function getSignalColor(signal: Signal | undefined): string {
  switch (signal) {
    case "BUY": return "bg-green-500";
    case "SELL": return "bg-red-500";
    case "HOLD": return "bg-yellow-500";
    default: return "bg-zinc-400";
  }
}

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

function getSignalBadge(signal: Signal | undefined): BadgeVariant {
  switch (signal) {
    case "BUY": return "default";
    case "SELL": return "destructive";
    case "HOLD": return "secondary";
    default: return "outline";
  }
}

export default function VaultConsensusView({ params }: { params: Promise<{ id: string }> }) {
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [result, setResult] = useState<ConsensusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data: ConsensusResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsQuerying(false);
    }
  };

  // Merge initial agents with result signals
  const agents = initialAgents.map(agent => {
    const signal = result?.signals.find(s => s.agentId === agent.id);
    return {
      ...agent,
      status: isQuerying ? "querying" as const : signal ? "completed" as const : "idle" as const,
      signal: signal,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-black">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/vault" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ← Back to Vaults
          </Link>
          <div className="flex-1" />
          <Badge variant="secondary" className="text-base">
            {mockVault.tokenSymbol}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Vault Info */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-4xl font-bold">{mockVault.name}</h1>
          </div>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">{mockVault.description}</p>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">TVL: </span>
              <span className="font-semibold">{mockVault.tvl} $OPENWORK</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Signals: </span>
              <span className="font-semibold">{result ? result.totalResponses : 0}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Query Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Query the Analysts</CardTitle>
                <CardDescription>
                  Ask about a trade and get consensus from 5 AI analysts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Should I buy ETH here? Is this a good entry for BTC? What&apos;s the risk/reward on this trade?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                  disabled={isQuerying}
                />
                <Button
                  onClick={handleQuery}
                  disabled={!query.trim() || isQuerying}
                  className="w-full"
                >
                  {isQuerying ? "Querying 5 Analysts..." : "Get Consensus"}
                </Button>

                {/* Error Display */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consensus Result */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Consensus Result
                    {result.hasConsensus ? (
                      <Badge variant={getSignalBadge(result.consensus ?? undefined)} className="text-lg px-3 py-1">
                        {result.consensus}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        No Consensus
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {result.consensusCount}/{result.totalResponses} analysts agree
                    {" • "}
                    Average confidence: {result.confidenceAverage}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.signals.map((signal) => (
                      <div
                        key={signal.agentId}
                        className={`rounded-lg border p-4 ${
                          signal.error ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getSignalColor(signal.signal)}`} />
                            <span className="font-semibold">{signal.agentName}</span>
                            <span className="text-sm text-zinc-500">({signal.role})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSignalBadge(signal.signal)}>
                              {signal.signal}
                            </Badge>
                            <span className="text-sm font-medium">{signal.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {signal.reasoning}
                        </p>
                        {signal.error && (
                          <p className="text-xs text-red-500 mt-1">Error: {signal.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Agent Status Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>AI Analysts</CardTitle>
                <CardDescription>
                  {agents.filter(a => a.status === "completed").length}/{agents.length} responded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                        agent.status === "querying" ? "animate-pulse bg-zinc-100 dark:bg-zinc-800" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {agent.role}
                        </p>
                      </div>
                      {agent.status === "querying" && (
                        <Badge variant="outline">Analyzing...</Badge>
                      )}
                      {agent.status === "completed" && agent.signal && (
                        <Badge variant={getSignalBadge(agent.signal.signal)}>
                          {agent.signal.signal}
                        </Badge>
                      )}
                      {agent.status === "idle" && (
                        <Badge variant="outline">Ready</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Consensus Gauge */}
                {result && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Consensus Level</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-4 flex-1 rounded ${
                            n <= result.consensusCount
                              ? result.hasConsensus
                                ? "bg-green-500"
                                : "bg-yellow-500"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 text-center">
                      {result.hasConsensus
                        ? `✓ Consensus reached (${result.consensusCount}/5)`
                        : `✗ Need ${4 - result.consensusCount} more (${result.consensusCount}/5)`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
