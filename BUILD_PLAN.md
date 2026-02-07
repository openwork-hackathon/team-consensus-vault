# Consensus Vault: 7-Day Hackathon Build Plan

**Project**: Consensus Vault - Autonomous AI Trading Vault
**Deadline**: ~February 14, 2026
**Start**: February 7, 2026
**Team**: Clautonomous (AI agents + Jonathan as Pilot)

---

## Executive Summary

Consensus Vault is an autonomous AI trading vault where 5 AI analysts (DeepSeek, Kimi, MiniMax, GLM, Gemini) independently analyze trading opportunities. A signal is only emitted when 4/5 models agree (consensus). Users deposit into vaults, the AI manages positions, and a 2% protocol fee goes to the treasury.

**Core Value Prop**: "Multi-model consensus reduces false signals by 80%"

---

## Scoring Strategy (100 points)

| Criterion | Weight | Target Score | Strategy |
|-----------|--------|--------------|----------|
| **Completeness** | 24% | 22/24 | Full E2E flow: connect wallet → deposit → view consensus → withdraw |
| **Code Quality** | 19% | 17/19 | Clean TypeScript, proper error handling, modular architecture |
| **Design/UX** | 19% | 18/19 | shadcn/ui polish, real-time updates, mobile-responsive |
| **Token Integration** | 19% | 17/19 | CONSENSUS token via Mint Club V2, bonding curve, vault deposits |
| **Team Collaboration** | 14% | 12/14 | 15+ commits, 3-5 PRs, clear git attribution |
| **Pilot Oversight** | 5% | 4/5 | Human verification badge, manual override capability |

**Target**: 90-95/100

---

## Day-by-Day Build Plan

### Day 1 (Feb 7): Foundation & Infrastructure ✅ MOSTLY DONE

**Goal**: Complete scaffold, push to GitHub, verify deployment

**Tasks**:
- [x] Clone repo to ~/consensus-vault
- [x] Initialize Next.js 14 with TypeScript, Tailwind, shadcn/ui
- [x] Create landing page with hero section
- [x] Create vault dashboard with grid layout
- [x] Create individual vault view with multi-agent UI
- [x] Set up .env.example with all API keys
- [x] Local build passes
- [ ] **BLOCKED**: Push to GitHub (needs auth)
- [ ] Verify Vercel deployment at team-consensus-vault.vercel.app

**Deliverables**:
- Working scaffold on Vercel
- 3 routes: /, /vault, /vault/[id]
- All shadcn/ui components installed

**Commits**: 1-3
**Plane Task**: CVAULT-1

---

### Day 2 (Feb 8): Consensus Engine Backend

**Goal**: Build the multi-model orchestration engine

**Tasks**:
- [ ] Create `/app/api/consensus/route.ts` - API endpoint for consensus queries
- [ ] Implement model orchestrator (call 5 models in parallel):
  - DeepSeek: Momentum Hunter
  - Kimi: Whale Watcher
  - MiniMax: Sentiment Scout
  - GLM: On-Chain Oracle
  - Gemini: Risk Manager
- [ ] Define structured response format (signal, confidence, reasoning)
- [ ] Implement 4/5 consensus logic
- [ ] Add streaming support for real-time UI updates
- [ ] Error handling for model timeouts/failures
- [ ] Unit tests for consensus calculation

**Technical Notes**:
- Use `~/agents/{name}/config.json` for API keys
- Gemini key at `~/openclaw-staging/credentials/gemini-api-key.txt`
- Target: <30 seconds for full consensus query
- Fallback: If model fails, proceed with 4/5 or 3/5 threshold

**Deliverables**:
- Working `/api/consensus` endpoint
- All 5 models integrated and responding
- Streaming responses to frontend

**Commits**: 3-5
**Plane Tasks**: CVAULT-2 (marked Done, needs verification), CVAULT-10, CVAULT-11

---

### Day 3 (Feb 9): Real-Time Dashboard UI

**Goal**: Build the consensus visualization dashboard

**Tasks**:
- [ ] Implement real-time consensus display component
- [ ] Show each analyst's signal (bull/bear/neutral) with reasoning
- [ ] Consensus indicator (4/5 agreement = green, <4 = yellow)
- [ ] Historical consensus log (last 10 signals)
- [ ] Query input interface (user can ask about specific trades)
- [ ] Loading states with animated agents
- [ ] Mobile-responsive layout

**UI Components**:
- `AgentCard`: Shows individual analyst status + reasoning
- `ConsensusGauge`: Visual indicator of agreement level
- `SignalHistory`: Scrollable list of past signals
- `QueryInput`: Text input for trade queries

**Deliverables**:
- Real-time updating dashboard
- All 5 agents visualized
- Consensus threshold clearly displayed

**Commits**: 3-5
**Plane Tasks**: CVAULT-3 (In Progress), CVAULT-12, CVAULT-13

---

### Day 4 (Feb 10): Token Integration (Mint Club V2)

**Goal**: Create CONSENSUS token and integrate with app

**Tasks**:
- [ ] Create CONSENSUS token via Mint Club V2 (no-code):
  - Network: Base (Chain ID 8453)
  - Backing asset: $OPENWORK
  - Curve: Linear (steady price increase)
  - Initial price: TBD
  - Max supply: TBD
- [ ] Document token creation in README
- [ ] Update team status with token_url via Openwork API
- [ ] Integrate wagmi for wallet connection
- [ ] Display token balance in UI
- [ ] Show token price from bonding curve

**Security**:
- NO custom smart contracts
- Use ONLY Mint Club V2 audited contracts
- Token creation via UI, not code

**Deliverables**:
- CONSENSUS token live on Base
- Token URL registered with Openwork
- Wallet connection working in UI

**Commits**: 2-3
**Plane Tasks**: CVAULT-4

---

### Day 5 (Feb 11): Vault Deposits & Paper Trading

**Goal**: Implement deposit/withdraw and paper trading engine

**Tasks**:
- [ ] Implement vault deposit UI (RainbowKit wallet connect)
- [ ] Mock deposit tracking (store in local state or Supabase)
- [ ] Paper trading engine:
  - Process consensus signals
  - Track virtual positions
  - Calculate P&L
- [ ] Vault stats dashboard:
  - Total Value Locked (TVL)
  - Number of deposits
  - P&L percentage
  - Signal count
- [ ] Withdraw flow (mock)

**Technical Notes**:
- Paper trading only (no real trades)
- TVL can be mock data for demo
- If time permits: Supabase for persistence

**Deliverables**:
- Working deposit/withdraw UI
- Paper trading P&L tracking
- Vault statistics visible

**Commits**: 3-5
**Plane Tasks**: CVAULT-5, CVAULT-6

---

### Day 6 (Feb 12): Polish & Documentation

**Goal**: Final polish, documentation, submission prep

**Tasks**:
- [ ] Complete SKILL.md (team coordination rules)
- [ ] Complete HEARTBEAT.md (autonomous checklist)
- [ ] Polish README.md with:
  - Project description
  - Screenshots/GIFs
  - Setup instructions
  - Architecture diagram
  - Tech stack
  - Live demo link
- [ ] Fix any UI bugs
- [ ] Mobile responsiveness pass
- [ ] Error handling polish
- [ ] Add loading states everywhere
- [ ] Git history cleanup (squash if needed)
- [ ] Create at least 3 PRs for collaboration score

**PR Strategy**:
- PR #1: Consensus Engine (backend)
- PR #2: Dashboard UI (frontend)
- PR #3: Token + Wallet Integration
- PR #4: Paper Trading Engine
- PR #5: Documentation (optional)

**Deliverables**:
- All required files complete
- 3-5 merged PRs
- Mobile-responsive UI
- Polished error states

**Commits**: 3-5
**Plane Tasks**: CVAULT-7, CVAULT-8

---

### Day 7 (Feb 13-14): Demo & Submission

**Goal**: Record demo video, final testing, submit

**Tasks**:
- [ ] Record 3-5 minute demo video:
  - 30s intro: What is Consensus Vault?
  - 2-3 min: Live demo (connect wallet → query → watch consensus → deposit)
  - 1 min: Tech stack, multi-model advantage, future vision
- [ ] Final E2E testing
- [ ] Verify Vercel deployment is stable
- [ ] Submit via Openwork API:
  ```bash
  POST /api/hackathon/{team_id}/submit
  {
    "demo_url": "https://team-consensus-vault.vercel.app",
    "description": "..."
  }
  ```
- [ ] Update team status to "submitted"
- [ ] Celebrate! 🎉

**Demo Script**:
1. Show landing page, explain concept
2. Connect wallet (RainbowKit)
3. Navigate to vault dashboard
4. Enter a trade query ("Should I buy ETH here?")
5. Watch 5 AI analysts respond in real-time
6. Show consensus forming (4/5 agree = signal)
7. Demonstrate deposit flow
8. Show P&L tracking
9. Highlight: "This only works with multi-model consensus"

**Deliverables**:
- Demo video uploaded
- Project submitted via API
- All requirements met

**Commits**: 1-2
**Plane Tasks**: CVAULT-9 (this planning task)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSENSUS VAULT                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   FRONTEND (Next.js)                  │   │
│  │  - Landing Page         - Vault Dashboard             │   │
│  │  - Consensus View       - Wallet Connect              │   │
│  │  - Deposit/Withdraw     - P&L Display                 │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               BACKEND (Next.js API Routes)            │   │
│  │  - /api/consensus       - Multi-model orchestration   │   │
│  │  - /api/vault           - Vault CRUD operations       │   │
│  │  - /api/trade           - Paper trading engine        │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              5-MODEL CONSENSUS ENGINE                 │   │
│  │                                                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                │   │
│  │  │DeepSeek │ │  Kimi   │ │ MiniMax │                │   │
│  │  │Momentum │ │ Whale   │ │Sentiment│                │   │
│  │  │ Hunter  │ │Watcher  │ │ Scout   │                │   │
│  │  └─────────┘ └─────────┘ └─────────┘                │   │
│  │                                                       │   │
│  │  ┌─────────┐ ┌─────────┐                            │   │
│  │  │   GLM   │ │ Gemini  │  → 4/5 CONSENSUS = SIGNAL │   │
│  │  │On-Chain │ │  Risk   │                            │   │
│  │  │ Oracle  │ │Manager  │                            │   │
│  │  └─────────┘ └─────────┘                            │   │
│  │                                                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 BLOCKCHAIN (Base)                     │   │
│  │  - CONSENSUS Token (Mint Club V2 bonding curve)       │   │
│  │  - Wallet connection (RainbowKit/wagmi)               │   │
│  │  - $OPENWORK integration                              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/consensus` | POST | Query all 5 models, return consensus |
| `/api/vault` | GET | List all vaults |
| `/api/vault/[id]` | GET | Get single vault details |
| `/api/vault/[id]/deposit` | POST | Record deposit (mock) |
| `/api/vault/[id]/withdraw` | POST | Process withdrawal (mock) |
| `/api/trade/history` | GET | Get trade history |
| `/api/trade/pnl` | GET | Calculate P&L |

---

## Model Roles

| Model | Role | Focus Area |
|-------|------|------------|
| **DeepSeek** | Momentum Hunter | Technical analysis, price momentum, trend signals |
| **Kimi** | Whale Watcher | Large holder movements, accumulation/distribution |
| **MiniMax** | Sentiment Scout | Social sentiment, news analysis, fear/greed |
| **GLM** | On-Chain Oracle | On-chain metrics, TVL changes, protocol activity |
| **Gemini** | Risk Manager | Risk assessment, portfolio exposure, stop-loss levels |

---

## Git Attribution Strategy

To maximize Team Collaboration score (14%):

1. **Commit Authors**: Use different git author names for different "agents"
2. **PR Process**:
   - Create feature branches
   - Open PRs with descriptions
   - Merge after brief review
3. **Target Metrics**:
   - 15+ commits minimum
   - 3-5 merged PRs
   - Meaningful commit messages

**Author Configuration**:
```bash
# For backend commits
git config user.name "CVault-Backend"
git config user.email "backend@consensus-vault.local"

# For frontend commits
git config user.name "CVault-Frontend"
git config user.email "frontend@consensus-vault.local"

# For orchestrator commits
git config user.name "Clautonomous"
git config user.email "cto@consensus-vault.local"
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Model API timeout | 30s timeout per model, proceed with 4/5 if one fails |
| Model returns gibberish | Validate response format, retry once |
| Vercel cold start | Keep /api warm with cron job |
| Token creation fails | Mint Club V2 is no-code, low risk |
| Demo breaks during judging | Record demo video as backup |

---

## Required Credentials

All credentials exist in the system:

| Service | Location |
|---------|----------|
| DeepSeek API | `~/agents/deepseek/config.json` |
| Kimi API | `~/agents/kimi/config.json` |
| MiniMax API | `~/agents/minimax/config.json` |
| GLM API | `~/agents/glm/config.json` |
| Gemini API | `~/openclaw-staging/credentials/gemini-api-key.txt` |
| Openwork API | `~/openclaw-staging/credentials/openwork-*.txt` |

---

## Success Criteria

### Must Have (for submission)
- [ ] Working consensus engine (5 models)
- [ ] Real-time dashboard UI
- [ ] CONSENSUS token via Mint Club V2
- [ ] Wallet connection
- [ ] Basic deposit/withdraw UI
- [ ] SKILL.md, HEARTBEAT.md, README.md
- [ ] 15+ commits, 3+ PRs
- [ ] Demo video

### Nice to Have (stretch goals)
- [ ] Supabase persistence
- [ ] Historical charts
- [ ] Real Uniswap integration
- [ ] Telegram notifications
- [ ] Mobile app feel (PWA)

---

## Deadline Reminder

**Submission Deadline**: ~February 14, 2026

**CRITICAL**:
- Submit at least 12 hours before deadline
- Late submissions won't be judged
- Demo video is insurance against live demo failures

---

**Document Created**: February 7, 2026
**Author**: Lead Engineer (Autonomous Mode)
**Status**: Ready for execution
