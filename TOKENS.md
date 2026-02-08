# Token Documentation

## CONSENSUS Token Status

**🔶 PENDING CREATION**

The CONSENSUS token has not been created yet. This task is currently **BLOCKED** and requires human execution via the Mint Club V2 interface.

### Current Status

- **Task**: [CVAULT-22] Create CONSENSUS via Mint Club V2
- **Status**: 🔶 PENDING (requires browser access)
- **Network**: Base (Chain ID: 8453)
- **Contract Address**: `PENDING_CREATION_VIA_MINT_CLUB_V2`
- **Mint Club URL**: `PENDING`
- **BaseScan URL**: `PENDING`

### Required Action

1. **Human with browser access** must execute token creation via Mint Club V2
2. **Wallet Required**: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`
3. **Available Funds**: 3.1M $OPENWORK tokens
4. **Guide**: See `TOKEN_CREATION_GUIDE.md` for step-by-step instructions

### Post-Creation Updates Required

After token creation, update the following:

#### 1. .env.local
```env
NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=0x[ACTUAL_CONTRACT_ADDRESS]
NEXT_PUBLIC_MINT_CLUB_URL=https://mint.club/token/base/0x[CONTRACT_ADDRESS]
NEXT_PUBLIC_BASESCAN_URL=https://basescan.org/token/0x[CONTRACT_ADDRESS]
```

#### 2. src/lib/wagmi.ts
```typescript
// CONSENSUS Token on Base
export const CONSENSUS_TOKEN = {
  address: '0x[ACTUAL_CONTRACT_ADDRESS]' as `0x${string}`,
  symbol: 'CONSENSUS',
  decimals: 18,
  name: 'CONSENSUS',
} as const;
```

#### 3. TOKEN_INFO.md
- Contract address
- Transaction hash
- Block number
- Mint Club URL
- BaseScan URL
- Deployment timestamp
- Deployment cost (gas fees)

### Frontend Integration Status

- ✅ Wallet connection (RainbowKit + wagmi)
- ✅ Network config (Base network)
- 🔶 Token display (pending contract address)
- 🔶 Governance UI (pending token)

### Security Notes

- **No custom smart contracts** - using audited Mint Club V2 contracts
- **Zero platform fees** - 0% creator royalty
- **Bonding curve** - Linear curve with $OPENWORK backing
- **Instant liquidity** - Available immediately after creation

---

**Last Updated**: 2026-02-07  
**Blocker**: Browser authentication needed for Mint Club V2 interface  
**Next Action**: Human execution of token creation process