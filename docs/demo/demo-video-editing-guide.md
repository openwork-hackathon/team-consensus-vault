# Demo Video Editing & Upload Guide

## Status: BLOCKED - Video Not Yet Recorded

**Current Issue:** CVAULT-84 (Record demo video take 1) is still in Backlog state. The raw video must be recorded before editing can begin.

## Prerequisites
- Raw video recording (3-5 minutes, 1080p minimum)
- FFmpeg installed for editing
- YouTube account or Loom account for hosting

## Quick Start (Once Video is Available)

### 1. Place Raw Video
Save the raw recording as: `~/consensus-vault/demo-raw.mp4`

### 2. Run the Editing Script
```bash
bash ~/consensus-vault/edit-demo-video.sh demo-raw.mp4
```

This will:
- Trim silence/dead time from start and end
- Re-encode for optimal web playback
- Output as `demo-edited.mp4`

### 3. Upload to YouTube
```bash
# Option A: Manual upload via web browser
# Go to: https://studio.youtube.com/
# Set visibility to "Unlisted" or "Public"
# Add title: "Consensus Vault - Decentralized Governance Platform"
# Add description: See below

# Option B: Upload via CLI (requires youtube-upload package)
youtube-upload \
  --title="Consensus Vault - Decentralized Governance Platform" \
  --description="$(cat ~/consensus-vault/demo-video-description.txt)" \
  --category=Science \
  --privacy=unlisted \
  demo-edited.mp4
```

### 4. Verify & Document
- Test the video plays correctly
- Document the URL in: `~/consensus-vault/DEMO_VIDEO_URL.txt`
- Add URL to the hackathon submission

## Video Description Template

```
Consensus Vault - Decentralized Governance Platform

A hackathon project demonstrating on-chain governance with:
- Token-weighted voting
- Proposal creation and management
- Real-time vote tracking
- Integration with Mint Club V2 for tokenomics

Built with: Next.js, RainbowKit, Wagmi, Viem
Blockchain: Base Sepolia Testnet

GitHub: https://github.com/openwork-hackathon/team-consensus-vault
Live Demo: https://team-consensus-vault.vercel.app

Hackathon: Openwork 2026
```

## Manual Editing Steps (If Script Doesn't Work)

### Trim Dead Time
```bash
# Trim first 5 seconds and last 3 seconds
ffmpeg -i demo-raw.mp4 -ss 00:00:05 -t 00:03:00 -c copy demo-trimmed.mp4
```

### Add Captions (If Needed)
```bash
# Generate subtitle file first (demo-captions.srt)
# Then burn into video:
ffmpeg -i demo-trimmed.mp4 -vf "subtitles=demo-captions.srt" demo-with-captions.mp4
```

### Optimize for Web
```bash
# Re-encode for smaller file size and better compatibility
ffmpeg -i demo-trimmed.mp4 \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  demo-edited.mp4
```

## Alternative Hosting: Loom

If YouTube is not available, use Loom:
1. Go to https://www.loom.com/
2. Sign in or create account
3. Click "Upload" and select `demo-edited.mp4`
4. Set sharing to "Anyone with the link"
5. Copy the public URL

## Troubleshooting

### Video Too Large
If the video is over 500MB, re-encode with higher compression:
```bash
ffmpeg -i demo-raw.mp4 -c:v libx264 -crf 28 -preset slow demo-compressed.mp4
```

### Audio Issues
If audio is too quiet or has noise:
```bash
# Normalize audio levels
ffmpeg -i demo-raw.mp4 -af "loudnorm" demo-audio-fixed.mp4
```

### Wrong Aspect Ratio
Force 16:9 aspect ratio:
```bash
ffmpeg -i demo-raw.mp4 -aspect 16:9 demo-fixed-ratio.mp4
```

## Completion Checklist

- [ ] Video recorded (CVAULT-84)
- [ ] Video edited and trimmed
- [ ] Video uploaded to YouTube/Loom
- [ ] Video accessibility verified
- [ ] URL documented in DEMO_VIDEO_URL.txt
- [ ] URL added to hackathon submission
- [ ] Video tested on different devices/browsers
