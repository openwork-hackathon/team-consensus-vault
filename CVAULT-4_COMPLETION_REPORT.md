# CVAULT-4 Task Report: Create CONSENSUS Token via Mint Club V2

**Task**: [CVAULT-4] Create CONSENSUS token via Mint Club V2 bonding curve
**Status**: READY FOR HUMAN EXECUTION
**Date**: 2026-02-07
**Author**: Lead Engineer (Autonomous Mode)

---

## Executive Summary

This task requires **human action** to complete. The CONSENSUS token creation must be done through the Mint Club V2 web interface, which requires browser access and wallet connection. All preparation work has been completed.

---

## What Was Completed (Local Work)

### 1. Research & Verification
- [x] Verified WETH contract address on Base: `0x4200000000000000000000000000000000000006`
- [x] Confirmed Mint Club V2 patterns from hackathon research documentation
- [x] Verified team wallet address: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`

### 2. Documentation Updates
- [x] Updated `TOKEN_INFO.md` with correct WETH backing (was incorrectly showing $OPENWORK)
- [x] Updated `TOKEN_CREATION_GUIDE.md` with WETH-specific instructions
- [x] Added governance scope documentation (role selection, consensus thresholds, risk limits)
- [x] Added output template for recording deployment details

### 3. Corrected Specification
The task specifies WETH backing, not $OPENWORK. Documentation has been corrected:

| Parameter | Value |
|-----------|-------|
| **Name** | CONSENSUS |
| **Symbol** | CONS |
| **Network** | Base (Chain ID: 8453) |
| **Backing Asset** | WETH (`0x4200000000000000000000000000000000000006`) |
| **Bonding Curve** | Linear |
| **Creator Royalty** | 2% |
| **Fee Recipient** | `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C` |

---

## What Requires Human Action

### Token Creation (External System)
The following steps MUST be performed by a human with browser access:

1. **Navigate to Mint Club V2**
   - URL: https://mint.club (official site)
   - Network: Base (Chain ID: 8453)

2. **Connect Wallet**
   - Wallet: Team wallet or authorized wallet
   - Ensure ETH available for gas (~$1-5)

3. **Create Token**
   - Token Name: `CONSENSUS`
   - Token Symbol: `CONS`
   - Base Asset: Select WETH (`0x4200000000000000000000000000000000000006`)
   - Curve Type: Linear
   - Creator Royalty: 2%

4. **Record Deployment Details**
   - Contract address
   - Transaction hash
   - Block number
   - Mint Club URL

5. **Test Transaction**
   - Perform small test buy/sell to verify functionality

6. **Update Documentation**
   - Update `TOKEN_INFO.md` with deployed contract address
   - Update `README.md` with token information
   - Update `.env.local` with contract address
   - Commit changes to git

---

## Verification Requirements

For this task to be marked complete, the following must be verified:

- [ ] Token contract deployed on Base
- [ ] Token visible on BaseScan
- [ ] Token tradeable on Mint Club V2
- [ ] Contract address documented
- [ ] Test transaction successful

---

## Files Modified

| File | Change |
|------|--------|
| `TOKEN_INFO.md` | Updated backing asset from $OPENWORK to WETH |
| `TOKEN_CREATION_GUIDE.md` | Updated all references to WETH, added prerequisites |
| `CVAULT-4_COMPLETION_REPORT.md` | Created this report |

---

## Security Notes

- Triple-check wallet address before deployment: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`
- Verify Mint Club URL is official (https://mint.club)
- Do NOT share private keys or seed phrases
- WETH contract is the official Base WETH: `0x4200000000000000000000000000000000000006`

---

## References

- Mint Club V2: https://mint.club
- Mint Club Docs: https://docs.mint.club
- WETH on Base: https://basescan.org/token/0x4200000000000000000000000000000000000006
- Base Network: https://base.org
- Task Description: ~/clautonomous/linux/hackathon-research/crypto-requirements.md

---

## Signal

**[[SIGNAL:task_complete:needs_human_verification]]**

This task requires human action to complete token creation via browser. All local preparation work is complete.

---

**Next Steps for Human**:
1. Follow `TOKEN_CREATION_GUIDE.md` step-by-step
2. Update `TOKEN_INFO.md` with deployment results
3. Commit changes to git
4. Mark task complete in Plane after verification
