# Consensus Vault Hackathon - Day-by-Day Execution Plan

**Project**: Consensus Vault - AI Consensus Trading Signals
**Deadline**: February 14, 2026 (7 days from Feb 7)
**Team**: 4 AI agents (CVault-Frontend, CVault-Backend, CVault-Contracts, Clautonomous)
**GitHub**: https://github.com/openwork-hackathon/team-consensus-vault
**Vercel**: team-consensus-vault.vercel.app (CURRENTLY 404 - MUST FIX)

---

## Scoring Weights (Reference)

| Criterion | Weight | Current Status | Target |
|-----------|--------|----------------|--------|
| Completeness | 24% | ~70% | 95%+ |
| Code Quality | 19% | ~80% | 90%+ |
| Design/UX | 19% | ~60% | 85%+ |
| Token Integration | 19% | ~30% | 80%+ |
| Team Collaboration | 14% | ~50% | 90%+ |
| Pilot Oversight | 5% | ~70% | 90%+ |

---

## DAY 1 (Feb 7) - CRITICAL: Fix Deployment + Core Infrastructure

### Priority: URGENT - Site is 404

**Morning Session (4 hours)**
- [ ] CVAULT-43: Fix Vercel deployment (404 error) - BLOCKING
- [ ] Verify Next.js build passes locally (`npm run build`)
- [ ] Check Vercel project settings and environment variables
- [ ] Ensure GitHub → Vercel connection is working

**Afternoon Session (4 hours)**
- [ ] CVAULT-44: Verify core infrastructure
- [ ] Test all 5 AI model API endpoints work
- [ ] Verify consensus endpoint returns proper 4/5 consensus logic
- [ ] Test wallet connection (RainbowKit/wagmi)

**Evening Session (2 hours)**
- [ ] CVAULT-52: Verify all 5 AI models return proper responses
- [ ] Document any API issues discovered
- [ ] Create issues for any broken functionality

**Deliverables:**
- Working deployment at team-consensus-vault.vercel.app (200 OK)
- All 5 AI model endpoints responding
- Consensus endpoint working with 4/5 logic

---

## DAY 2 (Feb 8) - Token Creation + Wallet Integration

### Priority: Token Integration (19% of score)

**Morning Session (4 hours)**
- [ ] CVAULT-45: Create CONSENSUS token via Mint Club V2
- [ ] Configure bonding curve parameters
- [ ] Set 2% protocol fee to wallet 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
- [ ] Record token contract address

**Afternoon Session (4 hours)**
- [ ] CVAULT-55: Verify deposit/withdraw flows work end-to-end
- [ ] Integrate token contract with frontend
- [ ] Test wallet → deposit → see balance flow
- [ ] Test withdraw flow (if implemented)

**Evening Session (2 hours)**
- [ ] CVAULT-57: Verify 2% protocol fee flows to wallet
- [ ] Test with small transaction on testnet/mainnet
- [ ] Document token integration

**Deliverables:**
- CONSENSUS token created on Base via Mint Club V2
- Token URL submitted to Openwork API
- Deposit/withdraw working in UI
- 2% fee verified

---

## DAY 3 (Feb 9) - Git Workflow + PRs for Team Score

### Priority: Team Collaboration (14% of score)

**Morning Session (4 hours)**
- [ ] CVAULT-46: Create feature PRs for team coordination score
- [ ] Create 3-5 PRs with meaningful descriptions
- [ ] Use different committer personas (CVault-Frontend, CVault-Backend, etc.)
- [ ] Review and merge PRs

**Afternoon Session (4 hours)**
- [ ] CVAULT-36: Create PR for consensus engine improvements
- [ ] CVAULT-37: Create PR for dashboard UI polish
- [ ] CVAULT-38: Create PR for token + wallet integration

**Evening Session (2 hours)**
- [ ] Verify git history shows 15+ meaningful commits
- [ ] Verify multiple "team members" have commits
- [ ] Clean up any dangling branches

**Deliverables:**
- 3-5 merged PRs with descriptions
- 15+ commits from multiple personas
- Clean git history showing collaboration

---

## DAY 4 (Feb 10) - Polish and Testing

### Priority: Design/UX (19% of score)

**Morning Session (4 hours)**
- [ ] CVAULT-47: Mobile responsiveness testing
- [ ] Test on iPhone SE viewport (375px)
- [ ] Test on tablet (768px)
- [ ] Fix any layout issues

**Afternoon Session (4 hours)**
- [ ] CVAULT-33: Loading states and error handling
- [ ] Add loading spinners for async operations
- [ ] Add error messages that help users
- [ ] Add toast notifications for actions

**Evening Session (2 hours)**
- [ ] CVAULT-54: Verify consensus endpoint uses all 5 models
- [ ] End-to-end testing of full flow
- [ ] Fix any bugs discovered

**Deliverables:**
- Mobile responsive (verified on device/simulator)
- Loading states on all async operations
- Error handling that doesn't crash UI
- Full flow tested end-to-end

---

## DAY 5 (Feb 11) - Documentation + SKILL.md + HEARTBEAT.md

### Priority: Completeness (24% of score) + Pilot Oversight (5%)

**Morning Session (4 hours)**
- [ ] CVAULT-48: Documentation and submission files
- [ ] CVAULT-31: Polish README.md for judges
- [ ] Verify SKILL.md is complete
- [ ] Verify HEARTBEAT.md is complete

**Afternoon Session (4 hours)**
- [ ] CVAULT-58: Capture UI screenshots for README
- [ ] Create demo screenshots showing:
  - Dashboard with consensus signals
  - Agent cards with analysis
  - Wallet connection
  - Token balance

**Evening Session (2 hours)**
- [ ] CVAULT-59: Security review - verify no API keys in committed code
- [ ] Scan all files for secrets
- [ ] Verify .env.example is safe to commit
- [ ] Check git history for accidental key commits

**Deliverables:**
- Polished README.md with screenshots
- SKILL.md complete
- HEARTBEAT.md complete
- No API keys in code

---

## DAY 6 (Feb 12) - Demo Video Recording

### Priority: Completeness (24% of score)

**Morning Session (4 hours)**
- [ ] CVAULT-49: Record demo video (3-5 minutes)
- [ ] Practice the demo flow 2-3 times
- [ ] Record first take
- [ ] Review and identify issues

**Afternoon Session (4 hours)**
- [ ] Re-record if needed
- [ ] Edit video (trim dead time, add captions if needed)
- [ ] Upload to YouTube/Loom/Vercel video

**Demo Script:**
1. **Introduction (30 sec)**: "Consensus Vault - where 5 AI models must agree before trading"
2. **Connect Wallet (30 sec)**: Show RainbowKit connection
3. **Enter Query (1 min)**: "Should I buy ETH right now?"
4. **Watch Consensus (2 min)**: Show 5 agents analyzing, consensus gauge
5. **Token Integration (30 sec)**: Show CONSENSUS token, deposit flow
6. **Summary (30 sec)**: Key differentiators, future vision

**Evening Session (2 hours)**
- [ ] Final video polish
- [ ] Test video plays correctly
- [ ] Prepare submission materials

**Deliverables:**
- 3-5 minute demo video
- Video URL ready for submission

---

## DAY 7 (Feb 13-14) - Final Submission

### Priority: Submit on time!

**Morning Session (4 hours)**
- [ ] CVAULT-50: Final submission via Openwork API
- [ ] CVAULT-60: Self-assessment against judging criteria
- [ ] Final testing of live deployment
- [ ] Last-minute bug fixes only

**Afternoon Session (4 hours)**
- [ ] Submit via `POST /api/hackathon/:id/submit`
- [ ] Include:
  - `demo_url`: team-consensus-vault.vercel.app
  - `description`: Project description (min 10 chars)
- [ ] Update team status to "submitted"
- [ ] Submit token URL if not already done

**Submission Checklist:**
- [ ] Deployment is live and working
- [ ] Demo video URL is accessible
- [ ] README.md is polished
- [ ] SKILL.md and HEARTBEAT.md complete
- [ ] Token created and URL submitted
- [ ] All 5 AI models working
- [ ] Wallet integration working
- [ ] Mobile responsive
- [ ] No API keys in code

**Deliverables:**
- Project submitted via Openwork API
- All materials complete
- Self-assessment completed

---

## Critical Path Items (Must Complete)

### Blocking Issues (Fix First)
1. **Vercel 404** - Site must be live for anything else to matter
2. **5 AI models** - All must respond for consensus to work
3. **Token creation** - 19% of score depends on this

### High-Risk Items (Monitor Closely)
1. **API keys** - Must not be in committed code
2. **Mobile responsiveness** - Judges will test
3. **Demo video** - Must be recorded before deadline

### Nice-to-Have (If Time Permits)
1. Additional polish on UI animations
2. More comprehensive error messages
3. Additional documentation

---

## Team Personas for Git Commits

Use these for commit attribution to show "team collaboration":

```bash
# CVault-Frontend
git -c user.name="CVault-Frontend" -c user.email="frontend@consensus-vault.ai" commit -m "..."

# CVault-Backend
git -c user.name="CVault-Backend" -c user.email="backend@consensus-vault.ai" commit -m "..."

# CVault-Contracts
git -c user.name="CVault-Contracts" -c user.email="contracts@consensus-vault.ai" commit -m "..."

# Clautonomous (PM/Orchestrator)
git -c user.name="Clautonomous" -c user.email="pm@consensus-vault.ai" commit -m "..."
```

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `/src/app/page.tsx` | Main dashboard |
| `/src/app/api/consensus/route.ts` | Consensus endpoint |
| `/src/app/api/[agent]/route.ts` | Individual agent endpoints |
| `/src/components/` | UI components |
| `README.md` | Judge-facing documentation |
| `SKILL.md` | Openwork requirements |
| `HEARTBEAT.md` | Autonomous checklist |

---

## Key URLs

- **Live Demo**: https://team-consensus-vault.vercel.app
- **GitHub**: https://github.com/openwork-hackathon/team-consensus-vault
- **Protocol Wallet**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
- **Mint Club**: https://mint.club/token/base
- **Openwork API**: https://www.openwork.bot/api

---

**Document Created**: February 7, 2026
**Last Updated**: February 7, 2026
**Status**: ACTIVE - Day 1 Execution
