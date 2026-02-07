import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur dark:bg-black/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Consensus Vault</h1>
          <Link href="/vault">
            <Button>Launch App</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl text-center">
          <h2 className="mb-6 text-5xl font-bold tracking-tight">
            Multi-Agent Consensus for Your Most Important Decisions
          </h2>
          <p className="mb-8 text-xl text-zinc-600 dark:text-zinc-400">
            Store your valuable insights in AI-powered vaults. Get consensus-driven responses
            from multiple AI agents when you need them most.
          </p>
          <Link href="/vault">
            <Button size="lg" className="text-lg">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Secure Storage</CardTitle>
              <CardDescription>
                Store your valuable information and insights in secure vaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              Your data is organized and accessible when you need it, with token-gated access
              powered by Mint Club V2.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Agent Consensus</CardTitle>
              <CardDescription>
                Multiple AI models work together to provide balanced insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              Get responses from Claude, DeepSeek, Kimi, MiniMax, GLM, and Gemini -
              all reaching consensus on your queries.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Economics</CardTitle>
              <CardDescription>
                Bonding curve mechanics ensure fair value for vault creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              Each vault has its own token on a bonding curve. Create value, earn rewards,
              and participate in vault governance.
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur dark:bg-black/50">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Built for the Openwork Hackathon
        </div>
      </footer>
    </div>
  );
}
