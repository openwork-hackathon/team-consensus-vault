# GLM API Integration - On-Chain Oracle

## Overview
This document describes the GLM API integration for the Consensus Vault's On-Chain Oracle role.

## Implementation Status
✅ **COMPLETE** - The GLM API integration is fully implemented and operational.

## Architecture

### Model Configuration
**File**: `lib/models.ts` (lines 73-81)

```typescript
{
  id: 'glm',
  name: 'GLM',
  role: 'On-Chain Oracle',
  roleDescription: 'Monitors on-chain metrics, TVL changes, protocol activity, and network fundamentals',
  provider: 'anthropic',
  baseUrl: 'https://api.z.ai/api/anthropic/v1',
  model: 'glm-4.6',
  envKey: 'GLM_API_KEY',
}
```

### API Integration
**File**: `lib/consensus.ts` (lines 133-150)

The GLM agent uses the Anthropic-compatible API format:

- **Endpoint**: `POST https://api.z.ai/api/anthropic/v1/messages`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: <GLM_API_KEY>`
  - `anthropic-version: 2023-06-01`
- **Request Body**:
  ```json
  {
    "model": "glm-4.6",
    "max_tokens": 500,
    "messages": [
      {
        "role": "user",
        "content": "<analyst prompt>"
      }
    ]
  }
  ```
- **Response Format**: Standard Anthropic messages format
  ```json
  {
    "content": [
      {
        "text": "<response text>"
      }
    ]
  }
  ```

### Response Schema
GLM returns responses in the standardized `AnalystResponse` format:

```typescript
{
  agentId: 'glm',
  agentName: 'GLM',
  role: 'On-Chain Oracle',
  signal: 'BUY' | 'SELL' | 'HOLD',
  confidence: 0-100,
  reasoning: string,
  timestamp: number,
  error?: string
}
```

## GLM's Analytical Role

As the **On-Chain Oracle**, GLM specializes in:

1. **On-Chain Metrics Analysis**
   - Transaction volumes and patterns
   - Active addresses and user growth
   - Network hash rate and validator activity

2. **TVL (Total Value Locked) Monitoring**
   - Protocol TVL changes
   - Capital flows between protocols
   - Liquidity pool depth analysis

3. **Protocol Activity Assessment**
   - Smart contract interactions
   - DeFi protocol usage patterns
   - Token transfer patterns
   - Gas fee trends

4. **Network Fundamentals**
   - Chain utilization metrics
   - Development activity
   - Upgrade schedules and network health

## Integration Flow

1. User submits query via `/api/consensus` endpoint
2. Consensus engine calls `queryConsensus(query)`
3. GLM is one of 5 agents called in parallel via `callModel(query, glmConfig)`
4. GLM analyzes the query from on-chain perspective
5. GLM returns signal (BUY/SELL/HOLD) with confidence and reasoning
6. Consensus engine aggregates all 5 agent responses
7. Final consensus determined by 4/5 agreement threshold

## Configuration

### Environment Variable
**File**: `.env.local`
```
GLM_API_KEY=b25b9cab5ce04d7b952bf287356b2901.TJBp4DsqOzyZvRFs
```

### Agent Configuration
**File**: `~/agents/glm/config.json`
```json
{
  "agent_id": "glm",
  "agent_name": "GLM",
  "model": "glm-4.6",
  "provider": "anthropic",
  "base_url": "https://api.z.ai/api/anthropic/v1",
  "api_key": "b25b9cab5ce04d7b952bf287356b2901.TJBp4DsqOzyZvRFs",
  "max_tokens": 8000,
  "temperature": 0.7,
  "supports_tools": true
}
```

## Testing

### Test Command
```bash
curl -X POST http://localhost:3000/api/consensus \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Should I buy Bitcoin at current levels?",
    "enablePaperTrading": false
  }'
```

### Expected Response
```json
{
  "query": "Should I buy Bitcoin at current levels?",
  "timestamp": 1770510781445,
  "signals": [
    {
      "agentId": "glm",
      "agentName": "GLM",
      "role": "On-Chain Oracle",
      "signal": "BUY|SELL|HOLD",
      "confidence": 0-100,
      "reasoning": "On-chain analysis reasoning...",
      "timestamp": 1770510782309
    },
    // ... other 4 agents
  ],
  "consensus": "BUY|SELL|HOLD|null",
  "consensusCount": 4,
  "totalResponses": 5,
  "confidenceAverage": 75,
  "hasConsensus": true
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **Missing API Key**: Returns HOLD signal with error message
2. **Timeout**: 30-second timeout with retry logic (max 2 retries)
3. **API Errors**: Captured and returned in error field
4. **Rate Limits**: Detected and reported (with retry for transient errors)
5. **Invalid JSON**: Parsing errors caught and reported

## Related Files

- `lib/models.ts` - Model configurations
- `lib/consensus.ts` - Consensus engine and API integration
- `app/api/consensus/route.ts` - API endpoint
- `.env.local` - Environment variables
- `~/agents/glm/config.json` - Agent configuration

## Notes

- GLM API uses Anthropic-compatible format but hosted at `api.z.ai`
- The API key format is different from standard Anthropic keys
- GLM is integrated identically to the other 4 agents (DeepSeek, Kimi, MiniMax, Gemini)
- All agents share the same prompt structure and response parsing logic
- Timeout and retry logic is consistent across all agents

## Completion Date
2026-02-07

## Task Reference
CVAULT-15: API: Implement GLM On-Chain Oracle
