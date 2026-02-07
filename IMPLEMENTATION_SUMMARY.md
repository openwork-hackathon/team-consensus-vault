# CVAULT-17: 4/5 Consensus Logic Implementation

**Status:** ✅ COMPLETE
**Date:** 2026-02-07
**Task:** Implement 4/5 consensus logic for Consensus Vault API

## Summary

Implemented a strict 4-out-of-5 consensus mechanism for the Consensus Vault API that collects trading signals from 5 AI models and returns a consensus only when at least 4 models agree.

## Implementation Details

### 1. New Types and Interfaces (`src/lib/models.ts`)

```typescript
export type ConsensusStatus = 'CONSENSUS_REACHED' | 'NO_CONSENSUS' | 'INSUFFICIENT_RESPONSES';

export interface IndividualVote {
  model_name: string;
  signal: Signal | null;
  response_time_ms: number;
  confidence: number;
  status: 'success' | 'timeout' | 'error';
  error?: string;
}

export interface ConsensusResponse {
  consensus_status: ConsensusStatus;
  consensus_signal: Signal | null;
  individual_votes: IndividualVote[];
  vote_counts: {
    BUY: number;
    SELL: number;
    HOLD: number;
  };
  timestamp: string;
}
```

### 2. Consensus Calculation Function

**Function:** `calculateConsensusDetailed()`
**Location:** `src/lib/models.ts`

**Logic:**
- Accepts analyst results and response times
- Filters valid responses (excludes timeouts and errors)
- Returns `INSUFFICIENT_RESPONSES` if < 3 valid responses
- Counts votes for each signal (BUY/SELL/HOLD)
- Returns `CONSENSUS_REACHED` if any signal has ≥ 4 votes
- Returns `NO_CONSENSUS` if no signal reaches 4 votes
- Includes detailed tracking of each model's vote and status

### 3. Enhanced Consensus Engine (`src/lib/consensus-engine.ts`)

**Changes:**
- Modified `getAnalystOpinion()` to return `{ result, responseTime }`
- Updated `runConsensusAnalysis()` to track response times
- Added `runDetailedConsensusAnalysis()` function that:
  - Calls all 5 models in parallel
  - Tracks response time for each model
  - Returns detailed consensus response with full voting data

### 4. New API Endpoint

**Path:** `/api/consensus-detailed`
**Methods:** GET, POST

**Request:**
```json
{
  "asset": "BTC",
  "context": "optional context"
}
```

**Response Structure:**
```json
{
  "consensus_status": "CONSENSUS_REACHED",
  "consensus_signal": "buy",
  "individual_votes": [
    {
      "model_name": "deepseek",
      "signal": "buy",
      "response_time_ms": 1523,
      "confidence": 85,
      "status": "success"
    },
    ...
  ],
  "vote_counts": {
    "BUY": 4,
    "SELL": 0,
    "HOLD": 1
  },
  "timestamp": "2026-02-07T..."
}
```

### 5. Edge Case Handling

#### Model Timeout (30 seconds)
- Detected via AbortController/AbortSignal
- Marked as `status: "timeout"`
- Excluded from consensus calculation
- Error message included in response

#### Invalid Response
- Parse errors caught and marked as `status: "error"`
- Malformed signals handled gracefully
- Excluded from consensus calculation
- Error details preserved in response

#### Tie-breaker Logic
- If no signal reaches 4 votes → `NO_CONSENSUS`
- No arbitrary tie-breaking
- All vote counts returned transparently

### 6. Comprehensive Test Suite

**Location:** `src/lib/__tests__/consensus-logic.test.ts`

**Test Coverage:**
- ✅ 4/5 BUY consensus
- ✅ 4/5 SELL consensus
- ✅ 4/5 HOLD consensus
- ✅ 5/5 unanimous agreement
- ✅ 3-2 split (NO_CONSENSUS)
- ✅ 2-2-1 split (NO_CONSENSUS)
- ✅ Only 2 valid responses (INSUFFICIENT_RESPONSES)
- ✅ All failures (INSUFFICIENT_RESPONSES)
- ✅ Timeout classification
- ✅ Error classification
- ✅ Response time tracking
- ✅ Timestamp format validation

### 7. Updated Existing Endpoints

**Modified:**
- `src/app/api/momentum-hunter/route.ts` - Added response_time_ms tracking
- `src/app/api/whale-watcher/route.ts` - Added response_time_ms tracking
- `src/app/api/consensus/route.ts` - Updated to use new timing data

### 8. Documentation

**Created:**
- `docs/CONSENSUS_API.md` - Complete API documentation with examples
- `IMPLEMENTATION_SUMMARY.md` - This file

## Consensus Rules

| Scenario | Valid Responses | Votes | Result |
|----------|----------------|-------|--------|
| 5/5 agree | 5 | BUY:5, SELL:0, HOLD:0 | CONSENSUS_REACHED (buy) |
| 4/5 agree | 5 | BUY:4, SELL:1, HOLD:0 | CONSENSUS_REACHED (buy) |
| 3/2 split | 5 | BUY:3, SELL:2, HOLD:0 | NO_CONSENSUS |
| 2/2/1 split | 5 | BUY:2, SELL:2, HOLD:1 | NO_CONSENSUS |
| 2 valid, 3 timeout | 2 | BUY:2, SELL:0, HOLD:0 | INSUFFICIENT_RESPONSES |

## Files Modified/Created

**Created:**
- `src/app/api/consensus-detailed/route.ts`
- `src/lib/__tests__/consensus-logic.test.ts`
- `docs/CONSENSUS_API.md`
- `IMPLEMENTATION_SUMMARY.md`

**Modified:**
- `src/lib/models.ts` - Added new types and `calculateConsensusDetailed()`
- `src/lib/consensus-engine.ts` - Enhanced with timing and detailed consensus
- `src/app/api/consensus/route.ts` - Updated to use new timing data
- `src/app/api/momentum-hunter/route.ts` - Added response time tracking
- `src/app/api/whale-watcher/route.ts` - Added response time tracking

## Build Status

✅ TypeScript compilation successful
✅ All type checks passed
✅ Next.js build completed without errors

## Testing

Run the test suite:
```bash
npm test consensus-logic
```

Test the API endpoint:
```bash
# Development mode (uses mock data)
curl http://localhost:3000/api/consensus-detailed?asset=BTC

# Production mode (requires API keys)
curl -X POST http://localhost:3000/api/consensus-detailed \
  -H "Content-Type: application/json" \
  -d '{"asset": "BTC", "context": "short-term trade setup"}'
```

## Key Design Decisions

1. **Strict 4/5 Threshold:** No consensus is returned unless exactly 4 or 5 models agree
2. **Transparent Voting:** All individual votes are returned, even in NO_CONSENSUS scenarios
3. **Error Exclusion:** Timed-out or errored models don't count toward the threshold
4. **Minimum Viable Threshold:** Need at least 3 valid responses to attempt consensus
5. **No Arbitrary Tie-Breaking:** If consensus isn't reached, return NO_CONSENSUS (don't pick the "majority" if it's less than 4)

## Next Steps

1. Deploy to Vercel (team-consensus-vault.vercel.app)
2. Add API endpoint to frontend UI
3. Monitor consensus patterns in production
4. Potentially add analytics/logging for consensus decisions
5. Consider adding confidence weighting to consensus calculation

## Notes

- The existing `calculateConsensus()` function is preserved for backward compatibility
- The new endpoint (`/api/consensus-detailed`) provides the full 4/5 implementation
- Response times are tracked for all models, even those that fail
- Timestamp is in ISO 8601 format for standardization
- All edge cases are documented and tested
