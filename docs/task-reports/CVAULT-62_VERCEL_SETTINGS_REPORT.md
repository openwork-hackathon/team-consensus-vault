# CVAULT-62: Vercel Project Settings Verification Report

**Date:** 2026-02-08 03:25 UTC
**Task:** DAY 1-AM: Check Vercel project settings and env vars
**Status:** Verified with findings requiring human action

---

## 1. GitHub Connection Status

**Status:** WORKING

- **Repository:** https://github.com/openwork-hackathon/team-consensus-vault
- **Default Branch:** main
- **Latest Commit:** fd0684b (Feb 7, 2026 21:02 UTC) - "docs: Add CVAULT-86 detailed activity log"
- **Auto-Deploy:** Enabled (commits trigger deployments)

The GitHub integration is functioning correctly. Commits to main automatically trigger Vercel deployments.

---

## 2. Deployment Status

**Status:** WORKING

- **URL:** https://team-consensus-vault.vercel.app
- **HTTP Status:** 200 OK
- **Cache Status:** x-vercel-cache: HIT
- **Region:** sfo1 (San Francisco)
- **Build:** Next.js application loads correctly

The previous deployment blocker (DEPLOYMENT_NOT_FOUND) has been resolved. The site is now live and serving the full application.

---

## 3. Environment Variables Status

### CRITICAL: ALL API KEYS ARE MISSING IN VERCEL

The live API endpoint confirms missing environment variables:

```
curl https://team-consensus-vault.vercel.app/api/consensus?asset=BTC
```

Returns errors for all 5 AI models:
- `Missing API key: DEEPSEEK_API_KEY`
- `Missing API key: KIMI_API_KEY`
- `Missing API key: MINIMAX_API_KEY`
- `Missing API key: GLM_API_KEY`
- `Missing API key: GEMINI_API_KEY`

### Required Environment Variables

| Variable | Purpose | Local Value | Vercel Status |
|----------|---------|-------------|---------------|
| `DEEPSEEK_API_KEY` | Momentum Hunter AI | Configured in .env.local | **NOT SET** |
| `KIMI_API_KEY` | Whale Watcher AI | Configured in .env.local | **NOT SET** |
| `MINIMAX_API_KEY` | Sentiment Scout AI | Configured in .env.local | **NOT SET** |
| `GLM_API_KEY` | On-Chain Oracle AI | Configured in .env.local | **NOT SET** |
| `GEMINI_API_KEY` | Risk Manager AI | Configured in .env.local | **NOT SET** |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Wallet connection | **NOT SET LOCALLY** | **NOT SET** |

### Local API Keys Available

All 5 AI model API keys exist in the local `.env.local` file at:
```
/home/shazbot/team-consensus-vault/.env.local
```

These need to be added to Vercel's environment variables.

---

## 4. Build Settings

**Status:** CORRECTLY CONFIGURED

From `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sfo1"]
}
```

Build settings are correct for a Next.js application.

---

## 5. Project Metadata

- **Vercel Project ID:** `prj_pizYRrkrjBvRIH20E6nnQ7VoVT7u`
- **Vercel Org ID:** `team_WcAaRh6rT96xt65bK1Rwlp4n`
- **Project Name:** `team-consensus-vault`

Note: The VERCEL_DEPLOYMENT_BLOCKER.md file references a different project ID (`prj_FbiD470CjV1T9EfHJmlywGqrsRXP`) which may be from Openwork's system. The local `.vercel/project.json` shows the actual linked project.

---

## 6. Required Actions (Human/Manual)

### Priority 1: Set Environment Variables in Vercel (CRITICAL)

The AI consensus feature is completely broken in production because no API keys are configured. This must be done via the Vercel dashboard or CLI with authentication.

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/team_WcAaRh6rT96xt65bK1Rwlp4n/team-consensus-vault/settings/environment-variables
2. Add each variable from `.env.local`
3. Set scope to "Production" (and optionally Preview/Development)
4. Redeploy after setting variables

**Option B: Via Vercel CLI (requires login)**
```bash
cd ~/team-consensus-vault
vercel login
vercel env add DEEPSEEK_API_KEY production
# (repeat for each variable)
vercel --prod  # trigger redeploy
```

### Priority 2: Configure WalletConnect Project ID

1. Get a project ID from https://cloud.walletconnect.com/
2. Add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to Vercel
3. This is needed for wallet connection functionality

### Priority 3: Verify Database/Backend Connections

The project includes `@vercel/kv` dependency but no KV database URL was found. Check if Vercel KV storage is needed and configure if so.

---

## 7. Current Application Status

| Feature | Status |
|---------|--------|
| Frontend UI | Working |
| 5 AI Analyst Cards | Displayed (but showing errors) |
| Consensus Meter | Displayed (showing 0%) |
| Wallet Connection | UI present, WalletConnect not configured |
| SSE Streaming | Working (returns API key errors) |
| Trade Execution | UI ready, awaiting backend |

---

## Summary

The Vercel deployment infrastructure is working correctly:
- GitHub integration is connected and auto-deploying
- Build process completes successfully
- Site is live and accessible

However, **all AI functionality is broken** because environment variables are not set in Vercel. The API keys exist locally but must be manually added to Vercel's environment variable settings.

**Impact:** Judges viewing the demo will see the UI but the AI analysts will show "Missing API key" errors instead of real analysis.

**Urgency:** HIGH - This should be fixed before any demo or presentation.

---

**Verified by:** Lead Engineer (Claude Code autonomous mode)
**Task:** CVAULT-62
