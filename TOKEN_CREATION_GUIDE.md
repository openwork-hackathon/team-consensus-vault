# CONSENSUS Token Creation Guide

**Task**: [CVAULT-4] Create CONSENSUS token via Mint Club V2 bonding curve
**Status**: Ready for human execution
**Wallet**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

---

## 🎯 Token Specification

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Name** | CONSENSUS | Governance token for Consensus Vault |
| **Symbol** | CONS | Short, memorable token symbol |
| **Network** | Base (Chain ID: 8453) | Low fees, Openwork ecosystem |
| **Backing Asset** | **WETH** (Wrapped Ether) | Standard DeFi collateral, high liquidity |
| **WETH Contract** | `0x4200000000000000000000000000000000000006` | Official Base WETH |
| **Bonding Curve** | Linear | Predictable price growth, fair distribution |
| **Creator Royalty** | 2% | Protocol fee for vault sustainability |
| **Fee Recipient** | `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C` | Team wallet |
| **Initial Price** | TBD (recommend ~0.0001 WETH per CONS) | Accessible entry point |
| **Max Supply** | Unlimited (bonding curve model) | Supply grows with demand |

### Governance Scope
CONSENSUS token holders will govern:
- **Role Selection**: Which AI analyst roles are active (Bull, Bear, Technical, etc.)
- **Consensus Thresholds**: Minimum agreement % required for trade signals
- **Risk Limits**: Maximum position sizes, allocation percentages

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
   - **Token Symbol**: `CONS`
   - **Network**: Base (should be pre-selected if wallet is on Base)

### Step 3: Configure Bonding Curve
1. **Base Asset**: Select **WETH** (contract: `0x4200000000000000000000000000000000000006`)
   - WETH should be available in dropdown on Base
   - If not found, manually add this contract address
   - Verify on BaseScan: https://basescan.org/token/0x4200000000000000000000000000000000000006
2. **Curve Type**: Select **"Linear"**
   - Linear = steady price increase
   - More predictable than exponential
3. **Initial Minting Price**: Recommend `0.0001 WETH per CONS` (~$0.30 at current ETH prices)
   - This is the starting price for the first token
   - Adjust based on desired accessibility
4. **Step Size** (if available): Configure linear growth rate
5. **Reserve Ratio** (if available): Set according to bonding curve parameters
6. **Free Minting Allocation**: `0` (fair launch with bonding curve only)

### Step 4: Set Fees
1. **Creator Royalty**: `2%`
   - Low fee for platform sustainability
   - Still competitive compared to traditional DEX fees (typically 0.3-1%)
   - Of this 2%, creator keeps 80% and platform keeps 20% (standard Mint Club split)
2. Review total creation fee:
   - One-time deployment fee (varies by chain, expect $5-20 in gas)
   - Gas fee for contract deployment (~$0.10-0.50 on Base)

### Step 5: Deploy
1. Review all parameters carefully
2. Click **"Create Token"** or **"Deploy"**
3. Approve transaction in wallet
4. Wait for confirmation (usually 5-30 seconds on Base)
5. **SAVE THE FOLLOWING IMMEDIATELY**:
   - **Token contract address** (0x...) - CRITICAL for all integrations
   - **Mint Club token page URL** - For user trading access
   - **Transaction hash** - For verification
   - **Deployment timestamp** - For records
   - **Bonding curve parameters** - Initial price, curve type, creator fee

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
- Token symbol: CONS
- Network: Base (chain ID: 8453)
- Openwork API key: Check `~/openclaw-staging/credentials/openwork-api-key.txt`

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
  "symbol": "CONS",
  "contract_address": "0x...",
  "chain_id": 8453,
  "backing_asset": "WETH",
  "backing_asset_address": "0x4200000000000000000000000000000000000006",
  "bonding_curve_type": "linear",
  "initial_price": "0.0001",
  "creator_royalty": "2",
  "mint_club_url": "https://mint.club/token/base/0x..."
}
```

Example curl command:
```bash
curl -X POST https://api.openwork.bot/v1/tokens/register \
  -H "Authorization: Bearer $(cat ~/openclaw-staging/credentials/openwork-api-key.txt)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CONSENSUS",
    "symbol": "CONS",
    "contract_address": "0x...",
    "chain_id": 8453,
    "backing_asset": "WETH",
    "backing_asset_address": "0x4200000000000000000000000000000000000006",
    "bonding_curve_type": "linear",
    "initial_price": "0.0001",
    "creator_royalty": "2",
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
## 🪙 CONSENSUS Token (CONS)

**Contract**: `0x...` (Base network)
**Symbol**: CONS
**Type**: ERC-20 governance token backed by $OPENWORK
**Mint Club**: [Trade CONS](https://mint.club/token/base/0x...)
**BaseScan**: [View Contract](https://basescan.org/token/0x...)

CONS token is backed by $OPENWORK via a linear bonding curve starting at 0.0001 OPENWORK per CONS. Users can:
- Deposit crypto to earn vault returns
- Hold CONS to govern which AI analyst roles are active
- Trade CONS on Mint Club (instant liquidity via bonding curve)
- 2% creator royalty supports ongoing development
```

### 2. .env.local
Add token configuration:
```env
# CONSENSUS Token (CONS) - Base Network
NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_CONSENSUS_TOKEN_SYMBOL=CONS
NEXT_PUBLIC_MINT_CLUB_URL=https://mint.club/token/base/0x...
NEXT_PUBLIC_WETH_ADDRESS=0x4200000000000000000000000000000000000006
NEXT_PUBLIC_OPENWORK_TOKEN_ADDRESS=0x299c30DD5974BF4D5bFE42C340CA40462816AB07
```

### 3. src/lib/wagmi.ts
Add token constant:
```typescript
// CONSENSUS Token (CONS) on Base
export const CONSENSUS_TOKEN = {
  address: '0x...' as `0x${string}`,
  symbol: 'CONS',
  decimals: 18,
  name: 'CONSENSUS',
  backingAsset: '0x4200000000000000000000000000000000000006' as `0x${string}`, // WETH
  initialPrice: '0.0001', // WETH per CONS
  creatorRoyalty: 2, // 2%
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
- Backing Asset: WETH (0x4200000000000000000000000000000000000006)
- Initial Price: [ACTUAL] WETH per CONS
- Supply Model: Unlimited (bonding curve)
- Step Size: [Record actual value from Mint Club]

Creator Royalty: 2% (to team wallet 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C)
Deployment Cost: $X.XX (gas)

Openwork Registration: [PENDING/COMPLETE]
API Response: [Record API response here]

Verified By: [Your Name]
Timestamp: [ISO 8601 timestamp]
```

---

**Status**: 🔶 BLOCKED - Requires human with browser access to execute
**Blocker**: Browser authentication needed for Mint Club V2 interface
**Ready**: All parameters defined, documentation prepared

## Prerequisites for Human
- [ ] ETH on Base (for gas, ~$1-5 recommended)
- [ ] WETH on Base (for initial liquidity test buy, optional)
- [ ] Wallet connected to Base network (Chain ID: 8453)
- [ ] Access to Mint Club V2 (https://mint.club)

**Human Action Required**: Follow this guide to create token, then update TOKEN_INFO.md with results.

---

**Last Updated**: 2026-02-07
**Updated By**: Lead Engineer (CVAULT-4)
