# CONSENSUS Token Deployment Guide

**Project**: Consensus Vault (CVAULT-4)
**Token Name**: Consensus
**Token Symbol**: CNSNS
**Network**: Base (Chain ID: 8453)
**Platform**: Mint Club V2 (No-Code, Audited)

---

## Overview

The CONSENSUS token is the governance token for Consensus Vault. It uses a bonding curve backed by WETH on Base chain, deployed via Mint Club V2's audited smart contracts. The bonding curve provides:

- **Automatic liquidity** - No DEX listing required
- **Price discovery** - Price increases with demand/supply
- **Built-in fees** - 2% protocol fee routed to treasury

---

## Why Mint Club V2?

| Feature | Benefit |
|---------|---------|
| No-code deployment | No smart contract development required |
| Audited contracts | Security without custom audits |
| Multi-chain support | Base, Ethereum, Arbitrum, Optimism |
| Bonding curve | Automatic pricing and liquidity |
| Creator royalties | Built-in fee mechanism |

---

## Token Specifications

### Core Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Name** | Consensus | Full token name |
| **Symbol** | CNSNS | 5-character ticker |
| **Network** | Base | Coinbase L2 (Chain ID: 8453) |
| **Base Asset** | WETH | Address: `0x4200000000000000000000000000000000000006` |
| **Max Supply** | 1,000,000 CNSNS | Total supply cap |
| **Free Allocation** | 100,000 CNSNS | 10% allocated to creator (treasury) |

### Bonding Curve Configuration

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| **Curve Type** | Linear (DBC) | Discrete Bonding Curve with step array |
| **Initial Price** | 0.0001 WETH | ~$0.25 at $2,500/ETH |
| **Final Price** | 0.01 WETH | ~$25 at $2,500/ETH |
| **Price Steps** | 20 | Number of price intervals |
| **Price Increase** | Linear | Equal increments per step |

### Bonding Curve Economics

The price increases linearly from 0.0001 to 0.01 WETH across 20 steps:

```
Step 1:  50,000 tokens at 0.0001 WETH  (~$0.25 each)
Step 2:  100,000 tokens at 0.00055 WETH
...
Step 10: 500,000 tokens at 0.005 WETH  (~$12.50 each)
...
Step 20: 1,000,000 tokens at 0.01 WETH (~$25 each)
```

**Early buyers benefit from lower prices.** As demand increases supply, price rises automatically.

---

## Fee Configuration

### Royalty Structure

| Fee Type | Rate | Recipient | Purpose |
|----------|------|-----------|---------|
| **Creator Royalty** | 2.0% | Treasury | Protocol revenue (per task requirement) |
| **Protocol Fee** | 0.4% | Mint Club | Platform fee (20% of creator royalty) |
| **Total Fee** | 2.4% | Split | Combined transaction fee |

### How Fees Work

1. **On Mint (Buy)**: User pays WETH → 2% goes to treasury, 0.4% to Mint Club, rest buys tokens
2. **On Burn (Sell)**: User burns tokens → Receives WETH minus 2.4% total fees

### Fee Calculation Formula

```
Protocol Fee = Creator Royalty × 0.2

Example (CONSENSUS token):
Creator Royalty = 2.0% (task requirement)
Protocol Fee = 2.0% × 0.2 = 0.4%
Total Fee = 2.0% + 0.4% = 2.4%
```

### Treasury Wallet

**Address**: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`

This is the project's multi-purpose wallet that receives:
- 2% creator royalty on every token mint
- 2% creator royalty on every token burn
- 100,000 CNSNS free allocation (10% of supply)

---

## Deployment Process

### Prerequisites

1. **Wallet**: MetaMask or Coinbase Wallet with Base network
2. **Funds**: At least 0.002 ETH on Base for deployment fee + gas
3. **Access**: Browser with wallet extension

### Step-by-Step Deployment

#### 1. Navigate to Mint Club

1. Go to **https://mint.club/create**
2. Click **"Create Token"** (not NFT)
3. Select **"Base"** network from chain selector

#### 2. Configure Token Basics

Enter the following:

| Field | Value |
|-------|-------|
| Token Name | `Consensus` |
| Token Symbol | `CNSNS` |

#### 3. Select Base Asset

1. Click "Select Base Asset"
2. Search for **WETH**
3. Select `WETH (Wrapped Ether)` at address `0x4200000000000000000000000000000000000006`

#### 4. Configure Bonding Curve

1. Select **"Linear"** curve type
2. Enter parameters:

| Field | Value |
|-------|-------|
| Initial Price | `0.0001` WETH |
| Final Price | `0.01` WETH |
| Max Supply | `1000000` |
| Price Steps | `20` |

#### 5. Set Free Allocation (Optional but Recommended)

1. Enable "Free Minting Allocation"
2. Enter: `100000` tokens
3. This allocates 100K CNSNS to creator (treasury wallet)

#### 6. Configure Creator Royalty

1. Set Minting Royalty: `2%`
2. Set Burning Royalty: `2%`
3. Verify the display shows:
   - Creator receives: 2%
   - Protocol fee: 0.4%
   - Total: 2.4%

#### 7. Review and Deploy

1. Review all parameters in the summary
2. Connect wallet if not connected
3. Ensure wallet is on Base network
4. Click **"Create Token"**
5. Sign the transaction in wallet
6. Wait for confirmation (~5-15 seconds on Base)

#### 8. Record Deployment Details

After successful deployment, save:

```
Contract Address: 0x[COPY FROM CONFIRMATION]
Transaction Hash: 0x[COPY FROM WALLET]
Deploy Time: [TIMESTAMP]
```

---

## Post-Deployment Verification

### 1. Verify on BaseScan

1. Go to `https://basescan.org/token/[CONTRACT_ADDRESS]`
2. Verify:
   - Token name: Consensus
   - Token symbol: CNSNS
   - Total supply: 1,000,000
   - Decimals: 18

### 2. Test Transaction

1. Go to `https://mint.club/token/base/CNSNS`
2. Connect wallet
3. Mint a small amount (e.g., 1 WETH worth)
4. Verify:
   - Tokens received in wallet
   - Fee deducted correctly (2.4%)
   - Treasury received royalty

### 3. Verify Fee Routing

1. Check treasury wallet on BaseScan: `https://basescan.org/address/0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`
2. Look for incoming WETH transactions from the mint

---

## Integration Steps

### Update Environment Variables

After deployment, update `.env.local`:

```bash
# Add the deployed contract address
NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=0x[DEPLOYED_ADDRESS]
```

### Update Vercel Environment

If using Vercel:
1. Go to project settings → Environment Variables
2. Add `NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS` with the contract address
3. Redeploy to pick up changes

### Register with Openwork

The token URL for registration:
```
https://mint.club/token/base/CNSNS
```

Or on BaseScan:
```
https://basescan.org/token/[CONTRACT_ADDRESS]
```

---

## Security Considerations

### What This Approach Provides

- **Audited contracts**: Mint Club V2 contracts are audited
- **No custom code**: Zero custom smart contract risk
- **Bonding curve security**: Built-in liquidity prevents rug pulls
- **Fee transparency**: All fees visible on-chain

### What to Watch For

- **Never share private keys**
- **Verify contract address** before any interaction
- **Test with small amounts** before large transactions
- **Double-check treasury address** receives fees

---

## Quick Reference Card

```
=== CONSENSUS Token Deployment ===

URL: https://mint.club/create
Network: Base
Token: CNSNS (Consensus)
Base Asset: WETH

Initial: 0.0001 WETH
Final:   0.01 WETH
Supply:  1,000,000
Steps:   20
Curve:   Linear

Free:    100,000 (10%)
Royalty: 2% + 0.4% = 2.4%
Treasury: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

Time: ~15 minutes
Cost: ~0.002 ETH + gas
```

---

## Troubleshooting

### "Insufficient funds"
- Ensure you have at least 0.005 ETH on Base
- Check you're on Base network, not Ethereum

### "Transaction failed"
- Try increasing gas limit
- Wait a few minutes and retry
- Check Base network status

### "Token not found on BaseScan"
- Wait 1-2 minutes for indexing
- Verify the contract address
- Check transaction status on wallet

### "Royalty not received"
- Verify treasury address was set correctly
- Check that royalty percentage is >0
- Wait for block confirmations

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| Feb 7, 2026 | Initial draft | Claude |
| Feb 8, 2026 | Added complete deployment steps, fee calculations, verification process | Claude |

---

## References

- Mint Club V2 Docs: https://docs.mint.club
- Base Network: https://docs.base.org
- BaseScan: https://basescan.org
- WETH on Base: https://basescan.org/token/0x4200000000000000000000000000000000000006
