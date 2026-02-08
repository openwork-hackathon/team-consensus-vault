# Demo Feature Checklist

**Purpose**: Ensure all key features are demonstrated in the video
**URL**: https://team-consensus-vault.vercel.app

---

## MUST SHOW (Critical for Judges)

### 1. Multi-AI Voting System
- [ ] 5 distinct AI analyst cards visible
- [ ] Each analyst has unique name and specialty
- [ ] Real-time vote streaming (cards update as votes arrive)
- [ ] Confidence percentages displayed per analyst
- [ ] Signal (BUY/SELL/HOLD) visible on each card

**Why It Matters**: This is the core innovation — no other project has 5 AI models voting in consensus.

### 2. Consensus Mechanism
- [ ] Consensus Meter visible
- [ ] Meter animates as votes come in
- [ ] 80% threshold line visible
- [ ] Status text changes (Divergent → Partial → Agreement)
- [ ] Final consensus status clearly shown

**Why It Matters**: The 4/5 supermajority is the key differentiator.

### 3. Trade Signal
- [ ] Trade Signal banner appears after consensus
- [ ] Shows clear BUY, SELL, or HOLD recommendation
- [ ] Displays aggregate confidence score
- [ ] Visual distinction (green for buy, red for sell, yellow for hold)

**Why It Matters**: Shows actionable output from the AI council.

### 4. Web3 Integration
- [ ] Wallet connect button visible in header
- [ ] RainbowKit modal when connecting
- [ ] Wallet address displayed after connection
- [ ] Base network indicator
- [ ] Deposit/Withdraw buttons enabled after connection

**Why It Matters**: Proves Web3 integration is real, not just mockups.

---

## SHOULD SHOW (Important for Full Picture)

### 5. Vault Deposit Flow
- [ ] Click Deposit button
- [ ] Modal opens with amount input
- [ ] Enter deposit amount
- [ ] Processing animation
- [ ] Success toast notification
- [ ] Balance updates in real-time

**Why It Matters**: Shows user funds flow into the vault.

### 6. Total Value Locked (TVL)
- [ ] TVL display on dashboard
- [ ] Updates after deposit
- [ ] Shows pooled nature of vault

**Why It Matters**: Key DeFi metric judges understand.

### 7. Trading Performance
- [ ] Trading Performance section visible
- [ ] P&L tracking displayed
- [ ] Trade history (if available)

**Why It Matters**: Shows the system produces measurable outcomes.

---

## NICE TO SHOW (If Time Permits)

### 8. Withdraw Flow
- [ ] Withdraw button enabled (with balance)
- [ ] Modal with MAX button
- [ ] Successful withdrawal
- [ ] Balance decreases appropriately

### 9. Mobile Responsiveness
- [ ] Show on mobile device or DevTools
- [ ] Cards stack vertically
- [ ] Touch-friendly buttons
- [ ] Readable on small screens

### 10. Error Handling
- [ ] What happens when an analyst times out
- [ ] What happens when no consensus is reached
- [ ] Graceful degradation messaging

### 11. Real-Time Streaming
- [ ] Server-Sent Events visible in action
- [ ] Progressive loading of analyst responses
- [ ] No full page reload required

---

## DO NOT SHOW

- Personal wallet addresses with real funds
- Any API keys or environment variables
- Developer console with sensitive data
- Incomplete or buggy features
- Personal bookmarks or browser history
- Desktop notifications or personal apps

---

## Visual Highlights for Editing

### Key Animation Moments
1. **Consensus Meter Filling** — Capture this in slow-mo if possible
2. **Analyst Card Vote Arrival** — The moment a card updates from "Analyzing" to a vote
3. **Trade Signal Appearance** — The banner sliding in or animating
4. **Toast Notifications** — Success messages appearing

### Pause Points (Hold for 2-3 seconds)
1. After all 5 analysts have voted
2. Final Consensus Meter showing result
3. Trade Signal with confidence score
4. Updated balances after deposit

### Close-Up Shots
1. Individual analyst card with vote and confidence
2. Consensus Meter at threshold line
3. Trade Signal banner
4. Wallet connection address

---

## Feature-to-Script Mapping

| Feature | Script Segment | Timestamp |
|---------|---------------|-----------|
| AI Analyst Cards | Segment 3, 5 | 0:50-1:20, 1:50-3:00 |
| Consensus Meter | Segment 3, 5 | 1:00, 2:00-2:20 |
| Trade Signal | Segment 5, 6 | 2:35, 3:00-3:05 |
| Wallet Connect | Segment 2 | 0:30-0:50 |
| Deposit Flow | Segment 4 | 1:20-1:50 |
| TVL Display | Segment 3, 4 | 0:55, 1:37 |
| Trading Performance | Segment 6 | 3:05-3:15 |

---

## Quick Reference: AI Analysts

| Analyst Name | AI Provider | Specialty | Card Color |
|-------------|-------------|-----------|------------|
| DeepSeek Quant | DeepSeek | Technical Analysis | - |
| Kimi Macro | Kimi (Moonshot) | Whale Watching | - |
| MiniMax Sentiment | MiniMax | Social Sentiment | - |
| GLM Technical | GLM-4-Plus (Zhipu) | On-Chain Metrics | - |
| Gemini Risk | Gemini Pro 2.0 | Risk Assessment | - |

---

## Verification Checklist (Before Recording)

Run through this on the live site:

- [ ] Site loads at team-consensus-vault.vercel.app
- [ ] All 5 analyst cards visible
- [ ] Wallet connection works
- [ ] Deposit modal opens and functions
- [ ] Consensus streaming works (votes appear)
- [ ] Trade signal displays after consensus
- [ ] No console errors (check DevTools)
- [ ] API calls succeeding (Network tab)

---

**Checklist Version**: 1.0
**Created**: February 8, 2026
**Related**: DEMO_SCRIPT.md
