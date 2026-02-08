# Vercel Environment Variables Setup

**Task:** CVAULT-134
**Status:** Awaiting human action (OAuth login required)

## Steps

1. Go to https://vercel.com/dashboard
2. Navigate to **team-consensus-vault** project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below (copy the value exactly):

### Required Variables

| Variable | Value |
|----------|-------|
| `DEEPSEEK_API_KEY` | `sk-4641f690e02a40a1b367b538683fc865` |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` |
| `KIMI_API_KEY` | `sk-kimi-RCzRQDdiNBOyaj2Sug8r5R6quo3jH81yAJWQUZEsWH0h3nIMlv1BlUkyfbYdBbIc` |
| `KIMI_BASE_URL` | `https://api.kimi.com/coding/v1` |
| `MINIMAX_API_KEY` | `sk-cp-woDrsY5b_7WYeqduNiyzREX-khHWclVIL5pxDS_n17XfZhsXdHCwuXn-AXZ5_JFEsl3o1o_47AUE9G1fiNYQS3hB5BAhnAn3W2mT0hXzJegYB0UJtCTJuL4` |
| `MINIMAX_BASE_URL` | `https://api.minimax.io/v1` |
| `GLM_API_KEY` | `5be79a885d1f4ee3bfe6ef479e153fb4.q31jwX4icLBAXvjd` |
| `GLM_BASE_URL` | `https://api.z.ai/api/anthropic/v1` |
| `GEMINI_API_KEY` | `AIzaSyBPzM7pfs0uucpNJIvuHTnD9b1QPtAfjWo` |
| `GEMINI_API_KEYS` | `AIzaSyBPzM7pfs0uucpNJIvuHTnD9b1QPtAfjWo,AIzaSyAfYfUmnG47E27nquB9QYWuNHNimAxfF80,AIzaSyA0ioR8YdrsevJ4-FRko3srEpkQLBdbbDs,AIzaSyDAu3EgH2hxhPK0vg1nO2CetHa_ExaWkdw,AIzaSyBQnA11AavHhirOa82ufqKqSjDgFKZzjKs,AIzaSyAZfENDnoIU-C1qgXXdUn925XdRuqlNaxw,AIzaSyBv6NTxl55zLKcvmGL9JCazWNvnz0VOg1I,AIzaSyBK5SUyfQuw_BwG06Zw12f6d4Ur922WIRA` |

5. For each variable, select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. Trigger a redeploy: **Deployments** → click "..." on latest → **Redeploy**

## Alternative: CLI Method

If you have the Vercel CLI authenticated:

```bash
cd /home/shazbot/team-consensus-vault
npx vercel login
npx vercel link
npx vercel env add DEEPSEEK_API_KEY production preview development
# ... repeat for each variable
```

## Unblocks

Once complete, the following features will work in production:
- Consensus engine (all 5 AI models)
- AI chatroom / debate arena
- Prediction market AI analysis

## Verification

After setting env vars and redeploying, test:
```bash
curl -s https://team-consensus-vault.vercel.app/api/deepseek -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}' | head -c 200
```

Should return a JSON response, not an API key error.
