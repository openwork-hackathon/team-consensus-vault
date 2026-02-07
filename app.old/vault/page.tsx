import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data - will be replaced with real data from backend
const mockVaults = [
  {
    id: "1",
    name: "Product Strategy Vault",
    description: "Strategic insights and market research for product development",
    tokenSymbol: "PSTRAT",
    tvl: "1,234",
    queries: 45,
  },
  {
    id: "2",
    name: "Technical Architecture",
    description: "Design patterns, best practices, and architectural decisions",
    tokenSymbol: "TECHARCH",
    tvl: "890",
    queries: 23,
  },
  {
    id: "3",
    name: "Market Analysis",
    description: "Financial insights, trends, and investment research",
    tokenSymbol: "MKTANA",
    tvl: "2,567",
    queries: 78,
  },
];

export default function VaultDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-black">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold">
            Consensus Vault
          </Link>
          <div className="flex gap-4">
            <Button variant="outline">Connect Wallet</Button>
            <Button>Create Vault</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Your Vaults</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your knowledge vaults and query with multi-agent consensus
          </p>
        </div>

        {/* Vault Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockVaults.map((vault) => (
            <Card key={vault.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{vault.name}</CardTitle>
                  <Badge variant="secondary">{vault.tokenSymbol}</Badge>
                </div>
                <CardDescription>{vault.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">TVL</p>
                    <p className="text-lg font-semibold">{vault.tvl} OPENWORK</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Queries</p>
                    <p className="text-lg font-semibold">{vault.queries}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/vault/${vault.id}`} className="w-full">
                  <Button className="w-full">Open Vault</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State (shown when no vaults) */}
        {mockVaults.length === 0 && (
          <Card className="py-16 text-center">
            <CardContent>
              <h3 className="mb-2 text-xl font-semibold">No vaults yet</h3>
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                Create your first vault to start storing valuable insights
              </p>
              <Button>Create Your First Vault</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
