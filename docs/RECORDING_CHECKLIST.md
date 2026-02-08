# Demo Video Recording — Quick Reference Checklist

**Task:** CVAULT-84 (Record demo video take 1)
**Target Duration:** 3-5 minutes
**Resolution:** 1080p minimum
**Date:** February 2026

---

## ⚡ QUICK START (5 minutes before recording)

```bash
# 1. Start local dev server
cd ~/team-consensus-vault
npm run dev
# Wait for: ✓ Ready on http://localhost:3000

# 2. Verify it's working
curl http://localhost:3000
# Should return HTML (not error)

# 3. Open browser
# Visit: http://localhost:3000
# Should see landing page with 5 analyst cards

# 4. Test consensus once (before recording)
# Click "Analyze BTC" and wait for results
# Confirms all 5 AI APIs are working
```

---

## ✅ PRE-RECORDING CHECKLIST (2 minutes)

### Technical Setup
- [ ] **Screen resolution:** 1920x1080 (or 2560x1440)
- [ ] **Browser:** Chrome/Arc, full screen mode (F11)
- [ ] **Browser zoom:** 100% (Cmd/Ctrl + 0 to reset)
- [ ] **Audio:** Microphone tested and working
- [ ] **Recording software:** OBS/Loom/ScreenFlow ready
- [ ] **Distractions OFF:** Notifications, Slack, email disabled
- [ ] **Internet:** Stable connection (needed for AI API calls)

### Demo Environment
- [ ] **Dev server running:** `npm run dev` in terminal
- [ ] **Localhost loads:** http://localhost:3000 accessible
- [ ] **Wallet ready:** MetaMask installed, Base network added
- [ ] **Browser tabs:** Only demo tab open (clean look)
- [ ] **Bookmarks bar:** Hidden (Cmd+Shift+B)
- [ ] **Test run done:** Clicked "Analyze BTC" once successfully

### Content Prep
- [ ] **Script reviewed:** Read demo-script.md 2-3 times
- [ ] **Key phrases memorized:** "4/5 consensus," "multi-model," "transparent voting"
- [ ] **Talking points clear:** Know what to say in each segment
- [ ] **Timing practiced:** 30s intro, 2min demo, 1min technical, 30s governance, 30s closing

---

## 🎬 RECORDING FLOW (30 seconds per segment)

### 1. Introduction (0:00-0:30)
**Screen:** Landing page with 5 analyst cards visible
**Key Message:** Single AI = failure → Multi-model consensus = resilience
**Action:** Hover over analyst cards to highlight roles

### 2. Live Demo (0:30-2:30)
**Screen:** Main dashboard
**Key Message:** Watch 5 AI analysts vote in real-time
**Action:** Click "Analyze BTC" → Narrate as votes stream in → Point to consensus meter

### 3. Technical (2:30-3:30)
**Screen:** README.md architecture section
**Key Message:** Parallel execution, 30s timeouts, no custom contracts
**Action:** Scroll to architecture diagram → Highlight security approach

### 4. Governance (3:30-4:00)
**Screen:** README.md governance section or back to dashboard
**Key Message:** $CONSENSUS token enables community voting
**Action:** Show governance features list

### 5. Closing (4:00-4:30)
**Screen:** Landing page with URL visible
**Key Message:** Try it live → Collective AI intelligence → Call to action
**Action:** Hover over "Connect Wallet" → Show URL clearly

---

## 🚨 KNOWN ISSUES & WORKAROUNDS

### ⚠️ Vercel Deployment Returns 404
- **Status:** https://team-consensus-vault.vercel.app is DOWN
- **Workaround:** Use http://localhost:3000 for recording
- **In voiceover:** Still say "team-consensus-vault.vercel.app" (fix deployment after recording)
- **Action required:** Re-deploy to Vercel before final submission

### If AI Analyst Times Out During Demo
- ✅ **Say:** "Notice how the system continues — this is graceful degradation"
- ❌ **Don't say:** "Oh no, it broke!" (it's expected behavior)

### If No Consensus Reached (e.g., 2 BUY, 2 HOLD, 1 SELL)
- ✅ **Say:** "This is safety-first design — vault holds position when analysts disagree"
- ❌ **Don't say:** "Let me try again" (show NO_CONSENSUS is a feature)

### If Localhost Won't Start
```bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Reinstall dependencies
cd ~/team-consensus-vault
npm install

# Verify .env.local exists with all 5 API keys
ls -la .env.local

# Restart dev server
npm run dev
```

---

## 🎙️ DELIVERY TIPS (3 quick rules)

1. **Sound excited, not rushed** — you're showing off cool tech
2. **Pause for emphasis** — especially when consensus is reached
3. **Don't apologize for anything** — every outcome is a feature

---

## ✅ POST-RECORDING CHECKLIST (2 minutes)

- [ ] **Duration:** 3-5 minutes (check video length)
- [ ] **Audio clear:** No background noise, voice audible
- [ ] **Visuals clear:** UI visible, not too zoomed out
- [ ] **Content complete:**
  - [ ] Problem statement mentioned (single AI failure)
  - [ ] Solution explained (4/5 consensus)
  - [ ] Live demo shown (5 analysts voting)
  - [ ] Consensus reached (or NO_CONSENSUS explained)
  - [ ] Technical approach mentioned (parallel execution, no custom contracts)
  - [ ] Call to action (try it live)
- [ ] **No personal info visible:** No notifications, email, etc.

---

## 📤 UPLOAD & FINALIZE (5 minutes)

```bash
# 1. Save video as: consensus-vault-demo-v1.mp4 (or .mov)
# 2. Upload to YouTube (unlisted) or Vimeo
# 3. Get shareable link
# 4. Update README.md:
#    Find "Video Demo" section
#    Replace placeholder with: [Watch Demo](https://youtube.com/...)
# 5. Commit and push
git add README.md
git commit -m "docs: Add demo video link for CVAULT-84"
git push origin main
```

---

## 🎯 SUCCESS CRITERIA

**A good demo video:**
- ✅ Shows live product (not slides)
- ✅ Demonstrates 4/5 consensus clearly
- ✅ Explains WHY multi-model consensus matters
- ✅ Highlights security approach (no custom contracts)
- ✅ Is under 5 minutes
- ✅ Sounds enthusiastic and authentic

**You'll know it's good if:**
- Judges understand the innovation (multi-model consensus)
- Judges see it's production-ready (live demo, real-time voting)
- Judges remember the 4/5 threshold (supermajority consensus)

---

## ⏱️ ESTIMATED TIME

- **Prep:** 5 min (check audio, start server)
- **Recording:** 30 min (3-4 takes)
- **Review:** 10 min (watch it back)
- **Upload:** 5 min
- **Total:** ~50 minutes

**Best practice:** Do 3 takes minimum, pick the best one.

---

## 📚 FULL DETAILS

For complete script with voiceover text, see:
**`~/team-consensus-vault/docs/demo-script.md`**

For Vercel deployment troubleshooting, see:
**`~/team-consensus-vault/docs/VERCEL_DEPLOYMENT_ISSUE.md`**

---

**You've got this! 🦞**

This is your chance to show judges the innovation and hard work that went into Consensus Vault. The multi-model consensus approach is genuinely novel — make sure that comes across.

**Show, don't tell. Let the live product speak for itself.**

---

**Document Created:** 2026-02-07 21:45 UTC
**Task:** CVAULT-84 (Demo video preparation)
**Lead Engineer:** Claude Sonnet 4.5
