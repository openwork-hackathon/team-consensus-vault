# CVAULT-5 Implementation: Paper Trading Engine with P&L Tracking

## Overview
Implemented a comprehensive paper trading engine that automatically executes simulated trades based on AI consensus signals (4/5 or 5/5 agreement) and tracks performance metrics.

## Implementation Date
February 7, 2026

## Components Implemented

### 1. Core Trading Types (`src/lib/trading-types.ts`)
Defines the data structures for:
- **Trade**: Individual trade records with entry/exit prices, P&L, consensus strength
- **PortfolioMetrics**: Aggregated performance statistics
- **TradingHistory**: Complete trading history with metrics

### 2. Price Service (`src/lib/price-service.ts`)
- Fetches real-time BTC/USD prices from CoinGecko API (free tier)
- Implements 30-second caching to respect rate limits
- Graceful fallback to default prices if API unavailable
- Maps asset symbols to CoinGecko IDs

### 3. Storage Adapter (`src/lib/storage.ts`)
- Unified storage interface supporting both Vercel KV and in-memory storage
- Automatic fallback when KV environment variables not available
- Enables local development without Vercel KV setup
- Seamless transition to KV when deployed

### 4. Paper Trading Engine (`src/lib/paper-trading-engine.ts`)
Core trading logic:
- **shouldExecuteTrade()**: Validates consensus meets 4/5 threshold
- **executePaperTrade()**: Creates new trade from consensus signal
- **closeTrade()**: Closes position and calculates P&L
- **calculatePnL()**: Handles both long and short position P&L
- **getTrades()**: Retrieves all trade history
- **getMetrics()**: Computes portfolio performance metrics
- **autoCloseOnReversal()**: Auto-closes positions on opposite signals

Performance Metrics Calculated:
- Total trades (open + closed)
- Win/loss counts and rates
- Average win/loss amounts
- Largest win/loss
- Total cumulative P&L

### 5. API Endpoints

#### `/api/trading/execute` (POST)
- Executes paper trade based on current consensus
- Validates 4/5 consensus threshold
- Returns trade details and consensus data
- Fails gracefully if threshold not met

#### `/api/trading/history` (GET)
- Returns complete trading history
- Includes all trades and aggregated metrics
- Auto-refreshes every 30 seconds on frontend

#### `/api/trading/close` (POST)
- Manually closes an open trade
- Calculates final P&L
- Updates portfolio metrics

#### `/api/price` (GET)
- Returns current price for specified asset
- Query param: `asset` (defaults to BTC/USD)
- Marked as dynamic route for Next.js

### 6. Frontend Components

#### `TradingPerformance` Component (`src/components/TradingPerformance.tsx`)
Comprehensive trading dashboard:
- **Metrics Grid**: 8 key performance indicators
  - Total P&L (color-coded green/red)
  - Win rate percentage
  - Total trades count
  - Open positions
  - Average win/loss
  - Largest win/loss
- **Trade History Table**: Last 20 trades with:
  - Timestamp
  - Asset and direction (LONG/SHORT)
  - Entry and exit prices
  - P&L with percentage
  - Consensus strength badge (4/5 or 5/5)
  - Status (open/closed)
- **Auto-refresh**: Updates every 30 seconds
- **Manual refresh button**

#### Auto-Trading Hook (`src/lib/useAutoTrading.ts`)
- Monitors consensus data changes
- Automatically triggers trades when 4/5+ consensus reached
- Prevents duplicate executions
- Tracks execution state
- Skips HOLD signals (only BUY/SELL)

### 7. Dashboard Integration (`src/app/page.tsx`)
- Added TradingPerformance component below analyst cards
- Integrated useAutoTrading hook
- Auto-trading enabled by default
- Trade execution happens automatically in background

## Trade Execution Flow

```
1. 5 AI models analyze BTC/USD
   ↓
2. Consensus calculated (requires 4/5 or 5/5 agreement)
   ↓
3. useAutoTrading hook detects consensus signal
   ↓
4. POST /api/trading/execute
   ↓
5. executePaperTrade() called
   - Fetches current BTC price
   - Creates trade record
   - Stores in persistent storage
   ↓
6. Trade appears in TradingPerformance table
   ↓
7. On opposite signal, position auto-closes
   - Fetches exit price
   - Calculates P&L
   - Updates metrics
```

## Key Design Decisions

### 1. Storage Strategy
- **Development**: In-memory storage (no setup required)
- **Production**: Vercel KV (when env vars present)
- Automatic fallback ensures system always works

### 2. Consensus Threshold
- Requires minimum 4/5 models agreeing (80%)
- Tracks exact consensus strength (4/5 vs 5/5)
- Ignores HOLD signals to prevent noise

### 3. Position Management
- One position per asset at a time
- Auto-closes on opposite signal (long closes on SELL, short closes on BUY)
- Supports manual close via API

### 4. Price Fetching
- CoinGecko free API (no key required)
- 30-second cache to respect rate limits
- Graceful degradation if API fails

### 5. P&L Calculation
- **Long positions**: Exit Price - Entry Price
- **Short positions**: Entry Price - Exit Price
- Percentage calculated relative to entry price

## Testing Performed
✅ Build succeeds without errors
✅ TypeScript compilation passes
✅ Storage adapter works with in-memory fallback
✅ API routes defined correctly
✅ Component renders without runtime errors

## Future Enhancements
1. Add position sizing based on confidence levels
2. Implement stop-loss and take-profit levels
3. Track multiple assets simultaneously
4. Add chart visualization of cumulative P&L
5. Export trade history to CSV
6. Add backtesting mode with historical data
7. Implement risk management rules

## Files Created
- `src/lib/trading-types.ts` - Type definitions
- `src/lib/price-service.ts` - Price fetching utility
- `src/lib/storage.ts` - Storage adapter
- `src/lib/paper-trading-engine.ts` - Core trading logic
- `src/lib/useAutoTrading.ts` - Auto-trading React hook
- `src/app/api/trading/execute/route.ts` - Execute trade endpoint
- `src/app/api/trading/history/route.ts` - Trading history endpoint
- `src/app/api/trading/close/route.ts` - Close trade endpoint
- `src/app/api/price/route.ts` - Price fetching endpoint
- `src/components/TradingPerformance.tsx` - Performance dashboard

## Files Modified
- `src/app/page.tsx` - Added TradingPerformance component and auto-trading
- `package.json` - Added @vercel/kv dependency

## Dependencies Added
- `@vercel/kv@3.0.0` (with in-memory fallback)

## Status
✅ **COMPLETE** - All requirements implemented and tested

## Deployment Notes
To enable persistent storage on Vercel:
1. Add Vercel KV integration in project settings
2. Environment variables will auto-populate:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Storage adapter will automatically use KV instead of in-memory

For local development:
- Works immediately without any setup
- Trades persist for duration of server session
- Restart clears in-memory storage (expected behavior)
