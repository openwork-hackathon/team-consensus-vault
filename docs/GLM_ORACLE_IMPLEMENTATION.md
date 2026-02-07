# GLM On-Chain Oracle - Implementation Documentation

## Overview

The GLM On-Chain Oracle is implemented as part of the Consensus Vault multi-agent crypto analysis system. It provides blockchain metrics analysis using the GLM-4.6 model via the Z.ai API.

## Task: CVAULT-15

**Status:** ✅ COMPLETE

**Deliverables:**
- ✅ Working GLM API integration
- ✅ Endpoint callable from consensus engine
- ✅ Proper error handling and logging
- ✅ Structured response format matching specifications

## Architecture

### Configuration Location

**API Configuration:** `~/agents/glm/config.json`
```json
{
  "agent_id": "glm",
  "agent_name": "GLM",
  "model": "glm-4.6",
  "provider": "anthropic",
  "base_url": "https://api.z.ai/api/anthropic/v1",
  "api_key": "[redacted]",
  "max_tokens": 8000,
  "temperature": 0.7,
  "supports_tools": true
}
```

**Environment Variables:** `.env.local`
```bash
GLM_API_KEY=REDACTED_GLM_KEY
GLM_BASE_URL=https://api.z.ai/api/anthropic/v1
```

### Model Configuration

**File:** `src/lib/models.ts`

The GLM model is configured as the "On-Chain Oracle" analyst:

```typescript
{
  id: 'glm',
  name: 'On-Chain Oracle',
  role: 'On-Chain Metrics & TVL Analysis',
  baseUrl: process.env.GLM_BASE_URL || 'https://api.z.ai/api/anthropic/v1',
  apiKeyEnv: 'GLM_API_KEY',
  model: 'glm-4.6',
  provider: 'anthropic',
  timeout: 30000,
  systemPrompt: `You are the On-Chain Oracle, an expert in blockchain analytics...`
}
```

**Expertise Areas:**
- Total Value Locked (TVL) analysis
- Active addresses and network growth
- Transaction volume and velocity
- NVT ratio and network value metrics
- DeFi protocol flows and liquidity
- Gas usage and network activity
- Staking ratios and token economics

## API Endpoints

### GET /api/on-chain-oracle

Query on-chain metrics for a specific asset.

**Query Parameters:**
- `asset` (required): The cryptocurrency asset symbol (e.g., "BTC", "ETH")
- `metrics` (optional): Comma-separated list of metrics to focus on
- `context` (optional): Additional context for the analysis

**Example:**
```bash
curl "http://localhost:3000/api/on-chain-oracle?asset=BTC&metrics=tvl,active_addresses"
```

**Response:**
```json
{
  "asset": "BTC",
  "analyst": {
    "id": "glm",
    "name": "On-Chain Oracle",
    "role": "On-Chain Oracle - On-Chain Metrics & TVL Analysis"
  },
  "signal": "neutral",
  "confidence": 0.75,
  "reasoning": "Bitcoin displays strong long-term holder conviction...",
  "response_time_ms": 1983,
  "timestamp": "2026-02-07T12:54:42.585Z"
}
```

### POST /api/on-chain-oracle

Submit on-chain analysis request with JSON body.

**Request Body:**
```json
{
  "asset": "ETH",
  "metrics": ["tvl", "active_addresses", "gas_usage"],
  "context": "Focus on DeFi TVL trends"
}
```

**Response:** Same format as GET endpoint

## Response Format

All responses follow the specification from CVAULT-15:

```typescript
{
  signal: 'bullish' | 'bearish' | 'neutral',
  confidence: number,  // 0-1 scale
  reasoning: string
}
```

**Signal Mapping:**
- `buy` → `bullish`
- `sell` → `bearish`
- `hold` → `neutral`

**Confidence Conversion:**
- Internal: 0-100 scale
- API response: 0-1 scale (divided by 100)

## Integration with Consensus Engine

**File:** `src/lib/consensus-engine.ts`

The GLM oracle is integrated into the consensus engine via the `getAnalystOpinion()` function:

```typescript
const { result, responseTime } = await getAnalystOpinion('glm', asset, context);
```

**API Call Flow:**
1. `getAnalystOpinion()` retrieves GLM config from `ANALYST_MODELS`
2. Validates `GLM_API_KEY` environment variable
3. Constructs Anthropic-compatible API request
4. Calls GLM via POST to `{baseUrl}/messages`
5. Parses JSON response for signal/confidence/reasoning
6. Returns structured `AnalystResult`

**Anthropic API Format:**
```typescript
POST https://api.z.ai/api/anthropic/v1/messages
Headers:
  Content-Type: application/json
  x-api-key: {GLM_API_KEY}
  anthropic-version: 2023-06-01

Body:
{
  "model": "glm-4.6",
  "max_tokens": 500,
  "system": "{systemPrompt}",
  "messages": [
    { "role": "user", "content": "Analyze {asset}..." }
  ]
}
```

## Error Handling

### Timeout Protection
- 30-second timeout per request
- Abort controller cancels long-running requests
- Timeout errors return neutral sentiment with confidence 0

### API Error Handling
- Missing API key: Clear error message
- Rate limiting: 1-second minimum interval between requests per model
- Network errors: Caught and logged, return error state
- Invalid responses: JSON parsing errors handled gracefully

### Error Response Format
```json
{
  "error": "Error message",
  "asset": "BTC",
  "analyst": "glm"
}
```

## Testing

### Manual Testing

**Test Script:** `test-glm-oracle.sh`

Run comprehensive tests:
```bash
cd ~/team-consensus-vault
npm run dev  # Start dev server in separate terminal
./test-glm-oracle.sh
```

**Test Coverage:**
1. ✅ Basic GET request
2. ✅ GET with metrics parameter
3. ✅ GET with custom context
4. ✅ POST with JSON body
5. ✅ POST with array of metrics
6. ✅ Error handling (missing asset)
7. ✅ Response format validation

### Quick Test

```bash
# Start dev server
cd ~/team-consensus-vault
npm run dev

# Test in another terminal
curl "http://localhost:3000/api/on-chain-oracle?asset=BTC" | jq .
```

## Implementation Files

| File | Purpose |
|------|---------|
| `src/app/api/on-chain-oracle/route.ts` | API endpoint implementation |
| `src/lib/models.ts` | GLM model configuration |
| `src/lib/consensus-engine.ts` | Integration with consensus engine |
| `.env.local` | API keys and configuration |
| `test-glm-oracle.sh` | Test script |
| `docs/GLM_ORACLE_IMPLEMENTATION.md` | This documentation |

## Performance

- **Typical response time:** 1.5-3 seconds
- **Timeout:** 30 seconds
- **Rate limit:** 1 request per second per model
- **Concurrent requests:** Supported (via consensus engine)

## Security

- ✅ API keys stored in environment variables (not committed)
- ✅ No API keys in logs or error messages
- ✅ Input validation (asset parameter required)
- ✅ JSON parsing error handling
- ✅ Timeout protection against hanging requests

## Future Enhancements

Potential improvements (not required for CVAULT-15):
- Cache responses for identical queries
- Add metrics-specific prompts for deeper analysis
- Integrate real-time on-chain data feeds
- Add historical TVL comparison
- Support batch asset analysis

## Deployment Considerations

### Vercel Deployment
- Environment variables must be set in Vercel dashboard
- Edge runtime compatible (uses fetch API)
- No server-side dependencies required

### Environment Variables Required
```bash
GLM_API_KEY=your_api_key_here
GLM_BASE_URL=https://api.z.ai/api/anthropic/v1
```

## Status

✅ **IMPLEMENTATION COMPLETE**

All requirements from CVAULT-15 have been met:
- GLM API integration implemented
- Endpoint callable from consensus engine
- Proper error handling and logging
- Structured response format with signal/confidence/reasoning
- Follows existing API patterns
- Fully tested and documented

**Date Completed:** 2026-02-07
**Implemented By:** Lead Engineer (Autonomous Mode)
**Verified:** Manual testing via curl, response format validation
