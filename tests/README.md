# Consensus Vault Test Suite

This directory contains comprehensive end-to-end tests for the Consensus Vault API.

## Quick Start

```bash
# Ensure dev server is running
npm run dev

# Run all API tests (in a new terminal)
npm run test:api

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui
```

## Test Files

- **api/endpoints.test.ts** - Complete API endpoint test suite (32 tests)
- **setup.ts** - Global test configuration and setup hooks
- **API_TEST_RESULTS.md** - Latest test run results and performance metrics
- **API_TEST_REPORT.md** - Detailed analysis and recommendations

## Test Coverage

### Endpoints Tested (17 total)

#### AI Agents (5 endpoints)
- `/api/deepseek` - DeepSeek Momentum Hunter
- `/api/gemini` - Gemini AI Agent
- `/api/glm` - GLM AI Agent
- `/api/kimi` - Kimi Whale Watcher
- `/api/minimax` - MiniMax AI Agent

#### Consensus Engine (2 endpoints)
- `/api/consensus` - SSE streaming and POST batch
- `/api/consensus-detailed` - Detailed analysis

#### Trading Strategy Agents (4 endpoints)
- `/api/momentum-hunter` - Pattern recognition
- `/api/whale-watcher` - Large holder tracking
- `/api/sentiment-scout` - Social sentiment
- `/api/risk-manager` - Risk assessment

#### Trading Operations (3 endpoints)
- `/api/trading/execute` - Execute paper trade
- `/api/trading/history` - Trade history
- `/api/trading/close` - Close position

#### Data Endpoints (2 endpoints)
- `/api/price` - Price data
- `/api/on-chain-oracle` - On-chain data

#### Chatroom (1 endpoint)
- `/api/chatroom/stream` - Agent communication SSE

## Test Results (Latest Run)

**Date:** 2026-02-08
**Status:** ✅ ALL PASSED
**Tests:** 32/32 passed
**Duration:** 133.7 seconds
**Success Rate:** 100%

See [API_TEST_RESULTS.md](./API_TEST_RESULTS.md) for detailed metrics.

## Configuration

### Environment Variables

Tests use `TEST_API_URL` environment variable (defaults to `http://localhost:3000`).

### Timeouts

- Standard tests: 10 seconds
- AI agent tests: 35 seconds (allows for API latency)
- Consensus tests: 60 seconds (parallel AI calls)
- Trading execute: 60 seconds (consensus + trade logic)

### Prerequisites

1. **Running dev server** - `npm run dev` must be running
2. **API keys configured** - `.env.local` must contain:
   - `DEEPSEEK_API_KEY`
   - `KIMI_API_KEY`
   - `MINIMAX_API_KEY`
   - `GLM_API_KEY`
   - `GEMINI_API_KEY`

## Test Categories

### Functional Tests
- ✅ Endpoint availability
- ✅ Response format validation (JSON)
- ✅ Required field presence
- ✅ Data type validation

### Error Handling Tests
- ✅ Missing parameters (400 errors)
- ✅ Invalid input validation
- ✅ API key errors (500 errors)
- ✅ Non-existent endpoints (404 errors)

### Integration Tests
- ✅ Real API calls to all 5 AI providers
- ✅ Consensus aggregation
- ✅ Trading logic execution
- ✅ SSE streaming functionality

### CORS Tests
- ✅ OPTIONS preflight requests
- ✅ Cross-origin headers

## Framework

**Test Runner:** Vitest 4.0.18
**Test Environment:** Node.js
**Setup:** `tests/setup.ts` configures global hooks

## Writing New Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', async () => {
    const response = await apiRequest('/api/my-endpoint');
    expect(response.status).toBe(200);
    const data = await expectValidJson(response);
    expect(data).toHaveProperty('expectedField');
  });
});
```

Helper functions available:
- `apiRequest(endpoint, options)` - Make API calls with proper headers
- `expectValidJson(response)` - Validate and parse JSON responses

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:api
```

## Performance Benchmarks

Average response times:
- AI agents: 3-6 seconds
- Consensus (POST): 3-4 seconds
- Consensus detailed: 8-9 seconds
- Trading execute: 10-11 seconds
- Data endpoints: 77-300ms
- SSE connection: <120ms

## Troubleshooting

**Tests timing out?**
- Ensure dev server is running (`npm run dev`)
- Check API keys are configured in `.env.local`
- Increase timeout values if AI APIs are slow

**Dev server errors?**
- Restart dev server: `pkill -f "next dev" && npm run dev`
- Check for TypeScript compilation errors
- Verify all dependencies are installed

**API key errors?**
- Check `.env.local` has all required keys
- Verify API keys are valid and not expired
- Some tests expect 500 errors when keys are missing

## Maintenance

- Review test coverage when adding new endpoints
- Update timeouts if AI API performance changes
- Keep API_TEST_RESULTS.md updated with latest runs
- Add new test cases for edge cases discovered in production

## Contact

For issues or questions about the test suite, see test file headers for documentation.
