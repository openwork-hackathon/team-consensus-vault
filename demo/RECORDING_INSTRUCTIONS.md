# Demo Video Recording Instructions

## Current Status

**Automated Video Generated:**
- File: `demo/demo-automated.mp4`
- Duration: 1:41 (101 seconds)
- Resolution: 1920x1080 (1080p)
- Size: 1.4 MB
- Audio: NONE (silent screen recording)

**Hackathon Requirement:** 3-5 minute demo video with narration

## What Human Action Is Required

To complete the demo video for hackathon submission, a human must either:

### Option A: Add Voiceover to Existing Video (Recommended)

1. Open the generated video in a video editor:
   - **DaVinci Resolve** (free, professional quality)
   - **Kdenlive** (free, Linux-native)
   - **OpenShot** (free, simple)

2. Record voiceover narration following the script below

3. Add narration audio track synced to the video

4. Export as MP4 (H.264, 1080p, 30fps)

### Option B: Record Fresh Video with OBS

1. Install OBS: `sudo apt install obs-studio`

2. Configure OBS:
   - Video: 1920x1080, 30fps
   - Audio: Select external microphone
   - Output: MP4 format

3. Open https://team-consensus-vault.vercel.app in browser

4. Start recording and follow the demo script below

5. Interact with the app while narrating

---

## Demo Script (Target: 3-4 minutes)

### Scene 1: Introduction (0:00 - 0:30)

**Visual:** Landing page
**Narration:**
> "Have you ever wondered how institutional traders make million-dollar decisions? They don't trust just one analyst. They get consensus from entire teams of experts. We're bringing that same wisdom-of-crowds approach to DeFi — but instead of human analysts, we're using five specialized AI models that analyze markets 24/7 and only trade when they reach consensus. This is Consensus Vault."

### Scene 2: The AI Analyst Council (0:30 - 1:30)

**Visual:** Show the 5 analyst cards
**Narration:**
> "Here's the Consensus Vault dashboard. You're looking at five AI analyst models, each with a specialized role:
>
> - DeepSeek Quant focuses on technical analysis
> - Kimi Macro analyzes on-chain data and whale activity
> - MiniMax Sentiment reads market psychology
> - GLM Technical studies price action patterns
> - Gemini Risk assesses the risk/reward profile
>
> Each of these models runs independently. They don't share answers. They don't copy each other. This prevents groupthink and creates true diversified analysis."

### Scene 3: Query the Council (1:30 - 2:30)

**Visual:** Type a query, watch responses stream in
**Narration:**
> "Let me show you how it works. I'll ask the council: 'Should I buy Bitcoin at current levels?'
>
> [Type query slowly]
>
> Watch what happens next. All five agents start analyzing simultaneously — but independently.
>
> [Wait for responses]
>
> See the typing indicators? Each agent is processing the query right now. DeepSeek just finished — look at that 85% confidence, bullish signal. Now Kimi weighs in — also bullish. Notice the consensus meter at the top. It's calculating agreement across all agents in real-time."

### Scene 4: Consensus and Signal (2:30 - 3:15)

**Visual:** Show consensus meter filling, trade signal appearing
**Narration:**
> "When consensus reaches 80% or higher, the vault triggers a trade signal. Four out of five agents agree: BUY Bitcoin. That's 84% consensus.
>
> This is the key innovation. A single AI model can be wrong. But when five independent models with different specializations reach the same conclusion? That signal is far more reliable.
>
> The vault can execute trades automatically when consensus is reached, or you can use it as a decision-support tool for your own trading."

### Scene 5: Tech Stack & Security (3:15 - 3:45)

**Visual:** Scroll through features or show GitHub
**Narration:**
> "Let's talk about how this is built. The frontend is Next.js with TypeScript. We're calling five different AI APIs in parallel — DeepSeek, Kimi, MiniMax, GLM, and Gemini.
>
> On the blockchain side, we're deployed on Base network using Mint Club V2 for our token. No custom smart contracts — we're using audited, battle-tested infrastructure. This is a deliberate security choice."

### Scene 6: Closing (3:45 - 4:00)

**Visual:** Back to landing page
**Narration:**
> "Consensus Vault brings the wisdom of AI crowds to DeFi. No more relying on a single prediction. No more FOMO. Just data-driven decisions backed by multi-model consensus.
>
> Try it now at team-consensus-vault.vercel.app. The code is open source on GitHub. Thanks for watching!"

---

## Quick Checklist Before Recording

- [ ] Vercel app is live: https://team-consensus-vault.vercel.app
- [ ] Browser notifications disabled
- [ ] Desktop notifications disabled
- [ ] Browser zoom at 100%
- [ ] Microphone tested and working
- [ ] Script printed or visible on second monitor
- [ ] Phone silenced

## Upload Instructions

1. Upload to YouTube (unlisted or public)
2. Title: "Consensus Vault - AI Multi-Model Trading | Openwork Clawathon 2026"
3. Description:
   ```
   Consensus Vault: The Wisdom of AI Crowds

   An autonomous trading vault powered by multi-model consensus.
   Five specialized AI analyst models independently analyze crypto markets
   and execute trades when reaching ≥80% agreement.

   Live Demo: https://team-consensus-vault.vercel.app
   GitHub: https://github.com/openwork-hackathon/team-consensus-vault

   Built for the Openwork Clawathon (February 2026)
   ```
4. Copy the YouTube URL
5. Save to: `~/team-consensus-vault/demo/DEMO_VIDEO_URL.txt`

---

## Files in This Directory

| File | Description |
|------|-------------|
| `demo-automated.mp4` | Silent screen recording (1:41) |
| `generate-demo.js` | Script to regenerate the video |
| `RECORDING_INSTRUCTIONS.md` | This file |

## Regenerating the Video

If you need to capture again:
```bash
cd ~/team-consensus-vault
node demo/generate-demo.js
```

---

*Generated by Lead Engineer for CVAULT-49*
*Date: 2026-02-08*
