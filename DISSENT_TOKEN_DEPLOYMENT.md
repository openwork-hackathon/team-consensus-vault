# $DISSENT Token Deployment Guide

**Status**: Ready for Human Execution
**Task**: [CVAULT-97] Deploy $DISSENT token on Mint Club V2
**Date**: 2026-02-08
**Operator**: Jonathan (vanclute@gmail.com)

---

## Quick Start

Deploy the $DISSENT contrarian token via Mint Club V2 on Base chain.

**TL;DR:**
1. Go to https://mint.club
2. Connect wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
3. Switch to Base network
4. Create token with parameters below
5. Run post-deployment script with contract address

---

## Token Parameters (Copy These Exactly)

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Token Name** | `DISSENT` | The contrarian token |
| **Token Symbol** | `DISSENT` | Full name as symbol |
| **Network** | Base (Chain ID: 8453) | Must be on Base |
| **Backing Asset** | `$OPENWORK` | Contract: 0x299c30DD5974BF4D5bFE42C340CA40462816AB07 |
| **Bonding Curve** | Linear | Same as CONSENSUS |
| **Initial Price** | `0.0001` OPENWORK per DISSENT | Matches CONSENSUS pricing |
| **Creator Royalty** | `2%` | Platform sustainability |

---

## Quick Links

- **Mint Club**: https://mint.club
- **Wallet Address**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
- **Current Balance**: 3.1M $OPENWORK (sufficient for deployment)
- **$OPENWORK Contract**: 0x299c30DD5974BF4D5bFE42C340CA40462816AB07
- **BaseScan**: https://basescan.org

---

## Step-by-Step Instructions

### Step 1: Access Mint Club V2
1. Open browser (Chrome/Brave recommended)
2. Navigate to: **https://mint.club**
3. Verify URL is exactly `mint.club` (security check)

### Step 2: Connect Wallet
1. Click "Connect Wallet" button
2. Select MetaMask (or your wallet provider)
3. Approve connection for wallet: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`
4. **Switch to Base network** (Chain ID: 8453)
   - MetaMask: Click network dropdown -> Select "Base"
   - If Base not added, add it manually:
     - Network Name: Base
     - RPC URL: https://mainnet.base.org
     - Chain ID: 8453
     - Currency Symbol: ETH

### Step 3: Create Token
1. Click **"Create Token"** or **"Launch Token"**
2. Select token type: **ERC-20 (Fungible Token)**
3. Enter details:
   - **Token Name**: `DISSENT`
   - **Token Symbol**: `DISSENT`
   - Network: Base (should auto-select)

### Step 4: Configure Bonding Curve
1. **Base Asset**: Select `$OPENWORK`
   - If not in dropdown, paste contract: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
   - Verify on BaseScan: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07
2. **Curve Type**: Select **"Linear"**
3. **Initial Price**: `0.0001` (OPENWORK per DISSENT)
4. **Creator Royalty**: `2%`
5. Review all parameters carefully

### Step 5: Deploy & Save Information
1. Click "Create Token" or "Deploy"
2. Approve transaction in MetaMask
   - Gas fee: ~$0.10-0.50 on Base (very cheap)
3. Wait for confirmation (5-30 seconds)
4. **IMMEDIATELY SAVE**:
   - Token contract address (0x...)
   - Transaction hash (0x...)
   - Mint Club token page URL
   - Timestamp

---

## After Deployment

### Run Post-Deployment Script

```bash
cd ~/team-consensus-vault
./scripts/post-dissent-deployment.sh <CONTRACT_ADDRESS>
```

Example:
```bash
./scripts/post-dissent-deployment.sh 0x1234567890abcdef...
```

This script will:
1. Verify deployment on BaseScan
2. Update .env.local with DISSENT_TOKEN_ADDRESS
3. Update TOKEN_INFO.md
4. Provide git commit command

### Manual Verification

1. **BaseScan**: Visit `https://basescan.org/token/<CONTRACT_ADDRESS>`
   - Contract is verified
   - Name: "DISSENT"
   - Symbol: "DISSENT"
   - Decimals: 18

2. **Mint Club**: Visit `https://mint.club/token/base/<CONTRACT_ADDRESS>`
   - Token page loads
   - Bonding curve chart visible
   - Can buy/sell tokens

3. **Wallet**: Check MetaMask
   - Add token if not visible
   - Test small purchase

---

## Post-Deployment Checklist

- [ ] Contract address saved
- [ ] Transaction hash saved
- [ ] Verified on BaseScan
- [ ] Test purchase completed on Mint Club
- [ ] .env.local updated with DISSENT_TOKEN_ADDRESS
- [ ] TOKEN_INFO.md updated
- [ ] Changes committed to git

---

## Troubleshooting

### $OPENWORK not found in dropdown
**Solution**: Manually add token contract address
- Click "Custom Token" or "Add Token"
- Paste: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`

### "Insufficient balance" error
**Solution**: Check you have:
- ETH for gas (~$0.50 minimum)
- Wallet is on Base network (not Ethereum mainnet)

### Transaction fails
**Solution**:
- Increase gas limit in MetaMask
- Wait a few minutes and retry
- Check Base network status: https://status.base.org

### Token not visible in wallet
**Solution**: Manually add to MetaMask:
- Open MetaMask -> "Import Token"
- Paste token contract address
- Symbol should auto-fill as "DISSENT"

---

## Output Template

After deployment, record:

```
$DISSENT TOKEN DEPLOYMENT - [DATE]

Contract Address: 0x...
Network: Base (Chain ID: 8453)
Transaction Hash: 0x...
Block Number: ...

Mint Club URL: https://mint.club/token/base/0x...
BaseScan URL: https://basescan.org/token/0x...

Bonding Curve Parameters:
- Type: Linear
- Backing Asset: $OPENWORK (0x299c30DD5974BF4D5bFE42C340CA40462816AB07)
- Initial Price: 0.0001 OPENWORK per DISSENT
- Creator Royalty: 2%

Deployment Cost: $X.XX (gas + platform fee)
Test Transaction: [TX_HASH]

Status: DEPLOYED AND VERIFIED
```

---

## Expected Costs

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| Token Creation Fee | ~$5-20 | Mint Club platform fee |
| Gas Fee (Base L2) | ~$0.10-0.50 | Very low on Base |
| Test Purchase | ~$0.01-1.00 | For verification |
| **Total** | **~$6-22** | One-time deployment cost |

---

## Security Notes

**Before Deploying:**
- Verify official Mint Club site (check URL: `mint.club`)
- Ensure wallet is on Base network (Chain ID: 8453)
- Double-check $OPENWORK contract address

**After Deployment:**
- Verify contract on BaseScan before announcing
- Test with small amounts first
- Don't share private keys or seed phrases

---

**Status**: READY FOR HUMAN EXECUTION
**Blocker**: Browser authentication needed for Mint Club V2 interface
**Prepared by**: Lead Engineer (Claude)
**Last Updated**: 2026-02-08
