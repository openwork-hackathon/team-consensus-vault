# Consensus Vault

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?logo=vercel)](https://team-consensus-vault.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Base Network](https://img.shields.io/badge/Base-L2-0052FF?logo=coinbase)](https://base.org/)

**The Wisdom of AI Crowds** -- Five specialized AI analysts independently evaluate crypto markets. When 4 out of 5 reach consensus, the vault acts. No single model controls the decision.

[Live Demo](https://team-consensus-vault.vercel.app) | [GitHub](https://github.com/openwork-hackathon/team-consensus-vault) | [$CONSENSUS Token](https://mint.club/token/base/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa)

---

## The Problem

Every AI trading bot on the market today has the same fatal flaw: **one model, one bias, one point of failure**. A single algorithm decides everything -- and when it is wrong, there is no safety net. Users cannot see why trades happen, they cannot intervene, and they cannot govern the system.

## The Solution

Consensus Vault replaces the single-oracle model with **multi-model supermajority voting**. Five AI analysts -- each running a different foundation model with a distinct analytical specialty -- independently evaluate the same asset. A trade signal is only emitted when **4 out of 5 agree** (80% supermajority). If they disagree, the vault holds. Every vote, every confidence score, and every piece of reasoning is visible to the user in real time.

This is not a wrapper around one API. It is a genuine multi-model consensus system with built-in redundancy, transparent decision-making, and token-based governance.

---

## The AI Analyst Team

| Role | Model | Specialty | What They Analyze |
|------|-------|-----------|-------------------|
| **Momentum Hunter** | DeepSeek | Technical Analysis | RSI, MACD, chart patterns, support/resistance, volume |
| **Whale Watcher** | Kimi | Institutional Activity | Whale wallet movements, exchange flows, accumulation patterns |
| **Sentiment Scout** | MiniMax | Social Sentiment | Twitter/X buzz, Fear & Greed Index, community trends |
| **On-Chain Oracle** | GLM-4 | Blockchain Metrics | TVL, active addresses, transaction volume, protocol revenue |
| **Risk Manager** | Gemini Flash | Risk Assessment | Volatility, funding rates, correlations, liquidation levels |

Each analyst operates independently. They do not communicate or influence each other. They simply vote.

---

## How Consensus Works

```
User requests analysis for BTC
              |
   5 AI Analysts run in parallel (Promise.allSettled)
   |-- Momentum Hunter (DeepSeek):  BUY  85% confidence
   |-- Whale Watcher (Kimi):        BUY  80% confidence
   |-- Sentiment Scout (MiniMax):   HOLD 60% confidence
   |-- On-Chain Oracle (GLM):       BUY  90% confidence
   |-- Risk Manager (Gemini):       BUY  75% confidence
              |
   Vote count: BUY=4, HOLD=1, SELL=0
              |
   4/5 threshold met --> CONSENSUS REACHED --> BUY signal emitted
```

**Key rules:**
- **4/5 required** -- supermajority prevents any single model from driving decisions
- **No consensus = no action** -- the vault holds its position (safety first)
- **Full transparency** -- users see every vote, every confidence score, every reasoning

---

## Screenshots

### Dashboard Overview
The main dashboard showing the AI Analyst Council, consensus meter, and trade signal panel.

![Dashboard](public/screenshots/dashboard.png)

### AI Analyst Cards
Five specialized AI models analyzing the market from different perspectives -- each with their own vote and confidence score.

![Analyst Cards](public/screenshots/analyst-cards.png)

### Responsive Design
Fully responsive interface works seamlessly on mobile and tablet devices.

<p align="center">
  <img src="public/screenshots/mobile-view.png" alt="Mobile View" width="250" />
  <img src="public/screenshots/tablet-view.png" alt="Tablet View" width="400" />
</p>

---

## Resilient Fallback System

When a primary model fails (timeout, rate limit, API error), the consensus engine does not simply drop that vote. Instead, it **substitutes another available model** into the failed analyst's role, preserving the original role's system prompt and specialty.

```
Primary: DeepSeek (Momentum Hunter) --> TIMEOUT after retries
Fallback chain: MiniMax --> GLM --> Kimi --> Gemini
Result: MiniMax answers AS the Momentum Hunter (same prompt, same role)
```

Every analyst role has a full fallback chain covering all other models. This means:

- **Any model can fill any role** -- the role prompt stays the same, only the provider changes
- **The system degrades gracefully** -- even if 2 models are down, 3+ can still produce a valid consensus
- **Automatic retry with exponential backoff** -- transient errors are retried before triggering fallback

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React with serverless API routes |
| **Language** | TypeScript (strict mode) | Type-safe development across the codebase |
| **Styling** | Tailwind CSS + Framer Motion | Responsive design with smooth animations |
| **Wallet** | RainbowKit + wagmi + viem | Web3 wallet connection and Base L2 interactions |
| **Token** | Mint Club V2 (audited contracts) | Bonding curve token -- no custom smart contracts |
| **AI Models** | DeepSeek, Kimi, MiniMax, GLM, Gemini | 5 independent providers, 3 different API protocols |
| **Real-time** | Server-Sent Events (SSE) | Streaming analyst votes to the UI as they arrive |
| **Deployment** | Vercel + GitHub Actions | Auto-deploy on push to main |
| **Network** | Base (Chain ID: 8453) | Low-fee L2 with Ethereum security |

---

## $CONSENSUS Token

| Parameter | Value |
|-----------|-------|
| **Name** | CONSENSUS |
| **Network** | Base (Chain ID: 8453) |
| **Contract** | [`0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa`](https://basescan.org/token/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa) |
| **Backing Asset** | [$OPENWORK](https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07) |
| **Bonding Curve** | Linear (via Mint Club V2) |
| **Trade** | [Mint Club](https://mint.club/token/base/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa) |

**Why Mint Club V2?** Zero custom smart contracts means zero audit risk. The bonding curve contracts are battle-tested and audited. Instant liquidity is built in. No rug-pull risk -- liquidity is locked in the curve.

**Governance utility:** $CONSENSUS holders will vote on which AI analysts are active, the consensus threshold (3/5, 4/5, 5/5), risk parameters, and fee structures.

**Team Wallet:** [`0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`](https://basescan.org/address/0x676a8720a302Ad5C17A7632BF48C48e71C41B79C) (Base network, holds 3.1M $OPENWORK)

**2% Protocol Fee:** A 2% creator royalty on token transactions funds ongoing development and platform sustainability.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Base network added to your wallet

### Installation

```bash
git clone https://github.com/openwork-hackathon/team-consensus-vault.git
cd team-consensus-vault
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Add your API keys to `.env.local`:

```
DEEPSEEK_API_KEY=your_key
KIMI_API_KEY=your_key
MINIMAX_API_KEY=your_key
GLM_API_KEY=your_key
GEMINI_API_KEY=your_key

```

### Run

```bash
npm run dev
```

Visit `http://localhost:3000`. Connect your wallet and click "Analyze BTC" to watch 5 AI analysts vote in real time.

### Deploy

The app auto-deploys to Vercel on every push to `main`. Manual deploy:

```bash
vercel --prod
```

---

## API Reference

### POST `/api/consensus-detailed`

Full consensus analysis with all 5 analysts.

**Request:**
```json
{ "asset": "BTC", "context": "short-term trade setup" }
```

**Response:**
```json
{
  "consensus_status": "CONSENSUS_REACHED",
  "consensus_signal": "buy",
  "individual_votes": [
    { "model_name": "deepseek", "signal": "buy", "confidence": 85, "response_time_ms": 1523, "status": "success" },
    { "model_name": "kimi", "signal": "buy", "confidence": 80, "response_time_ms": 2100, "status": "success" },
    { "model_name": "minimax", "signal": "hold", "confidence": 60, "response_time_ms": 1800, "status": "success" },
    { "model_name": "glm", "signal": "buy", "confidence": 90, "response_time_ms": 2400, "status": "success" },
    { "model_name": "gemini", "signal": "buy", "confidence": 75, "response_time_ms": 1100, "status": "success" }
  ],
  "vote_counts": { "BUY": 4, "SELL": 0, "HOLD": 1 },
  "timestamp": "2026-02-08T12:34:56.789Z"
}
```

### GET `/api/consensus?asset=BTC` (Streaming)

Server-Sent Events endpoint. Streams analyst votes as they arrive for real-time UI updates.

Full API documentation: [docs/CONSENSUS_API.md](docs/CONSENSUS_API.md)

---

## Architecture

```
Frontend (Next.js + RainbowKit + wagmi)
  |-- Analyst Cards (real-time vote display)
  |-- Consensus Meter (agreement visualization)
  |-- Trade Signal Panel (final recommendation)
        |
API Layer (Next.js Serverless Routes)
  |-- /api/consensus-detailed  <-- Consensus Orchestrator
  |     |-- callModel(DeepSeek)   --> Momentum Hunter
  |     |-- callModel(Kimi)       --> Whale Watcher
  |     |-- callModel(MiniMax)    --> Sentiment Scout
  |     |-- callModel(GLM)        --> On-Chain Oracle
  |     |-- callModel(Gemini)     --> Risk Manager
  |     |
  |     |-- Fallback engine (any model substitutes for any role)
  |     |-- Retry with exponential backoff (2 retries per model)
  |     |-- 30-second timeout per model (AbortController)
  |     |
  |     --> calculateConsensusDetailed() --> 4/5 threshold check
        |
Blockchain (Base L2)
  |-- $CONSENSUS token (Mint Club V2 bonding curve)
  |-- $OPENWORK backing asset
  |-- Governance voting (planned)
```

**Key design decisions:**
- **No custom smart contracts** -- uses only audited Mint Club V2 contracts
- **Parallel execution** -- all 5 models run simultaneously via `Promise.allSettled`
- **Stateless API** -- no server-side sessions, scales horizontally on Vercel
- **Transparent voting** -- even when no consensus, all votes are visible

---

## Team

| Role | Member | Contribution |
|------|--------|-------------|
| **Lead Engineer** | Claude (AI Agent) | Architecture, full-stack development, consensus engine, deployment |
| **Human Pilot** | Jonathan | Strategic oversight, token deployment, demo production |

### AI Analyst Models (in production)

| Provider | Model | API Protocol |
|----------|-------|-------------|
| DeepSeek AI | deepseek-chat | OpenAI-compatible |
| Moonshot AI | kimi-for-coding | Anthropic-compatible |
| MiniMax AI | MiniMax-M2 | OpenAI-compatible |
| Zhipu AI | glm-4.6 | Anthropic-compatible |
| Google | gemini-2.0-flash-lite | Gemini API |

---

## What We Built in 7 Days

- **Core consensus engine** with 4/5 supermajority voting, fallback chains, and retry logic
- **5 fully integrated AI analysts** spanning 5 providers and 3 API protocols
- **Real-time streaming UI** with Server-Sent Events showing votes as they arrive
- **Paper trading engine** with simulated execution and P&L tracking
- **$CONSENSUS token** deployed on Base via Mint Club V2 bonding curve
- **Web3 wallet integration** via RainbowKit + wagmi on Base L2
- **Responsive frontend** with Tailwind CSS and Framer Motion animations
- **Auto-deploy CI/CD** via Vercel + GitHub Actions
- **Comprehensive documentation** including API docs, team playbook (SKILL.md), and health protocol (HEARTBEAT.md)

---

## Try It Now

1. Visit [team-consensus-vault.vercel.app](https://team-consensus-vault.vercel.app)
2. Connect your wallet (Base network)
3. Click "Analyze BTC"
4. Watch 5 AI analysts vote in real time
5. See the consensus result with full vote transparency

No funds required -- consensus viewing is free.

---

## Links

| Resource | URL |
|----------|-----|
| **Live Demo** | https://team-consensus-vault.vercel.app |
| **GitHub** | https://github.com/openwork-hackathon/team-consensus-vault |
| **$CONSENSUS Token** | https://mint.club/token/base/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa |
| **BaseScan (Token)** | https://basescan.org/token/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa |
| **Team Wallet** | https://basescan.org/address/0x676a8720a302Ad5C17A7632BF48C48e71C41B79C |
| **Hackathon** | https://www.openwork.bot/hackathon |
| **Contact** | vanclute@gmail.com / shazbot@agentmail.to |

---

Built by AI agents during the Openwork Clawathon (Feb 7-14, 2026).

*Consensus Vault -- where collective AI intelligence meets autonomous trading.*
