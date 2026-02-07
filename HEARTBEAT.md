# HEARTBEAT.md - Health Monitoring Checklist

**Project:** Consensus Vault - AI-Powered Autonomous Trading Vault
**Purpose:** Health monitoring checklist to ensure smooth operation during the hackathon
**Last Updated:** 2026-02-07

---

## How to Use This File

This file serves as a **periodic health check protocol** for the Lead Engineer and Human Pilot. During the 7-day hackathon, this checklist should be executed every 2-4 hours to ensure:

- Deployments stay healthy and accessible
- Core features are functional
- AI consensus system is operational
- Progress stays on track toward submission

**Execution:**
- Lead Engineer: Check this file at start of each work session
- Human Pilot: Review when resuming work after breaks
- Autonomous sessions: Run health checks before starting new tasks

---

## EVERY 2-4 HOURS CHECKLIST

### 1. Deployment Health Check ⚠️ CRITICAL
**Priority: URGENT - Do this first**

- [ ] **Verify site is accessible**
  ```bash
  curl -I https://team-consensus-vault.vercel.app
  ```
  - Expected: HTTP 200 OK
  - If 404/500/timeout: **DROP EVERYTHING** and fix immediately

- [ ] **Check Vercel deployment status**
  - Visit: https://vercel.com/dashboard
  - Verify latest deployment succeeded
  - Check for build errors or warnings
  - If failed: Check logs, identify issue, push fix

- [ ] **Test critical endpoints**
  ```bash
  # Test consensus API
  curl https://team-consensus-vault.vercel.app/api/consensus-detailed?asset=BTC

  # Test individual analyst endpoints
  curl https://team-consensus-vault.vercel.app/api/momentum-hunter?asset=BTC
  curl https://team-consensus-vault.vercel.app/api/whale-watcher?asset=BTC
  curl https://team-consensus-vault.vercel.app/api/on-chain-oracle?asset=BTC
  ```
  - Verify all return valid JSON
  - Check for timeout errors (should respond within 30 seconds)
  - If failing: Check API keys in Vercel environment variables

**Action if broken:** Fix immediately. Deployment issues block judging and demo.

---

### 2. AI Consensus System Health 🤖 HIGH PRIORITY
**Ensure the core feature is working**

- [ ] **Test 4/5 consensus mechanism**
  ```bash
  curl -X POST https://team-consensus-vault.vercel.app/api/consensus-detailed \
    -H "Content-Type: application/json" \
    -d '{"asset": "BTC", "context": "short-term trade"}'
  ```
  - Verify response includes all 5 analyst votes
  - Check `consensus_status` is one of: CONSENSUS_REACHED, NO_CONSENSUS, INSUFFICIENT_RESPONSES
  - Verify `vote_counts` are accurate
  - Confirm response times are reasonable (<5 seconds per model)

- [ ] **Verify AI analyst availability**
  - DeepSeek (Momentum Hunter): Active?
  - Kimi (Whale Watcher): Active?
  - MiniMax (Sentiment Scout): Active?
  - GLM (On-Chain Oracle): Active?
  - Gemini (Risk Manager): Active?

- [ ] **Check for API key issues**
  - Review Vercel logs for authentication errors
  - Verify no rate limit errors
  - Confirm all environment variables are set:
    - `DEEPSEEK_API_KEY`
    - `KIMI_API_KEY`
    - `MINIMAX_API_KEY`
    - `GLM_API_KEY`
    - `GEMINI_API_KEY`

**Why this matters:** The consensus mechanism is the core differentiator of our project.

---

### 3. Frontend UI Health 🎨 HIGH PRIORITY
**Ensure user-facing features work**

- [ ] **Test live site in browser**
  - Visit: https://team-consensus-vault.vercel.app
  - Verify page loads without errors
  - Check for console errors (open DevTools)
  - Verify all components render correctly:
    - Header with wallet connection
    - 5 analyst cards
    - Consensus meter / vote visualization
    - Trade signal display
    - Deposit modal (if implemented)

- [ ] **Test wallet connection**
  - Click "Connect Wallet" in header
  - Verify RainbowKit modal appears
  - Test connection with MetaMask or Coinbase Wallet
  - Confirm wallet address displays after connection
  - Verify Base network (Chain ID: 8453) is available

- [ ] **Test real-time consensus updates**
  - Trigger consensus analysis from UI
  - Verify analyst cards update in real-time (SSE)
  - Check consensus meter shows vote breakdown
  - Confirm trade signal appears when consensus reached

**Why this matters:** Judges will interact with the UI. First impression matters.

---

### 4. Push Local Work 📤 MEDIUM PRIORITY
**Keep repository current**

- [ ] **Check for uncommitted changes**
  ```bash
  cd ~/team-consensus-vault
  git status
  ```

- [ ] **If changes exist:**
  - Stage relevant files: `git add <files>`
  - Commit with proper format: `[LEAD] type(scope): description`
  - Push to GitHub: `git push origin main`
  - Verify deployment triggered on Vercel

- [ ] **Check git log**
  ```bash
  git log --oneline -5
  ```
  - Verify recent commits are descriptive
  - Confirm all work is pushed

**Why this matters:** Keeps work visible, prevents data loss, triggers auto-deployment.

---

### 5. Documentation Health 📚 MEDIUM PRIORITY
**Ensure submission materials are complete**

- [ ] **Verify required files exist:**
  - [ ] README.md (professional overview)
  - [ ] SKILL.md (team coordination playbook)
  - [ ] HEARTBEAT.md (this file)
  - [ ] docs/CONSENSUS_API.md (API documentation)

- [ ] **Check README.md accuracy:**
  - Project description is clear and compelling
  - Tech stack is accurate
  - Setup instructions work
  - Live deployment link is correct
  - Team members are listed

- [ ] **Verify ACTIVITY_LOG.md is current:**
  - Recent work is documented
  - Blockers are noted
  - Status updates are accurate

**Why this matters:** Judges will read these files. Quality documentation shows professionalism.

---

### 6. Issue Tracking & Progress 📋 LOW PRIORITY
**Monitor task completion**

- [ ] **Check Plane for current status**
  ```bash
  bash ~/plane-cli.sh backlog | grep CVAULT
  ```

- [ ] **Review task completion:**
  - How many tasks are done?
  - What's in_progress?
  - Any blocked tasks?
  - Are priorities correct?

- [ ] **Update task status if needed:**
  - Mark completed work as done
  - Document blockers
  - Adjust priorities for remaining time

- [ ] **Review milestone tracking:**
  - Are we on track for Day 6 goals?
  - What must be done today?
  - What can be deferred?

**Why this matters:** Clear priorities prevent wasted effort in final days.

---

### 7. Token Integration Status 💰 LOW PRIORITY
**Check governance token status**

- [ ] **Has CONSENSUS token been created?**
  - Check TOKEN_INFO.md for deployment details
  - If not created: Human pilot action required (see TOKEN_CREATION_GUIDE.md)
  - If created: Verify contract address is set in:
    - `.env.local` → `NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS`
    - `src/lib/wagmi.ts` → token configuration

- [ ] **If token exists, test integration:**
  - Visit Mint Club URL (check TOKEN_INFO.md)
  - Verify token is visible on Mint Club
  - Check token can be bought/sold
  - Confirm token balance displays in UI (if implemented)

- [ ] **Governance features:**
  - Can users vote with CONSENSUS tokens? (if implemented)
  - Is token purchase linked from UI?
  - Are token holders tracked?

**Why this matters:** Token integration is worth points, but NOT blocking if time is tight.

---

## PRIORITY ORDER (When Time-Constrained)

If you only have 5 minutes, do these in order:

1. ⚠️ **Deployment Check** (1 min) - Site must be up
2. 🤖 **Consensus API Test** (2 min) - Core feature must work
3. 🎨 **Frontend Quick Check** (1 min) - Load site, check for errors
4. 📤 **Push Work** (1 min) - Don't lose progress

If you have 15 minutes, add:

5. 📚 **Documentation Review** (5 min) - Verify submission materials
6. 📋 **Task Status** (3 min) - Check what's left to do
7. 💰 **Token Status** (2 min) - Note if blocked, defer if needed

---

## EMERGENCY ESCALATION

### When to Escalate to Human (Jonathan)

1. **Deployment completely broken** and can't fix in 30 min
2. **API keys expired or invalid** (need new keys from services)
3. **Vercel account issue** (billing, permissions, domain)
4. **Token creation blocked** (requires browser + wallet signing)
5. **Demo video needed** (requires screen recording and editing)
6. **Final submission** (requires Openwork platform interaction)

**Contact:** vanclute@gmail.com or via AgentMail (shazbot@agentmail.to)

### When to Stop Work

1. **Repeated deployment failures** (>3 failed builds in a row)
2. **All AI APIs down** (cannot provide consensus)
3. **Context limit reached** (run `/handoff` and resume)
4. **All tasks complete** (rare but possible!)

**Action:** Emit `[[SIGNAL:blocked:reason]]` and document in ACTIVITY_LOG.md

---

## AUTOMATED MONITORING

These checks should run automatically (if configured):

| Check | Frequency | Method | Purpose |
|-------|-----------|--------|---------|
| Deployment status | On git push | Vercel webhook | Auto-deploy to production |
| Build success | On deployment | Vercel logs | Catch build errors immediately |
| API health | Manual | cURL scripts | Verify endpoints functional |
| Frontend errors | Manual | Browser DevTools | Catch runtime errors |

**Manual monitoring required:** This project uses manual health checks, not automated monitoring services.

---

## DAILY CHECKLIST (Once per day)

In addition to the 2-4 hour checks, do this once daily:

- [ ] **Review progress against timeline**
  - Day 6 target: Documentation complete, polish UI, prepare demo
  - Day 7 target: Demo video, final submission
  - Are we on track?

- [ ] **Test full user journey**
  - Visit site as new user
  - Connect wallet
  - View consensus analysis
  - Attempt deposit (if implemented)
  - Check if flow is intuitive

- [ ] **Review competition**
  - Check other teams on Openwork (if visible)
  - Note interesting features or approaches
  - Don't copy, but learn from good ideas

- [ ] **Plan next session**
  - What must be done today?
  - What's the highest priority?
  - Any blockers to address?

---

## METRICS TO TRACK

Keep an eye on these indicators:

| Metric | Target | Warning Level | Critical Level |
|--------|--------|--------------|----------------|
| Deployment uptime | 100% | < 98% | < 95% |
| API response time | < 5s | > 10s | > 30s |
| Frontend load time | < 3s | > 5s | > 10s |
| Commits per day | 3-5 | < 2 | < 1 |
| Build time | < 2 min | > 5 min | > 10 min |
| Consensus success rate | > 80% | < 60% | < 40% |

**Check metrics:**
```bash
# Commits today
cd ~/team-consensus-vault
git log --oneline --since="midnight" | wc -l

# Test API response time
time curl https://team-consensus-vault.vercel.app/api/consensus-detailed?asset=BTC

# Check Vercel build time (via dashboard)
```

---

## KNOWN ISSUES & WORKAROUNDS

### Issue: CONSENSUS token not created
**Symptom:** TOKEN_INFO.md has placeholder contract address
**Status:** 🔶 BLOCKED - requires human with browser access
**Workaround:** Continue with other features. Token is nice-to-have, not must-have.
**Fix:** Follow TOKEN_CREATION_GUIDE.md step-by-step (15-30 min manual work)

### Issue: AI API timeout
**Symptom:** Individual analyst returns `status: "timeout"` or `status: "error"`
**Fix:**
- Check API key is valid (environment variable)
- Verify rate limits not exceeded (1 req/sec per model)
- Test API directly with cURL (bypass Next.js)
- Check service status (downforeveryoneorjustme.com)
- If persistent: Disable analyst temporarily, proceed with 4/4 consensus

### Issue: Vercel deployment timeout
**Symptom:** Build succeeds locally but fails on Vercel
**Fix:**
- Check build logs for specific error
- Verify environment variables are set in Vercel dashboard
- Check for missing dependencies in package.json
- Try `vercel --prod --force` to force rebuild
- Contact Vercel support if persistent

### Issue: Wallet connection fails
**Symptom:** RainbowKit modal doesn't open or connection fails
**Fix:**
- Clear browser cache and localStorage
- Try different wallet (MetaMask vs Coinbase Wallet)
- Verify Base network is configured in wagmi.ts
- Check RainbowKit setup in Providers.tsx
- Test on different browser

### Issue: Real-time updates not working
**Symptom:** Analyst cards don't update during consensus analysis
**Fix:**
- Verify SSE endpoint is working: `/api/consensus`
- Check browser DevTools Network tab for EventSource connection
- Confirm CORS headers allow SSE
- Test in different browser (some block SSE)
- Fallback: Use polling instead of SSE

---

## COMPLETION CRITERIA

This heartbeat protocol can be retired when:

1. ✅ Hackathon submission complete
2. ✅ Demo video recorded and submitted
3. ✅ All required documentation in repository
4. ✅ Project deployed and publicly accessible
5. ✅ Winner announced (or 3 days post-deadline)

Until then, **check this file every 2-4 hours during active development**.

---

## PUSH CADENCE & UPTIME EXPECTATIONS

### Git Push Frequency
- **Active Development:** Push every 1-2 hours (or after each feature)
- **Between Sessions:** Push before taking breaks
- **Bug Fixes:** Push immediately after verification
- **Documentation:** Push after completing each file

### Deployment Uptime
- **Target:** 99%+ uptime during judging period (Feb 7-14)
- **Expected Downtime:** <1 hour total (for deployments, fixes)
- **Monitoring:** Manual checks every 2-4 hours
- **Response Time:** Fix broken deployments within 30 minutes

### PR Management Workflow
- **No PRs Required:** Direct push to main branch (hackathon speed)
- **Optional PRs:** Use for major architectural changes requiring review
- **Merge Strategy:** Fast-forward merge if PR is used
- **Review Time:** < 1 hour if PR is created

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07 by Lead Engineer
**Status:** ✅ Ready for use

**Next Check Due:** [To be filled on each check]
