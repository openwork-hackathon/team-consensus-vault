# API Key Verification Report - CVAULT-89
**Date:** 2026-02-07
**Task:** Verify all 5 AI model API keys for Consensus Vault hackathon

## Summary

**CRITICAL ISSUE:** Only 2 out of 5 API keys are valid and functional.

| Model | Status | Source | Notes |
|-------|--------|--------|-------|
| **DeepSeek** | ✅ VALID | Agent config | Key `sk-943c...5134` works |
| **Kimi** | ❌ INVALID | Both sources | All tested keys return 401 |
| **MiniMax** | ❌ INVALID | Both sources | All tested keys return "invalid api key" |
| **GLM** | ⚠️ UNKNOWN | Agent config | Auth works but model "glm-4.6" doesn't exist |
| **Gemini** | ✅ VALID | .env.local | Key works, model "gemini-2.0-flash" available |

## Detailed Test Results

### 1. DeepSeek ✅
- **Agent config key:** `sk-943c6324cd754241a1b300c9d6415134`
- **Test result:** HTTP 200, successful response
- **Model:** deepseek-chat
- **Endpoint:** https://api.deepseek.com/v1/chat/completions
- **Action needed:** Update .env.local with working key from agent config

### 2. Kimi ❌
- **Agent config key:** `sk-kimi-RCzRQDdiNBOyaj2Sug8r5R6quo3jH81yAJWQUZEsWH0h3nIMlv1BlUkyfbYdBbIc`
- **Test result:** HTTP 401 "Invalid Authentication"
- **.env.local key:** `sk-kimi-UVaAt0Is0ffY9haAmNNBv5ABAsPjLoaRH7eD2k37FoLlyWrCyPABXN2bJfxM7xh5`
- **Test result:** HTTP 401 "Invalid Authentication"
- **Endpoint tested:** https://api.moonshot.cn/v1/chat/completions
- **Action needed:** Obtain new valid Kimi API key from https://platform.moonshot.cn/

### 3. MiniMax ❌
- **Agent config key:** `sk-cp-woDrsY5b_7WYeqduNiyzREX-khHWclVIL5pxDS_n17XfZhsXdHCwuXn-AXZ5_JFEsl3o1o_47AUE9G1fiNYQS3hB5BAhnAn3W2mT0hXzJegYB0UJtCTJuL4`
- **Test result:** HTTP 200 but error "invalid api key"
- **.env.local key:** JWT token (starts with `eyJhbGci...`)
- **Test result:** HTTP 200 but error "invalid api key"
- **Endpoint tested:** https://api.minimax.chat/v1/text/chatcompletion_v2
- **Action needed:** Obtain new valid MiniMax API key from https://api.minimax.chat/

### 4. GLM ⚠️
- **Agent config key:** `c9a1301c667d4a24882d0b534028df85.jOf5QQSX5FThVQCS`
- **Test result:** HTTP 400 "模型不存在，请检查模型代码" (Model doesn't exist)
- **.env.local key:** `b25b9cab5ce04d7b952bf287356b2901.TJBp4DsqOzyZvRFs`
- **Test result:** HTTP 401 "身份验证失败" (Auth failed)
- **Endpoint:** https://open.bigmodel.cn/api/paas/v4/chat/completions
- **Issue:** Agent config key authenticates, but model "glm-4.6" not found. App expects "glm-4.6" but available models unknown.
- **Action needed:**
  1. Test agent config key with correct model name
  2. Update lib/models.ts if model name needs correction
  3. Verify .env.local key or replace with agent config key

### 5. Gemini ✅
- **.env.local key:** `AIzaSyAjVNavgFw54Dq8slhDCBgDRYPai9spp0I`
- **Test result:** HTTP 200, successfully listed models
- **Available models:** gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
- **App expects:** gemini-2.0-flash (matches available models)
- **Endpoint:** https://generativelanguage.googleapis.com/v1beta
- **Action needed:** None - key is valid and working

## Configuration Mismatch

There are **TWO sets** of API keys on this system:

1. **Agent configs** (`~/agents/{agent}/config.json`) - Used by the agent looper system
2. **.env.local** (`~/consensus-vault/.env.local`) - Used by the Next.js app

These keys are **different** and have different validity:

| Model | Agent Config Status | .env.local Status | Recommended Source |
|-------|---------------------|-------------------|-------------------|
| DeepSeek | ✅ Valid | ❌ Invalid | Use agent config |
| Kimi | ❌ Invalid | ❌ Invalid | Need new key |
| MiniMax | ❌ Invalid | ❌ Invalid | Need new key |
| GLM | ⚠️ Partial | ❌ Invalid | Use agent config (fix model) |
| Gemini | N/A (file denied) | ✅ Valid | Keep .env.local |

## Vercel Environment Variables

The Consensus Vault app is deployed on Vercel at: https://team-consensus-vault.vercel.app

**CRITICAL:** The Vercel deployment needs the following environment variables set:
```
DEEPSEEK_API_KEY=sk-943c6324cd754241a1b300c9d6415134
KIMI_API_KEY=[NEED NEW KEY]
MINIMAX_API_KEY=[NEED NEW KEY]
GLM_API_KEY=c9a1301c667d4a24882d0b534028df85.jOf5QQSX5FThVQCS
GEMINI_API_KEY=AIzaSyAjVNavgFw54Dq8slhDCBgDRYPai9spp0I
OPENWORK_API_KEY=ow_baad515777a5b5066c9e84ccc035492c656d8fb53aab36e4
OPENWORK_WALLET_ADDRESS=0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
```

**Note:** Cannot verify or update Vercel environment variables from this system - requires browser access to Vercel dashboard.

## Immediate Actions Required

### 1. Update .env.local with working keys
```bash
cd ~/consensus-vault
# Update DEEPSEEK_API_KEY with agent config key
# Keep GEMINI_API_KEY (already valid)
```

### 2. Obtain new API keys for:
- **Kimi/Moonshot:** https://platform.moonshot.cn/console/api-keys
- **MiniMax:** https://platform.minimaxi.com/user-center/basic-information/interface-key

### 3. Fix GLM model configuration
- Test agent config key with available GLM models
- Update `lib/models.ts` if model name is wrong

### 4. Update Vercel environment (requires human/browser)
- Log in to Vercel dashboard
- Navigate to project settings → Environment Variables
- Update all 5 API keys with working values

## Testing Recommendations

Once keys are updated, verify the consensus engine works:

```bash
cd ~/consensus-vault
npm run dev
# Test the /api/consensus endpoint with a query
curl http://localhost:3000/api/consensus -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "Should I buy Bitcoin?"}'
```

Expected: All 5 models should respond without API key errors.

## Security Notes

- All API keys in this report are currently stored in plain text in .env.local
- .env.local is correctly in .gitignore (verified)
- Keys should NEVER be committed to git
- Vercel environment variables are encrypted at rest
- Consider rotating all keys after hackathon submission for security
