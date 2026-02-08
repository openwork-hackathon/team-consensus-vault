# Demo Video Upload Instructions

## Video Ready for Upload

**Video File:** `demo-final.mp4`
**Location:** `/home/shazbot/consensus-vault/demo-final.mp4`
**Duration:** 28 seconds
**Resolution:** 1920x1080 (1080p)
**File Size:** ~375 KB
**Format:** H.264 MP4

## Upload Options

### Option A: YouTube (Recommended)

1. Go to https://studio.youtube.com/
2. Click "Create" → "Upload videos"
3. Select `demo-final.mp4`
4. Fill in the details:

**Title:**
```
Consensus Vault - Decentralized Governance Platform | Openwork Hackathon 2026
```

**Description:**
```
Consensus Vault - Decentralized Governance Platform

A hackathon project demonstrating on-chain governance with token-weighted voting, proposal creation and management, and real-time vote tracking.

Key Features:
• Token-weighted voting system
• On-chain proposal creation and execution
• Real-time vote tracking and results
• Integration with Mint Club V2 for secure tokenomics
• Modern responsive UI built with Next.js

Technical Stack:
- Frontend: Next.js 15, React 19, TypeScript
- Blockchain: Base Sepolia Testnet
- Wallet Integration: RainbowKit, Wagmi, Viem
- Token Protocol: Mint Club V2 (audited, battle-tested)
- Styling: Tailwind CSS

Smart Contracts:
- CONSENSUS Token: 0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa
- Governance Contract: 0x64A8d1F8b6Fcf85e3d3Fd88Ed75e6e70efd3ec79

Links:
• Live Demo: https://team-consensus-vault.vercel.app
• GitHub: https://github.com/openwork-hackathon/team-consensus-vault
• Token on BaseScan: https://sepolia.basescan.org/address/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa

Hackathon: Openwork 2026
Team: Consensus Vault
```

**Tags:**
```
blockchain, governance, web3, hackathon, defi, dao, ethereum, base, sepolia, nextjs, rainbowkit, voting
```

**Visibility:** Unlisted (or Public)
**Category:** Science & Technology

5. Click "Publish"
6. Copy the video URL
7. Save URL to `DEMO_VIDEO_URL.txt`

### Option B: Loom (Alternative)

1. Go to https://www.loom.com/
2. Sign in or create an account
3. Click "Upload" button
4. Select `demo-final.mp4`
5. Wait for upload to complete
6. Click "Share" → "Copy link"
7. Set sharing to "Anyone with the link"
8. Save URL to `DEMO_VIDEO_URL.txt`

## Quick Upload Command

After uploading, save the URL:

```bash
echo "YOUR_VIDEO_URL_HERE" > ~/consensus-vault/DEMO_VIDEO_URL.txt
```

## Video Content Overview

The demo video includes:

1. **Intro (3s)** - Title card with project name and hackathon info
2. **Features (2s)** - Key features highlight slide
3. **Live Demo (20s)** - Automated capture of the live application showing:
   - Landing page overview
   - Scrolling through features
   - Wallet connection area
   - Proposals section
4. **Outro (3s)** - Thank you with links

## Testing the Video

Before submitting, verify the video plays correctly:

```bash
# Local playback
mpv ~/consensus-vault/demo-final.mp4

# Or open in browser
xdg-open ~/consensus-vault/demo-final.mp4
```

## Submission Checklist

- [ ] Video uploaded to YouTube or Loom
- [ ] Video set to "Unlisted" or "Public" (not Private)
- [ ] URL copied and saved to DEMO_VIDEO_URL.txt
- [ ] Video tested and plays correctly
- [ ] URL added to hackathon submission form

## Files Created

| File | Purpose |
|------|---------|
| `demo-final.mp4` | Final demo video ready for upload |
| `demo-generated.mp4` | Raw website capture (backup) |
| `generate-demo-video.js` | Script to regenerate video |
| `create-enhanced-demo-video.sh` | Script to create enhanced version |
| `demo-video-description.txt` | YouTube description template |
| `DEMO_VIDEO_UPLOAD_INSTRUCTIONS.md` | This file |

## Need to Regenerate?

If you need to recreate the video:

```bash
cd ~/consensus-vault
bash create-enhanced-demo-video.sh
```

This will regenerate the video from the live website.

## Support

For issues with:
- **Video generation**: Check `generate-demo-video.js`
- **Upload issues**: Contact YouTube/Loom support
- **Video content**: See `demo-video-editing-guide.md`
