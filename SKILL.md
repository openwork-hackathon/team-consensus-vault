# SKILL.md - Team Coordination Playbook

**Project:** Consensus Vault - AI-Powered Autonomous Trading Vault
**Repository:** https://github.com/openwork-hackathon/team-consensus-vault
**Deployment:** https://team-consensus-vault.vercel.app
**Last Updated:** 2026-02-07

---

## Team Members

### Lead Engineer (Claude Sonnet 4.5)
- **Primary Role:** System architect, full-stack development, project coordination
- **Specialties:** Next.js, TypeScript, Web3 integration, AI consensus systems
- **Responsibilities:**
  - Architecture decisions and system design
  - Full-stack implementation (frontend + backend)
  - API development and AI model integration
  - Documentation and deployment
  - Code review and quality assurance
- **Commit Prefix:** `[LEAD]`
- **Git Signature:** Lead Engineer (5326546+vanclute@users.noreply.github.com)

### AI Analyst Team (5 Specialized Models)
- **Primary Role:** Provide trading signals through specialized analysis
- **Team Members:**
  1. **DeepSeek** - Momentum Hunter (technical analysis, chart patterns)
  2. **Kimi** - Whale Watcher (large holder movements, institutional activity)
  3. **MiniMax** - Sentiment Scout (social sentiment, community buzz)
  4. **GLM** - On-Chain Oracle (on-chain metrics, TVL, network activity)
  5. **Gemini** - Risk Manager (risk assessment, volatility, exposure)
- **Integration:** API endpoints at `/api/{analyst-name}/route.ts`
- **Consensus:** 4/5 agreement required for trading signals

### Human Pilot (Jonathan)
- **Primary Role:** Strategic oversight, token creation, deployment approvals
- **Responsibilities:**
  - Final deployment approvals
  - Manual token creation (Mint Club V2)
  - Strategic decisions requiring browser/wallet access
  - Demo video recording and submission
- **Contact:** 5326546+vanclute@users.noreply.github.com / shazbot@agentmail.to

---

## Coordination Protocol

### Decision-Making Process

1. **Technical Decisions** (Architecture, implementation)
   - Lead Engineer makes final call
   - Document rationale in commit messages or implementation docs
   - No approval needed for standard Next.js/React patterns

2. **Strategic Decisions** (Scope, features, submission)
   - Discussed with Human Pilot
   - Prioritize: shipping > perfection
   - Focus on completeness over sophistication

3. **AI Consensus Mechanism**
   - 5 AI models analyze independently
   - 4/5 agreement required for action
   - Transparent voting (all votes visible)
   - No tie-breaking if < 4 agree

### Communication Channels

1. **Primary: Git Commit Messages**
   - Use conventional commit format: `[PREFIX] type(scope): description`
   - Example: `[LEAD] feat(consensus): implement 4/5 voting logic`

2. **Secondary: Implementation Documentation**
   - Document complex features in markdown files
   - Examples: `IMPLEMENTATION_SUMMARY.md`, `TOKEN_CREATION_GUIDE.md`
   - Include technical details, decisions, and rationale

3. **Tertiary: Activity Log**
   - Location: `ACTIVITY_LOG.md`
   - Track daily progress and blockers
   - Reference for session continuity

4. **Code Documentation**
   - TypeScript interfaces and types (self-documenting)
   - API documentation in `docs/CONSENSUS_API.md`
   - Inline comments for complex logic only

---

## Task Assignment System

### Backlog Management
- **Primary Source:** Plane instance at http://10.0.0.204:8080 (project: CVAULT)
- **Priority Levels:** urgent → high → medium → low
- **Task Statuses:** pending → in_progress → done → blocked

### Assignment Rules

1. **Lead Engineer** handles all development tasks
   - Full-stack implementation
   - API integration
   - UI/UX development
   - Documentation

2. **AI Analysts** provide domain expertise
   - Respond to analysis requests via API
   - Specialized signals (momentum, whale activity, sentiment, on-chain, risk)
   - Operate independently, coordinated by consensus engine

3. **Human Pilot** handles browser-required tasks
   - Token creation on Mint Club V2
   - Wallet signing operations
   - Demo video production
   - Final submission

### Task Ownership

**Lead Engineer owns:**
- All code in `src/` directory
- API routes: `src/app/api/*/route.ts`
- Components: `src/components/*.tsx`
- Consensus engine: `src/lib/consensus-engine.ts`
- Documentation: README.md, SKILL.md, HEARTBEAT.md
- Build configuration: package.json, next.config.mjs

**AI Analysts own:**
- Trading signal generation
- Independent analysis responses
- Domain-specific expertise

**Human Pilot owns:**
- Strategic direction
- Token deployment (requires browser)
- Demo video
- Submission process

---

## Git Workflow

### Branch Strategy

- **main** - Production branch (auto-deploys to Vercel)
  - Always deployable
  - Direct commits allowed for hackathon speed
  - Protected for production use post-hackathon

- **Feature branches** (optional for complex work)
  - Naming: `feat/{description}` (e.g., `feat/consensus-api`)
  - Create PR if wanting review before merge
  - Fast-forward merge to main

### Commit Message Format

Follow conventional commits:

```
[PREFIX] type(scope): description

Body (optional):
- More detailed explanation
- Why this change was needed
- Links to tasks or docs

Closes CVAULT-XX
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code restructuring (no behavior change)
- `test` - Adding tests
- `chore` - Build scripts, dependencies, config
- `style` - UI/styling changes

**Examples:**
```
[LEAD] feat(consensus): implement 4/5 voting logic with timeout handling

- Added calculateConsensusDetailed() function
- Implemented 30-second timeout per model
- Created comprehensive test suite

Closes CVAULT-17

[LEAD] feat(api): add GLM on-chain oracle endpoint

- Integrated GLM-4-Plus API for on-chain analysis
- Added specialized prompt for TVL and network metrics
- Tested with Base network data

Closes CVAULT-15

[LEAD] docs(submission): create SKILL.md, HEARTBEAT.md, README.md

- Added team coordination playbook
- Documented health check protocol
- Updated README with professional overview

Closes CVAULT-7
```

---

## Code Quality Standards

### General Principles
- **Ship Fast:** Working > Perfect (it's a hackathon)
- **Type Safety:** TypeScript strict mode enabled
- **Web3 First:** RainbowKit + Wagmi for all wallet interactions
- **AI Transparency:** Show all votes, not just consensus

### TypeScript/React (Full Stack)
```typescript
// Required
- TypeScript strict mode enabled
- Proper type definitions (minimize 'any')
- React Server Components where appropriate
- Client components marked with 'use client'
- API routes follow Next.js 14 patterns

// Example Component
interface AnalystCardProps {
  name: string;
  role: string;
  signal: 'buy' | 'sell' | 'hold' | null;
  confidence: number;
  status: 'success' | 'timeout' | 'error';
}

export function AnalystCard({ name, role, signal, confidence, status }: AnalystCardProps) {
  // Implementation
}

// Example API Route
export async function POST(request: Request) {
  const body = await request.json();
  const { asset, context } = body;

  const result = await runDetailedConsensusAnalysis(asset, context);
  return Response.json(result);
}
```

### Web3 Integration
- **Wallet:** RainbowKit for connection UI
- **Hooks:** Wagmi hooks for all chain interactions
- **Network:** Base (Chain ID: 8453)
- **Token Standard:** ERC20 via Mint Club V2 (no custom contracts)

### Testing
- **Unit Tests:** Critical business logic (consensus calculation)
- **Manual Testing:** UI flows, wallet interactions
- **API Testing:** cURL scripts for endpoint verification
- **Coverage:** Focus on consensus logic (most critical)

---

## Integration with AI Consensus System

### The 5 AI Analysts

Each analyst has a specialized role and provides independent analysis:

| Analyst | Model | Expertise | API Endpoint |
|---------|-------|-----------|--------------|
| Momentum Hunter | DeepSeek | Technical analysis, chart patterns | `/api/momentum-hunter` |
| Whale Watcher | Kimi | Large holder movements | `/api/whale-watcher` |
| Sentiment Scout | MiniMax | Social sentiment | (planned) |
| On-Chain Oracle | GLM | On-chain metrics | `/api/on-chain-oracle` |
| Risk Manager | Gemini | Risk assessment | (planned) |

### Consensus Mechanism

**Rules:**
- 4/5 agreement required → `CONSENSUS_REACHED`
- Less than 4 agree → `NO_CONSENSUS`
- Less than 3 valid responses → `INSUFFICIENT_RESPONSES`

**Timeout Handling:**
- 30 seconds per model
- Timed-out models excluded from consensus
- Transparent status reporting

**Vote Transparency:**
- All individual votes returned in API response
- Vote counts displayed: `{ BUY: 4, SELL: 0, HOLD: 1 }`
- Users see how each AI voted

### API Architecture

```
GET/POST /api/consensus-detailed
├─> DeepSeek (Momentum Hunter)
├─> Kimi (Whale Watcher)
├─> MiniMax (Sentiment Scout)
├─> GLM (On-Chain Oracle)
└─> Gemini (Risk Manager)
     ↓
  Calculate 4/5 Consensus
     ↓
  Return detailed vote breakdown
```

---

## Time Management (7-Day Hackathon)

### Priority Order (Per HEARTBEAT.md)
1. **Fix broken deploys** (URGENT - drop everything)
2. **Complete core features** (consensus engine, UI)
3. **Integration work** (token display, wallet connection)
4. **Documentation** (README, SKILL.md, HEARTBEAT.md)
5. **Polish & Testing** (UI refinement, error handling)
6. **Demo preparation** (video, submission materials)

### Milestone Tracking

- **Day 1-2:** Core consensus engine + basic UI ✅
- **Day 3-4:** AI analyst integration (5 models) ✅
- **Day 5:** Token creation + governance features 🔶 (token blocked)
- **Day 6:** Testing, polish, documentation ← WE ARE HERE
- **Day 7:** Demo video, final submission

### Current Status (Day 6)

**Completed:**
- ✅ Next.js app scaffolded and deployed
- ✅ Consensus engine with 4/5 logic
- ✅ 3/5 AI analysts integrated (DeepSeek, Kimi, GLM)
- ✅ Real-time consensus UI with SSE
- ✅ Wallet integration (RainbowKit + Wagmi)
- ✅ Deposit modal UI
- ✅ Professional documentation

**In Progress:**
- 🔶 CONSENSUS token creation (blocked - requires human with browser)
- 🔨 Submission files (SKILL.md, HEARTBEAT.md, README.md)

**Remaining:**
- 📋 Demo video production
- 📋 Final submission on Openwork platform
- 📋 Token integration (after token created)

---

## Emergency Procedures

### Broken Deployment
1. Check Vercel dashboard: https://vercel.com/dashboard
2. Review build logs for errors
3. Test locally: `npm run build`
4. If critical: revert last commit, push fix
5. Verify deployment succeeded

### API Failures
1. Check environment variables in Vercel
2. Verify API keys in .env.local (DeepSeek, Kimi, GLM, Gemini, MiniMax)
3. Test individual endpoints: `curl https://team-consensus-vault.vercel.app/api/consensus-detailed?asset=BTC`
4. Check rate limits (1 req/sec per model)

### Wallet Connection Issues
1. Verify Base network in wagmi config
2. Check RainbowKit setup in Providers
3. Test with different wallet (MetaMask, Coinbase Wallet)
4. Clear browser cache and localStorage

### Context Limit Hit
- Run `/handoff` to create session continuity files
- Resume with: `claude --continue`
- Previous session context preserved in RESUME files

---

## Repository Structure

```
team-consensus-vault/
├── README.md                      # Professional project overview
├── SKILL.md                       # This file - team coordination
├── HEARTBEAT.md                   # Health check protocol
├── ACTIVITY_LOG.md                # Daily progress tracking
├── package.json                   # Dependencies (Next.js 14, Wagmi, RainbowKit)
├── next.config.mjs                # Next.js configuration
├── .env.example                   # Environment variable template
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Main dashboard page
│   │   └── api/                  # API routes
│   │       ├── consensus/        # SSE streaming endpoint
│   │       ├── consensus-detailed/ # 4/5 consensus endpoint
│   │       ├── momentum-hunter/  # DeepSeek analyst
│   │       ├── whale-watcher/    # Kimi analyst
│   │       └── on-chain-oracle/  # GLM analyst
│   ├── components/               # React components
│   │   ├── Header.tsx           # Wallet connection header
│   │   ├── AnalystCard.tsx      # Individual AI analyst display
│   │   ├── ConsensusMeter.tsx   # Vote visualization
│   │   ├── TradeSignal.tsx      # Consensus result display
│   │   ├── DepositModal.tsx     # Vault deposit UI
│   │   └── Providers.tsx        # RainbowKit + Wagmi setup
│   ├── lib/
│   │   ├── consensus-engine.ts  # Core consensus logic
│   │   ├── models.ts            # Type definitions
│   │   ├── wagmi.ts             # Web3 configuration
│   │   └── __tests__/           # Test suite
│   └── contexts/
│       └── VaultContext.tsx     # Vault state management
├── docs/
│   └── CONSENSUS_API.md         # API documentation
├── scripts/
│   └── verify-token.sh          # Token verification script
└── public/                      # Static assets
```

---

## Definition of Done

A task is "done" when:

- [ ] Code is written and tested locally
- [ ] TypeScript compiles without errors
- [ ] Next.js build succeeds (`npm run build`)
- [ ] Deployed to Vercel successfully
- [ ] Verified in production (curl or browser)
- [ ] Documentation updated (if API changes)
- [ ] Committed with proper prefix and message
- [ ] Activity log updated (if significant feature)

---

## Contact & Support

- **Human Pilot:** Jonathan (5326546+vanclute@users.noreply.github.com)
- **Agent Email:** shazbot@agentmail.to
- **Project Repository:** https://github.com/openwork-hackathon/team-consensus-vault
- **Live Deployment:** https://team-consensus-vault.vercel.app
- **Issue Tracker:** Plane instance at http://10.0.0.204:8080 (project: CVAULT)
- **Hackathon Platform:** https://www.openwork.bot/hackathon

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07 by Lead Engineer
**Status:** ✅ Ready for submission
