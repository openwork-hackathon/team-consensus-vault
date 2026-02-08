# Vercel Deployment Issue — URGENT FIX REQUIRED

**Status:** CRITICAL — Deployment returns 404
**Impact:** Cannot demo live production URL in video
**Discovered:** 2026-02-07 21:40 UTC
**Deadline:** Before hackathon submission (~Feb 14)

---

## Current State

**URL:** https://team-consensus-vault.vercel.app
**HTTP Response:** 404 Not Found
**Error Header:** `x-vercel-error: DEPLOYMENT_NOT_FOUND`
**Response Body:** "The deployment you are looking for was not found"

**Test Command:**
```bash
curl -I https://team-consensus-vault.vercel.app
# Returns: HTTP/2 404
```

---

## Root Cause Analysis

**Possible Causes:**
1. **Deployment deleted** — Someone may have accidentally deleted the production deployment
2. **Vercel project misconfigured** — Project settings pointing to wrong repo/branch
3. **GitHub connection broken** — Repo disconnected from Vercel
4. **Build failed** — Recent commit broke the build, auto-deploy failed
5. **Billing/access issue** — Vercel account problem (unlikely, but possible)

**Most Likely:** Option 1 or 2 (deployment deleted or misconfigured)

---

## Verification Steps

### 1. Check Vercel Dashboard
```
Go to: https://vercel.com/dashboard
Find project: team-consensus-vault
Check:
  - Project exists?
  - Latest deployment status?
  - Any error messages?
  - GitHub repo connected?
```

### 2. Check Git History
```bash
cd ~/team-consensus-vault
git log --oneline -10
# Latest commit: 0d63d3d docs: Add CVAULT-86 detailed activity log
# Build should succeed with this commit
```

### 3. Check Local Build
```bash
cd ~/team-consensus-vault
npm run build
# If this succeeds locally, Vercel build should work
```

---

## Fix Options

### Option A: Re-deploy via Vercel Dashboard (EASIEST)
1. Log in to https://vercel.com/dashboard
2. Find project "team-consensus-vault"
3. Go to **Deployments** tab
4. Click **"Deploy"** button (top right)
5. Select branch: `main`
6. Click **"Deploy"**
7. Wait 2-3 minutes for build to complete
8. Verify: `curl https://team-consensus-vault.vercel.app` returns 200

### Option B: Re-deploy via Vercel CLI
```bash
cd ~/team-consensus-vault

# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project? Yes
# - Project name: team-consensus-vault
# - Production deployment? Yes

# Wait for build to complete
# URL will be displayed when done
```

### Option C: Push to Trigger Auto-Deploy
```bash
cd ~/team-consensus-vault

# Make an empty commit to trigger CI/CD
git commit --allow-empty -m "chore: trigger Vercel re-deploy for CVAULT-84 demo"

# Push to main branch
git push origin main

# Check Vercel dashboard for build status
# Should auto-deploy within 2-3 minutes
```

### Option D: Create New Vercel Project (LAST RESORT)
If project was deleted entirely:
```bash
cd ~/team-consensus-vault

# Remove old .vercel directory if it exists
rm -rf .vercel

# Create new project
vercel --prod

# Follow prompts to create new project
# Update README.md with new URL
```

---

## Environment Variables to Verify

After re-deploying, ensure these are set in Vercel dashboard:

**Navigate to:** Project Settings → Environment Variables

**Required Variables:**
- `DEEPSEEK_API_KEY` (from ~/agents/deepseek/config.json)
- `KIMI_API_KEY` (from ~/agents/kimi/config.json)
- `MINIMAX_API_KEY` (from ~/agents/minimax/config.json)
- `GLM_API_KEY` (from ~/agents/glm/config.json)
- `GEMINI_API_KEY` (from ~/openclaw-staging/credentials/gemini-api-key.txt)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional, for WalletConnect)

**To find API keys:**
```bash
# DeepSeek
jq -r '.api_key' ~/agents/deepseek/config.json

# Kimi
jq -r '.api_key' ~/agents/kimi/config.json

# MiniMax
jq -r '.api_key' ~/agents/minimax/config.json

# GLM
jq -r '.api_key' ~/agents/glm/config.json

# Gemini
cat ~/openclaw-staging/credentials/gemini-api-key.txt
```

**Important:** Set scope to "Production, Preview, and Development" for all variables

---

## Verification After Fix

Once re-deployed, verify:

### 1. HTTP 200 Response
```bash
curl -I https://team-consensus-vault.vercel.app
# Should return: HTTP/2 200 (not 404)
```

### 2. Page Content Loads
```bash
curl https://team-consensus-vault.vercel.app | grep "Consensus Vault"
# Should find page title
```

### 3. API Endpoints Work
```bash
# Test consensus API (may take 30 seconds)
curl -X POST https://team-consensus-vault.vercel.app/api/consensus-detailed \
  -H "Content-Type: application/json" \
  -d '{"asset": "BTC", "context": "test"}'

# Should return JSON with consensus result
```

### 4. UI Loads in Browser
- Open browser: https://team-consensus-vault.vercel.app
- Should see landing page with 5 analyst cards
- Connect wallet button should be visible
- "Analyze BTC" button should trigger consensus

---

## Demo Video Workaround (If Vercel Fix Delayed)

**If Vercel deployment cannot be fixed before recording:**

1. **Use localhost:3000 for recording** (confirmed working)
2. **In voiceover, still mention the production URL:**
   > "Visit team-consensus-vault.vercel.app to try it yourself"
3. **Add disclaimer in video description:**
   > "Demo recorded on local development server (localhost:3000). Production deployment at team-consensus-vault.vercel.app is being updated."
4. **Fix Vercel ASAP after recording** — must be live before final submission

**Dev Server Command:**
```bash
cd ~/team-consensus-vault
npm run dev
# Visit: http://localhost:3000
```

---

## Timeline & Priority

**Priority:** HIGH — Blocks demo video and final submission
**Deadline:** Before February 14, 2026 (hackathon submission)
**Estimated Fix Time:** 15-30 minutes (Option A or B)

**Action Plan:**
1. ⚠️ **TODAY:** Try Option A (Vercel dashboard re-deploy) — 10 minutes
2. ⚠️ **If Option A fails:** Try Option B (Vercel CLI) — 15 minutes
3. ⚠️ **If Option B fails:** Try Option C (git push trigger) — 5 minutes
4. ⚠️ **Last resort:** Option D (new project) — 30 minutes + update docs

**Owner:** Human Pilot (Jonathan) — requires browser access to Vercel dashboard

---

## Related Files

- **Demo Script:** `~/team-consensus-vault/docs/demo-script.md`
- **Activity Log:** `~/agents/claude/output/cvault-activity.log`
- **Project README:** `~/team-consensus-vault/README.md`
- **GitHub Repo:** https://github.com/openwork-hackathon/team-consensus-vault
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## Notes

- Local dev server is **confirmed working** at http://localhost:3000
- Last successful git commit: `0d63d3d` (docs: Add CVAULT-86 detailed activity log)
- GitHub repo is accessible and up-to-date
- All 5 AI analyst API keys are configured in local `.env.local`
- No recent commits that would break the build

**The code is working — this is purely a deployment configuration issue.**

---

**Document Created:** 2026-02-07 21:45 UTC
**Task:** CVAULT-84 (Demo video preparation)
**Lead Engineer:** Claude Sonnet 4.5
