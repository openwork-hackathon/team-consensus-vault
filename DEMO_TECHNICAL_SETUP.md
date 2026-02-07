# Demo Video Technical Setup Guide

**For: CVAULT-34 Demo Video Recording**
**Prepared: 2026-02-07**
**Target: Jonathan (vanclute@gmail.com)**

---

## 🎯 Overview

This guide covers the technical setup needed to record a professional demo video for the Consensus Vault hackathon submission. It assumes you're using either **OBS Studio** (recommended for desktop) or **Loom** (recommended for ease of use).

---

## 📋 Pre-Recording Setup (30 Minutes)

### Step 1: Verify Deployment Status

First, ensure the app is live and functional.

```bash
# Check if deployed to Vercel
curl -I https://team-consensus-vault.vercel.app

# Expected: HTTP 200 OK
# If 404 or error, redeploy:
cd ~/team-consensus-vault
npx vercel --prod
```

**Test the app**:
1. Open https://team-consensus-vault.vercel.app in browser
2. Verify 5 analyst cards load
3. Submit test query: "Should I buy Bitcoin?"
4. Confirm consensus meter animates
5. Check that wallet connection button works

**Fallback**: If Vercel is down, use localhost:
```bash
cd ~/team-consensus-vault
npm run dev
# Open http://localhost:3000
# Works for demo but not ideal for submission
```

---

### Step 2: Prepare Demo Wallet

You'll need a Web3 wallet connected for the demo.

**Option A: MetaMask (Most Common)**
1. Install MetaMask browser extension
2. Create new wallet or import existing
3. Switch to **Base Mainnet** network
   - Network Name: Base Mainnet
   - RPC URL: https://mainnet.base.org
   - Chain ID: 8453
   - Symbol: ETH
4. Add ~$5 worth of ETH (for gas fees)
5. Test connection:
   - Go to app
   - Click "Connect Wallet"
   - Select MetaMask
   - Confirm connection

**Option B: Rainbow Wallet**
1. Install Rainbow browser extension
2. Set up wallet
3. Switch to Base Mainnet
4. Test connection

**Option C: Coinbase Wallet**
1. Install Coinbase Wallet extension
2. Set up wallet
3. Ensure Base network support
4. Test connection

**Backup Plan**: If wallet connection fails during recording, you can:
- Skip wallet step and verbally describe it
- Show wallet connection from a static screenshot
- Use pre-recorded clip of wallet connection

---

### Step 3: Browser Preparation

**Recommended Browser**: Chrome or Brave (best Web3 support)

**Setup**:
```bash
# 1. Close all tabs except:
#    - team-consensus-vault.vercel.app
#    - (optional) GitHub repo page for credits

# 2. Disable notifications:
#    - Settings → Privacy and security → Site Settings → Notifications → Blocked

# 3. Hide bookmarks bar:
#    - Ctrl+Shift+B (or Cmd+Shift+B on Mac)

# 4. Enable clean view:
#    - F11 for fullscreen (or Cmd+Ctrl+F on Mac)
#    - OR use OBS to capture browser window only

# 5. Set zoom to 100%:
#    - Ctrl+0 (or Cmd+0 on Mac)

# 6. Test scroll behavior:
#    - Ensure smooth scrolling enabled in browser settings
```

**Extensions to Disable**:
- Ad blockers (can interfere with Web3)
- Password managers (may show popup)
- Any extensions that overlay UI

**Extensions to Keep**:
- Wallet extension (MetaMask, Rainbow, etc.)

---

### Step 4: Desktop Cleanup

**Minimize Distractions**:
```bash
# Close these applications:
- Slack
- Discord
- Email clients
- Notification apps
- Music players (unless using for background music)

# Set OS to Do Not Disturb:
# - Ubuntu: Settings → Notifications → Do Not Disturb
# - Windows: Notification Center → Focus Assist → Priority Only
# - macOS: Control Center → Focus → Do Not Disturb
```

**Desktop Background**:
- Use neutral background (solid color, not busy wallpaper)
- If showing desktop, ensure no sensitive files visible

---

## 🎙️ Audio Setup

### Microphone Options (Best to Worst)

1. **External USB Microphone** (Blue Yeti, Rode, etc.)
   - Best quality
   - Position 6-8 inches from mouth
   - Use pop filter if available

2. **Headset with Boom Mic** (Gaming headset)
   - Good quality
   - Consistent positioning
   - Reduces echo

3. **Laptop Built-in Mic**
   - Acceptable if quiet environment
   - Position laptop ~12 inches from mouth
   - Avoid typing while recording

4. **Phone Headphones with Mic** (AirPods, etc.)
   - Decent quality
   - Make sure charged
   - Test audio level first

### Audio Test Procedure

```bash
# Using OBS:
1. Open OBS
2. Add Audio Input Capture
3. Select your microphone
4. Speak normally — check levels (should be -12 to -6 dB)
5. Record 30 seconds of test audio
6. Play back — listen for:
   - Background noise (hum, buzz, fan noise)
   - Echo or reverb
   - Volume too low/high
   - Mouth sounds (pops, clicks)

# Using Loom:
1. Open Loom
2. Start new recording
3. Select microphone
4. Do audio test — Loom shows visual waveform
5. Play back test
```

**Fix Common Issues**:
- **Echo**: Use headphones to prevent speakers feeding back
- **Background noise**: Record in quiet room, turn off AC/fans
- **Low volume**: Move mic closer, check OS volume settings
- **Pops**: Use pop filter or turn slightly off-axis from mic

---

## 🖥️ Screen Recording Setup

### Option A: OBS Studio (Recommended for Quality)

**Installation** (if not installed):
```bash
# Ubuntu/Debian:
sudo apt update
sudo apt install obs-studio

# Or download from: https://obsproject.com/
```

**OBS Configuration**:

1. **Scene Setup**:
```
Scene 1: "Full Screen Demo"
- Source: Window Capture (browser window)
- OR: Display Capture (full screen)
- Audio: Microphone/Aux

Scene 2: "Picture-in-Picture" (optional)
- Source: Window Capture (browser)
- Source: Video Capture Device (webcam) — resize to corner
- Audio: Microphone/Aux

Scene 3: "GitHub Page" (for credits)
- Source: Window Capture (GitHub in browser)
- Audio: Microphone/Aux
```

2. **Output Settings**:
```
File → Settings → Output
- Output Mode: Simple
- Recording Format: MP4
- Recording Quality: High Quality, Medium File Size
- Encoder: x264
```

3. **Video Settings**:
```
File → Settings → Video
- Base (Canvas) Resolution: 1920x1080
- Output (Scaled) Resolution: 1920x1080
- FPS: 30 (or 60 if your system can handle it)
```

4. **Audio Settings**:
```
File → Settings → Audio
- Sample Rate: 48kHz
- Channels: Stereo
- Desktop Audio: Disabled (unless app has audio)
- Mic/Auxiliary Audio: Select your microphone
```

5. **Hotkeys** (optional but useful):
```
File → Settings → Hotkeys
- Start Recording: F9
- Stop Recording: F10
- Switch to Scene: F1, F2, F3
```

**Recording Checklist**:
- [ ] Correct scene selected
- [ ] Browser window captured (visible in OBS preview)
- [ ] Audio levels showing when you speak
- [ ] No unwanted elements in frame
- [ ] Recording folder set (File → Settings → Output → Recording Path)

**Start Recording**:
1. Position browser window
2. Click "Start Recording" (or press F9)
3. Count to 3 silently
4. Begin speaking
5. When done, click "Stop Recording" (or F10)
6. File saved to: ~/Videos/ (default)

---

### Option B: Loom (Recommended for Ease)

**Installation**:
```bash
# Install Loom desktop app:
# Download from: https://www.loom.com/download

# Or use Loom Chrome Extension:
# Install from: chrome.google.com/webstore → search "Loom"
```

**Loom Configuration**:

1. **Recording Mode**:
   - Screen Only (for full-screen demo)
   - Screen + Camera (if showing face)
   - Camera Only (not recommended for this demo)

2. **Settings**:
```
Loom → Settings → Recording
- Quality: 1080p
- Frame Rate: 30 fps
- Microphone: Select your mic
- Camera: Select webcam (if using)
```

3. **Recording Area**:
   - Full Screen
   - OR Specific Window (browser window)

**Recording Process**:
1. Click Loom icon in toolbar
2. Select "Screen + Mic" (or "Screen Only")
3. Choose recording area (full screen or window)
4. Click "Start Recording"
5. Loom gives 3-second countdown
6. Perform demo
7. Click "Stop Recording" (Loom toolbar)
8. Video auto-uploads to Loom cloud
9. Download MP4 for submission

**Pros**:
- ✅ Easy to use
- ✅ Auto-saves to cloud (no lost recordings)
- ✅ Built-in trimming and editing
- ✅ Shareable link

**Cons**:
- ❌ Less control over quality settings
- ❌ Requires internet upload
- ❌ Free tier has limits (5 min videos)

---

## 🎬 Recording Best Practices

### Before You Hit Record

1. **Do a Full Dry Run**:
   - Open app
   - Perform entire demo flow without recording
   - Time yourself (should be 3:30-4:30)
   - Note any hiccups or slow parts

2. **Test Recording Setup**:
   - Record 30 seconds of test footage
   - Check audio quality
   - Check video quality
   - Verify screen capture works

3. **Prepare Script Access**:
   - Print DEMO_QUICK_REFERENCE.md
   - OR have it on second monitor
   - OR memorize key points (don't read word-for-word)

4. **Hydration & Comfort**:
   - Glass of water nearby
   - Comfortable chair position
   - Room temperature comfortable

---

### During Recording

**If You Make a Mistake**:
- **Small Flub**: Pause 2 seconds, restart sentence
- **Big Mistake**: Pause 5 seconds, say "Let me restart this section"
- **Technical Issue**: Pause recording, fix issue, resume

**Mouse Movement**:
- Move **slowly** — viewers need time to see what you're pointing at
- **Circle** elements you're highlighting
- **Pause** on buttons before clicking (1 second)
- **Avoid** erratic or fast movements

**Speaking**:
- **Pace**: Speak 10% slower than normal conversation
- **Clarity**: Enunciate clearly, especially technical terms
- **Energy**: Vary your tone — don't be monotone
- **Pauses**: Pause between sections — easier to edit later

**Timing**:
- Glance at clock occasionally (don't stare)
- If running long, skip less important parts
- If too short, add more detail to demo flow

---

### After Recording

1. **Don't Delete Raw File**:
   - Save original recording as backup
   - You might want to re-edit later

2. **Immediate Review**:
   - Watch full video
   - Note timestamps of any issues
   - Decide if re-recording is needed

3. **Basic Editing** (Optional):
   ```
   # Using OBS recordings:
   # - Use any video editor (DaVinci Resolve, Shotcut, etc.)
   # - Trim dead air at start/end
   # - Cut out long pauses or mistakes
   # - Add title card (optional)
   # - Normalize audio (prevent clipping)

   # Using Loom:
   # - Use Loom's built-in trim tool
   # - Cut unnecessary sections
   # - Add captions (optional)
   ```

4. **Export Settings**:
   ```
   Format: MP4
   Codec: H.264
   Resolution: 1920x1080 (1080p)
   Frame Rate: 30fps
   Bitrate: 5-10 Mbps (higher = better quality, larger file)
   Audio: AAC, 192 kbps, 48kHz
   ```

---

## 📤 Upload & Submission

### YouTube Upload

**Steps**:
1. Go to youtube.com
2. Click "Create" → "Upload video"
3. Select your MP4 file
4. Set visibility:
   - **Unlisted**: Anyone with link can view (recommended)
   - **Public**: Anyone can find via search
5. Title: "Consensus Vault — Openwork Clawathon Demo"
6. Description:
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
7. Click "Publish"
8. Copy YouTube URL (e.g., youtube.com/watch?v=...)

**Alternative**: Vimeo, Google Drive, or direct file upload to hackathon platform

---

### Hackathon Submission

**What to Submit**:
- [ ] Video URL (YouTube link)
- [ ] GitHub repo: https://github.com/openwork-hackathon/team-consensus-vault
- [ ] Live demo URL: https://team-consensus-vault.vercel.app
- [ ] Team name: Consensus Vault
- [ ] Team members: Clautonomous (PM), CVault-Backend, CVault-Frontend, CVault-Contracts

**Submission Checklist**:
- [ ] Video is 3-5 minutes long
- [ ] Video is public or unlisted (not private)
- [ ] Video shows working demo (not just slides)
- [ ] GitHub repo is public
- [ ] Live demo URL is accessible
- [ ] All team members listed
- [ ] Submission deadline not passed (~Feb 14)

---

## 🚨 Troubleshooting

### Issue: App Not Loading
**Symptoms**: Vercel URL shows 404 or error page
**Fix**:
```bash
cd ~/team-consensus-vault
git status  # Check for uncommitted changes
git push origin main  # Push to GitHub
npx vercel --prod  # Redeploy to Vercel
```
**Workaround**: Use localhost (npm run dev) but note in video: "Deployed at team-consensus-vault.vercel.app"

---

### Issue: Wallet Won't Connect
**Symptoms**: Clicking "Connect Wallet" does nothing or shows error
**Fix**:
- Ensure wallet extension is installed and unlocked
- Check browser console for errors (F12)
- Try different wallet (MetaMask vs Rainbow)
- Clear browser cache and reload
**Workaround**: Skip wallet connection, verbally describe it

---

### Issue: Consensus Doesn't Calculate
**Symptoms**: Agents show results but meter stays at 0%
**Fix**:
- Check browser console for JavaScript errors
- Refresh page and retry
- Verify `/api/consensus` endpoint is working
**Workaround**: Use different query or explain algorithm verbally

---

### Issue: Audio Has Echo
**Symptoms**: Voice sounds reverberating, delayed
**Fix**:
- Use headphones (prevents speaker feedback)
- Move to room with soft furnishings (carpet, curtains)
- Reduce mic sensitivity in OS settings
- Use noise suppression in OBS/Loom
**Workaround**: Record audio separately, overlay in editing

---

### Issue: Video Quality Poor
**Symptoms**: Blurry, pixelated, choppy
**Fix**:
- Increase bitrate in export settings (8-10 Mbps)
- Record at 1080p (not 720p)
- Close background apps (reduce CPU load)
- Use 30fps instead of 60fps (more stable)
**Workaround**: Record in shorter segments, stitch together

---

### Issue: File Size Too Large
**Symptoms**: Video exceeds upload limit (e.g., 2GB)
**Fix**:
- Re-export with lower bitrate (5 Mbps instead of 10)
- Use H.264 codec (smaller than H.265)
- Trim unnecessary sections
- Upload to YouTube (no size limit)
**Workaround**: Use video compression tool (Handbrake, ffmpeg)

---

## 🎯 Final Quality Checklist

Before submitting:

**Video Quality**:
- [ ] Resolution: 1080p minimum
- [ ] No black bars or letterboxing
- [ ] No visible glitches or artifacts
- [ ] Smooth playback (no stuttering)

**Audio Quality**:
- [ ] Clear voice (no mumbling)
- [ ] No background noise
- [ ] Consistent volume throughout
- [ ] No audio sync issues

**Content**:
- [ ] Duration: 3:00 - 5:00 minutes
- [ ] All key points covered
- [ ] Demo shows working product
- [ ] URLs visible and correct
- [ ] Team credits included

**Submission**:
- [ ] Video uploaded successfully
- [ ] Link tested in incognito mode
- [ ] All hackathon fields filled
- [ ] Submitted before deadline

---

## 📊 Recommended Tools Summary

| Tool | Purpose | Difficulty | Quality |
|------|---------|------------|---------|
| **OBS Studio** | Screen recording | Medium | Excellent |
| **Loom** | Screen recording | Easy | Good |
| **Audacity** | Audio editing | Medium | Excellent |
| **DaVinci Resolve** | Video editing | Hard | Professional |
| **Shotcut** | Video editing | Easy | Good |
| **Handbrake** | Video compression | Easy | Excellent |

---

## 💡 Pro Tips

1. **Record in Multiple Takes**:
   - Record each section separately
   - Stitch together in editing
   - Easier to perfect each part

2. **Use a Teleprompter App**:
   - Free apps: CuePrompter, PromptSmart
   - Display script below webcam
   - Read naturally, maintain eye contact

3. **Add Subtle Background Music**:
   - Use royalty-free music (YouTube Audio Library)
   - Keep volume low (-30 dB)
   - Fade in/out at start/end

4. **Add Captions**:
   - YouTube auto-generates (edit for accuracy)
   - Improves accessibility
   - Helps non-native speakers

5. **Test on Multiple Devices**:
   - Watch on desktop
   - Watch on mobile
   - Ensure readable on small screens

---

**Document Status**: ✅ Complete
**Prepared By**: Lead Engineer (Autonomous Mode)
**Date**: 2026-02-07
**For Task**: CVAULT-34 Demo Video Recording

**Everything is ready. You've got this! 🎥🦞**
