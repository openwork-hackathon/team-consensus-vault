# Chatroom-to-Trading-Council Integration

**Status:** ✅ Implemented (CVAULT-177)
**Created:** 2026-02-08

## Overview

This integration connects the 17-persona chatroom consensus system to the 5-agent trading council, creating a two-tier analysis framework for Consensus Vault.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONSENSUS VAULT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────┐         ┌────────────────────┐        │
│  │  17-PERSONA        │         │   5-AGENT          │        │
│  │  CHATROOM          │────────▶│   TRADING COUNCIL  │        │
│  │                    │         │                    │        │
│  │  • DeepSeek        │         │  • Momentum Hunter │        │
│  │  • Kimi (x3)       │         │  • Whale Watcher   │        │
│  │  • MiniMax (x3)    │  Bridge │  • Sentiment Scout │        │
│  │  • GLM (x5)        │         │  • Chain Analyst   │        │
│  │  • Gemini (x5)     │         │  • Risk Manager    │        │
│  │                    │         │                    │        │
│  │  Output:           │         │  Output:           │        │
│  │  - Direction       │         │  - Signal          │        │
│  │  - Strength 0-100  │         │  - Confidence      │        │
│  │  - Phase           │         │  - Supermajority   │        │
│  └────────────────────┘         └────────────────────┘        │
│           │                               │                    │
│           └───────────┬───────────────────┘                    │
│                       ▼                                        │
│            ┌─────────────────────┐                            │
│            │  ALIGNMENT SCORING  │                            │
│            │  - Score 0-100      │                            │
│            │  - Commentary       │                            │
│            └─────────────────────┘                            │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Bridge Layer (`/src/lib/chatroom-consensus-bridge.ts`)

**Purpose:** Connects chatroom consensus to trading council context

**Key Functions:**

- `getChatroomConsensus()` - Fetch current 17-persona consensus
- `prepareCouncilContext()` - Format chatroom data as trading context
- `calculateAlignmentScore()` - Measure agreement between systems
- `isChatroomConsensusSignificant()` - Filter weak signals

**Data Flow:**

```typescript
ChatroomState → calculateRollingConsensus() → ChatroomConsensusSnapshot
    → prepareCouncilContext() → Enhanced Context String
        → runConsensusAnalysis() → Trading Council Analysis
```

### 2. Enhanced Consensus API (`/src/app/api/consensus-enhanced/route.ts`)

**Endpoint:** `GET /api/consensus-enhanced?asset=BTC&context=...`

**Response Structure:**

```json
{
  "council": {
    "signal": "buy" | "sell" | "hold",
    "recommendation": "BUY",
    "consensusLevel": 85,
    "analysts": [...]
  },
  "chatroom": {
    "direction": "bullish" | "bearish" | "neutral",
    "strength": 82,
    "phase": "CONSENSUS" | "DEBATE" | "COOLDOWN",
    "messageCount": 47,
    "summary": "Strong bullish consensus...",
    "isSignificant": true
  },
  "alignment": {
    "score": 88,
    "commentary": "✅ Strong agreement...",
    "agreement": "strong" | "moderate" | "weak" | "disagreement"
  }
}
```

### 3. UI Component (`/src/components/EnhancedConsensusView.tsx`)

**Features:**

- Side-by-side display of chatroom and council results
- Real-time alignment scoring
- Visual indicators for consensus strength
- Analyst and persona vote breakdowns

**Route:** `/enhanced-consensus`

## How It Works

### Step 1: Chatroom Generates Consensus

17 AI personas debate crypto markets in real-time:

- **DEBATE phase:** Personas argue with sentiment + confidence tags
- **CONSENSUS phase:** Rolling calculation detects 80%+ agreement
- **COOLDOWN phase:** System rests before next debate

Output: `{ direction: 'bullish', strength: 85 }`

### Step 2: Bridge Formats Context

The bridge layer:

1. Fetches chatroom consensus from KV store
2. Formats as human-readable summary
3. Combines with user context (if provided)
4. Passes to trading council as enhanced context

Example context string:

```
**Community Consensus:** Consensus reached: strong bullish consensus
(85% agreement) from 17-persona crypto chatroom debate.

**Additional Context:** Recent Bitcoin halving event approaching
```

### Step 3: Trading Council Analyzes

5 specialist analysts process the enhanced context:

- **Momentum Hunter** (DeepSeek) - Technical analysis
- **Whale Watcher** (Kimi) - Large holder movements
- **Sentiment Scout** (MiniMax) - Social sentiment
- **Chain Analyst** (GLM) - On-chain metrics
- **Risk Manager** (Gemini) - Risk assessment

Each analyst sees the chatroom consensus as additional market intelligence.

### Step 4: Alignment Scoring

The system measures agreement between chatroom and council:

```typescript
alignmentScore = calculateAlignmentScore(
  chatroomConsensus,
  councilSignal,
  councilConfidence
);
```

**Scoring:**

- **80-100:** Strong agreement (both bullish/bearish, high confidence)
- **60-79:** Moderate agreement (same direction, varying confidence)
- **40-59:** Weak agreement (mixed signals)
- **0-39:** Disagreement (opposite directions)

## Usage Examples

### Example 1: Both Systems Agree

**Chatroom:** `bullish` @ 85% strength
**Council:** `BUY` @ 88% consensus
**Alignment:** 91% (Strong agreement ✅)

**Interpretation:** High confidence signal - both community debate and expert analysis align.

### Example 2: Systems Disagree

**Chatroom:** `bearish` @ 72% strength
**Council:** `BUY` @ 65% consensus
**Alignment:** 32% (Disagreement ❌)

**Interpretation:** Conflicting signals - proceed with caution. Community sentiment doesn't match expert analysis.

### Example 3: Chatroom Insignificant

**Chatroom:** `neutral` @ 45% strength
**Council:** `HOLD` @ 58% consensus
**Alignment:** 50% (Neutral alignment)

**Interpretation:** No strong chatroom signal. Council recommendation stands alone.

## API Integration

### Fetch Enhanced Consensus

```typescript
const response = await fetch(
  '/api/consensus-enhanced?asset=BTC&context=Recent%20halving'
);
const data = await response.json();

console.log('Council signal:', data.council.signal);
console.log('Chatroom direction:', data.chatroom?.direction);
console.log('Alignment:', data.alignment.score);
```

### Access Individual Components

```typescript
// Chatroom consensus only
import { getChatroomConsensus } from '@/lib/chatroom-consensus-bridge';
const consensus = await getChatroomConsensus();

// Trading council only
import { runConsensusAnalysis } from '@/lib/consensus-engine';
const { analysts, consensus: councilConsensus } = await runConsensusAnalysis(
  'BTC'
);
```

## Design Decisions

### 1. Chatroom as Context, Not Vote

**Decision:** Chatroom consensus is provided as context to the trading council, not as a 6th vote.

**Rationale:**

- Maintains 4/5 supermajority threshold integrity
- Analysts interpret chatroom sentiment alongside their expertise
- Preserves existing consensus logic
- Allows analysts to disagree with community if fundamentals dictate

### 2. Optional Integration

**Decision:** Chatroom data is optional - trading council works without it.

**Rationale:**

- Chatroom may be in cooldown or have insufficient data
- Early deployment phase may lack chatroom messages
- Trading council remains functional standalone
- Graceful degradation if chatroom fails

### 3. Alignment Scoring for Transparency

**Decision:** Expose alignment score between both systems.

**Rationale:**

- Users see when systems agree/disagree
- Provides confidence signal beyond single consensus
- Helps users weight their own decisions
- Educational - shows different analysis methods

## Testing

### Unit Tests

```bash
# Test bridge functions
npm test src/lib/chatroom-consensus-bridge.test.ts

# Test API endpoint
npm test src/app/api/consensus-enhanced/route.test.ts
```

### Manual Testing

```bash
# 1. Start chatroom (generate some messages)
curl http://localhost:3000/api/chatroom/stream

# 2. Run enhanced consensus
curl http://localhost:3000/api/consensus-enhanced?asset=BTC

# 3. Check alignment scoring
# Expected: JSON with council, chatroom, and alignment sections
```

## Performance Considerations

### Caching

- Chatroom consensus: Cached in KV store (Redis)
- Trading council: Cached via AI response memoization (60s TTL)
- Alignment calculation: Computed on-demand (fast operation)

### Latency

- Chatroom fetch: ~10-50ms (KV store read)
- Council analysis: ~2-5s (5 parallel AI calls)
- Total response time: ~2-5s

### Rate Limiting

- Inherits existing consensus API rate limits (10 req/min per IP)
- Chatroom reads don't count against rate limit

## Future Enhancements

### 1. Weighted Consensus (TIER3)

Add chatroom consensus as a weighted 6th vote:

```typescript
const weightedVotes = [
  ...analystVotes,
  { signal: chatroomDirection, weight: chatroomStrength / 100 },
];
```

### 2. Real-Time Updates (TIER3)

Stream chatroom consensus changes to UI via SSE:

```typescript
const eventSource = new EventSource('/api/chatroom/stream');
eventSource.addEventListener('consensus_update', (event) => {
  updateAlignmentScore(event.data);
});
```

### 3. Historical Alignment Tracking (TIER3)

Track alignment score over time to identify:

- When systems typically agree/disagree
- Which market conditions cause divergence
- Accuracy of aligned vs. divergent signals

### 4. Persona-to-Analyst Mapping (TIER3)

Map specific chatroom personas to trading council analysts:

- Technical analysts personas → Momentum Hunter influence
- Whale discussion → Whale Watcher influence
- Social buzz → Sentiment Scout influence

## Troubleshooting

### Chatroom Consensus Returns Null

**Causes:**

- Chatroom in cooldown phase
- Insufficient messages (< 5)
- Low consensus strength (< 20%)

**Solution:** This is expected behavior. UI shows "Chatroom not available."

### Alignment Score Always 50%

**Causes:**

- Chatroom consensus is null
- One system returns neutral

**Solution:** Verify chatroom has recent messages and strong consensus.

### API Returns 500 Error

**Causes:**

- Redis/KV connection failure
- Trading council API failure

**Solution:**

1. Check KV store health: `curl /api/health`
2. Check API keys in `.env`
3. Review logs: `kubectl logs -l app=consensus-vault`

## Related Files

```
/src/lib/chatroom-consensus-bridge.ts          # Bridge layer
/src/app/api/consensus-enhanced/route.ts       # API endpoint
/src/components/EnhancedConsensusView.tsx      # UI component
/src/app/enhanced-consensus/page.tsx           # Page route
/src/lib/chatroom/consensus-calc.ts            # Chatroom logic
/src/lib/consensus-engine.ts                   # Council logic
```

## Conclusion

This integration creates a multi-layered consensus system:

1. **Community Layer:** 17 AI personas debate → directional consensus
2. **Expert Layer:** 5 specialist analysts → trading signals
3. **Alignment Layer:** Measure agreement → confidence signal

Users get the best of both worlds: crowd wisdom + expert analysis.
