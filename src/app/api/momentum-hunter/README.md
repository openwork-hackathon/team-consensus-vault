# DeepSeek Momentum Hunter API

Standalone API endpoint for technical analysis and price momentum detection using DeepSeek's AI model.

## Endpoint

- **GET** `/api/momentum-hunter`
- **POST** `/api/momentum-hunter`

## Purpose

The Momentum Hunter specializes in technical analysis, focusing on:
- Price action patterns and trend detection
- Technical indicators (RSI, MACD, Bollinger Bands)
- Support/resistance levels and breakouts
- Volume analysis and momentum signals
- Chart pattern recognition

## Request Format

### GET Request

Query parameters:
- `asset` (required): Crypto asset symbol (e.g., "BTC", "ETH", "SOL")
- `context` (optional): Additional analysis context or specific technical indicators to focus on

```bash
curl "https://team-consensus-vault.vercel.app/api/momentum-hunter?asset=BTC"
```

With context:
```bash
curl "https://team-consensus-vault.vercel.app/api/momentum-hunter?asset=ETH&context=Check%20for%20RSI%20divergence"
```

### POST Request

JSON body:
- `asset` (required): Crypto asset symbol
- `context` (optional): Additional analysis context

```bash
curl -X POST https://team-consensus-vault.vercel.app/api/momentum-hunter \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "BTC",
    "context": "Analyze breakout potential above $45k resistance"
  }'
```

## Response Format

### Success Response (200 OK)

```json
{
  "asset": "BTC",
  "analyst": {
    "id": "deepseek",
    "name": "Momentum Hunter",
    "role": "Momentum Hunter - Technical Analysis & Trend Detection"
  },
  "signal": "bullish",
  "confidence": 0.82,
  "reasoning": "Strong upward momentum with RSI confirming bullish divergence. Price breaking above key resistance at $45k with volume confirmation.",
  "timestamp": "2026-02-07T02:00:00.000Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Missing required parameter: asset"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "DeepSeek API timeout",
  "asset": "BTC",
  "analyst": "deepseek"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `asset` | string | The crypto asset analyzed |
| `analyst.id` | string | Analyst identifier ("deepseek") |
| `analyst.name` | string | Display name ("Momentum Hunter") |
| `analyst.role` | string | Full role description |
| `signal` | string | Trading signal: "bullish", "bearish", or "neutral" |
| `confidence` | number | Confidence level from 0 to 1 (0-100%) |
| `reasoning` | string | Technical analysis explanation (1-2 sentences) |
| `timestamp` | string | ISO 8601 timestamp of analysis |

## Technical Details

### Configuration

- **Model**: DeepSeek Chat (`deepseek-chat`)
- **API Base**: `https://api.deepseek.com/v1`
- **Timeout**: 30 seconds
- **API Key**: Read from `DEEPSEEK_API_KEY` environment variable
- **Rate Limiting**: DeepSeek has usage limits; implement client-side rate limiting if making frequent requests

### Error Handling

The endpoint includes:
- Input validation for required parameters
- Timeout handling (30s limit)
- JSON parsing error detection
- Graceful error messages
- HTTP status codes for different error types

### Integration with Consensus Engine

This endpoint uses the same underlying `getAnalystOpinion()` function as the main consensus system, ensuring consistent behavior between standalone and consensus modes.

## Use Cases

### Standalone Technical Analysis
Get pure technical analysis without other analyst opinions:
```javascript
const response = await fetch('/api/momentum-hunter?asset=BTC');
const analysis = await response.json();
console.log(analysis.reasoning);
```

### Specific Technical Questions
Ask about particular indicators or patterns:
```javascript
const response = await fetch('/api/momentum-hunter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset: 'ETH',
    context: 'Is there a head and shoulders pattern forming?'
  })
});
```

### Custom Trading Bots
Integrate technical analysis into your trading strategy:
```javascript
const analysis = await fetch('/api/momentum-hunter?asset=SOL')
  .then(r => r.json());

if (analysis.signal === 'bullish' && analysis.confidence > 0.75) {
  // Consider long position
}
```

## Comparison with Consensus API

| Feature | `/api/momentum-hunter` | `/api/consensus` |
|---------|----------------------|------------------|
| Analysts | DeepSeek only | All 5 analysts |
| Response Time | ~2-5 seconds | ~10-15 seconds |
| Use Case | Technical analysis focus | Multi-perspective consensus |
| Signal Format | Individual opinion | Consensus recommendation |

## Environment Variables

Required in `.env.local`:
```env
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

## Testing

See `test-momentum-hunter.js` for a complete test suite covering:
- GET request handling
- POST request handling
- Error scenarios
- Response validation

## Rate Limiting Awareness

DeepSeek API has usage limits. For production applications:
1. Implement client-side request caching
2. Add rate limiting middleware
3. Use exponential backoff on errors
4. Monitor API quota usage

## Support

For issues or questions:
- Check the main consensus engine logs
- Verify `DEEPSEEK_API_KEY` is set correctly
- Ensure the DeepSeek API service is accessible
- Review network logs for API call failures
