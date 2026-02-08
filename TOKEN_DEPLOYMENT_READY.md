# ✅ CONSENSUS Token Deployment - Ready for Human Execution

**Status**: All preparations complete. Ready for browser-based deployment.
**Task**: [CVAULT-45] DAY 2: Token creation via Mint Club V2
**Date**: 2026-02-07
**Operator**: Jonathan (vanclute@gmail.com)

---

## 🎯 Quick Start

You need to create the CONSENSUS (CONS) token via the Mint Club V2 web interface. This cannot be automated because it requires browser-based wallet interaction.

**TL;DR:**
1. Go to https://mint.club
2. Connect wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
3. Switch to Base network
4. Create token with parameters below
5. Run post-deployment script with contract address

---

## 📋 Token Parameters (Copy These Exactly)

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Token Name** | `CONSENSUS` | Full name |
| **Token Symbol** | `CONS` | Short ticker |
| **Network** | Base (Chain ID: 8453) | Must be on Base |
| **Backing Asset** | `$OPENWORK` | Contract: 0x299c30DD5974BF4D5bFE42C340CA40462816AB07 |
| **Bonding Curve** | Linear | Predictable price growth |
| **Initial Price** | `0.0001` OPENWORK per CONS | Starting price |
| **Creator Royalty** | `2%` | Platform sustainability |

---

## 🔗 Quick Links

- **Mint Club**: https://mint.club
- **Wallet Address**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
- **Current Balance**: 3.1M $OPENWORK (sufficient for deployment)
- **$OPENWORK Contract**: 0x299c30DD5974BF4D5bFE42C340CA40462816AB07
- **BaseScan (verify after)**: https://basescan.org/address/0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

---

## 📖 Step-by-Step Instructions

### Prerequisites (Already Complete ✅)
- ✅ Wallet funded with 3.1M $OPENWORK
- ✅ Base network configured
- ✅ Parameters defined and documented
- ✅ Post-deployment scripts ready

### Deployment Steps

#### Step 1: Access Mint Club V2
1. Open browser (Chrome/Brave recommended)
2. Navigate to: **https://mint.club**
3. Verify URL is exactly `mint.club` (security check)

#### Step 2: Connect Wallet
1. Click "Connect Wallet" button
2. Select MetaMask (or your wallet provider)
3. Approve connection for wallet: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`
4. **Switch to Base network** (Chain ID: 8453)
   - MetaMask: Click network dropdown → Select "Base"
   - If Base not added, add it manually:
     - Network Name: Base
     - RPC URL: https://mainnet.base.org
     - Chain ID: 8453
     - Currency Symbol: ETH

#### Step 3: Create Token
1. Click **"Create Token"** or **"Launch Token"**
2. Select token type: **ERC-20 (Fungible Token)**
3. Enter details:
   - **Token Name**: `CONSENSUS`
   - **Token Symbol**: `CONS`
   - Network: Base (should auto-select)

#### Step 4: Configure Bonding Curve
1. **Base Asset**: Select `$OPENWORK`
   - If not in dropdown, paste contract: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
   - Verify on BaseScan: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07
2. **Curve Type**: Select **"Linear"**
3. **Initial Price**: `0.0001` (OPENWORK per CONS)
4. **Creator Royalty**: `2%`
5. Review all parameters carefully

#### Step 5: Deploy & Save Information
1. Click "Create Token" or "Deploy"
2. Approve transaction in MetaMask
   - Gas fee: ~$0.10-0.50 on Base (very cheap)
3. Wait for confirmation (5-30 seconds)
4. **IMMEDIATELY SAVE**:
   - ✏️ Token contract address (0x...)
   - ✏️ Transaction hash (0x...)
   - ✏️ Mint Club token page URL
   - ✏️ Timestamp

---

## 🔧 After Deployment (Automated)

Once you have the token contract address, run the post-deployment script:

```bash
cd ~/team-consensus-vault
./scripts/post-token-deployment.sh
```

This script will:
1. ✅ Verify deployment on BaseScan
2. ✅ Register token with Openwork API
3. ✅ Update TOKEN_INFO.md with contract address
4. ✅ Update .env.local with environment variables
5. ✅ Provide git commit command

**Manual steps after script:**
- Update `src/lib/wagmi.ts` with token constant
- Update README.md with token section
- Test token purchase on Mint Club
- Commit and push to git

---

## 🧪 Post-Deployment Verification

### 1. Verify on BaseScan
Visit: `https://basescan.org/token/[YOUR_TOKEN_ADDRESS]`

Check:
- ✓ Contract is verified
- ✓ Name: "CONSENSUS"
- ✓ Symbol: "CONS"
- ✓ Decimals: 18
- ✓ Total Supply: Shows bonding curve supply

### 2. Test on Mint Club
Visit: `https://mint.club/token/base/[YOUR_TOKEN_ADDRESS]`

Test:
- ✓ Token page loads
- ✓ Can see bonding curve chart
- ✓ Buy 10-100 CONS (small test transaction)
- ✓ Token appears in MetaMask wallet
- ✓ Can sell tokens back (test liquidity)

### 3. Verify in Wallet
Open MetaMask:
- ✓ CONS token appears in token list
- ✓ Balance matches purchase amount
- ✓ Can send/receive CONS

---

## ⚠️ Important Security Notes

### Before Deploying
- ✓ Verify you're on official Mint Club site (check URL: `mint.club`)
- ✓ Ensure wallet is on Base network (Chain ID: 8453)
- ✓ Double-check $OPENWORK contract address (avoid fake tokens)
- ✓ Have at least $1 ETH for gas (currently have sufficient)

### During Deployment
- ✓ Review all parameters before confirming transaction
- ✓ Don't rush - this is irreversible
- ✓ Save contract address immediately (can't change later)

### After Deployment
- ✓ Verify contract on BaseScan before announcing
- ✓ Test with small amounts first
- ✓ Don't share private keys or seed phrases

---

## 📊 Expected Costs

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| Token Creation Fee | ~$5-20 | Mint Club platform fee |
| Gas Fee (Base L2) | ~$0.10-0.50 | Very low on Base |
| Test Purchase | ~$0.01-1.00 | For verification |
| **Total** | **~$6-22** | One-time deployment cost |

You have **3.1M $OPENWORK** available, which is more than sufficient.

---

## 🐛 Troubleshooting

### Problem: $OPENWORK not found in dropdown
**Solution**: Manually add token contract address
- Click "Custom Token" or "Add Token"
- Paste: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
- Verify on BaseScan before confirming

### Problem: "Insufficient balance" error
**Solution**: Check you have:
- ETH for gas (~$0.50 minimum)
- Wallet is on Base network (not Ethereum mainnet)
- $OPENWORK tokens available (you have 3.1M ✓)

### Problem: Transaction fails
**Solution**:
- Increase gas limit in MetaMask (click "Advanced" → increase by 20%)
- Wait a few minutes and try again (network congestion)
- Check Base network status: https://status.base.org

### Problem: Token created but not visible in wallet
**Solution**:
- Manually add to MetaMask:
  - Open MetaMask → "Import Token"
  - Paste token contract address
  - Symbol should auto-fill as "CONS"

---

## 📞 Support & Documentation

If you encounter issues:

1. **Mint Club Documentation**: https://docs.mint.club
2. **Base Network Docs**: https://docs.base.org
3. **Full Creation Guide**: `TOKEN_CREATION_GUIDE.md` (comprehensive)
4. **Openwork Support**: https://openwork.bot/support

---

## ✅ Final Checklist

**Before Starting:**
- [ ] Browser open with MetaMask installed
- [ ] Wallet connected and unlocked
- [ ] On Base network (Chain ID: 8453)
- [ ] Have notepad ready to save contract address

**During Deployment:**
- [ ] Verify all parameters match table above
- [ ] Review transaction details carefully
- [ ] Confirm transaction in MetaMask

**After Deployment:**
- [ ] Save token contract address
- [ ] Save transaction hash
- [ ] Verify on BaseScan
- [ ] Run post-deployment script
- [ ] Test small purchase
- [ ] Commit changes to git

---

## 🎯 Success Criteria

You'll know deployment succeeded when:
1. ✅ You have a token contract address (0x...)
2. ✅ Transaction confirmed on BaseScan
3. ✅ Token appears on Mint Club
4. ✅ Can buy/sell CONS tokens
5. ✅ Token appears in MetaMask

---

## 🚀 Next Steps After Deployment

Once token is deployed and verified:

1. **Immediate** (within 5 minutes):
   - Run `./scripts/post-token-deployment.sh [TOKEN_ADDRESS]`
   - Test purchase on Mint Club
   - Verify in wallet

2. **Same Day**:
   - Update frontend UI to display token
   - Add token trading interface
   - Register with Openwork API (script handles this)

3. **Next Session**:
   - Integrate token gating for AI role governance
   - Add token balance display
   - Build governance voting UI

---

## 📝 Output Template

After deployment, you should have this information:

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
- Backing Asset: $OPENWORK (0x299c30DD5974BF4D5bFE42C340CA40462816AB07)
- Initial Price: 0.0001 OPENWORK per CONS
- Creator Royalty: 2%

Deployment Cost: $X.XX (gas + platform fee)
Test Transaction: [TX_HASH]

Status: ✅ DEPLOYED AND VERIFIED
```

---

**Ready to deploy?** 🚀

1. Go to https://mint.club
2. Follow steps above
3. Run post-deployment script when done

**Questions?** Check `TOKEN_CREATION_GUIDE.md` for comprehensive details.

---

**Prepared by**: Lead Engineer (Claude)
**Task**: [CVAULT-45] DAY 2: Token creation via Mint Club V2
**Status**: 🟢 READY FOR HUMAN EXECUTION
**Last Updated**: 2026-02-07
