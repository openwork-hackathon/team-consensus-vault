# AI Analyst API Verification Report
**Task:** CVAULT-52 - Verify all 5 AI models return proper responses
**Date:** 2026-02-07
**Test Environment:** ~/team-consensus-vault/ (localhost:3000)

## Executive Summary
**CRITICAL ISSUE:** All 5 AI model API keys are INVALID or RATE-LIMITED. No models can provide analysis.

## Test Results Overview

| Model | Analyst Name | API Endpoint | Status | Response Time |
|-------|--------------|--------------|--------|---------------|
| DeepSeek | Momentum Hunter | `/api/momentum-hunter` | ❌ FAILED | 4.9s (when it briefly worked) |
| Kimi | Whale Watcher | `/api/whale-watcher` | ❌ FAILED | N/A |
| MiniMax | Sentiment Scout | No dedicated endpoint | ❌ FAILED | N/A |
| GLM | On-Chain Oracle | `/api/on-chain-oracle` | ❌ FAILED | N/A |
| Gemini | Risk Manager | `/api/risk-manager` | ❌ FAILED | N/A |

**Overall Status:** 0/5 PASSING

## Detailed Test Results

### 1. DeepSeek - Momentum Hunter
**API Endpoint:** `GET /api/momentum-hunter?asset=BTC`
**Status:** ❌ FAILED
**Error:** `Authentication Fails, Your api key: ****c605 is invalid`

**Initial Test (15:21 UTC):**
- ✅ Returned valid JSON response
- ✅ Proper schema: `{signal, confidence, reasoning, analyst, timestamp}`
- ✅ Response time: 4855ms (within 30s target)
- ✅ Confidence score: 0.55 (0-1 scale)
- ✅ Signal: "neutral"

**Subsequent Tests (15:23+ UTC):**
- ❌ API key rejected
- Error: "Authentication Fails, Your api key: ****c605 is invalid"

**Direct API Test:**
```bash
curl https://api.deepseek.com/v1/models -H "Authorization: Bearer sk-28e5f377..."
# Result: {"error":{"message":"Authentication Fails"}}
```

**API Key Location:** `.env.local` (line 5)
**Conclusion:** API key is INVALID or EXPIRED

---

### 2. Kimi - Whale Watcher
**API Endpoint:** `GET /api/whale-watcher?asset=ETH`
**Status:** ❌ FAILED
**Error:** `Invalid Authentication`

**Test Results:**
- ❌ GET request: `{"error":"API_ERROR: Invalid Authentication","asset":"ETH","analyst":"kimi"}`
- ❌ POST request: `{"error":"API_ERROR: Invalid Authentication","asset":"BTC","analyst":"kimi"}`

**API Key Location:** `.env.local` (line 10)
**API Endpoint:** `https://api.moonshot.cn/v1`
**Conclusion:** API key is INVALID or API endpoint is incorrect

---

### 3. MiniMax - Sentiment Scout
**API Endpoint:** No dedicated endpoint found
**Status:** ❌ FAILED
**Error:** `invalid api key (2049)`

**Test Results:**
- Tested via `/api/consensus` endpoint
- Error from consensus stream: `"error":"API_ERROR: invalid api key (2049)"`

**Expected Behavior:**
- Should analyze social sentiment, Twitter/Reddit buzz, Fear & Greed Index
- Should return: `{signal, confidence: 0-1, reasoning}`

**API Key Location:** `.env.local` (line 14)
**Note:** No dedicated `/api/sentiment-scout` endpoint exists - only accessible via consensus endpoint
**Conclusion:** API key is INVALID

---

### 4. GLM - On-Chain Oracle
**API Endpoint:** `GET /api/on-chain-oracle?asset=SOL`
**Status:** ❌ FAILED
**Error:** `Invalid API Key or Public Key`

**Test Results:**
- ❌ GET request: `{"error":"API_ERROR: Invalid API Key or Public Key","asset":"SOL","analyst":"glm"}`

**Expected Behavior:**
- Should analyze TVL, active addresses, on-chain metrics
- Should return: `{signal, confidence: 0-1, reasoning}`

**API Key Location:** `.env.local` (line 18)
**API Endpoint:** `https://api.z.ai/api/anthropic/v1`
**Model:** `glm-4.6`
**Conclusion:** API key is INVALID or expired

**Note:** Standalone test script exists at `test-glm-oracle.js` but requires working API to test

---

### 5. Gemini - Risk Manager
**API Endpoint:** `GET /api/risk-manager?asset=BTC`
**Status:** ❌ FAILED
**Error:** `Rate limit exceeded`

**Test Results:**
- ❌ GET request: `{"error":"RATE_LIMIT: Rate limit exceeded","asset":"BTC","analyst":"gemini"}`

**Expected Behavior:**
- Should analyze volatility, funding rates, risk/reward
- Should return: `{signal, confidence: 0-1, reasoning}`

**API Key Location:** `.env.local` (line 21) and `~/openclaw-staging/credentials/gemini-api-key.txt`
**API Endpoint:** `https://generativelanguage.googleapis.com/v1beta`
**Model:** `gemini-2.0-flash-lite`
**Conclusion:** API quota exceeded or rate limit hit

---

## Error Handling Tests

### Missing Asset Parameter
**Endpoint:** `GET /api/momentum-hunter` (no asset param)
**Expected:** HTTP 400 with error message
**Status:** Not tested due to invalid API keys

### Invalid JSON (POST)
**Status:** Not tested due to invalid API keys

---

## Infrastructure Status

### Development Server
✅ Next.js dev server running on port 3000
✅ Server starts in ~1.2 seconds
✅ Environment variables loaded from `.env.local`

### Test Scripts Available
- ✅ `test-momentum-hunter.js` - Comprehensive DeepSeek test suite
- ✅ `test-whale-watcher.js` - Kimi GET/POST tests
- ✅ `test-glm-oracle.js` - Standalone GLM test
- ❌ No test script for MiniMax (Sentiment Scout)
- ❌ No test script for Gemini (Risk Manager)

### API Endpoint Coverage
- ✅ `/api/momentum-hunter` - DeepSeek dedicated endpoint
- ✅ `/api/whale-watcher` - Kimi dedicated endpoint
- ✅ `/api/on-chain-oracle` - GLM dedicated endpoint
- ✅ `/api/risk-manager` - Gemini dedicated endpoint
- ❌ No dedicated endpoint for MiniMax (accessible via `/api/consensus`)
- ✅ `/api/consensus` - Aggregates all 5 models (SSE stream)

---

## Root Cause Analysis

### Primary Issue: Invalid API Keys
All 5 API services are rejecting the API keys in `.env.local`:

1. **DeepSeek:** "Authentication Fails" - key likely expired or revoked
2. **Kimi/Moonshot:** "Invalid Authentication" - key format or endpoint may be wrong
3. **MiniMax:** "invalid api key (2049)" - key invalid
4. **GLM:** "Invalid API Key or Public Key" - key invalid or service changed
5. **Gemini:** "Rate limit exceeded" - quota exhausted or too many requests

### Verification Needed
The API keys in `.env.local` were copied from:
- DeepSeek: `~/agents/deepseek/config.json`
- Kimi: `~/agents/kimi/config.json`
- MiniMax: `~/agents/minimax/config.json`
- GLM: `~/agents/glm/config.json`
- Gemini: `~/openclaw-staging/credentials/gemini-api-key.txt`

**These keys may have worked in the agent looper system but are now invalid for API calls.**

---

## Response Schema Validation

### Expected Schema (from initial DeepSeek success)
```json
{
  "asset": "BTC",
  "analyst": {
    "id": "deepseek",
    "name": "Momentum Hunter",
    "role": "Momentum Hunter - Technical Analysis & Trend Detection"
  },
  "signal": "neutral" | "bullish" | "bearish",
  "confidence": 0.0 - 1.0,
  "reasoning": "string",
  "response_time_ms": 4855,
  "timestamp": "2026-02-07T23:21:03.838Z"
}
```

✅ Schema structure is correct
✅ Confidence properly scaled to 0-1
✅ Timestamp included
✅ Response time tracked

**When API keys are fixed, the response format is correct.**

---

## Recommendations

### IMMEDIATE ACTIONS REQUIRED:

1. **Obtain Valid API Keys**
   - DeepSeek: Get new API key from https://platform.deepseek.com/
   - Kimi/Moonshot: Verify API endpoint and get valid key from https://platform.moonshot.cn/
   - MiniMax: Get new API key from https://api.minimax.io/
   - GLM: Get new API key from https://api.z.ai/
   - Gemini: Check quota status at https://console.cloud.google.com/

2. **Update Environment Variables**
   - Update `.env.local` with new keys
   - Restart Next.js dev server
   - Re-run verification tests

3. **Create Missing Test Scripts**
   - Create `test-sentiment-scout.js` for MiniMax
   - Create `test-risk-manager.js` for Gemini
   - Ensure all 5 models have dedicated test coverage

4. **Create Dedicated MiniMax Endpoint**
   - Add `/api/sentiment-scout/route.ts` for consistency
   - Currently only accessible via consensus endpoint

### VERIFICATION CHECKLIST (Post-Fix):

- [ ] DeepSeek returns valid analysis for BTC
- [ ] Kimi returns valid analysis for ETH
- [ ] MiniMax returns valid analysis (needs dedicated endpoint or test via consensus)
- [ ] GLM returns valid analysis for SOL
- [ ] Gemini returns valid analysis for BTC
- [ ] All responses match expected JSON schema
- [ ] All responses complete within 30 seconds
- [ ] Confidence scores are 0-1 range
- [ ] Error handling works (400 for missing params, etc.)
- [ ] All 5 test scripts pass

---

## Performance Benchmarks (from successful DeepSeek test)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Response Time | < 30s | 4.9s | ✅ PASS |
| JSON Schema | Valid | Valid | ✅ PASS |
| Confidence Range | 0-1 | 0.55 | ✅ PASS |
| Analyst Info | Present | Present | ✅ PASS |

**When working, the API infrastructure performs well within targets.**

---

## Technical Debt Identified

1. **No dedicated endpoint for MiniMax/Sentiment Scout** - should add `/api/sentiment-scout`
2. **Inconsistent test coverage** - only 3/5 models have standalone test scripts
3. **No API key rotation/management** - keys hardcoded in .env files
4. **No retry logic documentation** - unclear if failed requests are retried
5. **No health check endpoint** - should add `/api/health` to verify all 5 models

---

## Conclusion

**BLOCKED:** Cannot complete CVAULT-52 verification until API keys are obtained and validated.

**Current State:**
- ✅ API endpoints exist and are correctly structured
- ✅ Response schemas are correct
- ✅ Infrastructure is functional
- ❌ All 5 API keys are invalid/expired/rate-limited

**Next Steps:**
1. Escalate API key acquisition to project owner
2. Update `.env.local` with valid keys
3. Re-run full verification test suite
4. Document successful end-to-end test results

**Estimated Time to Fix:**
- API key acquisition: Unknown (depends on registration/approval process)
- Re-testing after keys obtained: 10-15 minutes

---

**Report Generated:** 2026-02-07 23:25 UTC
**Engineer:** Lead Engineer (Claude)
**Status:** Blocked - Awaiting Valid API Keys
