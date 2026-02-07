# Kimi Whale Watcher API

Dedicated API endpoint for whale movement and accumulation pattern analysis using the Kimi AI model.

## Endpoint

`/api/whale-watcher`

## Methods

### GET

Query whale behavior for a specific crypto asset.

**Query Parameters:**
- `asset` (required): The crypto asset symbol (e.g., BTC, ETH)
- `wallets` (optional): Comma-separated list of wallet addresses to analyze
- `context` (optional): Additional context for the analysis

**Example:**
```bash
curl "http://localhost:3000/api/whale-watcher?asset=BTC&wallets=0x123...,0x456..."
```

### POST

Query whale behavior with structured request body.

**Request Body:**
```json
{
  "asset": "BTC",
  "wallets": ["0x123...", "0x456..."],
  "context": "Analyze recent accumulation patterns"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/whale-watcher \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "ETH",
    "wallets": ["0x123...", "0x456..."],
    "context": "Check for institutional buying"
  }'
```

## Response Format

```json
{
  "asset": "BTC",
  "analyst": {
    "id": "kimi",
    "name": "Whale Watcher",
    "role": "Whale Watcher - Large Holder Movements & Accumulation Patterns"
  },
  "signal": "bullish" | "bearish" | "neutral",
  "confidence": 0.85,
  "reasoning": "Large holders accumulating aggressively. Exchange outflows at 3-month highs.",
  "timestamp": "2026-02-07T01:30:00.000Z"
}
```

**Fields:**
- `signal`: Trading signal based on whale behavior (bullish/bearish/neutral)
- `confidence`: Confidence level from 0 to 1
- `reasoning`: Human-readable explanation of the analysis
- `timestamp`: ISO 8601 timestamp of the analysis

## Error Responses

**400 Bad Request** - Missing or invalid parameters
```json
{
  "error": "Missing required parameter: asset"
}
```

**500 Internal Server Error** - API call failed
```json
{
  "error": "API timeout or service unavailable",
  "analyst": "kimi"
}
```

## What Kimi Analyzes

The Whale Watcher specializes in:
- **Large holder movements**: Tracking buy/sell activity from whales
- **Accumulation/distribution patterns**: Identifying when smart money is accumulating or distributing
- **Exchange flows**: Analyzing inflows and outflows from exchanges
- **Dormant wallet activity**: Monitoring previously inactive large wallets
- **Holder concentration**: Tracking changes in token distribution

## Configuration

The endpoint uses the Kimi API configuration from environment variables:

```env
KIMI_API_KEY=sk-kimi-xxx...
KIMI_BASE_URL=https://api.moonshot.cn/v1
```

The Kimi model is configured in `/src/lib/models.ts` with:
- Model: `moonshot-v1-8k`
- Timeout: 30 seconds
- Provider: OpenAI-compatible API

## Testing

Run the test suite:
```bash
node test-whale-watcher.js
```

Make sure the development server is running first:
```bash
npm run dev
```

## Integration with Consensus System

This endpoint provides standalone access to the Whale Watcher analyst. For multi-analyst consensus analysis that includes all 5 AI models, use the `/api/consensus` endpoint instead.

The Whale Watcher is also integrated into the main consensus flow and can be accessed there along with the other 4 analysts (Momentum Hunter, Sentiment Scout, On-Chain Oracle, and Risk Manager).
