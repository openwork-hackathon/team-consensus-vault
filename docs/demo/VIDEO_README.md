# Demo Video - Quick Reference

## Current Status: VIDEO NOT RECORDED

**Blocker:** CVAULT-84 (Record demo video) must be completed first.

## Once Video is Recorded

### Step 1: Edit (5-10 minutes)
```bash
cd ~/consensus-vault
./edit-demo-video.sh demo-raw.mp4
```
Output: `demo-edited.mp4` (optimized for web)

### Step 2: Upload (5-15 minutes)

#### Option A: YouTube (Recommended)
1. Go to: https://studio.youtube.com/
2. Click "Upload" → Select `demo-edited.mp4`
3. Title: "Consensus Vault - Decentralized Governance Platform"
4. Description: Copy from `demo-video-description.txt`
5. Visibility: **Unlisted** or Public
6. Category: Science & Technology
7. Publish and copy URL

#### Option B: Loom (Alternative)
1. Go to: https://www.loom.com/
2. Sign in or create account
3. Click "Upload" → Select `demo-edited.mp4`
4. Set sharing to: "Anyone with the link"
5. Copy URL

### Step 3: Document (2 minutes)
```bash
# Save the URL
echo "https://youtube.com/watch?v=..." > ~/consensus-vault/DEMO_VIDEO_URL.txt

# Test it opens
xdg-open "$(cat ~/consensus-vault/DEMO_VIDEO_URL.txt)"
```

### Step 4: Add to Submission
Include the URL in your hackathon submission form.

## Files Available

| File | Purpose |
|------|---------|
| `edit-demo-video.sh` | Automated editing script |
| `demo-video-editing-guide.md` | Comprehensive guide with troubleshooting |
| `demo-video-description.txt` | Pre-written YouTube description |
| `VIDEO_README.md` | This quick reference |
| `CVAULT-85_BLOCKED_REPORT.md` | Detailed blocker analysis |
| `CVAULT-85_ACTIVITY_LOG.md` | Complete activity log |

## Recording Checklist (CVAULT-84)

- [ ] Practice demo flow (CVAULT-83)
- [ ] Set up screen recording (OBS Studio or similar)
- [ ] Use 1080p resolution minimum
- [ ] Use good microphone (not laptop mic)
- [ ] Record 3-5 minute demo
- [ ] Show actual product, not slides
- [ ] Save as: `~/consensus-vault/demo-raw.mp4`

## Demo Content Suggestions

1. **Landing page** (15s) - Overview of platform
2. **Connect wallet** (10s) - RainbowKit integration
3. **View proposals** (20s) - Active governance
4. **Create proposal** (30s) - Show the flow
5. **Cast vote** (20s) - Token-weighted voting
6. **View results** (20s) - Real-time tracking
7. **Governance contract** (30s) - On-chain execution
8. **BaseScan** (15s) - Show transaction
9. **Closing** (20s) - Summary and links

**Total:** ~3 minutes

## Smart Contract Addresses (For Demo)

- **CONSENSUS Token:** `0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa`
- **Governance Contract:** `0x64A8d1F8b6Fcf85e3d3Fd88Ed75e6e70efd3ec79`
- **Network:** Base Sepolia Testnet

## Links to Show

- **Live Demo:** https://team-consensus-vault.vercel.app
- **GitHub:** https://github.com/openwork-hackathon/team-consensus-vault
- **Token on BaseScan:** https://sepolia.basescan.org/address/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa

## Troubleshooting

### Video Too Large
```bash
ffmpeg -i demo-raw.mp4 -c:v libx264 -crf 28 -preset slow demo-compressed.mp4
```

### Audio Too Quiet
```bash
ffmpeg -i demo-raw.mp4 -af "loudnorm" demo-audio-fixed.mp4
```

### Need Captions
Create `demo-captions.srt` then:
```bash
ffmpeg -i demo-trimmed.mp4 -vf "subtitles=demo-captions.srt" demo-with-captions.mp4
```

## Time Estimate

| Task | Time |
|------|------|
| Record video (CVAULT-84) | 20-30 min |
| Edit video (this task) | 5-10 min |
| Upload to YouTube/Loom | 5-15 min |
| Verify and document | 2-5 min |
| **Total** | **32-60 min** |

## Tools Verified

- ✅ ffmpeg 4.4.2 installed
- ✅ YouTube accessible (HTTP 200)
- ✅ Loom accessible (HTTP 200)
- ✅ Edit script tested and working

## Need Help?

See `demo-video-editing-guide.md` for detailed instructions and troubleshooting.
