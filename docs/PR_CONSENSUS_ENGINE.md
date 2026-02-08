# Pull Request: Consensus Engine

## PR Details

**Branch**: `feature/consensus-engine`
**Base**: `main`
**Title**: `feat: Add consensus engine with 5-model orchestration`

## Summary

This PR adds the core consensus engine to the Consensus Vault hackathon project. The engine orchestrates 5 specialized AI models to generate collaborative trading signals through multi-agent consensus.

### Key Components

#### 1. Consensus Engine (`lib/consensus.ts` - 252 lines)
- **Parallel Model Orchestration**: Calls all 5 AI models simultaneously
- **Timeout Handling**: 30-second timeout per model with graceful degradation
- **Signal Aggregation**: Calculates consensus from individual analyst responses
- **Consensus Threshold**: Requires 4/5 analysts to agree for valid consensus
- **Multi-Provider Support**: Integrates OpenAI-compatible, Anthropic, and Google APIs

**Core Functions**:
- `queryConsensus()`: Main entry point for consensus queries
- `callModel()`: Individual model API calls with error handling
- `parseModelResponse()`: JSON parsing with validation
- `calculateConsensus()`: Voting logic and threshold checking

#### 2. Model Configurations (`lib/models.ts` - 96 lines)
Defines 5 specialized AI analyst roles:

| Model | Role | Specialty |
|-------|------|-----------|
| **DeepSeek** | Momentum Hunter | Technical analysis, trend detection |
| **Kimi** | Whale Watcher | Large holder movements, social sentiment |
| **MiniMax** | Sentiment Scout | Market psychology, community signals |
| **GLM** | On-Chain Oracle | Blockchain metrics, transaction patterns |
| **Gemini** | Risk Manager | Risk assessment, portfolio protection |

**Configuration**:
- API endpoints and auth for each provider
- Role descriptions for specialized prompts
- Consensus threshold (CONSENSUS_THRESHOLD = 4)
- Request timeout (TIMEOUT_MS = 30000)

#### 3. API Endpoint (`app/api/consensus/route.ts` - 73 lines)
- **POST /api/consensus**: Main consensus query endpoint
- **GET /api/consensus**: API documentation endpoint
- Input validation (5-500 character queries)
- Error handling and JSON responses
- Edge runtime compatible (60s max duration)

## Technical Architecture

```
User Query → API Endpoint → Consensus Engine
                                   ↓
                    Parallel calls to 5 AI models
                    (DeepSeek, Kimi, MiniMax, GLM, Gemini)
                                   ↓
                    Parse responses → Calculate consensus
                                   ↓
                    Return aggregated signal (BUY/SELL/HOLD)
```

### Signal Types
- **BUY**: Opportunity identified, execute trade
- **SELL**: Exit position or short recommendation
- **HOLD**: Uncertainty or wait-and-see approach

### Response Format
```typescript
{
  query: string,
  timestamp: number,
  signals: AnalystResponse[],
  consensus: 'BUY' | 'SELL' | 'HOLD' | null,
  consensusCount: number,
  totalResponses: number,
  confidenceAverage: number,
  hasConsensus: boolean
}
```

## Integration Points

### Environment Variables Required
```bash
DEEPSEEK_API_KEY=sk-...
KIMI_API_KEY=...
MINIMAX_API_KEY=...
GLM_API_KEY=...
GEMINI_API_KEY=...
```

### API Usage Example
```typescript
const response = await fetch('/api/consensus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Should I buy ETH at $3,200?'
  })
});

const result = await response.json();
// result.consensus: 'BUY' | 'SELL' | 'HOLD' | null
// result.hasConsensus: true if 4+ analysts agree
```

## Testing

Test scripts included:
- `test-consensus.js`: Basic consensus engine test
- `test-consensus-generic.js`: Extended test suite

Run tests:
```bash
node test-consensus.js
```

## Files Changed

- **app/api/consensus/route.ts** (+72 lines) - API endpoint
- **lib/consensus.ts** (+251 lines) - Core engine logic
- **lib/models.ts** (+96 lines) - Model configurations

**Total**: 3 files, +419 lines

## Deployment Notes

- ✅ Edge-compatible (Vercel serverless)
- ✅ No database dependencies
- ✅ Stateless API design
- ✅ Environment variables for API keys
- ✅ Graceful degradation on model failures

## Hackathon Value

**Innovation**: Multi-agent AI consensus for crypto trading decisions
**Technical Merit**: Parallel orchestration with multiple LLM providers
**Practical Value**: Real-world trading signal generation
**Scalability**: Stateless design, easy to extend with more models

## Next Steps

After merging:
1. ✅ Dashboard UI (PR #1 - already created)
2. ⏳ Token bonding integration
3. ⏳ Wallet connection
4. ⏳ Trade execution

## Author Attribution

**Built by**: CVault-Backend
**Co-Authored-By**: Claude Sonnet 4.5 <noreply@anthropic.com>

---

## Manual PR Creation Instructions

Since GitHub authentication is currently blocked, create the PR manually:

1. **Push the branch**:
   ```bash
   cd ~/consensus-vault
   # First, configure a valid GitHub token
   git remote set-url origin https://YOUR_TOKEN@github.com/openwork-hackathon/team-consensus-vault.git
   git push -u origin feature/consensus-engine
   ```

2. **Create PR via GitHub Web**:
   - Visit: https://github.com/openwork-hackathon/team-consensus-vault
   - Click "Pull requests" → "New pull request"
   - Base: `main`, Compare: `feature/consensus-engine`
   - Title: `feat: Add consensus engine with 5-model orchestration`
   - Copy the "Summary" section above into the PR description

3. **Create PR via gh CLI**:
   ```bash
   gh pr create \
     --title "feat: Add consensus engine with 5-model orchestration" \
     --body "$(cat PR_CONSENSUS_ENGINE.md)" \
     --base main \
     --head feature/consensus-engine
   ```

4. **Create PR via API**:
   ```bash
   curl -X POST \
     -H "Authorization: token YOUR_GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/openwork-hackathon/team-consensus-vault/pulls \
     -d '{
       "title": "feat: Add consensus engine with 5-model orchestration",
       "head": "feature/consensus-engine",
       "base": "main",
       "body": "See PR_CONSENSUS_ENGINE.md for full details"
     }'
   ```

---

**Status**: Branch created, PR documentation ready, awaiting GitHub authentication to push and create PR.
