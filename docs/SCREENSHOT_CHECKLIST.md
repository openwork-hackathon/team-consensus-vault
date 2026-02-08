# Screenshot Capture Checklist

> **MANUAL TASK**: These screenshots must be captured by Jonathan on a machine with browser access to https://team-consensus-vault.vercel.app

## Required Screenshots

### 1. Dashboard with Connected Wallet
**Filename:** `public/screenshots/01-dashboard-connected.png`
- [ ] Navigate to https://team-consensus-vault.vercel.app
- [ ] Connect MetaMask or WalletConnect to Base network
- [ ] Capture full viewport showing:
  - Connected wallet address in header (truncated format: 0x676a...B79C)
  - All 5 AI analyst cards visible
  - Consensus meter at initial state
  - "Analyze" button visible
- **Resolution:** 1920x1080 (desktop)

### 2. Consensus Query In Progress
**Filename:** `public/screenshots/02-consensus-in-progress.png`
- [ ] Click "Analyze BTC" button
- [ ] Capture DURING analysis (before completion) showing:
  - 5 AI analyst cards with thinking/loading indicators
  - Some cards showing "Analyzing..." state
  - Possibly 1-2 cards already showing results while others still processing
  - Consensus meter partially filled or animating
- **Resolution:** 1920x1080 (desktop)
- **Note:** This may require quick capture or screen recording + frame extraction

### 3. Consensus Result - 4/5 Agreement
**Filename:** `public/screenshots/03-consensus-reached.png`
- [ ] Wait for consensus analysis to complete
- [ ] Capture showing:
  - 4 out of 5 analysts agreeing (e.g., 4 BUY, 1 HOLD)
  - Confidence scores visible on each card (e.g., 85%, 80%, 60%, 90%, 75%)
  - Consensus meter showing "4/5" or similar threshold indicator
  - Green/success styling indicating consensus reached
- **Resolution:** 1920x1080 (desktop)

### 4. Trade Signal Display
**Filename:** `public/screenshots/04-trade-signal.png`
- [ ] After consensus is reached, capture the trade signal section showing:
  - BUY/SELL/HOLD signal prominently displayed
  - Reasoning summary from analysts
  - Average confidence score
  - Any action buttons (if present)
- **Resolution:** 1920x1080 (desktop)
- **Note:** May be same screen as #3, zoom/crop if needed

### 5. Paper Trading P&L Summary
**Filename:** `public/screenshots/05-paper-trading-pnl.png`
- [ ] Navigate to paper trading or performance section
- [ ] Capture showing:
  - Simulated trades history
  - P&L (Profit/Loss) summary
  - Performance metrics if available
- **Resolution:** 1920x1080 (desktop)
- **Note:** If paper trading view doesn't exist as separate page, capture from main dashboard

### 6. Deposit Modal
**Filename:** `public/screenshots/06-deposit-modal.png`
- [ ] Open deposit modal/dialog
- [ ] Capture showing:
  - Input field for amount
  - Token selection (if applicable)
  - Wallet balance displayed
  - Deposit button
- **Resolution:** 1920x1080 (desktop)
- **Note:** If deposit flow not implemented, mark as N/A

### 7. Withdraw Modal
**Filename:** `public/screenshots/07-withdraw-modal.png`
- [ ] Open withdraw modal/dialog
- [ ] Capture showing:
  - Input field for amount
  - Vault balance displayed
  - Withdraw button
- **Resolution:** 1920x1080 (desktop)
- **Note:** If withdraw flow not implemented, mark as N/A

### 8. Mobile Responsive View
**Filename:** `public/screenshots/08-mobile-responsive.png`
- [ ] Open browser DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Set width to 375px (iPhone SE/standard mobile)
- [ ] Capture showing:
  - Mobile-optimized layout
  - All key elements visible and usable
  - Hamburger menu if applicable
  - Analyst cards stacked vertically
- **Resolution:** 375x812 (iPhone X viewport)

---

## Optional/Bonus Screenshots

### 9. Animated Voting GIF
**Filename:** `public/screenshots/09-voting-animation.gif`
- [ ] Record screen during "Analyze BTC" flow
- [ ] Convert to GIF showing real-time vote updates
- [ ] Keep under 5MB for README embedding
- **Tools:** LICEcap (Windows/Mac), Kap (Mac), ScreenToGif (Windows), or peek (Linux)

### 10. No Consensus State
**Filename:** `public/screenshots/10-no-consensus.png`
- [ ] Trigger analysis and wait for a scenario where consensus is NOT reached
- [ ] Capture showing:
  - Split vote (e.g., 2 BUY, 2 SELL, 1 HOLD)
  - "No Consensus" indicator
  - Amber/neutral styling
- **Note:** May need multiple attempts to capture this state

### 11. Wallet Connection Modal
**Filename:** `public/screenshots/11-wallet-connect.png`
- [ ] Click "Connect Wallet" button (while disconnected)
- [ ] Capture RainbowKit modal showing wallet options:
  - MetaMask
  - Coinbase Wallet
  - WalletConnect
  - Other options
- **Resolution:** 1920x1080 (desktop)

---

## Screenshot Specifications

| Requirement | Value |
|-------------|-------|
| Format | PNG (for static), GIF (for animated) |
| Desktop Resolution | 1920x1080 minimum |
| Mobile Resolution | 375x812 (iPhone X) |
| Max File Size | 2MB per PNG, 5MB per GIF |
| Naming Convention | `##-descriptive-name.png` |
| Location | `/public/screenshots/` |

---

## After Capture

1. **Optimize images** (optional but recommended):
   ```bash
   # Using ImageOptim, TinyPNG, or similar
   # Reduces file size without quality loss
   ```

2. **Update README.md** - Replace placeholder section with actual images:
   ```markdown
   ## Screenshots

   ### Dashboard
   ![Dashboard](public/screenshots/01-dashboard-connected.png)

   ### Consensus in Progress
   ![Voting](public/screenshots/02-consensus-in-progress.png)

   ... etc
   ```

3. **Commit and push**:
   ```bash
   git add public/screenshots/
   git commit -m "[HUMAN] docs: add UI screenshots for README"
   git push origin main
   ```

---

## Placeholder Files Created

The following placeholder files have been created in `public/screenshots/`:
- `01-dashboard-connected.png.placeholder`
- `02-consensus-in-progress.png.placeholder`
- `03-consensus-reached.png.placeholder`
- `04-trade-signal.png.placeholder`
- `05-paper-trading-pnl.png.placeholder`
- `06-deposit-modal.png.placeholder`
- `07-withdraw-modal.png.placeholder`
- `08-mobile-responsive.png.placeholder`

Replace each `.placeholder` file with the actual screenshot when captured.

---

**Created:** 2026-02-08
**Task:** CVAULT-58
**Status:** Documentation complete, awaiting manual screenshot capture
