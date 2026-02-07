"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Mock vault data
const mockVault = {
  id: "1",
  name: "Product Strategy Vault",
  description: "Strategic insights and market research for product development",
  tokenSymbol: "PSTRAT",
  tvl: "1,234",
  itemCount: 15,
};

// Mock agent responses
const mockAgents = [
  { name: "Claude", status: "completed", confidence: 0.92 },
  { name: "DeepSeek", status: "completed", confidence: 0.88 },
  { name: "Kimi", status: "completed", confidence: 0.90 },
  { name: "MiniMax", status: "completed", confidence: 0.85 },
  { name: "GLM", status: "completed", confidence: 0.87 },
  { name: "Gemini", status: "completed", confidence: 0.91 },
];

export default function VaultConsensusView({ params }: { params: { id: string } }) {
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    // TODO: Implement actual API call
    setTimeout(() => {
      setIsQuerying(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-black">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/vault" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ← Back to Vaults
          </Link>
          <div className="flex-1" />
          <Button variant="outline">Manage Vault</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Vault Info */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-4xl font-bold">{mockVault.name}</h1>
            <Badge variant="secondary" className="text-base">
              {mockVault.tokenSymbol}
            </Badge>
          </div>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">{mockVault.description}</p>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">TVL: </span>
              <span className="font-semibold">{mockVault.tvl} OPENWORK</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Items: </span>
              <span className="font-semibold">{mockVault.itemCount}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Query Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Query Your Vault</CardTitle>
                <CardDescription>
                  Ask a question and receive consensus from multiple AI agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What insights can you provide about launching a new feature in Q2?"
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
                  {isQuerying ? "Querying Agents..." : "Get Consensus"}
                </Button>

                {/* Response Area */}
                {isQuerying && (
                  <div className="rounded-lg border bg-zinc-50 p-6 dark:bg-zinc-800">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">
                      Consulting {mockAgents.length} AI agents...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Agent Status Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>{mockAgents.length} agents ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAgents.map((agent) => (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {agent.status === "completed" ? "Ready" : "Querying..."}
                        </p>
                      </div>
                      <Badge variant={agent.status === "completed" ? "default" : "secondary"}>
                        {Math.round(agent.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
