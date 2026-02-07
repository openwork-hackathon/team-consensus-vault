# Demo Video Recording Checklist

**Task:** CVAULT-49 (Day 6 Demo Video Preparation)
**Prepared:** 2026-02-07
**Target Recording Date:** Before Feb 14, 2026
**Duration Target:** 3:30 - 4:30 minutes

---

## ✅ PRE-RECORDING VERIFICATION (Do This 24 Hours Before)

### App Deployment Status
- [ ] Visit https://team-consensus-vault.vercel.app
- [ ] Verify page loads without errors
- [ ] Check that all 5 analyst cards render correctly
- [ ] Confirm asset selector shows BTC/USD (or current default)
- [ ] Test consensus query submission (type test query, click submit)
- [ ] Verify AI responses stream in real-time (watch for typing indicators)
- [ ] Check that consensus meter updates as votes arrive
- [ ] Confirm trade signal appears when consensus ≥ 80%

**If deployment fails:**
```bash
cd ~/team-consensus-vault
git status  # Check for uncommitted changes
git push origin main  # Ensure latest code is pushed
npx vercel --prod  # Redeploy
```

### Wallet Connection Test
- [ ] Install wallet extension (MetaMask, Rainbow, or Coinbase Wallet)
- [ ] Switch to Base Mainnet network (Chain ID: 8453)
- [ ] Add small amount of ETH (~$5) for gas fees (optional)
- [ ] Test wallet connection flow:
  - [ ] Click "Connect Wallet" button
  - [ ] Select wallet from RainbowKit modal
  - [ ] Approve connection in wallet extension
  - [ ] Verify wallet address appears in header
  - [ ] Test disconnect/reconnect

**If wallet connection fails:**
- Plan to skip this step in video and describe it verbally
- Prepare fallback: "Users connect their Web3 wallet here using RainbowKit"

### Browser & Desktop Preparation
- [ ] **Browser:** Chrome or Brave recommended (best Web3 support)
- [ ] **Zoom:** Set to 100% (Ctrl+0 or Cmd+0)
- [ ] **Extensions:** Disable ad blockers, keep wallet extension
- [ ] **Tabs:** Close all except demo app (and GitHub for credits section)
- [ ] **Notifications:** Disable browser notifications (Settings → Notifications → Blocked)
- [ ] **Bookmarks Bar:** Hide it (Ctrl+Shift+B)
- [ ] **Desktop:** Set Do Not Disturb mode
- [ ] **Close Apps:** Slack, Discord, email, music players
- [ ] **Desktop Background:** Use neutral/solid color (not busy wallpaper)
- [ ] **Silence Phone:** Turn off or mute

---

## 🎙️ AUDIO/VIDEO SETUP (1 Hour Before Recording)

### Recording Software Selection

**Option A: OBS Studio (Best Quality)**
- [ ] Install OBS from https://obsproject.com/
- [ ] Create scene: "Full Screen Demo"
  - [ ] Add Window Capture source (browser window)
  - [ ] Add Audio Input Capture (microphone)
- [ ] Settings → Output:
  - [ ] Recording Format: MP4
  - [ ] Recording Quality: High Quality, Medium File Size
  - [ ] Encoder: x264
- [ ] Settings → Video:
  - [ ] Base Resolution: 1920x1080
  - [ ] Output Resolution: 1920x1080
  - [ ] FPS: 30
- [ ] Settings → Audio:
  - [ ] Sample Rate: 48kHz
  - [ ] Channels: Stereo
  - [ ] Mic/Auxiliary: Select your microphone
- [ ] Test recording: Record 30 seconds, verify quality

**Option B: Loom (Easiest)**
- [ ] Install Loom from https://www.loom.com/download
- [ ] Click Loom icon → "Screen + Camera" or "Screen Only"
- [ ] Settings → Recording:
  - [ ] Quality: 1080p
  - [ ] Frame Rate: 30 fps
  - [ ] Microphone: Select your mic
- [ ] Select recording area: Full Screen or Browser Window
- [ ] Test recording: 30 seconds, verify quality

### Audio Test
- [ ] **Microphone selected** (external USB mic preferred, headset acceptable)
- [ ] **Position:** 6-8 inches from mouth
- [ ] **Test recording:**
  - [ ] Record 30 seconds of speech
  - [ ] Play back and check for:
    - [ ] Background noise (fans, AC, traffic)
    - [ ] Echo or reverb
    - [ ] Volume too low/high
    - [ ] Mouth sounds (pops, clicks)
- [ ] **Fix issues:**
  - [ ] Echo → Use headphones
  - [ ] Background noise → Close windows, turn off AC/fans
  - [ ] Low volume → Move mic closer
  - [ ] Pops → Use pop filter or speak slightly off-axis

### Environment Setup
- [ ] **Room:** Quiet space (no background noise)
- [ ] **Lighting:** Good lighting if using camera (optional)
- [ ] **Comfort:** Comfortable chair, room temperature comfortable
- [ ] **Hydration:** Glass of water nearby (avoid dry mouth)
- [ ] **Script Access:** DEMO_QUICK_REFERENCE.md visible on second monitor or printed

---

## 📝 DEMO SCENARIO PREPARATION (30 Minutes Before)

### Primary Demo Query (Recommended)
**Query:** "Should I buy Bitcoin at current levels?"

**Expected Flow:**
1. Type query in input field (type slowly for readability)
2. Click Submit button
3. Watch 5 analyst cards show "Analyzing..." with typing indicators
4. Wait for responses to stream in (~6-8 seconds)
5. Observe consensus meter filling as votes arrive
6. See trade signal appear when consensus ≥ 80%

**Test this query now:**
- [ ] Load app
- [ ] Submit query
- [ ] Verify all 5 agents respond
- [ ] Check consensus meter updates correctly
- [ ] Confirm trade signal appears (or doesn't, depending on current market)

**If consensus doesn't reach 80%:** This is fine! Adjust narration:
> "Notice the consensus is only 65% here — the system is being cautious and won't auto-trade without strong agreement."

### Backup Query (If Needed)
**Query:** "Is Ethereum a good investment right now?"

### Wallet Demo Preparation
- [ ] Wallet connected before recording (saves time)
- [ ] Small ETH balance visible (optional, for authenticity)
- [ ] Know how to show wallet address in extension

---

## 🎬 RECORDING SESSION CHECKLIST (Right Before Recording)

### Final Pre-Flight Check (5 Minutes Before)
- [ ] App loaded at https://team-consensus-vault.vercel.app
- [ ] Browser in full screen or clean window (F11 or Cmd+Ctrl+F on Mac)
- [ ] Recording software open and tested
- [ ] Microphone tested and working
- [ ] Audio levels good (-12 to -6 dB in OBS)
- [ ] Desktop clean (no sensitive files visible)
- [ ] Notifications silenced (OS + browser)
- [ ] Phone silenced
- [ ] DEMO_QUICK_REFERENCE.md visible for reference
- [ ] Water nearby
- [ ] Deep breath, relax shoulders

### Recording Procedure
1. **Start recording** (OBS: Click "Start Recording" or Loom: Click "Start")
2. **Count to 3 silently** (gives clean audio start)
3. **Begin narration** (follow DEMO_VIDEO_SCRIPT.md structure)
4. **Perform demo flow:**
   - Show dashboard with 5 analysts
   - Submit consensus query
   - Point to consensus meter as it fills
   - Highlight trade signal when it appears
   - Connect wallet (or describe)
   - Show GitHub page for credits
5. **Stop recording** when complete
6. **Save file immediately** (don't lose it!)

---

## 🎯 NARRATION GUIDE (Quick Reference)

### Section 1: Intro (0:00 - 0:30)
**Visual:** Landing page

> "Have you ever wondered how institutional traders make decisions worth millions of dollars? They don't trust just one analyst. They get consensus from entire teams of experts. We're bringing that same wisdom-of-crowds approach to DeFi — but instead of human analysts... we're using five specialized AI models that analyze markets 24/7 and only trade when they reach consensus. This is Consensus Vault. Let me show you how it works."

### Section 2: Demo (0:30 - 2:30)
**Visual:** Dashboard → Query → Results → Signal

**Dashboard (0:30 - 1:00):**
> "Here's the Consensus Vault dashboard. You're looking at five AI analyst models, each with a specialized role: DeepSeek Quant for technical analysis, Kimi Macro for on-chain data, MiniMax Sentiment for market psychology, GLM Technical for price action, and Gemini Risk for risk assessment."

**Query (1:00 - 1:20):**
> "Let's ask them about Bitcoin. [Type query slowly] Watch what happens next. All five agents start analyzing simultaneously — but independently."

**Consensus (1:20 - 2:15):**
> "See the typing indicators? Each agent is processing the query right now. [Wait for results] DeepSeek just finished — 85% confidence, bullish. Now Kimi weighs in — also bullish. Watch the consensus meter at the top. It's calculating agreement across all agents."

**Signal (2:15 - 2:30):**
> "When consensus reaches 80% or higher, the vault triggers a trade signal. Four out of five agents agree: BUY Bitcoin. That's 84% consensus."

### Section 3: Tech Stack (2:30 - 3:15)
**Visual:** App or GitHub page

> "Let's talk about how this is built. The frontend is Next.js with TypeScript and Tailwind CSS. The backend is a FastAPI orchestrator coordinating five AI models in parallel: Claude Sonnet, DeepSeek, Kimi, Gemini, and GLM. On the blockchain side, we're deployed on Base network using Mint Club V2 for the $CONSENSUS token. No custom smart contracts — we're using audited, battle-tested infrastructure. The key innovation is the multi-model consensus engine. When they agree, that signal is far more reliable than any one model alone."

### Section 4: Vision (3:15 - 4:00)
**Visual:** App

> "This is just the beginning. Phase 1 is automated crypto trading with multi-model consensus. Phase 2: expanding to other asset classes. Phase 3: Decentralized governance where $CONSENSUS token holders vote on which AI models to include. The vision? A fully autonomous investment DAO where the wisdom of AI crowds outperforms any single fund manager."

### Section 5: Credits (4:00 - 4:30)
**Visual:** GitHub repo page

> "Consensus Vault was built by a team of four autonomous AI agents during the Openwork Clawathon. The code is open source on GitHub. The live demo is at team-consensus-vault.vercel.app. Thanks for watching. Let's bring the wisdom of AI crowds to DeFi."

---

## ⚠️ COMMON ISSUES & FIXES

### Issue: App Shows Loading State Forever
**Fix:** Refresh page, check browser console (F12) for errors
**Workaround:** Explain the feature verbally while showing UI

### Issue: Wallet Connection Fails
**Fix:** Check wallet extension is installed and unlocked
**Workaround:** Skip wallet step, say "Users connect their wallet here with RainbowKit"

### Issue: Consensus Doesn't Reach 80%
**Fix:** This is actually good! Shows system working correctly
**Adjust:** "Notice the system is being cautious — it won't auto-trade without strong agreement"

### Issue: Audio Has Echo
**Fix:** Use headphones to prevent speaker feedback
**Workaround:** Re-record audio separately, overlay in editing

### Issue: You Stumble or Make Mistake
**Fix:** Pause 2 seconds, restart sentence (you can edit later)
**For big mistake:** Pause 5 seconds, say "Let me restart this section"

### Issue: Running Long (Over 5 Minutes)
**Fix:**
- Cut intro to 20 seconds
- Shorten tech stack to 30 seconds
- Remove future vision section
- Minimum viable: Intro (0:20) + Demo (2:30) + Credits (0:10) = 3:00

### Issue: Running Short (Under 3 Minutes)
**Fix:**
- Add more detail during demo (explain each analyst's reasoning)
- Show wallet connection flow in full
- Add tech stack details

---

## ✅ POST-RECORDING CHECKLIST

### Immediate Review (Right After Recording)
- [ ] Watch full recording once through
- [ ] Check audio quality (no echo, background noise, volume consistent)
- [ ] Check video quality (1080p, smooth, no glitches)
- [ ] Verify URLs are visible (team-consensus-vault.vercel.app)
- [ ] Confirm duration is 3:00 - 5:00 minutes
- [ ] Note any mistakes or sections to re-record

### Decision Point
- [ ] **Happy with recording?** → Proceed to editing
- [ ] **Not satisfied?** → Do Take 2 (usually better than Take 1)

### Basic Editing (Optional But Recommended)
- [ ] Trim silence at start (first 1-2 seconds)
- [ ] Trim silence at end (last 1-2 seconds)
- [ ] Cut out long pauses (>3 seconds)
- [ ] Cut out major mistakes or restarts
- [ ] Normalize audio volume (prevent clipping)
- [ ] Add title card (optional): "Consensus Vault — Openwork Clawathon Demo"
- [ ] Add end card (optional): Team credits, URLs

### Export Settings
- [ ] **Format:** MP4
- [ ] **Codec:** H.264
- [ ] **Resolution:** 1920x1080 (1080p)
- [ ] **Frame Rate:** 30 fps
- [ ] **Bitrate:** 5-10 Mbps (higher = better quality but larger file)
- [ ] **Audio:** AAC, 192 kbps, 48kHz

---

## 📤 UPLOAD & SUBMISSION CHECKLIST

### YouTube Upload
- [ ] Go to youtube.com
- [ ] Click "Create" → "Upload video"
- [ ] Select MP4 file
- [ ] **Title:** "Consensus Vault — Openwork Clawathon Demo"
- [ ] **Description:**
  ```
  Consensus Vault: The Wisdom of AI Crowds

  An autonomous trading vault powered by multi-model consensus.
  Five specialized AI analyst models (Claude, DeepSeek, Kimi,
  Gemini, GLM) independently analyze crypto markets and execute
  trades when reaching ≥80% agreement.

  Live Demo: https://team-consensus-vault.vercel.app
  GitHub: https://github.com/openwork-hackathon/team-consensus-vault

  Built for the Openwork Clawathon (February 2026)
  ```
- [ ] **Visibility:** Unlisted (anyone with link can view) or Public
- [ ] Click "Publish"
- [ ] Copy YouTube URL
- [ ] Test URL in incognito window (verify it works)

### Hackathon Submission
- [ ] **Video URL:** [YouTube link]
- [ ] **GitHub Repo:** https://github.com/openwork-hackathon/team-consensus-vault
- [ ] **Live Demo:** https://team-consensus-vault.vercel.app
- [ ] **Team Name:** Consensus Vault
- [ ] **Team Members:** Clautonomous (PM), CVault-Backend, CVault-Frontend, CVault-Contracts
- [ ] **Submission Deadline:** Before ~Feb 14, 2026

### Final QA
- [ ] Video is 3:00 - 5:00 minutes long ✓
- [ ] Video shows working demo (not just slides) ✓
- [ ] Audio is clear (no echo, background noise) ✓
- [ ] Video is 1080p resolution ✓
- [ ] URLs are visible and correct ✓
- [ ] GitHub repo is public ✓
- [ ] Live demo URL is accessible ✓
- [ ] Team members are listed ✓
- [ ] Submitted before deadline ✓

---

## 📊 RECORDING TIPS SUMMARY

### Voice & Pacing
- ✅ Speak 10% slower than normal conversation
- ✅ Pause between sections (easier to edit)
- ✅ Smile while talking (improves voice warmth)
- ✅ Enunciate technical terms clearly
- ❌ Don't say "um," "uh," "like" (pause silently instead)
- ❌ Don't rush — viewers need time to process

### Mouse & Screen
- ✅ Move cursor slowly (viewers need time to see)
- ✅ Circle or hover over elements you're highlighting
- ✅ Pause on buttons before clicking (1 second)
- ✅ Keep consensus meter visible during demo
- ❌ Don't move mouse erratically
- ❌ Don't click too fast

### Content Coverage
**MUST INCLUDE:**
1. Opening hook about institutional traders and consensus
2. Show all 5 AI analysts
3. Submit query and show real-time consensus building
4. Display trade signal when threshold reached
5. Mention "no custom smart contracts" (security selling point)
6. State vision: "fully autonomous investment DAO"
7. Show URLs: team-consensus-vault.vercel.app and GitHub

**CAN SKIP IF SHORT ON TIME:**
- Wallet connection (describe verbally)
- Future roadmap details
- Technical architecture deep dive

---

## 🎯 SUCCESS CRITERIA

Your video is ready to submit when:

- [x] Duration is 3:00 - 5:00 minutes
- [x] Shows working demo of multi-AI consensus
- [x] Audio is clear and professional
- [x] Video is 1080p quality
- [x] All key talking points covered
- [x] URLs visible and correct
- [x] Uploaded to YouTube successfully
- [x] Submitted to hackathon before deadline

---

## 💡 FINAL TIPS

1. **Practice Once First:** Do a full dry run without recording. Time yourself.
2. **It Doesn't Need to Be Perfect:** Working demo > polished pitch with no demo
3. **Mistakes Are OK:** Pause and restart sentences. You can edit later.
4. **Show Don't Tell:** Let the app do the talking. Demos are more powerful than words.
5. **Energy Matters:** Be excited about what you built. Enthusiasm is contagious.
6. **Breathe:** Take a deep breath before starting. You've got this.

---

## 📂 REFERENCE DOCUMENTS

For more details, see:
- **DEMO_VIDEO_SCRIPT.md** — Full narration script with timing
- **DEMO_QUICK_REFERENCE.md** — One-page cheat sheet for recording
- **DEMO_TECHNICAL_SETUP.md** — Detailed OBS/Loom setup guide
- **DEMO_SHOT_LIST.md** — Visual storyboard with 17 shots
- **START_HERE_DEMO.md** — Overview and navigation guide

---

**Prepared by:** Lead Engineer (Autonomous Mode)
**Task:** CVAULT-49 (Day 6 Demo Video Preparation)
**Date:** 2026-02-07
**Status:** ✅ Ready for Recording

**You've got everything you need. The app works. The script is solid. Now just hit record and show the world what you built! 🎥🦞**
