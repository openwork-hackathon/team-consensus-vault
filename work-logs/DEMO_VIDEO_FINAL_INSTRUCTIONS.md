# Demo Video Recording - Final Instructions

**Task:** CVAULT-49 - Record demo video (3-5 minutes)
**Status:** Silent video generated, requires voiceover
**Date:** 2026-02-08

---

## What's Ready

### 1. Silent Demo Video (COMPLETED)
**File:** `demo/demo-automated.mp4`
**Duration:** 1:24 (84 seconds)
**Resolution:** 1920x1080 (1080p)
**Size:** 1.2 MB

This video captures the live app at team-consensus-vault.vercel.app showing:
- Title cards with project branding
- Landing page overview (5s)
- Five AI analyst cards (8s)
- Query simulation (6s)
- AI analysis in progress (25s)
- Results display (10s)
- Feature scrolling (8s)
- Trading section (8s)
- Outro with URLs (5s)

### 2. Vercel Deployment (LIVE)
**URL:** https://team-consensus-vault.vercel.app
**Status:** Verified accessible

### 3. Documentation (COMPLETE)
- `DEMO_VIDEO_SCRIPT.md` - Full narration script
- `DEMO_CHECKLIST.md` - Recording checklist
- `DEMO_QUICK_REFERENCE.md` - One-page cheat sheet
- `START_HERE_DEMO.md` - Navigation guide

---

## What You Need To Do

### Option A: Use the Generated Video + Add Voiceover (Recommended - 30 min)

This is the fastest path to submission.

1. **Review the video**
   ```bash
   mpv ~/team-consensus-vault/demo/demo-automated.mp4
   # or
   vlc ~/team-consensus-vault/demo/demo-automated.mp4
   ```

2. **Record voiceover separately**
   - Use your phone's voice recorder or Audacity
   - Follow the script in `DEMO_VIDEO_SCRIPT.md`
   - Target: ~1:24 to match video length (or faster for 3-minute target)
   - Export as MP3 or WAV

3. **Combine video + audio**
   Using ffmpeg:
   ```bash
   ffmpeg -i demo/demo-automated.mp4 -i voiceover.mp3 \
     -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 \
     -shortest demo/demo-final.mp4
   ```

   Or use a video editor (iMovie, DaVinci Resolve, etc.)

4. **Upload to YouTube**
   - Title: "Consensus Vault - Openwork Clawathon Demo"
   - Visibility: Unlisted or Public
   - Add description with URLs

5. **Submit to hackathon**

### Option B: Record Fresh with Voiceover (60-90 min)

If you want more control or need to extend the demo:

1. **Use OBS Studio or Loom**
   - Install from https://obsproject.com/ or https://www.loom.com/
   - Configure for 1080p @ 30fps

2. **Record screen + microphone simultaneously**
   - Navigate to https://team-consensus-vault.vercel.app
   - Follow `DEMO_CHECKLIST.md` step-by-step

3. **Edit and export**
   - Trim start/end
   - Export as MP4

---

## Critical Information for Narration

### Key Talking Points (Must Include)

1. **Opening Hook:**
   > "Institutional traders don't trust just one analyst. They get consensus from entire teams of experts. We're bringing that same approach to DeFi - but with five specialized AI models."

2. **The Innovation:**
   > "Five different AI architectures analyzing markets 24/7. When they agree, that signal is far more reliable than any single model."

3. **Security Note:**
   > "No custom smart contracts - we're using audited, battle-tested infrastructure from Mint Club V2."

4. **The Vision:**
   > "A fully autonomous investment DAO where the wisdom of AI crowds outperforms any single fund manager."

5. **Call to Action:**
   > "The code is open source on GitHub. The live demo is at team-consensus-vault.vercel.app."

### URLs to Show/Mention
- **Live Demo:** team-consensus-vault.vercel.app
- **GitHub:** github.com/openwork-hackathon/team-consensus-vault

---

## Known Limitations

### API Keys Status
The live Vercel deployment currently shows **mock data** because:
- API keys are not configured in Vercel environment
- This is fine for demo - the UI looks identical

The video shows the app responding with simulated analyst data, which demonstrates the full flow without requiring live API connections.

### What the Demo Shows
- All 5 analyst card layouts
- Loading/analyzing states
- Consensus meter UI
- Trade signal visualization
- Scrollable features

### What It Doesn't Show (Would Need Live APIs)
- Real-time AI responses from DeepSeek, Kimi, etc.
- Actual wallet transactions

---

## Video Specifications for Hackathon

**Requirements:**
- Duration: 3:00 - 5:00 minutes
- Resolution: 1080p minimum
- Format: MP4 (H.264)
- Audio: Clear voiceover narration

**Current Status:**
- Video: 1:24 (need to extend with voiceover or record longer)
- Audio: None (needs voiceover)

**To extend to 3+ minutes:**
- Add longer intro with problem statement (~30s)
- Slower narration during demo (~1 min slower)
- Tech stack explanation (~45s)
- Future vision section (~30s)
- Credits and outro (~30s)

---

## File Locations

```
~/team-consensus-vault/
├── demo/
│   └── demo-automated.mp4    <- Silent demo video (1:24)
├── DEMO_VIDEO_SCRIPT.md      <- Full narration script
├── DEMO_CHECKLIST.md         <- Recording checklist
├── DEMO_QUICK_REFERENCE.md   <- One-page cheat sheet
├── START_HERE_DEMO.md        <- Navigation guide
└── DEMO_VIDEO_FINAL_INSTRUCTIONS.md <- THIS FILE
```

---

## Quick Commands

```bash
# Play the demo video
mpv ~/team-consensus-vault/demo/demo-automated.mp4

# Check video info
ffprobe -v error -show_format ~/team-consensus-vault/demo/demo-automated.mp4

# Combine video + audio (after recording voiceover)
cd ~/team-consensus-vault
ffmpeg -i demo/demo-automated.mp4 -i voiceover.mp3 \
  -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 \
  -shortest demo/demo-final.mp4

# Verify final video
ffprobe -v error -show_format demo/demo-final.mp4
```

---

## Deadline

**Hackathon Deadline:** ~February 14, 2026 (6 days remaining)

**Estimated Time to Complete:**
- Option A (add voiceover to existing): 30-45 minutes
- Option B (record fresh): 60-90 minutes

---

## Summary

**Completed by automation:**
- Silent demo video captured from live app
- All documentation prepared
- Vercel deployment verified

**Requires human action:**
- Record voiceover narration
- Combine audio with video
- Upload to YouTube
- Submit to hackathon

**Recommendation:** Use Option A - add voiceover to the existing demo-automated.mp4 video. This is the fastest path to submission and the video already captures all the important UI elements.

---

**Prepared by:** Lead Engineer (Autonomous Mode)
**Task:** CVAULT-49
**Signal:** [[SIGNAL:task_complete:needs_human_verification]]
