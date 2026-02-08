# CVAULT-49: Demo Video Recording Status Report

**Date:** 2026-02-08
**Task:** DAY 6: Record demo video (3-5 minutes)
**Status:** BLOCKED - Requires human action before recording

---

## Executive Summary

The demo video documentation package is complete and comprehensive, but **the live production app is not demo-ready** due to missing API keys on Vercel. All 5 AI analyst endpoints return errors.

### Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Documentation | READY | 8 comprehensive demo documents (117KB+) |
| Frontend UI | WORKING | 5 analyst cards, consensus meter, wallet button visible |
| AI Consensus Engine | BROKEN | All 5 API keys missing from Vercel |
| Wallet Connection | PARTIAL | UI works, WalletConnect project ID not configured |
| Vercel Deployment | WORKING | Site loads at team-consensus-vault.vercel.app |

---

## CRITICAL BLOCKERS (Require Human Action)

### Blocker 1: Missing Vercel Environment Variables

**Impact:** Live demo shows "Missing API key" errors for all 5 analysts

**Current behavior on team-consensus-vault.vercel.app:**
```json
{
  "deepseek": "Missing API key: DEEPSEEK_API_KEY",
  "kimi": "Missing API key: KIMI_API_KEY",
  "minimax": "Missing API key: MINIMAX_API_KEY",
  "glm": "Missing API key: GLM_API_KEY",
  "gemini": "Missing API key: GEMINI_API_KEY"
}
```

**Resolution:**
1. Log into Vercel dashboard: https://vercel.com/team_WcAaRh6rT96xt65bK1Rwlp4n/team-consensus-vault/settings/environment-variables
2. Add these environment variables (values from `.env.local`):
   - `DEEPSEEK_API_KEY=sk-943c6324cd754241a1b300c9d6415134`
   - `KIMI_API_KEY=sk-kimi-RCzRQDdiNBOyaj2Sug8r5R6quo3jH81yAJWQUZEsWH0h3nIMlv1BlUkyfbYdBbIc`
   - `MINIMAX_API_KEY=sk-cp-woDrsY5b_7WYeqduNiyzREX-khHWclVIL5pxDS_n17XfZhsXdHCwuXn-AXZ5_JFEsl3o1o_47AUE9G1fiNYQS3hB5BAhnAn3W2mT0hXzJegYB0UJtCTJuL4`
   - `GLM_API_KEY=c9a1301c667d4a24882d0b534028df85.jOf5QQSX5FThVQCS` (Note: may need account recharge)
   - `GEMINI_API_KEY` - NEEDS NEW KEY (current one is leaked/disabled)
3. Set scope to "Production"
4. Trigger redeploy: `vercel --prod`

### Blocker 2: Gemini API Key Leaked

**Impact:** Even if added to Vercel, Gemini (Risk Manager) won't work

**Error from Google:**
```json
{"code": 403, "message": "Your API key was reported as leaked. Please use another API key."}
```

**Resolution:**
1. Generate new API key at https://aistudio.google.com/apikey
2. Delete/revoke leaked key: `AIzaSyAjVNavgFw54Dq8slhDCBgDRYPai9spp0I`
3. Update `.env.local` with new key
4. Add new key to Vercel environment variables

### Blocker 3: GLM Account Balance

**Impact:** GLM (On-Chain Oracle) returns "insufficient balance" error

**Error:**
```json
{"code":"1113","message":"余额不足或无可用资源包,请充值。"}
```
(Translation: Insufficient balance, please recharge)

**Resolution:**
- Add credits to GLM/Zhipu account at https://open.bigmodel.cn/
- OR proceed with 4/5 analysts for demo (DeepSeek, Kimi, MiniMax, Gemini)

---

## Working Components

### 3 out of 5 AI APIs - VALIDATED

| Model | API Key Status | Production Status |
|-------|---------------|-------------------|
| DeepSeek (Momentum Hunter) | VALID | Missing from Vercel |
| Kimi (Whale Watcher) | VALID | Missing from Vercel |
| MiniMax (Sentiment Scout) | VALID | Missing from Vercel |
| GLM (On-Chain Oracle) | VALID but NO BALANCE | Missing from Vercel |
| Gemini (Risk Manager) | LEAKED/DISABLED | Needs new key |

### Frontend Features - VERIFIED

Tested at https://team-consensus-vault.vercel.app:
- All 5 analyst cards render correctly with avatars
- Consensus meter displays (showing 0% due to no data)
- Connect Wallet button visible (RainbowKit UI present)
- Asset display shows BTC/USD
- Trade signal component ready

---

## Demo Options

### Option A: Full Demo (Recommended)
**Prerequisites:** Fix all blockers above

1. Add all 5 API keys to Vercel
2. Generate new Gemini API key
3. (Optional) Add GLM credits or proceed with 4 analysts
4. Redeploy and test
5. Record demo with real AI responses

**Estimated time:** 30-60 min (depends on Vercel access)

### Option B: Partial Demo (Fallback)
**Prerequisites:** None (use current state)

1. Record demo with current app (showing UI)
2. The app has mock data fallback - may show simulated responses
3. Acknowledge in video: "For this demo, we're showing the UI flow"
4. Focus on architecture and vision rather than live AI responses

**Risk:** Judges may notice no real AI activity

### Option C: Local Demo (Alternative)
**Prerequisites:** `.env.local` has valid keys

1. Run local dev server: `cd ~/team-consensus-vault && npm run dev`
2. Record demo against localhost:3000
3. At least DeepSeek, Kimi, MiniMax should work
4. GLM and Gemini will still fail without fixes

**Downside:** Demo URL won't match live URL

---

## Documentation Ready

The following demo preparation documents are complete:

| File | Size | Purpose |
|------|------|---------|
| START_HERE_DEMO.md | 6.3KB | Navigation guide |
| DEMO_CHECKLIST.md | 16KB | Complete recording workflow |
| DEMO_VIDEO_SCRIPT.md | 20KB | Full narration with timing |
| DEMO_QUICK_REFERENCE.md | 6.3KB | One-page cheat sheet |
| DEMO_TECHNICAL_SETUP.md | 16KB | OBS/Loom configuration |
| DEMO_SHOT_LIST.md | 34KB | Visual storyboard (17 shots) |
| DEMO_GAPS_ANALYSIS.md | 13KB | Script validation report |
| RECORDING_READY_REPORT.md | 10KB | Preparation status |

### Script Already Updated

Three updates were made to match reality:
1. Removed query input step (feature not visible)
2. Token description uses future tense (accurate)
3. Backend architecture description corrected

---

## Recommended Next Steps

### For Jonathan (Human Action Required)

1. **Add API keys to Vercel** (5 min)
   - https://vercel.com/team_WcAaRh6rT96xt65bK1Rwlp4n/team-consensus-vault/settings/environment-variables
   - Copy values from `/home/shazbot/team-consensus-vault/.env.local`

2. **Generate new Gemini API key** (2 min)
   - https://aistudio.google.com/apikey
   - Add to Vercel as `GEMINI_API_KEY`

3. **Trigger redeploy** (2 min)
   ```bash
   cd ~/team-consensus-vault
   vercel login
   vercel --prod
   ```

4. **Test production** (3 min)
   ```bash
   curl https://team-consensus-vault.vercel.app/api/consensus?asset=BTC
   # Should return actual AI responses, not errors
   ```

5. **Record video** (30-60 min)
   - Follow `START_HERE_DEMO.md`
   - Use `DEMO_QUICK_REFERENCE.md` during recording

---

## Timeline to Deadline

- **Current Date:** 2026-02-08
- **Deadline:** ~Feb 14 (6 days remaining)
- **Time to fix blockers:** ~15 min (if credentials available)
- **Time to record:** 1-2 hours
- **Buffer:** Plenty of time if action taken soon

---

## Signals

[[SIGNAL:blocked:Vercel environment variables not configured - requires human action to add API keys via Vercel dashboard]]

---

**Prepared by:** Lead Engineer (Autonomous Mode)
**Task:** CVAULT-49
**Date:** 2026-02-08
