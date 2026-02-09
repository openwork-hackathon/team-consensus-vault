# API Quick Reference

## Working Immediately (No dependencies)
```bash
# Market Data - CoinGecko API (public)
curl http://localhost:3000/api/price?asset=BTC
curl http://localhost:3000/api/market-data?asset=BTC
curl http://localhost:3000/api/market-data?asset=BTC&format=prompt
```

## Requires KV Store Configuration
- `/api/chatroom/*` - All 5 chatroom endpoints
- `/api/trading/*` - All 3 trading endpoints
- `/api/prediction-market/*` - Both prediction endpoints
- `/api/human-chat/*` - Both human chat endpoints

## Requires AI Proxy or API Keys
- `/api/consensus` - GET (SSE) and POST
- `/api/consensus-detailed` - GET and POST
- `/api/consensus-enhanced` - GET
- `/api/council/evaluate` - POST

## System/Utility
- `/api/health` - GET/HEAD - Comprehensive health metrics
- `/api/cron/stale-trades` - GET - Cleanup job

## Known Issues
1. **MiniMax API key expired** - 401 Unauthorized
2. **Dev server had Turbopack issues** - Next.js 16.1.6 with corrupted cache
3. **KV store config unknown** - Check Vercel dashboard

## Test Script
```bash
cd /home/shazbot/team-consensus-vault
./test-api-endpoints.sh http://localhost:3000 verbose
```

## All 20 Endpoints Summary

| Category | Count | Status |
|----------|-------|--------|
| Chatroom | 5 | ⚠️ Needs KV |
| Consensus | 3 | ⚠️ Needs AI |
| Council | 1 | ⚠️ Needs AI |
| Trading | 3 | ⚠️ Needs KV |
| Market | 4 | ✅ 2 working, 2 need KV |
| Utility | 4 | ⚠️ Mixed |

**Total: 20 endpoints implemented and present in codebase**
