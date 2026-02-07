# Consensus API Documentation

## Overview

The Consensus Vault API implements a **4-out-of-5 consensus mechanism** for generating trading signals from 5 specialized AI models.

## The 5 AI Analysts

| Model | ID | Role | Specialization |
|-------|-----|------|----------------|
| DeepSeek | `deepseek` | Momentum Hunter | Technical analysis, chart patterns, indicators |
| Kimi | `kimi` | Whale Watcher | Large holder movements, institutional activity |
| MiniMax | `minimax` | Sentiment Scout | Social sentiment, community buzz |
| GLM | `glm` | On-Chain Oracle | On-chain metrics, TVL, network activity |
| Gemini | `gemini` | Risk Manager | Risk assessment, volatility, exposure |

## Consensus Rules

### 4/5 Agreement Threshold

- **CONSENSUS_REACHED**: At least 4 out of 5 models agree on the same signal (BUY/SELL/HOLD)
- **NO_CONSENSUS**: Less than 4 models agree (e.g., 3-2 split or 2-2-1 split)
- **INSUFFICIENT_RESPONSES**: Fewer than 3 models returned valid responses

### Edge Case Handling

1. **Model Timeout**
   - Timeout threshold: 30 seconds
   - Timed-out models are excluded from consensus calculation
   - Status marked as `timeout`

2. **Invalid Response**
   - Parse errors or malformed signals
   - Excluded from consensus calculation
   - Status marked as `error`

3. **Tie-breaker Logic**
   - If no 4/5 consensus reached, return `NO_CONSENSUS`
   - No arbitrary tie-breaking — transparency is key

## API Endpoints

### POST /api/consensus-detailed

Full implementation of 4/5 consensus logic with detailed response tracking.

**Request:**
```json
{
  "asset": "BTC",
  "context": "Optional context for analysis"
}
```

**Response:**
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
    {
      "model_name": "kimi",
      "signal": "buy",
      "response_time_ms": 2103,
      "confidence": 80,
      "status": "success"
    },
    {
      "model_name": "minimax",
      "signal": "buy",
      "response_time_ms": 1847,
      "confidence": 75,
      "status": "success"
    },
    {
      "model_name": "glm",
      "signal": "buy",
      "response_time_ms": 2234,
      "confidence": 90,
      "status": "success"
    },
    {
      "model_name": "gemini",
      "signal": "hold",
      "response_time_ms": 2567,
      "confidence": 60,
      "status": "success"
    }
  ],
  "vote_counts": {
    "BUY": 4,
    "SELL": 0,
    "HOLD": 1
  },
  "timestamp": "2026-02-07T12:34:56.789Z"
}
```

### GET /api/consensus-detailed

Same as POST but accepts query parameters.

**Example:**
```
GET /api/consensus-detailed?asset=BTC&context=short-term%20trade
```

### GET /api/consensus (Streaming)

Server-Sent Events (SSE) endpoint for real-time streaming of analyst responses.

**Example:**
```
GET /api/consensus?asset=BTC&context=optional
```

Streams results as they arrive, useful for UI updates.

## Response Fields

### consensus_status

- `CONSENSUS_REACHED` — At least 4 models agree
- `NO_CONSENSUS` — Disagreement among models
- `INSUFFICIENT_RESPONSES` — Fewer than 3 valid responses

### consensus_signal

- `"buy"` — 4+ models recommend buying
- `"sell"` — 4+ models recommend selling
- `"hold"` — 4+ models recommend holding
- `null` — No consensus or insufficient data

### individual_votes

Array of individual model votes with:
- `model_name`: Unique ID of the model
- `signal`: The model's recommendation (buy/sell/hold/null)
- `response_time_ms`: Time taken for the model to respond
- `confidence`: Model's confidence score (0-100)
- `status`: Response status (success/timeout/error)
- `error`: Optional error message if status is not success

### vote_counts

Total count of votes for each signal:
- `BUY`: Number of buy votes
- `SELL`: Number of sell votes
- `HOLD`: Number of hold votes

### timestamp

ISO 8601 formatted timestamp of when consensus was calculated.

## Example Scenarios

### Scenario 1: Strong Consensus (5/5)

All 5 models agree → `CONSENSUS_REACHED` with high confidence

```json
{
  "consensus_status": "CONSENSUS_REACHED",
  "consensus_signal": "buy",
  "vote_counts": { "BUY": 5, "SELL": 0, "HOLD": 0 }
}
```

### Scenario 2: Minimum Consensus (4/5)

4 models agree, 1 dissents → `CONSENSUS_REACHED`

```json
{
  "consensus_status": "CONSENSUS_REACHED",
  "consensus_signal": "sell",
  "vote_counts": { "BUY": 1, "SELL": 4, "HOLD": 0 }
}
```

### Scenario 3: Split Decision (3/2)

3-2 split → `NO_CONSENSUS`

```json
{
  "consensus_status": "NO_CONSENSUS",
  "consensus_signal": null,
  "vote_counts": { "BUY": 3, "SELL": 2, "HOLD": 0 }
}
```

### Scenario 4: Timeout + Error

Only 2 valid responses → `INSUFFICIENT_RESPONSES`

```json
{
  "consensus_status": "INSUFFICIENT_RESPONSES",
  "consensus_signal": null,
  "individual_votes": [
    { "model_name": "deepseek", "signal": "buy", "status": "success", ... },
    { "model_name": "kimi", "signal": "buy", "status": "success", ... },
    { "model_name": "minimax", "signal": null, "status": "timeout", "error": "Request timeout after 30 seconds" },
    { "model_name": "glm", "signal": null, "status": "error", "error": "API error: 500" },
    { "model_name": "gemini", "signal": null, "status": "timeout", "error": "AbortError" }
  ],
  "vote_counts": { "BUY": 2, "SELL": 0, "HOLD": 0 }
}
```

## Implementation Details

### Timeout Handling

Each model has a 30-second timeout enforced via `AbortController`:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
```

### Error Classification

Errors are classified based on message content:
- Contains "timeout" or "aborted" → `status: "timeout"`
- All other errors → `status: "error"`

### Parallel Execution

All 5 models are called in parallel using `Promise.allSettled()` for resilience:

```typescript
const promises = ANALYST_MODELS.map(config => getAnalystOpinion(config.id, asset, context));
const results = await Promise.allSettled(promises);
```

### Vote Counting

Only votes with `status: "success"` are counted toward consensus:

```typescript
const validVotes = individual_votes.filter(v => v.status === 'success');
const vote_counts = {
  BUY: validVotes.filter(v => v.signal === 'buy').length,
  SELL: validVotes.filter(v => v.signal === 'sell').length,
  HOLD: validVotes.filter(v => v.signal === 'hold').length,
};
```

## Testing

Comprehensive test suite at `src/lib/__tests__/consensus-logic.test.ts` covers:

- ✅ 4/5 consensus scenarios (BUY, SELL, HOLD)
- ✅ 5/5 unanimous agreement
- ✅ 3/2 split (NO_CONSENSUS)
- ✅ 2/2/1 split (NO_CONSENSUS)
- ✅ Timeout handling
- ✅ Error classification
- ✅ Insufficient responses
- ✅ Response time tracking
- ✅ Timestamp format validation

Run tests with:
```bash
npm test consensus-logic
```

## Security Considerations

- API keys stored in environment variables
- No sensitive data in response (only analysis results)
- Rate limiting applied per model (1 request/second minimum interval)
- Timeout enforcement prevents hanging requests
- Input validation on asset parameter

## Performance

- **Average response time**: 2-3 seconds (parallel execution)
- **Max response time**: 30 seconds (timeout limit)
- **Concurrent requests**: Supported via stateless design
- **Rate limiting**: 1 req/sec per model (prevents API abuse)
