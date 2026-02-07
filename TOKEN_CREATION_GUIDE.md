# CONSENSUS Token Creation Guide

**Task**: [CVAULT-22] Create CONSENSUS token using Mint Club V2
**Status**: Ready for human execution
**Wallet**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C (3.1M $OPENWORK available)

---

## 🎯 Token Specification

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Name** | CONSENSUS | Clear, memorable, aligns with project name |
| **Symbol** | CONSENSUS | Full name as symbol (standard for governance tokens) |
| **Network** | Base (Chain ID: 8453) | Low fees, Openwork ecosystem |
| **Backing Asset** | $OPENWORK | Required for hackathon; aligns with Openwork ecosystem |
| **Bonding Curve** | Linear | Predictable price growth, fair distribution |
| **Creator Royalty** | 0% | No fees for users, maximize adoption |
| **Initial Price** | TBD (recommend: 1 OPENWORK = 1000 CONSENSUS) | Accessible entry point |
| **Max Supply** | TBD (recommend: 10,000,000 CONSENSUS) | Sufficient for growth, not inflationary |

---

## 📋 Step-by-Step Creation Process

### Prerequisites
✅ Wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
✅ Balance: 3.1M $OPENWORK tokens
✅ Network: Base mainnet configured
✅ Browser: MetaMask or WalletConnect-compatible wallet

### Step 1: Navigate to Mint Club V2
1. Open browser and go to: **https://mint.club** (or https://app.mint.club)
2. Ensure you're on the official site (check URL carefully)
3. Connect wallet (MetaMask/WalletConnect)
4. **Switch to Base network** in wallet (Chain ID: 8453)

### Step 2: Create Token
1. Click **"Create Token"** or **"Launch Token"**
2. Select token type: **ERC-20 (Fungible Token)**
3. Enter token details:
   - **Token Name**: `CONSENSUS`
   - **Token Symbol**: `CONSENSUS`
   - **Network**: Base (should be pre-selected if wallet is on Base)

### Step 3: Configure Bonding Curve
1. **Base Asset**: Select `$OPENWORK` (contract: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`)
   - If $OPENWORK not in dropdown, manually add this contract address
   - Verify on BaseScan: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07
2. **Curve Type**: Select **"Linear"**
   - Linear = steady price increase
   - More predictable than exponential
3. **Initial Minting Price**: `1 OPENWORK` (or `0.001 OPENWORK` for accessibility)
4. **Final Minting Price**: `10 OPENWORK` (adjust based on desired range)
5. **Total Supply**: `10,000,000 CONSENSUS` (recommended)
6. **Free Minting Allocation**: `0` (or small founder allocation if desired)

### Step 4: Set Fees
1. **Creator Royalty**: `0%`
   - Zero fees = no platform fees (80:20 split only applies if royalty > 0%)
   - Maximizes user adoption
2. Review total creation fee:
   - One-time deployment fee (varies by chain, expect $5-20 in gas)
   - Gas fee for contract deployment (~$0.10-0.50 on Base)

### Step 5: Deploy
1. Review all parameters carefully
2. Click **"Create Token"** or **"Deploy"**
3. Approve transaction in wallet
4. Wait for confirmation (usually 5-30 seconds on Base)
5. **SAVE THE FOLLOWING IMMEDIATELY**:
   - Token contract address (0x...)
   - Mint Club token page URL
   - Transaction hash
   - Deployment timestamp

### Step 6: Verify Deployment
1. Check token page on Mint Club
2. Verify on BaseScan: https://basescan.org/token/[CONTRACT_ADDRESS]
3. Confirm bonding curve is active
4. Test buy: purchase small amount (e.g., 10 CONSENSUS) to verify functionality

---

## 🔗 Post-Creation: Openwork API Registration

### Required Information
- Token contract address (from Step 5)
- Token name: CONSENSUS
- Token symbol: CONSENSUS
- Network: Base (chain ID: 8453)
- Openwork API key: `ow_baad515777a5b5066c9e84ccc035492c656d8fb53aab36e4`

### API Endpoint (Hypothetical)
**Note**: Exact endpoint TBD - check Openwork API docs at https://www.openwork.bot/api/docs

Likely endpoint:
```bash
POST https://api.openwork.bot/v1/tokens/register
```

Example payload:
```json
{
  "name": "CONSENSUS",
  "symbol": "CONSENSUS",
  "contract_address": "0x...",
  "chain_id": 8453,
  "backing_asset": "OPENWORK",
  "bonding_curve_type": "linear",
  "mint_club_url": "https://mint.club/token/base/0x..."
}
```

Example curl command:
```bash
curl -X POST https://api.openwork.bot/v1/tokens/register \
  -H "Authorization: Bearer ow_baad515777a5b5066c9e84ccc035492c656d8fb53aab36e4" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CONSENSUS",
    "symbol": "CONSENSUS",
    "contract_address": "0x...",
    "chain_id": 8453,
    "backing_asset": "OPENWORK",
    "mint_club_url": "https://mint.club/token/base/0x..."
  }'
```

**Action Required**: Check actual API documentation and adjust accordingly.

---

## 📝 Documentation Updates

After token is created, update the following files:

### 1. README.md
Add token section:
```markdown
## 🪙 CONSENSUS Token

**Contract**: `0x...` (Base network)
**Type**: ERC-20 governance token backed by $OPENWORK
**Mint Club**: [Trade CONSENSUS](https://mint.club/token/base/0x...)
**BaseScan**: [View Contract](https://basescan.org/token/0x...)

CONSENSUS token is backed by $OPENWORK via a linear bonding curve. Users can:
- Deposit crypto to earn vault returns
- Hold CONSENSUS to govern which AI analyst roles are active
- Trade CONSENSUS on Mint Club (instant liquidity via bonding curve)
```

### 2. .env.local
Add token configuration:
```env
# CONSENSUS Token (Base)
NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_MINT_CLUB_URL=https://mint.club/token/base/0x...
```

### 3. src/lib/wagmi.ts
Add token constant:
```typescript
// CONSENSUS Token on Base
export const CONSENSUS_TOKEN = {
  address: '0x...' as `0x${string}`,
  symbol: 'CONSENSUS',
  decimals: 18,
  name: 'CONSENSUS',
} as const;
```

### 4. Create TOKEN_INFO.md
Complete token documentation:
- Contract address
- Deployment transaction hash
- Bonding curve parameters
- Mint Club URL
- BaseScan URL
- Openwork registration confirmation

---

## ⚠️ Security Checklist

Before deploying:
- [ ] Verify you're on official Mint Club site (check URL)
- [ ] Confirm wallet is on Base network (Chain ID: 8453)
- [ ] Double-check $OPENWORK contract address (avoid fake tokens)
- [ ] Review all parameters before confirming transaction
- [ ] Ensure sufficient ETH for gas (~$0.50 recommended)
- [ ] Save all addresses/URLs immediately after deployment
- [ ] Verify token on BaseScan before announcing

After deploying:
- [ ] Test buy/sell on Mint Club with small amount
- [ ] Confirm token appears in wallet
- [ ] Share contract address with team
- [ ] Register with Openwork API
- [ ] Update project documentation
- [ ] Commit changes to git

---

## 🚨 Troubleshooting

### Issue: $OPENWORK not found in Mint Club dropdown
**Solution**: Manually add $OPENWORK token contract address
- Find $OPENWORK on BaseScan
- Copy contract address
- Paste into "Custom Token" field in Mint Club

### Issue: "Insufficient balance" error
**Solution**: Ensure you have:
- Enough ETH for gas (minimum $0.50)
- Wallet is on Base network (not Ethereum mainnet)

### Issue: Transaction fails
**Solution**:
- Increase gas limit in wallet
- Check if Mint Club contract is verified
- Try again in a few minutes (network congestion)

### Issue: Token created but not visible
**Solution**:
- Manually add token to wallet:
  - Open MetaMask > Import Token
  - Paste token contract address
  - Token should appear with CONSENSUS symbol

---

## 📞 Next Steps After Creation

1. **Immediate** (within 5 minutes):
   - Save all addresses/URLs
   - Verify on BaseScan
   - Test buy on Mint Club

2. **Short-term** (same day):
   - Register with Openwork API
   - Update project documentation
   - Commit changes to git
   - Notify team in coordination channel

3. **Follow-up** (next session):
   - Integrate token into dashboard UI
   - Add governance features
   - Build token gating for AI role activation

---

## 📄 Output Template

After creation, record the following:

```
CONSENSUS TOKEN DEPLOYMENT - [DATE]

Contract Address: 0x...
Network: Base (Chain ID: 8453)
Transaction Hash: 0x...
Block Number: ...

Mint Club URL: https://mint.club/token/base/0x...
BaseScan URL: https://basescan.org/token/0x...

Bonding Curve Parameters:
- Type: Linear
- Backing Asset: $OPENWORK
- Initial Price: X OPENWORK
- Final Price: Y OPENWORK
- Total Supply: Z CONSENSUS

Creator Royalty: 0%
Deployment Cost: $X.XX (gas)

Openwork Registration: [PENDING/COMPLETE]
API Response: [Record API response here]

Verified By: [Your Name]
Timestamp: [ISO 8601 timestamp]
```

---

**Status**: 🔶 BLOCKED - Requires human with browser access to execute
**Blocker**: Browser authentication needed for Mint Club V2 interface
**Ready**: All parameters defined, wallet funded, documentation prepared

**Human Action Required**: Follow this guide to create token, then update TOKEN_INFO.md with results.
