"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AnalystCard } from "@/components/AnalystCard";
import { ConsensusMeter } from "@/components/ConsensusMeter";
import { TradeSignal } from "@/components/TradeSignal";
import type { AnalystResponse, Signal } from "@/lib/models";

// Mock vault data
const mockVault = {
  id: "1",
  name: "Consensus Vault",
  description: "Multi-model AI consensus for trading decisions. 5 analysts, 4/5 required for signal.",
  tokenSymbol: "CONSENSUS",
  tvl: "2,873,453",
  signalCount: 0,
};

// Agent configurations with their roles
const AGENTS = [
  { id: "deepseek", name: "DeepSeek", role: "Momentum Hunter" },
  { id: "kimi", name: "Kimi", role: "Whale Watcher" },
  { id: "minimax", name: "MiniMax", role: "Sentiment Scout" },
  { id: "glm", name: "GLM", role: "On-Chain Oracle" },
  { id: "gemini", name: "Gemini", role: "Risk Manager" },
];

type AgentStatus = {
  status: "idle" | "querying" | "completed";
  response?: AnalystResponse;
};

export default function VaultConsensusView({ params }: { params: Promise<{ id: string }> }) {
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track individual agent states
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>(
    Object.fromEntries(AGENTS.map(a => [a.id, { status: "idle" as const }]))
  );

  // Track overall consensus
  const [consensus, setConsensus] = useState<{
    signal: Signal | null;
    consensusCount: number;
    confidenceAverage: number;
    hasConsensus: boolean;
  } | null>(null);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    setError(null);
    setConsensus(null);

    // Reset all agents to querying state
    setAgentStates(
      Object.fromEntries(AGENTS.map(a => [a.id, { status: "querying" as const }]))
    );

    try {
      // Connect to SSE endpoint
      const eventSource = new EventSource(
        `/api/consensus/stream?query=${encodeURIComponent(query)}`
      );

      eventSource.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "start") {
            console.log("Started querying analysts:", data.query);
          } else if (data.type === "analyst") {
            // Update individual analyst state
            const response: AnalystResponse = data.data;
            setAgentStates(prev => ({
              ...prev,
              [response.agentId]: {
                status: "completed",
                response,
              },
            }));
          } else if (data.type === "complete") {
            // Final consensus received
            setConsensus({
              signal: data.data.consensus,
              consensusCount: data.data.consensusCount,
              confidenceAverage: data.data.confidenceAverage,
              hasConsensus: data.data.hasConsensus,
            });
            setIsQuerying(false);
            eventSource.close();
          } else if (data.type === "error") {
            setError(data.error);
            setIsQuerying(false);
            eventSource.close();
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      });

      eventSource.addEventListener("error", (err) => {
        console.error("SSE connection error:", err);
        setError("Connection to server lost");
        setIsQuerying(false);
        eventSource.close();
      });

      // Cleanup on component unmount
      return () => {
        eventSource.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
      setIsQuerying(false);
    }
  };

  const responsesReceived = Object.values(agentStates).filter(
    s => s.status === "completed"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link
            href="/vault"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back to Vaults
          </Link>
          <div className="flex-1" />
          <Badge variant="secondary" className="text-base px-3 py-1">
            {mockVault.tokenSymbol}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Vault Info */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            {mockVault.name}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4 max-w-3xl">
            {mockVault.description}
          </p>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">TVL: </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {mockVault.tvl} $OPENWORK
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Active Analysts: </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {AGENTS.length}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Query & Trade Signal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Query Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Query the Analysts</CardTitle>
                <CardDescription className="text-base">
                  Ask about a trade and get real-time consensus from 5 AI analysts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Should I buy ETH here? Is this a good entry for BTC? What's the risk/reward on this trade?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                  disabled={isQuerying}
                  className="text-base"
                />
                <Button
                  onClick={handleQuery}
                  disabled={!query.trim() || isQuerying}
                  className="w-full text-lg py-6"
                  size="lg"
                >
                  {isQuerying ? "Querying Analysts..." : "Get Consensus"}
                </Button>

                {/* Error Display */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trade Signal - Only show when we have results */}
            {consensus && (
              <TradeSignal
                signal={consensus.signal}
                consensusCount={consensus.consensusCount}
                totalAnalysts={AGENTS.length}
                confidenceAverage={consensus.confidenceAverage}
                hasConsensus={consensus.hasConsensus}
              />
            )}

            {/* Analyst Cards Grid */}
            {responsesReceived > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Analyst Reports
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {AGENTS.map((agent, index) => (
                    <AnalystCard
                      key={agent.id}
                      agentId={agent.id}
                      agentName={agent.name}
                      role={agent.role}
                      status={agentStates[agent.id]?.status || "idle"}
                      response={agentStates[agent.id]?.response}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Status & Consensus Meter */}
          <div className="space-y-6">
            {/* Consensus Meter */}
            <Card className="shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle>Live Consensus</CardTitle>
                <CardDescription>
                  Real-time tracking of analyst responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsensusMeter
                  totalAnalysts={AGENTS.length}
                  responsesReceived={responsesReceived}
                  consensusCount={consensus?.consensusCount || 0}
                  hasConsensus={consensus?.hasConsensus || false}
                  consensus={consensus?.signal}
                  confidenceAverage={consensus?.confidenceAverage}
                  isLoading={isQuerying}
                />
              </CardContent>
            </Card>

            {/* Analyst Status List */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>AI Analysts</CardTitle>
                <CardDescription>
                  {responsesReceived}/{AGENTS.length} responded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {AGENTS.map((agent) => {
                    const state = agentStates[agent.id];
                    return (
                      <div
                        key={agent.id}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                          state?.status === "querying"
                            ? "animate-pulse bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {agent.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {agent.role}
                          </p>
                        </div>
                        {state?.status === "querying" && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                            Analyzing...
                          </Badge>
                        )}
                        {state?.status === "completed" && state.response && (
                          <Badge
                            variant={
                              state.response.signal === "BUY"
                                ? "default"
                                : state.response.signal === "SELL"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {state.response.signal}
                          </Badge>
                        )}
                        {state?.status === "idle" && (
                          <Badge variant="outline">Ready</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
