# Chatroom-to-Trading-Council Integration

**Status:** Implemented (CVAULT-177)
**Updated:** 2026-02-08

## Overview

This integration connects the 17-persona chatroom consensus system to the 5-agent trading council, creating a two-tier analysis framework for Consensus Vault.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CHATROOM SYSTEM                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  17 AI Personas (DeepSeek, Kimi, MiniMax, GLM, Gemini)       │   │
│  │  - Rolling consensus with exponential decay                   │   │
│  │  - Phases: DEBATE → CONSENSUS (80%) → COOLDOWN               │   │
│  │  - Outputs: direction (bullish/bearish/neutral) + strength   │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  /api/chatroom/stream (SSE)                                  │   │
│  │  - Emits: consensus_update { direction, strength }           │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CHATROOM-COUNCIL BRIDGE                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  chatroom-council-bridge.ts                                  │   │
│  │  - Rate limiting: 5 min minimum between council triggers     │   │
│  │  - Threshold: 80%+ consensus strength required               │   │
│  │  - Filters out neutral consensus                             │   │
│  │  - Builds context string for council                         │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────┴───────────────────────────────────┐   │
│  │  useChatroomCouncilBridge.ts (React Hook)                    │   │
│  │  - Monitors chatroom consensus                               │   │
│  │  - Auto-trigger option for automatic council evaluation      │   │
│  │  - Exposes triggerCouncil() for manual triggering            │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TRADING COUNCIL                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  /api/council/evaluate                                       │   │
│  │  - Receives: asset, chatroomContext, triggeredBy             │   │
│  │  - Adds chatroom context to analyst prompts                  │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  5 Analyst Models                                            │   │
│  │  - Momentum Hunter (DeepSeek) - Technical Analysis           │   │
│  │  - Whale Watcher (Kimi) - Large Holder Movements             │   │
│  │  - Sentiment Scout (MiniMax) - Social Sentiment              │   │
│  │  - On-Chain Oracle (GLM) - On-Chain Metrics                  │   │
│  │  - Risk Manager (Gemini) - Risk Assessment                   │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Consensus Engine                                            │   │
│  │  - 4/5 (80%) agreement required for recommendation           │   │
│  │  - Outputs: BUY | SELL | HOLD                                │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTO-TRADING HOOK                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  useAutoTrading.ts                                           │   │
│  │  - Monitors council consensus                                │   │
│  │  - Executes paper trades when 4/5 threshold met              │   │
│  │  - Calls /api/trading/execute                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Bridge Core (`/src/lib/chatroom-council-bridge.ts`)

**Purpose:** Connects chatroom consensus to trading council via event-based trigger

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `shouldTriggerCouncil()` | Checks if council evaluation is allowed |
| `buildCouncilContext()` | Formats chatroom consensus as analyst context |
| `handleChatroomConsensusUpdate()` | Receives consensus updates from chatroom |
| `recordCouncilResult()` | Stores council results for state tracking |
| `onCouncilTrigger()` | Subscribe to trigger events |
| `onCouncilResult()` | Subscribe to result events |
| `getBridgeState()` | Get current bridge state for debugging |

**Rate Limiting:**

```typescript
const MIN_COUNCIL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CONSENSUS_STRENGTH_THRESHOLD = 80;       // Minimum strength
```

### 2. React Hook (`/src/lib/useChatroomCouncilBridge.ts`)

**Purpose:** Provides React integration for UI components

**Returns:**

```typescript
{
  isCouncilPending: boolean;          // Evaluation pending
  isEvaluating: boolean;              // Currently calling API
  timeUntilNextCouncilAllowed: number; // Countdown in ms
  lastChatroomConsensus: {...};       // Current chatroom state
  lastCouncilResult: {...};           // Last council result
  canTriggerCouncil: boolean;         // Whether trigger is allowed
  blockedReason: string | null;       // Why trigger is blocked
  triggerCouncil: () => Promise<void>; // Manual trigger function
}
```

**Options:**

```typescript
{
  asset?: string;              // Asset to analyze (default: 'BTC')
  autoTrigger?: boolean;       // Auto-trigger when conditions met
  onCouncilTrigger?: (ctx) => void;  // Trigger callback
  onCouncilResult?: (result) => void; // Result callback
}
```

### 3. API Endpoint (`/src/app/api/council/evaluate/route.ts`)

**Endpoint:** `POST /api/council/evaluate`

**Request Body:**

```typescript
{
  asset: string;              // Asset to analyze (default: 'BTC')
  chatroomContext?: {         // Optional chatroom context
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;         // 0-100
  };
  triggeredBy?: 'chatroom' | 'manual';  // Source of trigger
}
```

**Response:**

```typescript
{
  success: boolean;
  consensus: ConsensusData;   // Council consensus
  analysts: Analyst[];        // Individual analyst results
  metadata: {
    totalTimeMs: number;
    modelCount: number;
    successCount: number;
    triggeredBy: 'chatroom' | 'manual';
    chatroomContext?: {...};
  }
}
```

## Data Flow

### 1. Chatroom Consensus Generation

The chatroom continuously generates messages from 17 AI personas. Each debate-phase message includes:
- `sentiment`: bullish | bearish | neutral
- `confidence`: 0-100

The `calculateRollingConsensus()` function computes a rolling consensus using exponential decay:
- Window size: 15 messages
- Decay factor: 0.85 per message age
- Confidence weighting

### 2. Bridge Trigger Logic

The bridge monitors chatroom consensus and triggers council evaluation when:

```typescript
// All conditions must be met:
1. direction !== 'neutral'           // Actionable direction
2. strength >= 80                    // Strong consensus
3. timeSinceLastTrigger >= 5min     // Rate limit respected
4. consensusNotAlreadyProcessed     // Not duplicate
```

### 3. Council Context Injection

When triggered, the bridge builds a context string:

```typescript
`Market Sentiment Context: The 17-persona AI chatroom has reached
${strength}% consensus with a ${direction} outlook. This crowd
sentiment signal should be considered alongside your technical,
on-chain, and risk analysis.`
```

This context is passed to the trading council, influencing (but not determining) their analysis.

### 4. Council Evaluation

The 5 analysts run in parallel with the enhanced context. Each analyst:
1. Receives their specialized system prompt
2. Receives the asset + chatroom context
3. Returns: signal (buy/sell/hold), confidence (0-100), reasoning

### 5. Consensus & Trading

If 4/5 analysts agree on a direction with sufficient confidence:
- `recommendation` is set (BUY | SELL | HOLD)
- `consensusLevel` reflects agreement strength
- Auto-trading hook can execute paper trades

## Usage Examples

### Manual Council Trigger (React)

```tsx
import { useChatroomCouncilBridge } from '@/lib/useChatroomCouncilBridge';

function TradingDashboard() {
  const {
    canTriggerCouncil,
    blockedReason,
    triggerCouncil,
    isEvaluating,
    lastCouncilResult,
  } = useChatroomCouncilBridge(
    chatroomDirection,  // from chatroom state
    chatroomStrength,   // from chatroom state
    {
      asset: 'BTC',
      onCouncilResult: (result) => {
        console.log('Council result:', result.recommendation);
      },
    }
  );

  return (
    <button
      onClick={triggerCouncil}
      disabled={!canTriggerCouncil || isEvaluating}
    >
      {isEvaluating ? 'Evaluating...' : 'Trigger Council'}
    </button>
  );
}
```

### Auto-Trigger Mode

```tsx
const bridge = useChatroomCouncilBridge(
  chatroomDirection,
  chatroomStrength,
  {
    autoTrigger: true,  // Auto-trigger when conditions met
    onCouncilTrigger: (ctx) => {
      console.log('Auto-triggered by chatroom consensus:', ctx);
    },
    onCouncilResult: (result) => {
      // result.recommendation: 'BUY' | 'SELL' | 'HOLD' | null
    },
  }
);
```

### Direct API Call

```typescript
// Call the council evaluation API directly
const response = await fetch('/api/council/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset: 'BTC',
    chatroomContext: {
      direction: 'bullish',
      strength: 85,
    },
    triggeredBy: 'chatroom',
  }),
});

const data = await response.json();
console.log('Council recommendation:', data.consensus.recommendation);
```

## Design Decisions

### 1. Event-Based vs Weighted Input

**Decision:** Event-based trigger (chatroom triggers council evaluation)

**Rationale:**
- The trading council has its own sophisticated analysis
- Chatroom consensus is "market sentiment", one factor among many
- Continuous streaming would overwhelm the council API
- Rate limiting is natural with event-based approach

### 2. Chatroom as Context, Not Vote

**Decision:** Chatroom consensus is provided as context to the trading council, not as a 6th vote.

**Rationale:**
- Maintains 4/5 supermajority threshold integrity
- Analysts interpret chatroom sentiment alongside their expertise
- Preserves existing consensus logic
- Allows analysts to disagree with community if fundamentals dictate

### 3. 80% Threshold

**Decision:** Only trigger on 80%+ chatroom consensus

**Rationale:**
- Matches the trading council's own 4/5 threshold
- Weak consensus isn't worth querying the council
- Reduces API costs

### 4. 5-Minute Rate Limit

**Decision:** Minimum 5 minutes between council triggers

**Rationale:**
- Chatroom generates messages every 60-90 seconds
- Market conditions don't change that fast
- API cost management
- Prevents UI noise

## Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Min council interval | 5 minutes | `chatroom-council-bridge.ts` |
| Consensus threshold | 80% | `chatroom-council-bridge.ts` |
| Council agreement threshold | 4/5 (80%) | `consensus-engine.ts` |
| Chatroom decay factor | 0.85 | `consensus-calc.ts` |
| Chatroom window size | 15 messages | `consensus-calc.ts` |

## Files

| File | Purpose |
|------|---------|
| `src/lib/chatroom-council-bridge.ts` | Core bridge logic, state, listeners |
| `src/lib/useChatroomCouncilBridge.ts` | React hook for UI integration |
| `src/app/api/council/evaluate/route.ts` | API endpoint for council evaluation |
| `src/lib/chatroom/consensus-calc.ts` | Chatroom rolling consensus algorithm |
| `src/lib/consensus-engine.ts` | Trading council evaluation logic |
| `src/lib/useAutoTrading.ts` | Auto-trading execution hook |

## Troubleshooting

### Council Never Triggers

**Check:**
1. Chatroom direction is not neutral
2. Chatroom strength is >= 80%
3. At least 5 minutes since last trigger
4. Same consensus hasn't already been processed

### API Returns Error

**Check:**
1. All 5 model API keys are configured
2. Rate limits not exceeded on model APIs
3. Proxy is properly configured

### Auto-Trigger Not Working

**Check:**
1. `autoTrigger: true` is set in hook options
2. Chatroom state is being passed to hook
3. `canTriggerCouncil` is true

## Future Enhancements

1. **Confidence Weighting**: Weight chatroom context by strength in council prompts
2. **Persona Breakdown**: Pass individual persona votes to council (17 micro-signals)
3. **Historical Tracking**: Store chatroom→council trigger history for analysis
4. **Feedback Loop**: Track if council agreed with chatroom (calibration)
5. **Asset Detection**: Detect which asset chatroom is discussing
6. **Alignment Scoring**: Measure agreement between chatroom and council for UI
