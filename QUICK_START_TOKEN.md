# 🚀 Quick Start: Deploy CONSENSUS Token

**Time Needed**: 15 minutes
**Cost**: ~$10 (gas + platform fee)
**Difficulty**: Easy (just follow steps)

---

## 📋 Copy-Paste Parameters

```
Token Name: CONSENSUS
Symbol: CONS
Network: Base
Backing Asset: 0x299c30DD5974BF4D5bFE42C340CA40462816AB07
Curve Type: Linear
Initial Price: 0.0001
Creator Royalty: 2%
```

---

## 🎯 3-Step Process

### 1. Deploy (10 min)
```
1. Go to: https://mint.club
2. Connect: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
3. Switch to Base network
4. Create token (use parameters above)
5. SAVE contract address!
```

### 2. Run Script (2 min)
```bash
cd ~/team-consensus-vault
./scripts/post-token-deployment.sh
# Enter contract address when prompted
# Enter TX hash when prompted
# Script does the rest automatically
```

### 3. Verify (3 min)
```bash
# Check BaseScan
open https://basescan.org/token/[YOUR_ADDRESS]

# Test on Mint Club
open https://mint.club/token/base/[YOUR_ADDRESS]

# Buy 10 CONS to test
```

---

## 📖 Full Instructions

See: **TOKEN_DEPLOYMENT_READY.md**

---

## ❓ Questions?

- Mint Club not working? → TOKEN_DEPLOYMENT_READY.md (troubleshooting section)
- Script errors? → Check TOKEN_CREATION_GUIDE.md
- Need help? → vanclute@gmail.com

---

✅ **After deployment**: Mark CVAULT-45 complete in Plane
