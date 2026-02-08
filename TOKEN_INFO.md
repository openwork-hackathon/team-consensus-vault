# CONSENSUS Token Information

**Status**: 🔶 PENDING CREATION (Requires Human Action)
**Task**: [CVAULT-4] Create CONSENSUS token via Mint Club V2 bonding curve

---

## Token Specification

| Parameter | Value |
|-----------|-------|
| **Name** | CONSENSUS |
| **Symbol** | CONS |
| **Network** | Base (Chain ID: 8453) |
| **Backing Asset** | WETH (`0x4200000000000000000000000000000000000006`) |
| **Bonding Curve** | Linear |
| **Initial Price** | TBD (see creation guide) |
| **Creator Royalty** | 2% (protocol fee for vault sustainability) |
| **Supply Model** | Unlimited (bonding curve) |
| **Contract Address** | TBD (pending deployment) |
| **Mint Club URL** | TBD (pending deployment) |

---

## Backing Asset: WETH (Wrapped Ether)

**Contract Address**: `0x4200000000000000000000000000000000000006`
**Network**: Base (Chain ID: 8453)
**BaseScan**: https://basescan.org/token/0x4200000000000000000000000000000000000006

**Team Wallet Address**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
**Protocol Fee Recipient**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C (2% on deposits)

---

## Governance Scope

CONSENSUS token holders will govern vault parameters:
- **Role Selection**: Which AI analyst roles (Bull, Bear, Technical, etc.) are active
- **Consensus Thresholds**: Minimum agreement % required for trade signals
- **Risk Limits**: Maximum position sizes, allocation percentages

---

## Deployment Information

**Status**: Awaiting human execution via Mint Club V2 interface

**Required Steps**:
1. ✅ Parameters defined (WETH-backed linear bonding curve)
2. ✅ Team wallet address confirmed (0x676a8720a302Ad5C17A7632BF48C48e71C41B79C)
3. ✅ Base network configured in wagmi
4. 🔶 **PENDING**: Create token via Mint Club V2 (requires browser + wallet)
5. 🔶 **PENDING**: Register with Openwork API
6. 🔶 **PENDING**: Update project documentation

**Guide**: See `TOKEN_CREATION_GUIDE.md` for complete step-by-step instructions.

---

## Post-Deployment Checklist

After token is created, update this file with:

- [ ] Contract address
- [ ] Transaction hash
- [ ] Block number
- [ ] Mint Club URL
- [ ] BaseScan URL
- [ ] Deployment timestamp
- [ ] Deployment cost (gas fees)
- [ ] Test transaction confirmation
- [ ] Openwork API registration response
- [ ] Update README.md with token info
- [ ] Update .env.local with contract address
- [ ] Update src/lib/wagmi.ts with token constant
- [ ] Commit changes to git

---

## Integration Points

### Frontend
- Wallet connection: ✅ Implemented (RainbowKit + wagmi)
- Network config: ✅ Base network configured
- Token display: 🔶 Pending (needs contract address)
- Governance UI: 🔶 Pending (future feature)

### Backend
- Deposit tracking: ✅ Implemented (in-memory)
- Token balance queries: 🔶 Pending (needs contract address)
- Openwork API: 🔶 Pending (needs registration)

### Smart Contracts
- CONSENSUS token: 🔶 Pending creation
- Vault contract: ⏸️ Deferred (using in-memory for MVP)
- Governance contract: ⏸️ Deferred (post-hackathon)

---

## Security Considerations

**Mint Club V2 Advantages**:
- ✅ Audited contracts (no custom smart contract risk)
- ✅ Battle-tested bonding curve implementation
- ✅ No code deployment required
- ✅ Instant liquidity via bonding curve
- ✅ No rug-pull risk (liquidity locked in curve)

**Deployment Risks**:
- ⚠️ Ensure correct $OPENWORK contract address (avoid fake tokens)
- ⚠️ Verify Mint Club official site (check URL carefully)
- ⚠️ Test with small transaction after deployment
- ⚠️ Keep private keys secure

---

## Resources

- **Mint Club V2**: https://mint.club
- **Mint Club Docs**: https://docs.mint.club
- **Base Network**: https://base.org
- **BaseScan Explorer**: https://basescan.org
- **Openwork API Docs**: https://www.openwork.bot/api/docs
- **WETH on Base**: https://basescan.org/token/0x4200000000000000000000000000000000000006
- **$OPENWORK Token**: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07

---

**Last Updated**: 2026-02-07
**Updated By**: Lead Engineer (CVAULT-4)
**Next Action**: Human execution required (browser + wallet access for Mint Club V2)
