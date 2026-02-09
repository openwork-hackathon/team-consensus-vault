# 🎬 START HERE — Demo Video Recording Guide

**You're about to record the Consensus Vault hackathon demo video.**

This guide will walk you through the process step-by-step. Everything you need is in this repo.

---

## 📚 What's in This Package

You have **4 comprehensive documents** totaling 51KB of demo preparation materials:

| Document | What It Is | When to Use It |
|----------|------------|----------------|
| **DEMO_VIDEO_SCRIPT.md** | Full narration script with timing | Read first, refer during recording |
| **DEMO_QUICK_REFERENCE.md** | One-page cheat sheet | Print and keep visible while recording |
| **DEMO_TECHNICAL_SETUP.md** | Recording software setup guide | Follow before first recording session |
| **DEMO_SHOT_LIST.md** | Visual storyboard with 17 shots | Reference for screen positioning |

Plus this file: **START_HERE_DEMO.md** (navigation guide)

---

## ⚡ Quick Start (30-Minute Path)

If you're short on time, follow this streamlined process:

### Step 1: Verify App Works (5 minutes)
```bash
# Open browser, go to:
https://team-consensus-vault.vercel.app

# Test the demo flow:
1. Load page → see 5 analyst cards
2. Type: "Should I buy Bitcoin at current levels?"
3. Click Submit
4. Watch consensus build to 80%+
5. See BUY trade signal appear

# If app doesn't load:
cd ~/team-consensus-vault
npx vercel --prod
```

### Step 2: Set Up Recording (10 minutes)

**Option A: Loom (Easiest)**
1. Install Loom: https://www.loom.com/download
2. Click Loom icon → "Screen + Camera" (or "Screen Only")
3. Select "Full Screen" or "Browser Window"
4. You're ready!

**Option B: OBS Studio (Better Quality)**
1. Install OBS: https://obsproject.com/
2. Add "Window Capture" source → select browser
3. Add "Audio Input Capture" → select microphone
4. Settings → Output → Recording Format: MP4, Quality: High
5. Settings → Video → Resolution: 1920x1080, FPS: 30
6. You're ready!

### Step 3: Do One Practice Run (5 minutes)
- Open DEMO_QUICK_REFERENCE.md
- Practice speaking through the flow WITHOUT recording
- Time yourself (target: 3:30-4:30 minutes)
- Adjust pace if needed

### Step 4: Record (10 minutes)
1. Silence phone, close notifications
2. Load app in clean browser tab
3. Start recording
4. Count to 3, then begin speaking
5. Follow DEMO_QUICK_REFERENCE.md timing guide
6. Stop recording when done

**Pro tip**: It's OK to pause and restart a sentence if you stumble. You can edit it out later.

---

## 📖 Detailed Path (60-Minute High-Quality)

If you want to maximize quality, follow this process:

### Phase 1: Preparation (20 minutes)

1. **Read DEMO_VIDEO_SCRIPT.md** (10 min)
   - Familiarize yourself with the flow
   - Note the key talking points
   - Practice the opening hook out loud

2. **Follow DEMO_TECHNICAL_SETUP.md** (10 min)
   - Set up OBS or Loom
   - Test microphone (record 10 seconds, play back)
   - Configure export settings (1080p, MP4)

### Phase 2: Practice (15 minutes)

1. **Do a full dry run** (10 min)
   - No recording yet
   - Speak through entire script
   - Navigate through app as you talk
   - Time yourself

2. **Review DEMO_SHOT_LIST.md** (5 min)
   - See visual examples of each screen
   - Plan mouse movements
   - Note where to pause for effect

### Phase 3: Recording (15 minutes)

1. **Set up environment**
   - Quiet room
   - Good lighting
   - Water nearby
   - DEMO_QUICK_REFERENCE.md visible

2. **Record Take 1**
   - Start recording
   - Follow script
   - Don't worry about minor mistakes
   - Complete full 3:30-4:30 min

3. **Review and decide**
   - Watch the recording
   - If happy → move to editing
   - If not → do Take 2 (usually better)

### Phase 4: Edit & Upload (10 minutes)

1. **Basic editing**
   - Trim silence at start/end
   - Cut out long pauses or major mistakes
   - Normalize audio volume

2. **Export**
   - Format: MP4
   - Resolution: 1080p
   - Codec: H.264

3. **Upload to YouTube**
   - Title: "Consensus Vault — Openwork Clawathon Demo"
   - Visibility: Unlisted (or Public)
   - Copy URL

4. **Submit to hackathon**
   - Video URL
   - GitHub: https://github.com/openwork-hackathon/team-consensus-vault
   - Demo: https://team-consensus-vault.vercel.app

---

## 🎯 The Key Talking Points (Don't Miss These)

Even if you improvise, hit these 5 points:

1. **Opening Hook** (0:00-0:30)
   > "They don't trust just one analyst. They get consensus from entire teams of experts."

2. **The Innovation** (during demo)
   > "Five different AI architectures. When they agree, that signal is far more reliable."

3. **Security Note** (during tech stack)
   > "No custom smart contracts — we're using audited, battle-tested infrastructure."

4. **The Vision** (3:45-4:15)
   > "A fully autonomous investment DAO where the wisdom of AI crowds outperforms any single fund manager."

5. **Call to Action** (4:15-4:30)
   > "The code is open source on GitHub. The live demo is at team-consensus-vault.vercel.app."

---

## 🎤 Recording Tips (Quick Version)

### Voice
- Speak 10% slower than normal
- Pause between sections (makes editing easier)
- Smile while talking (improves voice warmth)
- Hydrate before recording

### Mouse
- Move slowly — viewers need time to see
- Circle elements you're highlighting
- Pause on buttons before clicking (1 second)

### Timing
- If running long → cut tech stack to 30 sec
- If too short → add more detail to demo
- Target: 3:30 - 4:30 minutes

### If You Make a Mistake
- Small stumble: Pause 2 seconds, restart sentence
- Big mistake: Pause 5 seconds, say "Let me restart this section"
- Keep going — you can edit later

---

## 🚨 Troubleshooting

### "The app won't load"
```bash
cd ~/team-consensus-vault
npx vercel --prod
# Wait for deployment, use new URL
```

### "Wallet won't connect"
- Skip that step
- Describe it verbally: "Users connect their Web3 wallet here with RainbowKit"

### "Consensus stays below 80%"
- This is actually fine! Say: "Notice the system is being cautious — it won't auto-trade without strong agreement."
- OR try different query: "Is Ethereum a good investment?"

### "Audio sounds bad"
- Move to quieter room
- Use headphones to prevent echo
- Speak closer to mic (6-8 inches)

### "Video file is huge"
- Export at 5 Mbps bitrate instead of 10 Mbps
- Upload to YouTube (no size limit)

---

## 📋 Final Checklist

Before you click "Submit to Hackathon":

- [ ] Video is 3:00 - 5:00 minutes long
- [ ] Video shows working demo (not just slides)
- [ ] Audio is clear (no echo, background noise)
- [ ] URLs are visible (team-consensus-vault.vercel.app)
- [ ] Video uploaded to YouTube successfully
- [ ] YouTube link works in incognito mode
- [ ] All hackathon form fields filled out
- [ ] Submitted before deadline (~Feb 14)

---

## 🎬 You're Ready!

Everything you need is prepared. The script is solid, the app is impressive, and the setup guides are comprehensive.

**Estimated total time**: 1-2 hours from start to submitted video.

**Remember**:
- It doesn't need to be perfect
- A working demo beats a polished pitch
- Your app is genuinely innovative — let it shine
- Breathe, smile, and have fun with it

---

## 📂 Document Reference Map

```
START_HERE_DEMO.md ←────────────── YOU ARE HERE
    ↓
    ├─→ DEMO_VIDEO_SCRIPT.md       (Full narration, 17KB)
    ├─→ DEMO_QUICK_REFERENCE.md    (Cheat sheet, 5KB)
    ├─→ DEMO_TECHNICAL_SETUP.md    (OBS/Loom guide, 16KB)
    └─→ DEMO_SHOT_LIST.md          (Visual storyboard, 13KB)

Supporting docs:
    ├─→ CVAULT-34_SUMMARY.md       (Task completion summary)
    ├─→ README_TECHNICAL.md        (App architecture)
    └─→ DEPLOYMENT_STATUS.md       (Deployment info)
```

---

## 💡 One Last Thing

The Lead Engineer has prepared all of this for you. The materials are thorough, the app works, and the story is compelling.

All you need to do is:
1. Open the app
2. Start recording
3. Show what you built
4. Submit

**You've got this.** 🎥🦞

---

**Questions?** Refer to the detailed docs:
- Script questions → DEMO_VIDEO_SCRIPT.md
- Technical issues → DEMO_TECHNICAL_SETUP.md
- Timing concerns → DEMO_QUICK_REFERENCE.md
- Visual layout → DEMO_SHOT_LIST.md

**Good luck!**

---

**Prepared**: 2026-02-07
**For**: Jonathan (vanclute@gmail.com)
**Task**: CVAULT-34 Demo Video Recording
**Deadline**: ~February 14, 2026
