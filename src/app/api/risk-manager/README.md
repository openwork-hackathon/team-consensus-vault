# Gemini Risk Manager API

Standalone API endpoint for risk assessment and portfolio exposure analysis using Google's Gemini AI model.

## Endpoint

- **GET** `/api/risk-manager`
- **POST** `/api/risk-manager`

## Purpose

The Risk Manager specializes in risk assessment, focusing on:
- Volatility analysis and Value-at-Risk (VaR) calculations
- Correlation with macro markets (BTC, stocks, bonds)
- Funding rates and derivatives positioning
- Liquidation level analysis
- Regulatory and geopolitical risk assessment
- Portfolio exposure and position sizing
- Black swan event probability

## Request Format

### GET Request

Query parameters:
- `asset` (required): Crypto asset symbol (e.g., "BTC", "ETH", "SOL")
- `context` (optional): Additional risk analysis context or specific factors to evaluate

```bash
curl "https://team-consensus-vault.vercel.app/api/risk-manager?asset=BTC"
```

With context:
```bash
curl "https://team-consensus-vault.vercel.app/api/risk-manager?asset=ETH&context=Analyze%20volatility%20and%20funding%20rates"
```

### POST Request

JSON body:
- `asset` (required): Crypto asset symbol
- `context` (optional): Additional risk analysis context

```bash
curl -X POST https://team-consensus-vault.vercel.app/api/risk-manager \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "BTC",
    "context": "Assess risk given current volatility spike"
  }'
```

## Response Format

### Success Response (200 OK)

```json
{
  "asset": "BTC",
  "analyst": {
    "id": "gemini",
    "name": "Risk Manager",
    "role": "Risk Manager - Risk Assessment & Portfolio Exposure"
  },
  "signal": "neutral",
  "confidence": 0.68,
  "reasoning": "Elevated volatility (30-day: 65%) and high funding rates (0.03%) suggest caution. Risk/reward at current levels warrants holding position until volatility normalizes.",
  "response_time_ms": 1847,
  "timestamp": "2026-02-07T05:00:00.000Z"
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
  "error": "Gemini API timeout",
  "asset": "BTC",
  "analyst": "gemini"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `asset` | string | The crypto asset analyzed |
| `analyst.id` | string | Analyst identifier ("gemini") |
| `analyst.name` | string | Display name ("Risk Manager") |
| `analyst.role` | string | Full role description |
| `signal` | string | Trading signal: "bullish", "bearish", or "neutral" |
| `confidence` | number | Confidence level from 0 to 1 (0-100%) |
| `reasoning` | string | Risk assessment explanation (1-2 sentences) |
| `response_time_ms` | number | API response time in milliseconds |
| `timestamp` | string | ISO 8601 timestamp of analysis |

## Technical Details

### Configuration

- **Model**: Gemini 2.0 Flash Lite (`gemini-2.0-flash-lite`)
- **API Base**: `https://generativelanguage.googleapis.com/v1beta`
- **Timeout**: 30 seconds
- **API Key**: Read from `GEMINI_API_KEY` environment variable
- **Rate Limiting**: Free tier has daily limits; upgrade to paid tier for production use

### Error Handling

The endpoint includes:
- Input validation for required parameters
- Timeout handling (30s limit)
- JSON parsing error detection
- Graceful error messages
- HTTP status codes for different error types
- Quota limit error handling

### Integration with Consensus Engine

This endpoint uses the same underlying `getAnalystOpinion()` function as the main consensus system, ensuring consistent behavior between standalone and consensus modes.

## Use Cases

### Risk-Adjusted Portfolio Management
Get risk assessment before making trading decisions:
```javascript
const response = await fetch('/api/risk-manager?asset=BTC');
const analysis = await response.json();
console.log(analysis.reasoning);
```

### Volatility and Exposure Analysis
Ask about specific risk factors:
```javascript
const response = await fetch('/api/risk-manager', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset: 'ETH',
    context: 'Evaluate risk given recent regulatory news'
  })
});
```

### Custom Risk Management Systems
Integrate risk analysis into your trading strategy:
```javascript
const analysis = await fetch('/api/risk-manager?asset=SOL')
  .then(r => r.json());

if (analysis.signal === 'bearish' || analysis.confidence < 0.5) {
  // Consider reducing position size
}
```

## Risk Manager Philosophy

The Risk Manager acts as the **voice of caution** in the consensus system. Key characteristics:

- **Conservative Bias**: When risk is elevated, confidence in buy signals is deliberately lower
- **Macro Awareness**: Considers correlations with broader markets (stocks, bonds, macro events)
- **Volatility Focus**: High volatility often triggers neutral or bearish signals
- **Funding Rate Monitoring**: Extreme funding rates indicate overleveraged positions
- **Regulatory Sensitivity**: Considers regulatory and geopolitical risks

## Comparison with Consensus API

| Feature | `/api/risk-manager` | `/api/consensus` |
|---------|---------------------|------------------|
| Analysts | Gemini only | All 5 analysts |
| Response Time | ~2-5 seconds | ~10-15 seconds |
| Use Case | Risk assessment focus | Multi-perspective consensus |
| Signal Format | Individual opinion | Consensus recommendation |

## Environment Variables

Required in `.env.local`:
```env
GEMINI_API_KEY=AIza...
```

## Rate Limiting Awareness

Gemini API has usage limits (especially on free tier). For production applications:
1. Upgrade to paid tier for higher quotas
2. Implement client-side request caching
3. Add rate limiting middleware
4. Use exponential backoff on errors
5. Monitor API quota usage via Google AI Studio

## Quota Management

Free tier limits (as of Feb 2026):
- **Requests per minute**: 15 RPM
- **Requests per day**: 1,500 RPD
- **Tokens per minute**: 1M TPM

For production, upgrade to paid tier for higher limits.

## Example Integration

### Combined Risk and Technical Analysis
```javascript
// Get both technical and risk perspectives
const [momentum, risk] = await Promise.all([
  fetch('/api/momentum-hunter?asset=BTC').then(r => r.json()),
  fetch('/api/risk-manager?asset=BTC').then(r => r.json())
]);

// Make decision based on both
if (momentum.signal === 'bullish' &&
    risk.signal !== 'bearish' &&
    risk.confidence > 0.6) {
  // Technical signal is bullish and risk is acceptable
  console.log('Consider long position');
}
```

### Stop-Loss Recommendations
```javascript
const risk = await fetch('/api/risk-manager', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset: 'ETH',
    context: 'Recommend stop-loss level based on current volatility'
  })
}).then(r => r.json());

console.log('Risk assessment:', risk.reasoning);
```

## Support

For issues or questions:
- Check the main consensus engine logs
- Verify `GEMINI_API_KEY` is set correctly in `.env.local`
- Ensure the Gemini API service is accessible
- Review quota limits at https://ai.google.dev/
- Check network logs for API call failures

## Links

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google AI Studio](https://aistudio.google.com/) (monitor usage)
