# Consensus Vault Demo Video Production Guide

**Hackathon Submission for Openwork**
**Target Length:** 3-5 minutes
**Deadline:** ~February 14, 2026

---

## Video Structure Overview

| Section | Duration | Purpose |
|---------|----------|---------|
| Intro | 0:00-0:30 | Hook + problem statement |
| Live Demo | 0:30-3:30 | Core product walkthrough |
| Tech Stack | 3:30-4:00 | Architecture highlights |
| Outro | 4:00-4:30 | Vision + CTA |

---

## Section 1: Intro (0:00 - 0:30)

### Opening Hook (0:00-0:10)
**Talking Point:**
> "What if the smartest crypto trading decisions weren't made by one AI... but by five AI models reaching consensus together?"

**Visual:** Show the main dashboard with the consensus meter prominently displayed.

### Problem Statement (0:10-0:20)
**Talking Point:**
> "Single AI models have blind spots. They can hallucinate. They miss context. In crypto, these mistakes cost real money."

**Visual:** Quick cut to show multiple analyst cards, each with different perspectives.

### Solution Intro (0:20-0:30)
**Talking Point:**
> "Consensus Vault solves this with multi-AI governance. Five specialized AI models analyze the market independently, then reach consensus before any trade executes."

**Visual:** Show the full dashboard with the 80% threshold visible on the consensus meter.

---

## Section 2: Live Demo (0:30 - 3:30)

### Part A: Wallet Connection (0:30 - 1:00)

**Screen Recording Sequence:**
1. Show the disconnected state (Deposit/Withdraw buttons disabled)
2. Click "Connect Wallet" button (RainbowKit modal)
3. Select MetaMask or preferred wallet
4. Approve connection
5. Show connected state with address visible

**Talking Point:**
> "First, connect your wallet. Consensus Vault integrates with RainbowKit for seamless Web3 connectivity."

**UI Elements to Highlight:**
- ConnectButton in header
- Vault stats section showing "Total Value Locked"
- "Your Deposits" field appearing after connection

---

### Part B: AI Analyst Council (1:00 - 2:00)

**Screen Recording Sequence:**
1. Scroll to the AI Analyst Council section
2. Show each of the 5 analyst cards in detail
3. Wait for analysis cycle to complete (show "Analyzing ●●●" state)
4. Show completed analysis with reasoning text

**Talking Points by Analyst:**

**DeepSeek Quant:**
> "DeepSeek focuses on quantitative signals—price patterns, volume analysis, technical indicators."

**Kimi Macro:**
> "Kimi analyzes macroeconomic context—interest rates, institutional flows, market cycles."

**MiniMax Sentiment:**
> "MiniMax reads market sentiment—social signals, fear and greed, crowd psychology."

**GLM Technical:**
> "GLM provides pure technical analysis—support/resistance, chart patterns, momentum."

**Gemini Risk:**
> "Gemini assesses risk—volatility, position sizing, downside protection."

**Visual Tips:**
- Zoom in on each analyst card to show:
  - Avatar icon and color coding
  - Sentiment indicator (bullish ↗, bearish ↘, neutral →)
  - Confidence percentage
  - Reasoning text
- Show the streaming indicator animation at the bottom of cards

---

### Part C: Consensus Mechanism (2:00 - 2:30)

**Screen Recording Sequence:**
1. Focus on the Consensus Meter component
2. Show the progress bar filling up
3. Highlight the threshold marker at 80%
4. Show status text changing: "Divergent" → "Building" → "Strong Agreement" → "CONSENSUS REACHED"

**Talking Point:**
> "The consensus meter aggregates all five AI opinions. Watch it update in real-time. When agreement crosses our 80% threshold, a trade signal activates."

**Visual Elements:**
- Progress bar with gradient color change (red → yellow → green)
- Shimmer effect during progress
- Pulse effect when threshold is reached
- Legend showing Disagreement/Partial/Consensus

---

### Part D: Trade Signal Activation (2:30 - 2:50)

**Screen Recording Sequence:**
1. Wait for (or simulate) consensus reaching threshold
2. Show TradeSignal component appearing with animation
3. Highlight the signal type (BUY/SELL/HOLD)
4. Show the "Execute Trade" button

**Talking Point:**
> "When consensus is reached, a clear trade signal appears. BUY when the AI council is bullish, SELL when bearish, HOLD when uncertain. The system can execute automatically or wait for manual confirmation."

**Visual Elements:**
- Pulsing background animation
- Large emoji indicator (rocket for BUY)
- Agreement percentage display
- Execute Trade button

---

### Part E: Deposit Flow (2:50 - 3:10)

**Screen Recording Sequence:**
1. Click "Deposit" button
2. Show DepositModal opening
3. Enter an amount (e.g., "0.1" ETH)
4. Click Deposit in modal
5. Show processing state
6. Show success toast notification
7. Show updated "Your Deposits" value

**Talking Point:**
> "Depositing into the vault is simple. Enter your amount, confirm the transaction, and your funds are now managed by the AI consensus system."

---

### Part F: Trading Performance (3:10 - 3:30)

**Screen Recording Sequence:**
1. Scroll to Paper Trading Performance section
2. Show the metrics grid (Total P&L, Win Rate, Total Trades, Open Positions)
3. Scroll through Recent Trades table
4. Highlight a winning trade (green P&L)

**Talking Point:**
> "Track your paper trading performance in real-time. The dashboard shows total P&L, win rate, and every trade executed by the consensus engine. In testing, our multi-AI approach has shown significantly better performance than single-model trading."

**Visual Elements:**
- 8-stat metrics grid
- Trade history table with color-coded P&L
- Status badges (open/closed)
- Consensus strength indicators

---

## Section 3: Tech Stack (3:30 - 4:00)

**Screen Recording Sequence:**
Show the architecture diagram or code snippets briefly.

**Talking Points:**

> "Under the hood, Consensus Vault is built on:"
>
> - **Next.js 14** with App Router for a blazing-fast React frontend
> - **Vercel** for instant global deployment
> - **Five AI APIs** working in parallel:
>   - DeepSeek for quantitative analysis
>   - Kimi (Moonshot) for macro insights
>   - MiniMax for sentiment
>   - GLM (Zhipu) for technicals
>   - Gemini for risk assessment
> - **RainbowKit + wagmi** for wallet connectivity
> - **Mint Club V2** for secure, audited token mechanics—no custom smart contracts

**Key Differentiator:**
> "We deliberately chose NOT to write custom smart contracts. Security is paramount in DeFi. By using Mint Club V2's audited infrastructure, we can focus on AI innovation while trusting battle-tested token mechanics."

---

## Section 4: Outro (4:00 - 4:30)

### Future Vision (4:00-4:15)
**Talking Point:**
> "What's next for Consensus Vault? We're building toward:
> - Automated trade execution with real funds
> - Additional AI models for even broader consensus
> - Cross-chain deployment
> - DAO governance over trading parameters"

### Call to Action (4:15-4:30)
**Talking Point:**
> "Consensus Vault: Because one AI is a guess, but five AIs reaching agreement is intelligence.
>
> Try it now at team-consensus-vault.vercel.app. Thank you to Openwork for this hackathon, and thank you for watching."

**Visual:** Show the deployed URL clearly, with the lobster emoji logo visible.

---

## Shot List / Recording Sequence

| Shot # | Screen/Element | Duration | Notes |
|--------|---------------|----------|-------|
| 1 | Full dashboard, disconnected | 10s | Wide shot, show layout |
| 2 | Wallet connect flow | 15s | RainbowKit modal animation |
| 3 | Header with wallet connected | 5s | Show address truncation |
| 4 | Vault stats section | 8s | TVL and deposit amounts |
| 5 | AI Analyst Council header | 5s | Section intro |
| 6 | DeepSeek Quant card | 8s | Zoom, show reasoning |
| 7 | Kimi Macro card | 6s | Show sentiment indicator |
| 8 | MiniMax Sentiment card | 6s | Show confidence % |
| 9 | GLM Technical card | 6s | Show analysis text |
| 10 | Gemini Risk card | 6s | Show border color |
| 11 | All 5 cards (wide) | 5s | Show grid layout |
| 12 | Consensus Meter | 15s | Record progress animation |
| 13 | Threshold crossing | 10s | Capture pulse effect |
| 14 | Trade Signal appearance | 12s | Record entrance animation |
| 15 | Execute Trade button hover | 5s | Show hover state |
| 16 | Deposit modal open | 5s | Click flow |
| 17 | Deposit amount entry | 8s | Type "0.1" |
| 18 | Deposit processing | 8s | Show loading state |
| 19 | Success toast | 5s | Notification appearance |
| 20 | Trading Performance header | 5s | Section intro |
| 21 | Metrics grid | 10s | Pan across stats |
| 22 | Recent Trades table | 15s | Scroll through trades |
| 23 | Code/architecture | 15s | Optional: show terminal/IDE |
| 24 | Final dashboard | 10s | Wide shot with URL visible |

**Total raw footage needed:** ~4-5 minutes
**Final cut target:** 3-5 minutes

---

## Recording Settings

### OBS Studio Configuration

**Video Settings:**
- Resolution: 1920x1080 (1080p)
- FPS: 30 or 60 (60 preferred for smooth animations)
- Encoder: Hardware (NVENC/AMF) if available, otherwise x264
- Bitrate: 6000-8000 kbps for quality

**Audio Settings:**
- Sample Rate: 48 kHz
- Bitrate: 160 kbps
- Microphone: Use a dedicated USB mic if possible
- Noise suppression: Enable

**Scene Setup:**
- Display Capture or Window Capture (browser only)
- Crop to 16:9 aspect ratio
- Consider 5-10% padding around browser for breathing room

**Browser Prep:**
- Use Chrome or Firefox in incognito mode
- Clear cache before recording
- Set zoom to 100% (or 110% if text is small)
- Hide bookmarks bar
- Disable browser notifications

### Loom Alternative

If using Loom instead of OBS:
- Enable HD recording
- Use browser tab capture for cleaner output
- Record in fullscreen mode
- Enable mouse click highlighting
- Record audio from both mic and system

### Pre-Recording Checklist

- [ ] Close unnecessary browser tabs
- [ ] Disable desktop notifications (Do Not Disturb)
- [ ] Test microphone levels (peak at -6dB to -12dB)
- [ ] Have MetaMask or test wallet ready
- [ ] Ensure stable internet connection
- [ ] Clear browser cookies for clean RainbowKit state
- [ ] Prepare script visible on second monitor or printed
- [ ] Do a 30-second test recording
- [ ] Check disk space (need at least 5GB free)

---

## YouTube Upload Checklist

### Video Details

**Title:**
```
Consensus Vault: Multi-AI Trading Governance | Openwork Hackathon 2026
```

**Description:**
```
Consensus Vault brings multi-AI governance to crypto trading decisions. Instead of trusting a single AI, our system uses five specialized AI models that must reach consensus before any trade executes.

Key Features:
- 5 AI Analysts: DeepSeek, Kimi, MiniMax, GLM, Gemini
- 80% Consensus Threshold for trade signals
- Real-time streaming analysis
- Paper trading with full performance tracking
- Web3 wallet integration via RainbowKit
- Secure token mechanics via Mint Club V2

Tech Stack:
- Next.js 14 (App Router)
- Vercel deployment
- RainbowKit + wagmi
- Framer Motion animations
- Tailwind CSS

Try it: https://team-consensus-vault.vercel.app
GitHub: https://github.com/openwork-hackathon/team-consensus-vault

Built for the Openwork Hackathon 2026.

Team: Consensus Vault
Wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

#OpenworkHackathon #AI #Crypto #Trading #DeFi #Web3 #MachineLearning
```

**Tags:**
```
openwork, hackathon, AI trading, crypto AI, multi-agent AI, consensus mechanism, DeFi, Web3, Next.js, Vercel, DeepSeek, Kimi, MiniMax, GLM, Gemini, paper trading, crypto trading bot, AI governance, Mint Club, RainbowKit
```

**Category:** Science & Technology

**Thumbnail Requirements:**
- Resolution: 1280x720 (minimum)
- Show the lobster logo prominently
- Include text: "CONSENSUS VAULT" and "5 AIs, 1 Decision"
- Use the app's color scheme (dark theme with green/red accents)
- Add Openwork hackathon branding if permitted

### Upload Settings

- [ ] Visibility: Public (or Unlisted for initial review)
- [ ] Add to playlist: "Hackathon Submissions" (create if needed)
- [ ] Allow embedding: Yes
- [ ] Notify subscribers: Yes
- [ ] Comments: On
- [ ] Age restriction: No
- [ ] Chapters: Add manual timestamps matching video sections

### Recommended Chapters
```
0:00 Introduction
0:30 Wallet Connection
1:00 AI Analyst Council
2:00 Consensus Mechanism
2:30 Trade Signals
2:50 Deposit Flow
3:10 Trading Performance
3:30 Tech Stack
4:00 Future Vision
```

---

## Post-Recording Editing Tips

### Editing Software
- **Free:** DaVinci Resolve, Shotcut, or iMovie
- **Paid:** Premiere Pro, Final Cut Pro

### Edit Checklist
- [ ] Trim dead air and mistakes
- [ ] Add subtle background music (royalty-free)
- [ ] Normalize audio levels
- [ ] Add title cards for section transitions
- [ ] Include lower-third text for key features
- [ ] Add zoom effects for important UI elements
- [ ] Color correct if browser looks washed out
- [ ] Export at 1080p, 30fps minimum, H.264 codec

### Music Suggestions
- Epidemic Sound (subscription)
- YouTube Audio Library (free)
- Artlist (subscription)
- Pixabay Music (free)

Look for: Tech, upbeat, electronic, futuristic themes. Keep volume at 10-15% of voice level.

---

## Troubleshooting

### If AI analysts aren't responding:
- Refresh the page to restart the consensus stream
- Check browser console for API errors
- Wait 10-15 seconds for the first analysis cycle

### If wallet won't connect:
- Clear MetaMask cache
- Switch to a different wallet temporarily
- Use WalletConnect as backup

### If consensus meter isn't moving:
- This is normal during low-activity periods
- The demo will be more impressive during market hours
- Consider recording the consensus building over time and speeding up

### If deposit fails:
- Ensure wallet is connected
- Check that there's test ETH in the wallet
- The demo uses simulated deposits (no real transactions)

---

## Final Notes

- **Authenticity:** Show real interactions, not staged screenshots
- **Confidence:** Speak clearly about the technology without overselling
- **Time:** Aim for 4 minutes—better to be slightly short than to drag
- **Branding:** Keep the lobster emoji visible—it's memorable
- **Judge Appeal:** Focus on the innovation (multi-AI consensus) and security decision (no custom contracts)

**Recording requires human execution.** This guide provides all the structure needed for a professional hackathon submission video.

---

*Generated for CVAULT-34 | February 2026*
