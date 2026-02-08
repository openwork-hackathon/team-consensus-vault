# CONSENSUS Token Deployment Checklist

**Quick Reference for Human Deployer**
**Estimated Time: 15-20 minutes**

---

## Pre-Deployment Requirements

- [ ] MetaMask or Coinbase Wallet installed
- [ ] Wallet connected to **Base network** (Chain ID: 8453)
- [ ] At least **0.005 ETH** on Base (covers deployment fee + gas)
- [ ] Treasury address verified: `0x676a8720a302Ad5C17A7632BF48C48e71C41B79C`

---

## Deployment Values (Copy-Paste Ready)

```
Token Name: Consensus
Token Symbol: CNSNS
Network: Base
Base Asset: WETH (0x4200000000000000000000000000000000000006)
Curve Type: Linear
Price Steps: 20
Initial Price: 0.0001 WETH
Final Price: 0.01 WETH
Max Supply: 1000000
Free Allocation: 100000
Minting Royalty: 2%
Burning Royalty: 2%
Treasury Wallet: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C
```

---

## Deployment Steps

### Step 1: Navigate to Mint Club
- [ ] Go to **https://mint.club/create**
- [ ] Select **"Token"** (not NFT)
- [ ] Select **"Base"** from network dropdown

### Step 2: Token Basics
- [ ] Enter Token Name: `Consensus`
- [ ] Enter Token Symbol: `CNSNS`

### Step 3: Base Asset
- [ ] Click "Select Base Asset"
- [ ] Search for **WETH**
- [ ] Select WETH at `0x4200000000000000000000000000000000000006`

### Step 4: Bonding Curve
- [ ] Select **Linear** curve type
- [ ] Initial Price: `0.0001` WETH
- [ ] Final Price: `0.01` WETH
- [ ] Max Supply: `1000000`
- [ ] Price Steps: `20`

### Step 5: Free Allocation
- [ ] Enable free minting allocation
- [ ] Enter: `100000` tokens

### Step 6: Royalties (Critical!)
- [ ] Minting Royalty: `2%`
- [ ] Burning Royalty: `2%`
- [ ] Verify treasury receives 2%, Mint Club receives 0.4%

### Step 7: Deploy
- [ ] Review all parameters in summary
- [ ] Click **"Create Token"**
- [ ] Confirm transaction in wallet
- [ ] Wait for confirmation

---

## Post-Deployment Checklist

### Record Deployment Details
- [ ] Contract Address: `_____________________________`
- [ ] Transaction Hash: `_____________________________`
- [ ] Deploy Time: `_____________________________`

### Verification Steps
- [ ] Verify on BaseScan: `https://basescan.org/token/[ADDRESS]`
- [ ] Token name shows "Consensus"
- [ ] Token symbol shows "CNSNS"
- [ ] Total supply shows 1,000,000

### Test Transaction
- [ ] Mint small amount (~0.001 WETH worth)
- [ ] Verify tokens received in wallet
- [ ] Verify treasury received 2% fee

### Integration Updates
- [ ] Update `.env.local` with contract address:
  ```
  NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=0x[ADDRESS]
  ```
- [ ] Update Vercel environment variable (if applicable)
- [ ] Update `CONSENSUS_TOKEN_DEPLOYMENT.md` with contract address

### External Registration
- [ ] Register token URL with Openwork API:
  ```
  Token URL: https://mint.club/token/base/CNSNS
  ```

---

## Deployment URL

**https://mint.club/create**
- Select Token/ERC20
- Select Base network

---

## Verification URLs (Update [ADDRESS] after deployment)

| Check | URL |
|-------|-----|
| BaseScan Token | `https://basescan.org/token/[ADDRESS]` |
| Mint Club Page | `https://mint.club/token/base/CNSNS` |
| Treasury Wallet | `https://basescan.org/address/0x676a8720a302Ad5C17A7632BF48C48e71C41B79C` |

---

## Time Estimate

| Step | Time |
|------|------|
| Pre-flight checks | 2 min |
| Mint Club UI entry | 5 min |
| Transaction confirmation | 1 min |
| BaseScan verification | 2 min |
| Test transaction | 3 min |
| Update env/docs | 5 min |
| **Total** | **~18 min** |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Insufficient funds" | Ensure 0.005+ ETH on Base |
| "Wrong network" | Switch to Base (Chain ID 8453) |
| Transaction stuck | Increase gas, wait, or retry |
| Token not on BaseScan | Wait 1-2 minutes for indexing |
| Fee not received | Verify royalty settings during deploy |

---

## Security Checklist

- [ ] Using audited Mint Club V2 contracts (NO custom code)
- [ ] Double-checked treasury address before deploy
- [ ] Tested with small amount before larger transactions
- [ ] Saved contract address in multiple locations
