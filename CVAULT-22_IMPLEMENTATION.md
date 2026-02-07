# CVAULT-22 Implementation: CONSENSUS Token Creation

**Task**: [CVAULT-22] Token: Create CONSENSUS via Mint Club V2
**Status**: 🔶 BLOCKED - Requires human with browser access
**Date**: 2026-02-07

---

## Overview

This task creates the CONSENSUS governance token using Mint Club V2's no-code interface. The token will be backed by $OPENWORK on Base network using a linear bonding curve.

### Key Decision: Mint Club V2 Only (No Custom Contracts)

Based on security analysis in `SMART_CONTRACT_SECURITY_PLAN.md`, we're using **Option A: NO Custom Smart Contracts**:

✅ **Why this approach**:
- Zero custom smart contract code = zero exploit surface
- Mint Club V2 is audited and battle-tested
- No audit needed (would cost $5K-$20K + 1-2 weeks)
- Fast to implement (hours vs days)
- Still demonstrates token integration for judging
- Bonding curve provides instant liquidity

✅ **Trade-offs**:
- Lose 2-4 points on "Token Integration" criterion (19% weight)
- Gain 5-10 points on "Completeness" (fully working vs broken)
- Gain 3-5 points on "Code Quality" (clean, bug-free)
- **Net positive**: Come out ahead by avoiding smart contract complexity

---

## Token Specification

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Name** | CONSENSUS | Clear, memorable, aligns with project |
| **Symbol** | CONSENSUS | Full name as symbol (governance standard) |
| **Network** | Base (Chain ID: 8453) | Low fees, Openwork ecosystem |
| **Backing Asset** | $OPENWORK | Required for hackathon |
| **Contract** | `0x299c30DD5974BF4D5bFE42C340CA40462816AB07` | Verified on BaseScan |
| **Bonding Curve** | Linear | Predictable price growth, fair distribution |
| **Creator Royalty** | 0% | No fees = maximum adoption |
| **Initial Price** | 1 OPENWORK = 1000 CONSENSUS | Accessible entry point |
| **Max Supply** | 10,000,000 CONSENSUS | Sufficient for growth |

---

## Implementation Approach

### Phase 1: Documentation & Preparation ✅
**Status**: COMPLETE

**Deliverables**:
1. ✅ **TOKEN_CREATION_GUIDE.md** - Complete step-by-step creation guide
   - Mint Club V2 navigation
   - Parameter configuration
   - Security checklist
   - Troubleshooting guide

2. ✅ **TOKEN_INFO.md** - Token information reference
   - Token specifications
   - Backing asset details
   - Integration points
   - Post-deployment checklist

3. ✅ **scripts/verify-token.sh** - Automated verification script
   - On-chain data queries (using Foundry's cast)
   - Manual verification steps (if cast not available)
   - Quick links generation

**Parameters Defined**:
- Wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C (3.1M $OPENWORK)
- Backing asset: $OPENWORK (`0x299c30DD5974BF4D5bFE42C340CA40462816AB07`)
- Network: Base (already configured in `src/lib/wagmi.ts`)
- Bonding curve: Linear
- Creator royalty: 0% (no fees)

### Phase 2: Token Creation 🔶
**Status**: BLOCKED - Requires human execution

**Blocker**: Mint Club V2 requires browser interface
- Cannot be automated via API
- Requires MetaMask/WalletConnect interaction
- Needs transaction signing in wallet

**Human Action Required**:
1. Follow `TOKEN_CREATION_GUIDE.md` step-by-step
2. Connect wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
3. Ensure Base network selected
4. Navigate to https://mint.club
5. Create token with specified parameters
6. Save contract address, transaction hash, Mint Club URL
7. Update `TOKEN_INFO.md` with deployment details

**Estimated Time**: 15-30 minutes (including verification)

### Phase 3: Verification & Integration ⏸️
**Status**: PENDING (awaits Phase 2 completion)

**Steps**:
1. Run verification script:
   ```bash
   ./scripts/verify-token.sh 0x<CONTRACT_ADDRESS>
   ```
2. Verify on BaseScan
3. Test buy small amount on Mint Club (e.g., 10 CONSENSUS)
4. Update project files:
   - `.env.local` - Add NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS
   - `src/lib/wagmi.ts` - Add CONSENSUS_TOKEN constant
   - `README.md` - Add token section
   - `TOKEN_INFO.md` - Fill in deployment details
5. Commit changes to git

### Phase 4: Openwork Registration ⏸️
**Status**: PENDING (awaits Phase 2 completion)

**Research Finding**: No dedicated token registration endpoint found in Openwork API (`api-technical-guide.md`).

**Likely Approaches**:
1. **Automatic detection**: Openwork may automatically detect tokens on Base
2. **Dashboard registration**: May need to add via Openwork web dashboard
3. **Submission metadata**: Include token info in hackathon submission

**Action Plan**:
- Check Openwork dashboard after token creation
- Include token details in hackathon submission:
  - Contract address
  - Mint Club URL
  - Bonding curve type
  - Backing asset ($OPENWORK)
- Monitor Openwork platform for token appearance

---

## Security Considerations

### ✅ Risk Mitigation via Mint Club
- **No custom code**: Cannot be exploited (no code to exploit)
- **Audited contracts**: Mint Club V2 is battle-tested
- **No rug-pull risk**: Liquidity locked in bonding curve
- **No admin keys**: Creator has no special privileges (0% royalty)
- **Transparent**: All parameters visible on-chain

### ⚠️ Deployment Risks
- **Wrong contract**: Must verify $OPENWORK address before deployment
- **Phishing**: Must use official Mint Club site (https://mint.club)
- **Gas**: Need ~$0.50 ETH on Base for deployment
- **Irreversible**: Cannot change parameters after deployment

### 🛡️ Security Checklist
- [ ] Verify Mint Club URL (official site)
- [ ] Confirm Base network in wallet (Chain ID: 8453)
- [ ] Double-check $OPENWORK contract: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
- [ ] Review all parameters before confirming transaction
- [ ] Save all addresses/URLs immediately after deployment
- [ ] Verify on BaseScan before announcing
- [ ] Test buy/sell with small amount

---

## Integration Architecture

### Frontend (Next.js + RainbowKit)
```
┌─────────────────────────────────────────┐
│           Dashboard UI                  │
├─────────────────────────────────────────┤
│  • Wallet connection (✅ done)          │
│  • Token balance display (⏸️ pending)   │
│  • Buy CONSENSUS link (⏸️ pending)      │
│  • Governance voting (⏸️ future)        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│        wagmi + viem                     │
├─────────────────────────────────────────┤
│  • Read token balance                   │
│  • Query user holdings                  │
│  • No write operations (Mint Club only) │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│     CONSENSUS Token (Base)              │
├─────────────────────────────────────────┤
│  • Mint Club V2 contract                │
│  • Backed by $OPENWORK                  │
│  • Linear bonding curve                 │
└─────────────────────────────────────────┘
```

### Token Flow
1. **User deposits crypto** → Vault (tracked in VaultContext)
2. **User buys CONSENSUS** → Via Mint Club interface (external)
3. **User holds CONSENSUS** → Enables governance features
4. **Future**: Vote on AI analyst roles with CONSENSUS balance

### Data Flow
- **On-chain**: Token balance, bonding curve state
- **Off-chain**: Vault deposits, consensus calculations, AI outputs
- **Hybrid**: Governance (wallet signatures verified off-chain)

---

## Files Created

### Documentation
- ✅ `TOKEN_CREATION_GUIDE.md` (246 lines) - Complete creation guide
- ✅ `TOKEN_INFO.md` (115 lines) - Token reference documentation
- ✅ `CVAULT-22_IMPLEMENTATION.md` (this file) - Task implementation doc

### Scripts
- ✅ `scripts/verify-token.sh` (90 lines) - Token verification script

### Configuration (Pending)
- ⏸️ `.env.local` - Add NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS
- ⏸️ `src/lib/wagmi.ts` - Add CONSENSUS_TOKEN constant
- ⏸️ `README.md` - Add token section

---

## Testing Plan

### Pre-Deployment
- [x] Parameters defined and documented
- [x] Wallet funded (3.1M $OPENWORK confirmed)
- [x] $OPENWORK contract verified on BaseScan
- [x] Base network configured in wagmi
- [x] Security checklist created

### Post-Deployment
- [ ] Run verification script
- [ ] Verify name/symbol on BaseScan
- [ ] Verify bonding curve on Mint Club
- [ ] Test buy: 10 CONSENSUS
- [ ] Test sell: 5 CONSENSUS (verify curve works both ways)
- [ ] Check token balance in wallet
- [ ] Verify $OPENWORK backing in Mint Club UI

### Integration Testing
- [ ] Token address added to .env.local
- [ ] wagmi reads token balance correctly
- [ ] UI displays token info correctly
- [ ] Buy link redirects to Mint Club correctly

---

## Success Criteria

### Minimum Viable Token (MVP)
- [x] Parameters defined
- [ ] Token deployed on Base via Mint Club V2
- [ ] Contract address verified on BaseScan
- [ ] Test transaction successful
- [ ] Documentation updated with contract address

### Full Integration
- [ ] Token info displayed on dashboard
- [ ] Buy CONSENSUS link prominent in UI
- [ ] User balance displayed (if wallet connected)
- [ ] Governance features enabled (or roadmap documented)

### Hackathon Submission
- [ ] Token included in project README
- [ ] Mint Club URL shared in demo
- [ ] Contract address in submission metadata
- [ ] Token demonstrates "meaningful use of token mechanics" (judging criteria)

---

## Next Steps

### Immediate (Human Required)
1. 🔶 **Execute TOKEN_CREATION_GUIDE.md** (15-30 min)
   - Use browser to access Mint Club V2
   - Follow guide step-by-step
   - Save all deployment details

2. 🔶 **Verify deployment** (5 min)
   - Run verification script
   - Check BaseScan
   - Test buy on Mint Club

3. 🔶 **Update project files** (10 min)
   - Add contract address to configs
   - Update documentation
   - Commit changes

### Short-term (Same Session)
- Integrate token display in dashboard UI
- Add "Buy CONSENSUS" button linking to Mint Club
- Test wallet balance display

### Long-term (Post-Hackathon)
- Implement governance voting
- Add token gating for AI analyst roles
- Build reward distribution system
- Explore DAO tooling integration

---

## Lessons Learned

### Design Decisions
1. **No custom contracts = smart move**
   - Avoided 2-3 days of Solidity development
   - Eliminated security audit requirement
   - Reduced attack surface to zero
   - Still meets "token integration" criterion

2. **Mint Club V2 is ideal for hackathons**
   - No-code = fast deployment
   - Audited = no security concerns
   - Bonding curve = instant liquidity
   - Fair distribution mechanism

3. **Browser-required tasks need human handoff**
   - Cannot automate OAuth/wallet signing
   - Clear documentation enables smooth handoff
   - Verification scripts catch errors early

### Recommendations for Future
- Use Mint Club for rapid token prototyping
- Defer custom contracts until product-market fit
- Prioritize security over feature complexity
- Document external dependencies clearly

---

## References

### Documentation
- `TOKEN_CREATION_GUIDE.md` - How to create token
- `TOKEN_INFO.md` - Token specifications
- `SMART_CONTRACT_SECURITY_PLAN.md` - Security analysis
- `crypto-requirements.md` - Mint Club research

### External Resources
- **Mint Club**: https://mint.club
- **Mint Club Docs**: https://docs.mint.club
- **Base Network**: https://base.org
- **BaseScan**: https://basescan.org
- **$OPENWORK Token**: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07

---

**Status**: 🔶 BLOCKED - Awaiting human execution via browser
**Blocker**: Mint Club V2 requires browser authentication
**Ready**: All parameters defined, wallet funded, documentation complete
**Next Action**: Human follows TOKEN_CREATION_GUIDE.md to create token

**Lead Engineer**: Claude (Autonomous)
**Last Updated**: 2026-02-07
