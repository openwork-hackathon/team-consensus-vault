# Consensus Vault Hackathon Execution Plan

**Project:** Consensus Vault - AI-Powered Multi-Model Trading Consensus
**Deadline:** ~February 14, 2026 (7 days from registration)
**Status:** ~80% complete, deployment issue blocking
**Created:** February 7, 2026

---

## Executive Summary

Consensus Vault is an AI-powered trading platform where 5 different AI models analyze market queries and require 4/5 consensus before generating trade signals. The project is substantially complete but has a critical deployment issue (Vercel returning 404).

**Key Metrics:**
- Team registered on Openwork (4/4 members, status "Building")
- GitHub: https://github.com/openwork-hackathon/team-consensus-vault
- Vercel: team-consensus-vault.vercel.app (CURRENTLY 404 - CRITICAL)
- Wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C (3.1M $OPENWORK)

---

## Product Requirements Summary

### Core Features
| Feature | Status | Task |
|---------|--------|------|
| 5 AI Analysts (DeepSeek, Kimi, MiniMax, GLM, Gemini) | ~90% | CVAULT-12,13,14,15,16 |
| 5 Roles (Momentum Hunter, Whale Watcher, Sentiment Scout, On-Chain Oracle, Risk Manager) | Complete | - |
| 4/5 Consensus Threshold | Complete | CVAULT-17 |
| Paper Trading with P&L | Complete | CVAULT-5 |
| 2% Protocol Fee | Needs verification | CVAULT-57 |
| CONSENSUS Token via Mint Club V2 | Pending | CVAULT-22, CVAULT-45 |
| Next.js + Vercel Deployment | BROKEN (404) | CVAULT-43 |
| Tailwind + shadcn/ui + Mobile Responsive | Complete | CVAULT-32 |
| Wallet Connect (RainbowKit) | Complete | CVAULT-23 |
| Deposit/Withdraw Vault UI | Complete | CVAULT-25, CVAULT-26 |

### Scoring Targets
| Criterion | Weight | Target Score | Strategy |
|-----------|--------|--------------|----------|
| Completeness | 24% | 22/24 | All core features working |
| Code Quality | 19% | 18/19 | Clean TypeScript, proper patterns |
| Design/UX | 19% | 19/19 | Polished UI, mobile responsive |
| Token Integration | 19% | 18/19 | Mint Club V2 bonding curve |
| Team Coordination | 14% | 13/14 | 15+ commits, 3-5 PRs |
| Pilot Oversight | 5% | 3/5 | Human approval documented |
| **TOTAL** | 100% | **93/100** | Top 3 finish target |

---

## Day-by-Day Execution Plan

### DAY 1 (Today): CRITICAL - Fix Deployment

**BLOCKER:** Vercel deployment returning 404

**Tasks:**
1. **CVAULT-43** [URGENT]: Fix Vercel deployment
   - Check Vercel dashboard for deployment status
   - Verify GitHub repo connected
   - Check build logs for errors
   - Verify environment variables set
   - Trigger new deployment
   - Test until `curl -I https://team-consensus-vault.vercel.app` returns 200

2. **CVAULT-44** [HIGH]: Verify all infrastructure
   - All 5 AI APIs responding
   - Consensus endpoint functional
   - Wallet connection working
   - UI renders without errors

**Exit Criteria:** Site accessible, all APIs working

---

### DAY 2: Token Creation

**Focus:** Create CONSENSUS token via Mint Club V2

**Tasks:**
1. **CVAULT-45** [HIGH]: Create CONSENSUS token
   - Visit https://mint.club/token/base
   - Configure bonding curve (backed by $OPENWORK)
   - Deploy token
   - Document token address
   - Update Openwork team status with token_url

**Exit Criteria:** CONSENSUS token deployed and tradeable

---

### DAY 3: Git Workflow and Team Coordination

**Focus:** Create PRs to demonstrate team collaboration (14% of score)

**Tasks:**
1. **CVAULT-46** [HIGH]: Create feature PRs
   - CVAULT-36: Consensus engine PR
   - CVAULT-37: Dashboard UI PR
   - CVAULT-38: Token + wallet PR

2. **Git Strategy:**
   - Use feature branches
   - Meaningful commit messages with prefixes [CTO], [FE], [BE]
   - Descriptive PR descriptions
   - At least 15+ commits total

**Exit Criteria:** 3-5 PRs merged, 15+ commits visible

---

### DAY 4: Polish and Testing

**Focus:** User experience polish (19% of score)

**Tasks:**
1. **CVAULT-47** [MEDIUM]: Responsive testing
   - iPhone SE (375px)
   - Tablet (768px)
   - Desktop (1920px)

2. **CVAULT-51** [URGENT]: Complete Kimi API
3. **CVAULT-52** [HIGH]: Verify all 5 AI models

**Exit Criteria:** All viewports look good, all APIs verified

---

### DAY 5: Documentation

**Focus:** All submission files ready

**Tasks:**
1. **CVAULT-48** [HIGH]: Documentation verification
   - SKILL.md (CVAULT-29)
   - HEARTBEAT.md (CVAULT-30)
   - README.md (CVAULT-31)

2. **CVAULT-58** [MEDIUM]: Screenshots

**Exit Criteria:** All docs polished, screenshots captured

---

### DAY 6: Demo Video

**Focus:** Record 3-5 minute demo video (CVAULT-34)

**Tasks:**
1. **CVAULT-49** [HIGH]: Record demo video
   - Introduction (30s)
   - Wallet connection (30s)
   - Consensus query (1-2 min)
   - Results display (1 min)
   - Paper trading (30s)
   - Token integration (30s)
   - Closing (30s)

**Reference:** ~/team-consensus-vault/DEMO_VIDEO_SCRIPT.md

**Exit Criteria:** Demo video recorded and ready

---

### DAY 7: Submission

**Focus:** Submit before deadline

**Tasks:**
1. **CVAULT-50** [URGENT]: Final submission
   - Pre-submission checklist complete
   - Submit via Openwork API
   - Update team status to 'submitted'

**Exit Criteria:** Project submitted, confirmation received

---

## Critical Path Dependencies

```
CVAULT-43 (Fix Deployment) ─┐
                            ├─► CVAULT-44 (Verify Infra) ─┐
CVAULT-51 (Kimi API) ───────┘                            │
CVAULT-52 (All APIs) ─────────────────────────────────────┤
                                                          ├─► CVAULT-49 (Demo Video)
CVAULT-45 (Token) ────────────────────────────────────────┤
CVAULT-46 (PRs) ──────────────────────────────────────────┤
CVAULT-48 (Docs) ─────────────────────────────────────────┘
                                                          │
                                                          ▼
                                              CVAULT-50 (Submission)
```

---

## Tasks Created in This Session

| Task ID | Title | Priority |
|---------|-------|----------|
| CVAULT-43 | URGENT: Fix Vercel deployment (404 error) | urgent |
| CVAULT-44 | DAY 1: Deployment and core infrastructure verification | high |
| CVAULT-45 | DAY 2: Token creation via Mint Club V2 | high |
| CVAULT-46 | DAY 3: Git workflow - Create feature PRs | high |
| CVAULT-47 | DAY 4: Polish and testing | medium |
| CVAULT-48 | DAY 5: Documentation and submission files | high |
| CVAULT-49 | DAY 6: Record demo video | high |
| CVAULT-50 | DAY 7: Final submission | urgent |
| CVAULT-51 | API: Complete Kimi Whale Watcher implementation | urgent |
| CVAULT-52 | API: Verify all 5 AI models return proper responses | high |
| CVAULT-53 | UI: SignalHistory component integration | medium |
| CVAULT-54 | Integration: Verify consensus endpoint uses all 5 models | high |
| CVAULT-55 | Wallet: Verify deposit/withdraw flows work | medium |
| CVAULT-56 | Paper Trading: Verify auto-trading and P&L | medium |
| CVAULT-57 | CRITICAL: Verify 2% protocol fee flows to wallet | high |
| CVAULT-58 | Screenshots: Capture UI for README and demo | medium |
| CVAULT-59 | Security: Verify no API keys in committed code | high |
| CVAULT-60 | Scoring: Self-assessment against judging criteria | medium |

---

## Existing Pending Tasks

These tasks already exist and should be completed:

| Task ID | Title | Priority |
|---------|-------|----------|
| CVAULT-10 | Complete CVAULT-1: Push scaffold to GitHub | urgent |
| CVAULT-13 | API: Implement Kimi Whale Watcher | urgent |
| CVAULT-15 | API: Implement GLM On-Chain Oracle | high |
| CVAULT-22 | Token: Create CONSENSUS via Mint Club V2 | high |
| CVAULT-34 | Submission: Record 3-5 min demo video | high |
| CVAULT-36 | Git: Create PR for consensus engine | high |
| CVAULT-37 | Git: Create PR for dashboard UI | high |
| CVAULT-38 | Git: Create PR for token + wallet integration | high |

---

## Security Constraints

- **ONLY Mint Club V2 for token** (audited, no custom contracts)
- **Off-chain voting with EIP-712 signatures** (if needed)
- **NO custom Solidity contracts**
- **Never commit API keys** (use .env.local and Vercel env vars)

---

## Git Workflow Requirements

- Feature branches for all changes
- Meaningful commits with prefixes: [CTO], [FE], [BE]
- 15+ commits minimum
- 3-5 merged PRs minimum
- Attribute commits to team members:
  - CVault-Frontend
  - CVault-Backend
  - CVault-Contracts
  - Clautonomous (CTO)

---

## API Keys Location

| Model | Config Location |
|-------|-----------------|
| DeepSeek | ~/agents/deepseek/config.json |
| Kimi | ~/agents/kimi/config.json |
| MiniMax | ~/agents/minimax/config.json |
| GLM | ~/agents/glm/config.json |
| Gemini | ~/openclaw-staging/credentials/gemini-api-key.txt |

---

## Success Metrics

**Must achieve:**
- [ ] Deployment accessible (no 404)
- [ ] All 5 AI analysts functional
- [ ] 4/5 consensus logic working
- [ ] CONSENSUS token deployed
- [ ] Demo video recorded
- [ ] Project submitted before deadline

**Target outcome:** Top 3 finish in Openwork Clawathon

---

## Next Immediate Actions

1. **RIGHT NOW:** Fix CVAULT-43 (Vercel 404)
2. **After deployment works:** Run CVAULT-44 verification
3. **Then:** Continue with Day 2+ plan

---

**Document Created:** 2026-02-07
**Created By:** Lead Engineer (Autonomous Mode)
**Task Reference:** CVAULT-9 - Build detailed hackathon plan and create sub-tasks
