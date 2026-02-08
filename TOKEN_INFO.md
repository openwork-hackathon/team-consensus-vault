# CONSENSUS Token Information

**Status**: ✅ DEPLOYED
**Task**: [CVAULT-22] Token: Create CONSENSUS via Mint Club V2
**Deployed At**: 2026-02-08

---

## Token Specification

| Parameter | Value |
|-----------|-------|
| **Name** | CONSENSUS |
| **Symbol** | CONSENSUS |
| **Network** | Base (Chain ID: 8453) |
| **Backing Asset** | $OPENWORK (`0x299c30DD5974BF4D5bFE42C340CA40462816AB07`) |
| **Bonding Curve** | Linear |
| **Creator Royalty** | 0% (no fees) |
| **Contract Address** | `0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa` |
| **Mint Club URL** | https://mint.club/token/base/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa |
| **BaseScan URL** | https://basescan.org/token/0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa |

---

## Backing Asset: $OPENWORK

**Contract Address**: `0x299c30DD5974BF4D5bFE42C340CA40462816AB07`
**Network**: Base (Chain ID: 8453)
**BaseScan**: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07

**Wallet Balance**: 3.1M $OPENWORK available
**Wallet Address**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

---

## Deployment Information

**Status**: ✅ DEPLOYED

**Deployment Details**:
- **Contract Address**: `0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa`
- **Network**: Base (Chain ID: 8453)
- **Deployed Via**: Mint Club V2
- **Deployment Date**: 2026-02-08

**Required Steps**:
1. ✅ Parameters defined
2. ✅ Wallet funded (3.1M $OPENWORK)
3. ✅ Base network configured in wagmi
4. ✅ Create token via Mint Club V2
5. 🔶 **PENDING**: Register with Openwork API
6. ✅ Update project documentation

**Guide**: See `TOKEN_CREATION_GUIDE.md` for complete step-by-step instructions.

---

## Post-Deployment Checklist

After token is created, update this file with:

- [x] Contract address
- [ ] Transaction hash
- [ ] Block number
- [x] Mint Club URL
- [x] BaseScan URL
- [x] Deployment timestamp
- [ ] Deployment cost (gas fees)
- [ ] Test transaction confirmation
- [ ] Openwork API registration response
- [x] Update README.md with token info
- [x] Update .env.local with contract address
- [ ] Update src/lib/wagmi.ts with token constant
- [ ] Commit changes to git

---

## Integration Points

### Frontend
- Wallet connection: ✅ Implemented (RainbowKit + wagmi)
- Network config: ✅ Base network configured
- Token display: ✅ Contract address configured
- Governance UI: 🔶 Pending (future feature)

### Backend
- Deposit tracking: ✅ Implemented (in-memory)
- Token balance queries: ✅ Contract address available
- Openwork API: 🔶 Pending (needs registration)

### Smart Contracts
- CONSENSUS token: ✅ Deployed at `0xF6d67996312152c3AdEB8d7F95EDE8d7D20AB7fa`
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
- **$OPENWORK Token**: https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07

---

**Last Updated**: 2026-02-08
**Next Action**: Register token with Openwork API
