# CVAULT-22 Handoff: Token Creation Ready for Human Execution

**From**: Claude (Lead Engineer, Autonomous Mode)
**To**: Human with browser access
**Task**: [CVAULT-22] Token: Create CONSENSUS via Mint Club V2
**Date**: 2026-02-07
**Git Commit**: e5326e4

---

## TL;DR - What You Need to Do

1. **Read**: `TOKEN_CREATION_GUIDE.md` (complete step-by-step guide)
2. **Execute**: Create token on https://mint.club (15-30 min)
3. **Verify**: Run `./scripts/verify-token.sh 0x<CONTRACT_ADDRESS>`
4. **Update**: Fill in `TOKEN_INFO.md` with deployment details
5. **Integrate**: Update `.env.local` and `src/lib/wagmi.ts` with contract address
6. **Commit**: Push changes to git

**Everything else is ready** - wallet funded, parameters defined, security analyzed, verification tools built.

---

## What I Completed

### ✅ Full Documentation Suite (721+ lines)

1. **TOKEN_CREATION_GUIDE.md** (246 lines)
   - Complete Mint Club V2 walkthrough
   - All parameters pre-configured
   - Security checklist included
   - Troubleshooting guide
   - Post-deployment steps

2. **TOKEN_INFO.md** (115 lines)
   - Token specifications
   - Backing asset details ($OPENWORK verified)
   - Integration architecture
   - Post-deployment checklist

3. **CVAULT-22_IMPLEMENTATION.md** (370 lines)
   - Security analysis and rationale
   - Four-phase implementation plan
   - Integration diagrams
   - Testing plan

4. **scripts/verify-token.sh** (90 lines)
   - Automated on-chain verification
   - Manual fallback instructions
   - Quick links generation

5. **CVAULT-22_COMPLETE.md**
   - Task completion summary
   - All deliverables listed
   - Success criteria defined

### ✅ Research & Verification

- Analyzed Mint Club V2 capabilities
- Found $OPENWORK contract: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
- Verified wallet has 3.1M $OPENWORK available
- Confirmed Base network configured in wagmi
- Security analysis: Use audited contracts only (safest approach)

### ✅ Git Commit

```
Commit: e5326e4
Branch: feature/wallet-integration
Message: [CVAULT-22] Prepare CONSENSUS token creation via Mint Club V2
Files: 14 files changed, 4101 insertions(+)
```

---

## Why This Is Blocked

**Blocker**: Mint Club V2 requires browser interface

Cannot be automated because:
- No API for token creation
- Requires MetaMask/WalletConnect wallet interaction
- Needs human to sign transaction in browser
- OAuth-style authentication flow

This is a **browser_auth** external task - AI cannot complete without human.

---

## Your Checklist

### Phase 1: Token Creation (15-30 minutes)

- [ ] **Open browser**, navigate to https://mint.club
- [ ] **Check URL carefully** (avoid phishing - verify official site)
- [ ] **Connect wallet**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
- [ ] **Switch to Base network** in wallet (Chain ID: 8453)
- [ ] **Follow TOKEN_CREATION_GUIDE.md step-by-step**
- [ ] **Create token** with these parameters:
  - Name: CONSENSUS
  - Symbol: CONSENSUS
  - Backing: $OPENWORK (`0x299c30DD5974BF4D5bFE42C340CA40462816AB07`)
  - Curve: Linear
  - Royalty: 0%
  - Initial price: 1 OPENWORK = 1000 CONSENSUS
  - Max supply: 10,000,000 CONSENSUS
- [ ] **Save immediately**:
  - Contract address (0x...)
  - Transaction hash (0x...)
  - Mint Club URL
  - Deployment timestamp

### Phase 2: Verification (5 minutes)

- [ ] **Run verification script**:
  ```bash
  cd ~/team-consensus-vault
  ./scripts/verify-token.sh 0x<CONTRACT_ADDRESS>
  ```
- [ ] **Check BaseScan**: Token name/symbol correct
- [ ] **Test buy on Mint Club**: Purchase 10 CONSENSUS
- [ ] **Test sell on Mint Club**: Sell 5 CONSENSUS
- [ ] **Verify in wallet**: Token appears with correct balance

### Phase 3: Integration (10 minutes)

- [ ] **Update TOKEN_INFO.md**:
  - Fill in contract address
  - Add transaction hash
  - Add Mint Club URL
  - Add deployment timestamp
  - Mark checklist items complete

- [ ] **Update .env.local**:
  ```bash
  echo "NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=0x..." >> .env.local
  echo "NEXT_PUBLIC_MINT_CLUB_URL=https://mint.club/token/base/0x..." >> .env.local
  ```

- [ ] **Update src/lib/wagmi.ts**:
  ```typescript
  // Add after existing imports
  export const CONSENSUS_TOKEN = {
    address: '0x...' as `0x${string}`,
    symbol: 'CONSENSUS',
    decimals: 18,
    name: 'CONSENSUS',
  } as const;
  ```

- [ ] **Update README.md**: Add token section (see TOKEN_CREATION_GUIDE.md for template)

- [ ] **Commit changes**:
  ```bash
  git add -A
  git commit -m "[CVAULT-22] Deploy CONSENSUS token on Base via Mint Club V2

  Token deployed:
  - Contract: 0x...
  - Network: Base (Chain ID: 8453)
  - Mint Club: https://mint.club/token/base/0x...
  - BaseScan: https://basescan.org/token/0x...

  Verified:
  - Test buy/sell successful
  - Token appears in wallet
  - Bonding curve functional

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

### Phase 4: Openwork Registration (if needed)

- [ ] **Check Openwork dashboard** - token may auto-detect
- [ ] **If not auto-detected**: Check for token registration option in dashboard
- [ ] **Include in submission**: Token contract, Mint Club URL, bonding curve details

---

## Quick Reference

### Token Parameters (Ready to Deploy)

| Parameter | Value |
|-----------|-------|
| Name | CONSENSUS |
| Symbol | CONSENSUS |
| Network | Base (Chain ID: 8453) |
| Backing Asset | $OPENWORK |
| Contract | `0x299c30DD5974BF4D5bFE42C340CA40462816AB07` |
| Bonding Curve | Linear |
| Creator Royalty | 0% |
| Initial Price | 1 OPENWORK = 1000 CONSENSUS |
| Max Supply | 10,000,000 CONSENSUS |

### Wallet Info

- **Address**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
- **Balance**: 3.1M $OPENWORK available
- **Network**: Base (must be selected in wallet)

### Important Links

- **Mint Club**: https://mint.club
- **BaseScan**: https://basescan.org
- **$OPENWORK Token**: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07
- **Wallet**: https://basescan.org/address/0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

### Files to Read

1. **Start here**: `TOKEN_CREATION_GUIDE.md` (complete walkthrough)
2. **Reference**: `TOKEN_INFO.md` (specifications)
3. **Implementation**: `CVAULT-22_IMPLEMENTATION.md` (full context)
4. **Completion**: `CVAULT-22_COMPLETE.md` (summary)

---

## Security Reminders

### Before Deploying
- ⚠️ Verify Mint Club URL (avoid phishing)
- ⚠️ Confirm Base network in wallet (Chain ID: 8453)
- ⚠️ Double-check $OPENWORK contract address
- ⚠️ Review all parameters before confirming transaction
- ⚠️ Ensure sufficient ETH for gas (~$0.50)

### After Deploying
- ✅ Save all addresses/URLs immediately
- ✅ Verify on BaseScan
- ✅ Test buy/sell with small amounts
- ✅ Check token appears in wallet

---

## Troubleshooting

### "Insufficient balance" error
- Ensure wallet has ETH for gas (need ~$0.50)
- Confirm wallet is on Base network (not Ethereum mainnet)

### "$OPENWORK not found"
- Manually add contract: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
- Verify on BaseScan first

### Transaction fails
- Increase gas limit in wallet
- Wait a few minutes and retry
- Check Base network status

### Token not visible in wallet
- Manually import token:
  - Open MetaMask > Import Token
  - Paste contract address
  - Should auto-fill CONSENSUS symbol

---

## Success Criteria

### Minimum Success
- [ ] Token deployed on Base via Mint Club V2
- [ ] Contract address verified on BaseScan
- [ ] Test buy/sell transactions successful
- [ ] Documentation updated with contract address

### Full Success
- [ ] All minimum criteria met
- [ ] .env.local updated
- [ ] src/lib/wagmi.ts updated
- [ ] README.md updated
- [ ] Changes committed to git
- [ ] Token visible on Openwork dashboard (if applicable)

---

## What Happens After You're Done

Once token is deployed and integrated:

1. **Dashboard displays token info** (future PR)
2. **"Buy CONSENSUS" button** links to Mint Club
3. **Governance features** enabled (vote on AI roles)
4. **Hackathon submission** includes token as key feature

This unlocks the governance layer of Consensus Vault - users can hold CONSENSUS to vote on which AI analyst roles are active.

---

## Questions?

If anything is unclear:

1. **Read TOKEN_CREATION_GUIDE.md** - most comprehensive guide
2. **Check CVAULT-22_IMPLEMENTATION.md** - full context
3. **Review security checklist** - in TOKEN_CREATION_GUIDE.md
4. **Test with small amounts first** - always safe to start small

---

## Time Estimate

- **Token creation**: 15-30 minutes (including verification)
- **Integration**: 10 minutes (update configs)
- **Total**: 25-40 minutes end-to-end

---

## Final Notes

**Everything is ready**. Just follow TOKEN_CREATION_GUIDE.md step-by-step. The wallet is funded, parameters are defined, security is analyzed, verification script is built.

This is a straightforward no-code deployment via audited Mint Club contracts. No Solidity knowledge required. Just browser + wallet.

**After deployment**, the token will have:
- ✅ Instant liquidity (bonding curve)
- ✅ No rug-pull risk (liquidity locked)
- ✅ Fair price discovery (linear curve)
- ✅ Zero fees (0% royalty)

Good luck! 🚀

---

**Lead Engineer**: Claude (Autonomous Mode)
**Handoff Date**: 2026-02-07
**Next Owner**: Human with browser access
**Status**: Ready for execution
