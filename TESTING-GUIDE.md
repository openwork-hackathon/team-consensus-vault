# Consensus Vault - Testing Guide

**Version:** 1.0
**Date:** 2026-02-08
**For:** Hackathon Demo & Integration Testing

---

## Quick Start

### Prerequisites
```bash
# Ensure dependencies are installed
npm install

# Verify .env.local exists and has DEMO_MODE=true
cat .env.local | grep DEMO_MODE
# Should output: DEMO_MODE=true
```

### Start Development Server
```bash
npm run dev

# Server starts at: http://localhost:3000
```

---

## Testing Scenarios

### 1. Prediction Market Full Cycle (~5 minutes)

**URL:** `http://localhost:3000/predict`

**Steps:**
1. **Navigate to /predict**
   - Should see "Prediction Market" page
   - Connection status indicators at top
   - Phase indicator shows current state

2. **SCANNING Phase (0-45 seconds)**
   - Spinner animation with 🔍 icon
   - "Scanning market conditions..." message
   - Wait for AI consensus (15s polling interval)
   - Console logs show consensus attempts

3. **BETTING_WINDOW Phase (30 seconds)**
   - Timer countdown appears
   - Pool display shows AGREE/DISAGREE totals
   - Bet amount input (min $100, max $10,000)
   - Quick amount buttons: $100, $250, $500, $1000
   - **Test:** Place a bet on AGREE or DISAGREE
   - Pool updates in real-time
   - Progress bar shows pool distribution

4. **POSITION_OPEN Phase (up to 2 minutes)**
   - Live P&L tracker appears
   - Price updates every 15 seconds
   - Shows entry price, current price, profit %
   - Oscillating price movement (±2% sine wave)
   - Exits after 2 minutes OR when 3% profit target hit

5. **EXIT_SIGNAL Phase (brief)**
   - Transition state
   - Exit price captured

6. **SETTLEMENT Phase (final)**
   - Settlement results displayed
   - Shows winning side (AGREE or DISAGREE)
   - Price change percentage
   - Total payout calculations
   - Platform fee breakdown (2%)

7. **Cycle Repeats**
   - After settlement, returns to SCANNING
   - New round ID generated
   - Bet history preserved

**Expected Total Time:** 3-5 minutes per full cycle

---

### 2. Chatroom / Debate Arena

**URL:** `http://localhost:3000/chatroom`

**Steps:**
1. **Navigate to /chatroom**
   - Accessible via nav menu (💬 icon)
   - ChatRoom component loads

2. **DEBATE Phase**
   - 17 AI personas debate market direction
   - Messages stream in real-time via SSE
   - Each message has sentiment tag (bullish/bearish/neutral)
   - Confidence levels displayed
   - Typing indicators show next speaker

3. **CONSENSUS Phase**
   - Triggered when 80% agreement reached
   - Consensus meter shows alignment level
   - Direction locked (BUY or SELL)

4. **COOLDOWN Phase**
   - 15-30 minute pause (can be accelerated for testing)
   - Displays countdown timer
   - Cycle repeats after cooldown

**AI Personas:**
- DeepSeek: Momentum Hunter
- Kimi: Whale Watcher
- MiniMax: Sentiment Scout
- GLM: On-Chain Oracle
- Gemini: Risk Manager (4-key rotation)

---

### 3. Mobile Responsiveness Testing

#### 375px (iPhone SE / Small Phones)
```
Chrome DevTools:
- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Select "iPhone SE" or set custom 375x667
```

**Test Points:**
- [ ] Betting panel grid collapses to single column
- [ ] Quick amount buttons stack properly (2x2 grid)
- [ ] Timer remains visible and readable
- [ ] Pool cards stack vertically
- [ ] Touch targets are at least 44x44px
- [ ] Navigation menu responsive
- [ ] All text readable without zoom

#### 768px (Tablets)
```
Chrome DevTools:
- Select "iPad Mini" or set custom 768x1024
```

**Test Points:**
- [ ] Betting panel grid shows 2 columns
- [ ] Quick amount buttons in 4-column row
- [ ] Pool cards side-by-side
- [ ] How It Works section readable
- [ ] Navigation icons + labels visible
- [ ] Touch-friendly button sizes

#### 1024px+ (Desktop)
```
Default browser view
```

**Test Points:**
- [ ] Full layout with all columns
- [ ] Optimal spacing and padding
- [ ] All features accessible
- [ ] Hover states work properly

---

### 4. Error Handling & Edge Cases

#### Test Connection Loss
1. Start prediction market stream
2. **Simulate:** Disable network in DevTools (Network tab → Offline)
3. **Expected:**
   - Connection status changes to red
   - "Connection lost. Reconnecting..." message appears
   - Exponential backoff retry (1s, 2s, 4s, 8s, etc.)
   - Max 10 retry attempts
4. **Restore:** Re-enable network
5. **Expected:** Automatic reconnection, stream resumes

#### Test Invalid Bet Amount
1. Navigate to BETTING_WINDOW phase
2. **Test:** Enter amount < $100
3. **Expected:** Error message "Minimum bet amount is $100"
4. **Test:** Enter amount > $10,000
5. **Expected:** Error message "Maximum bet amount is $10,000"
6. **Test:** Enter non-numeric characters
7. **Expected:** Input rejected (only numbers and decimals allowed)

#### Test Betting Outside Window
1. Wait for POSITION_OPEN phase
2. **Test:** Try to place bet (buttons should be disabled)
3. **Expected:** Buttons disabled, cannot submit

#### Test Wallet Connection
1. Start without wallet connected
2. **Expected:** "Wallet not connected" empty state
3. **Test:** Click AGREE/DISAGREE buttons
4. **Expected:** Toast: "Please connect your wallet to place bets"

---

### 5. Loading States

#### Initial Page Load
- [ ] LoadingSkeleton appears before data loads
- [ ] Smooth transition to actual content
- [ ] No layout shift (CLS score good)

#### Bet Placement
- [ ] Button shows spinner during submission
- [ ] Button text changes to "Placing..."
- [ ] Button disabled during placement
- [ ] Toast notification on success/failure

#### Phase Transitions
- [ ] Smooth animations between phases
- [ ] No flashing or jarring updates
- [ ] State updates propagate correctly

---

### 6. Empty States

#### No Active Round
- Navigate to /predict when no round active
- **Expected:** NoRoundsEmptyState component
- Message: "No active rounds"
- "The AI council is scanning market conditions..."

#### No Bets Placed
- During BETTING_WINDOW, don't place bets
- Check "Your Bets" section
- **Expected:** NoBetsEmptyState
- Icon: 📊
- Message: "No bets yet"

#### Connection Lost
- Disconnect from SSE stream
- **Expected:** DisconnectedEmptyState
- Icon: 🔌
- Message: "Connection lost"
- Retry button available

---

## Console Monitoring

### Expected Console Logs (Demo Mode)

```
[prediction-market] Connected: { timestamp: ..., demoMode: true, ... }
[prediction-market] Scanning for consensus...
[prediction-market] No consensus yet, waiting 15000ms
[prediction-market] Forcing BUY signal for demo after 3 polls
[prediction-market] Phase change: SCANNING → ENTRY_SIGNAL
[prediction-market] Phase change: ENTRY_SIGNAL → BETTING_WINDOW
[prediction-market] Betting window closed
[prediction-market] Phase change: BETTING_WINDOW → POSITION_OPEN
[prediction-market] Forcing exit after 120000 ms in POSITION_OPEN
[prediction-market] Phase change: POSITION_OPEN → EXIT_SIGNAL
[prediction-market] Phase change: EXIT_SIGNAL → SETTLEMENT
[prediction-market] Calculating settlement...
```

### Error Logs to Watch For

❌ **Should NOT see:**
- Unhandled promise rejections
- React hydration errors
- Network errors (except during connection loss tests)
- TypeScript type errors
- SSE connection failures (except during retry tests)

✅ **OK to see:**
- `[chatroom-engine] Moderator failed` (graceful fallback)
- `[prediction-market] Connection error` (during reconnection)
- `[prediction-market] Reconnecting in Xms` (retry logic)

---

## Performance Benchmarks

### Target Metrics
- **FCP (First Contentful Paint):** < 1.5s
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **TTI (Time to Interactive):** < 3.5s
- **SSE Connection Time:** < 1s

### Measure Performance
```bash
# Lighthouse audit
npm run build
npm run start
# Open Chrome DevTools → Lighthouse → Run audit
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

---

## Demo Mode Configuration

### Current Settings (.env.local)
```bash
DEMO_MODE=true

# Timings:
- SCANNING: 15s intervals
- BETTING_WINDOW: 30s duration
- POSITION_OPEN: 2min max (or 3% profit target)
- PRICE_UPDATE: 15s intervals
- MAX_ROUND: 5min total
```

### To Disable Demo Mode
```bash
# Edit .env.local
DEMO_MODE=false

# Production timings:
- SCANNING: 60s intervals
- BETTING_WINDOW: 5min duration
- POSITION_OPEN: 24h max
- PRICE_UPDATE: 5s intervals
- MAX_ROUND: 24h total
```

---

## Known Limitations (By Design)

### Demo Mode Behaviors
1. **Mock Prices:** BTC=$45,000, ETH=$2,500, SOL=$100
2. **Forced Consensus:** After 3 failed polls, forces BUY signal
3. **Forced Exit:** Position exits after 2 minutes regardless
4. **Mock Payouts:** Settlement uses placeholder data
5. **No Persistence:** Bet history lost on page refresh

### Features Pending Production
1. **Real Price Feeds:** Needs integration with CoinGecko/Binance API
2. **Smart Contracts:** Betting and payouts need on-chain execution
3. **User Authentication:** Persistent accounts and history
4. **Database Storage:** Bet tracking across sessions
5. **Wallet Integration:** Real wallet transactions (currently mock)

---

## Troubleshooting

### Problem: Dev server won't start
```bash
# Solution:
rm -rf .next node_modules
npm install
npm run dev
```

### Problem: SSE connection fails immediately
```bash
# Check:
1. Server running on port 3000
2. No CORS issues (should work on localhost)
3. Browser supports EventSource API
4. No ad blockers interfering
```

### Problem: Betting buttons disabled
```bash
# Verify:
1. Currently in BETTING_WINDOW phase
2. Wallet connected (or mock wallet active)
3. Bet amount between $100-$10,000
4. Haven't already bet this round
```

### Problem: Round stuck in SCANNING
```bash
# Expected in demo:
- Will force BUY signal after 3 polls (45 seconds max)
- Check console for "Forcing BUY signal for demo"
- If not progressing after 1 minute, refresh page
```

### Problem: Mobile layout broken
```bash
# Verify:
1. Using correct DevTools device emulation
2. Refresh page after changing viewport
3. Check for browser zoom (should be 100%)
4. Clear browser cache if styles not updating
```

---

## Test Checklist

### Pre-Demo
- [ ] npm install completed successfully
- [ ] .env.local has DEMO_MODE=true
- [ ] npm run dev starts without errors
- [ ] Can access http://localhost:3000
- [ ] Navigation works (/, /predict, /chatroom, /rounds)

### Prediction Market
- [ ] Full round cycle completes (<5 min)
- [ ] All phases transition correctly
- [ ] Betting works (adds to pool)
- [ ] Timer counts down accurately
- [ ] Settlement displays results
- [ ] Mobile layout works (375px, 768px)

### Chatroom
- [ ] Messages stream in real-time
- [ ] All 17 personas visible
- [ ] Sentiment tags display
- [ ] Consensus meter updates
- [ ] Phase transitions work

### Error Handling
- [ ] Connection loss handled gracefully
- [ ] Invalid input rejected
- [ ] Empty states show when appropriate
- [ ] Loading states smooth
- [ ] Toast notifications work

### Performance
- [ ] Page loads in < 3s
- [ ] No layout shifts
- [ ] Animations smooth (60fps)
- [ ] SSE connection stable
- [ ] Memory usage stable over time

---

## Support

### Log Files
- Browser DevTools Console (F12)
- Network tab for SSE streams
- React DevTools for component state

### Debug Mode
```javascript
// In browser console:
localStorage.setItem('debug', 'prediction-market:*,chatroom:*');
// Refresh page to enable verbose logging
```

### Report Issues
- Check CVAULT-132-ACTIVITY-LOG.md for known issues
- Document repro steps
- Include console errors
- Note browser and viewport size

---

## Success Criteria

### Hackathon Demo Ready ✅
- [ ] Full round completes in demo mode
- [ ] Betting mechanics functional
- [ ] Chatroom streams messages
- [ ] Mobile responsive
- [ ] No critical bugs
- [ ] Loading/error states work

### Production Ready ⚠️
- [ ] DEMO_MODE=false
- [ ] Real price feeds integrated
- [ ] Smart contracts deployed
- [ ] User authentication added
- [ ] Database persistence
- [ ] Error monitoring (Sentry)
- [ ] Analytics tracking
- [ ] Security audit complete

---

**Last Updated:** 2026-02-08
**Tested By:** Lead Engineer (code review)
**Next Test:** Manual browser testing recommended
