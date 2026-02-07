# GLM On-Chain Oracle API Documentation

## Overview
The GLM On-Chain Oracle provides expert analysis of blockchain metrics, TVL (Total Value Locked), network activity, and protocol health for crypto assets.

## Endpoint
```
/api/on-chain-oracle
```

## Methods

### GET Request
Query string parameters for simple requests.

**URL Pattern:**
```
GET /api/on-chain-oracle?asset={ASSET}&metrics={METRICS}&context={CONTEXT}
```

**Parameters:**
- `asset` (required): The crypto asset symbol (e.g., BTC, ETH, SOL)
- `metrics` (optional): Comma-separated metrics to focus on
- `context` (optional): Additional analysis context

**Example:**
```bash
curl "http://localhost:3000/api/on-chain-oracle?asset=BTC&metrics=tvl,active_addresses"
```

### POST Request
JSON body for structured requests.

**URL:**
```
POST /api/on-chain-oracle
Content-Type: application/json
```

**Request Body:**
```json
{
  "asset": "ETH",
  "metrics": ["tvl", "transaction_volume", "gas_usage"],
  "context": "Focus on recent DeFi protocol activity"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/on-chain-oracle \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "ETH",
    "metrics": ["tvl", "active_addresses"],
    "context": "Analyze recent network growth"
  }'
```

## Response Format

### Success Response (200 OK)
```json
{
  "asset": "BTC",
  "analyst": {
    "id": "glm",
    "name": "On-Chain Oracle",
    "role": "On-Chain Oracle - On-Chain Metrics & TVL Analysis"
  },
  "signal": "bullish",
  "confidence": 0.85,
  "reasoning": "Bitcoin network fundamentals remain robust with consistent transaction volume and stable exchange netflows, indicating strong hodler behavior despite current price consolidation.",
  "response_time_ms": 2741,
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

**Fields:**
- `asset`: The analyzed crypto asset
- `analyst`: Analyst metadata (id, name, role)
- `signal`: Trading signal - one of: `"bullish"`, `"bearish"`, `"neutral"`
- `confidence`: Confidence level from 0 to 1 (0% to 100%)
- `reasoning`: Detailed analysis explanation (1-2 sentences)
- `response_time_ms`: API call duration in milliseconds
- `timestamp`: ISO 8601 timestamp of the analysis

### Error Responses

#### 400 Bad Request
Missing or invalid parameters.
```json
{
  "error": "Missing required parameter: asset",
  "analyst": "glm"
}
```

#### 500 Internal Server Error
API call failed or timeout.
```json
{
  "error": "API error: timeout after 30 seconds",
  "asset": "BTC",
  "analyst": "glm"
}
```

## On-Chain Metrics Focus

The GLM On-Chain Oracle specializes in:

1. **Total Value Locked (TVL)**
   - Protocol TVL trends
   - Cross-chain TVL flows
   - Liquidity concentration

2. **Network Activity**
   - Active addresses
   - Transaction volume
   - Gas usage patterns

3. **Token Economics**
   - Token velocity
   - Holder distribution
   - Staking ratios

4. **Protocol Health**
   - Revenue metrics
   - Fee generation
   - Sustainability indicators

5. **Network Metrics**
   - NVT ratio (Network Value to Transactions)
   - Hash rate (for PoW chains)
   - Validator activity (for PoS chains)

## Usage Examples

### Basic Analysis
```bash
curl "http://localhost:3000/api/on-chain-oracle?asset=BTC"
```

### Focused Metrics
```bash
curl "http://localhost:3000/api/on-chain-oracle?asset=ETH&metrics=tvl,gas_usage"
```

### With Context
```bash
curl -X POST http://localhost:3000/api/on-chain-oracle \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "SOL",
    "context": "Focus on DeFi protocol growth and NFT marketplace activity"
  }'
```

### JavaScript/TypeScript Example
```typescript
async function getOnChainAnalysis(asset: string) {
  const response = await fetch('/api/on-chain-oracle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset,
      metrics: ['tvl', 'active_addresses', 'transaction_volume']
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  return {
    signal: data.signal,
    confidence: data.confidence,
    reasoning: data.reasoning
  };
}

// Usage
const analysis = await getOnChainAnalysis('BTC');
console.log(`Signal: ${analysis.signal} (${analysis.confidence * 100}% confidence)`);
console.log(`Reasoning: ${analysis.reasoning}`);
```

## Performance

- **Average Response Time**: 2-3 seconds
- **Timeout**: 30 seconds maximum
- **Rate Limiting**: 1 second minimum between requests to the same analyst

## Integration with Consensus System

The GLM On-Chain Oracle is one of 5 AI analysts in the Consensus Vault system:

1. **DeepSeek** - Momentum Hunter (Technical Analysis)
2. **Kimi** - Whale Watcher (Large Holder Movements)
3. **MiniMax** - Sentiment Scout (Social Sentiment)
4. **GLM** - On-Chain Oracle (On-Chain Metrics) ← This API
5. **Gemini** - Risk Manager (Risk Assessment)

For full consensus analysis using all 5 analysts, use the `/api/consensus` endpoint instead.

## Technical Details

- **Model**: GLM-4.6 (via Z.ai Anthropic-compatible API)
- **Provider**: Z.ai (`https://api.z.ai/api/anthropic/v1`)
- **Max Tokens**: 500
- **Temperature**: 0.7
- **System Prompt**: Specialized for on-chain metrics analysis

## Environment Configuration

Required environment variables (`.env.local`):
```bash
GLM_API_KEY=your_glm_api_key
GLM_BASE_URL=https://api.z.ai/api/anthropic/v1
```

## See Also

- `/api/consensus` - Full 5-analyst consensus analysis
- `/api/whale-watcher` - Kimi whale movement analysis
- `/api/momentum-hunter` - DeepSeek technical analysis
- `/api/consensus-detailed` - Detailed 4/5 consensus voting

## Support

For issues or questions:
- Check `test-glm-oracle.js` for integration test examples
- See `CVAULT-15_IMPLEMENTATION.md` for implementation details
- Review error logs for detailed API error messages
