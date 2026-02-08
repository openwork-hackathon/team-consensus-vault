# $DISSENT Token Economics Design

**Task**: CVAULT-96 (Design) + CVAULT-97 (Deploy)
**Status**: Ready for Deployment
**Date**: 2026-02-08

---

## Overview

$DISSENT is the **contrarian token** for Consensus Vault. While $CONS (CONSENSUS) represents alignment with the AI Council's recommendations, $DISSENT allows users to **bet against the AI consensus**.

**Core Mechanic**: When the AI Council reaches strong consensus (4/5 or 5/5 agreement), $DISSENT holders are betting the AI is wrong. Higher AI confidence = higher risk/reward for contrarians.

---

## Token Specification

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Name** | DISSENT | Clear opposition to CONSENSUS |
| **Symbol** | DISSENT | Distinct from CONS, memorable |
| **Network** | Base (Chain ID: 8453) | Same as CONSENSUS, low fees |
| **Backing Asset** | $OPENWORK | Hackathon requirement, ecosystem alignment |
| **Bonding Curve** | Linear | Matches CONSENSUS, predictable |
| **Initial Price** | 0.0001 OPENWORK | Same as CONSENSUS for parity |
| **Creator Royalty** | 2% | Platform sustainability (matches UI) |
| **Contract Platform** | Mint Club V2 | Audited, no custom contracts |

---

## Inverse Consensus Mechanics

### How Contrarian Betting Works

1. **AI Council Votes**: 5 AI models analyze and vote (BUY/SELL/HOLD)
2. **Consensus Confidence**: Measured by agreement level
   - 5/5 agreement = 100% confidence
   - 4/5 agreement = 80% confidence
   - 3/2 split = No consensus (neutral)
3. **$DISSENT Value**: Inversely correlated to consensus strength
   - Strong consensus (80-100%) = High risk, high reward for dissenters
   - Weak/no consensus (< 80%) = Lower risk, lower reward

### Risk Premium Structure

| AI Consensus | Confidence | $DISSENT Risk | Potential Payout |
|--------------|------------|---------------|------------------|
| 5/5 unanimous | 100% | Very High | 3x multiplier |
| 4/5 strong | 80% | High | 2x multiplier |
| 3/2 split | 60% | Medium | 1.5x multiplier |
| No consensus | < 60% | Low | 1x (no bonus) |

**Note**: Actual payouts depend on market outcome vs AI prediction, not just consensus level.

### Use Cases

1. **Contrarian Trading**
   - User sees AI Council is 100% bullish
   - User believes market will dump (AI is wrong)
   - User buys $DISSENT at premium (high confidence = high price)
   - If market dumps, $DISSENT appreciates

2. **Hedging**
   - User holds $CONS aligned with AI
   - User hedges by holding some $DISSENT
   - Balanced exposure regardless of AI accuracy

3. **Speculation**
   - Pure speculation on AI accuracy
   - No need to trade underlying assets
   - Simple long/short on "Is the AI right?"

---

## Bonding Curve Configuration

### Mint Club V2 Parameters

```
Token Name: DISSENT
Token Symbol: DISSENT
Network: Base
Backing Asset: $OPENWORK (0x299c30DD5974BF4D5bFE42C340CA40462816AB07)
Curve Type: Linear
Initial Minting Price: 0.0001 OPENWORK per DISSENT
Creator Royalty: 2%
```

### Why Linear Curve?

- **Predictability**: Users can calculate expected price impact
- **Fairness**: No early-adopter advantage from exponential growth
- **Consistency**: Matches $CONSENSUS token structure
- **Simplicity**: Easier to explain to users

### Why 2% Royalty?

- Matches the DissentTokenInterface.tsx UI implementation
- Provides platform sustainability
- Industry standard for bonding curve tokens
- Split: 80% to creator, 20% to Mint Club

---

## Token Relationship

### $CONS vs $DISSENT

| Aspect | $CONS (CONSENSUS) | $DISSENT |
|--------|-------------------|----------|
| Represents | AI is right | AI is wrong |
| Sentiment | Trust the Council | Doubt the Council |
| Risk Profile | Lower when AI accurate | Higher when AI accurate |
| Target User | Passive, trusts AI | Active, contrarian |
| Color Theme | Green/Blue | Orange/Red |
| Tagline | "Follow the consensus" | "Put your money where your mouth is" |

### Portfolio Strategy

- **100% CONS**: Full trust in AI Council
- **100% DISSENT**: Full distrust in AI Council
- **50/50**: Hedged position, profits from volatility
- **Dynamic**: Adjust based on personal conviction

---

## Integration Points

### Frontend (Already Implemented)

- **ModeToggle.tsx**: Switch between Consensus/Contrarian modes
- **Orange/red theming** for contrarian mode
- **Inverted displays** in AnalystCard, ConsensusMeter, TradeSignal
- **"Put your money where your mouth is"** messaging

### Required Updates After Deployment

1. **Environment Variables**
   ```env
   DISSENT_TOKEN_ADDRESS=0x...
   DISSENT_MINT_CLUB_URL=https://mint.club/token/base/0x...
   ```

2. **Token Constants** (src/lib/tokens.ts or wagmi.ts)
   ```typescript
   export const DISSENT_TOKEN = {
     address: '0x...' as `0x${string}`,
     symbol: 'DISSENT',
     decimals: 18,
     name: 'DISSENT',
   } as const;
   ```

3. **Buy/Sell Interface**
   - Link to Mint Club trading page
   - Or integrate Mint Club SDK for in-app trading

---

## Security Considerations

### Using Mint Club V2

- **Audited contracts**: No custom smart contract risk
- **Battle-tested**: Thousands of tokens deployed
- **No rug-pull risk**: Liquidity locked in bonding curve
- **Instant liquidity**: Can always buy/sell via curve

### Deployment Risks

- Verify official Mint Club URL (mint.club)
- Confirm $OPENWORK contract address
- Test with small transaction after deployment
- Save contract address immediately

---

## Deployment Checklist

- [ ] Connect wallet to Mint Club V2
- [ ] Switch to Base network
- [ ] Create DISSENT token with parameters above
- [ ] Save contract address and TX hash
- [ ] Verify on BaseScan
- [ ] Test buy/sell on Mint Club
- [ ] Update .env.local with contract address
- [ ] Run post-deployment verification script
- [ ] Commit changes to git

---

## Success Metrics

1. **Deployment**: Token live on Base via Mint Club
2. **Liquidity**: Trading enabled via bonding curve
3. **Integration**: Contract address in codebase
4. **Verification**: Confirmed on BaseScan

---

**Prepared by**: Lead Engineer
**Date**: 2026-02-08
**Status**: Ready for Human Execution
