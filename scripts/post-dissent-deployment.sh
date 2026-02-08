#!/bin/bash
# Post-deployment script for $DISSENT token
# Run this after creating the token on Mint Club V2
# Usage: ./scripts/post-dissent-deployment.sh <CONTRACT_ADDRESS>

set -e

echo "============================================"
echo "$DISSENT Token Post-Deployment Script"
echo "============================================"
echo ""

# Check for contract address argument
if [ -z "$1" ]; then
    echo "Usage: ./scripts/post-dissent-deployment.sh <CONTRACT_ADDRESS>"
    echo ""
    echo "Example:"
    echo "  ./scripts/post-dissent-deployment.sh 0x1234567890abcdef..."
    exit 1
fi

TOKEN_ADDRESS="$1"

# Validate address format
if [[ ! "$TOKEN_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "Error: Invalid address format"
    echo "Address should be 0x followed by 40 hex characters"
    exit 1
fi

# Prompt for transaction hash
echo "Enter deployment transaction hash (0x...): "
read TX_HASH

if [[ ! "$TX_HASH" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
    echo "Error: Invalid transaction hash format"
    exit 1
fi

# Construct URLs
MINT_CLUB_URL="https://mint.club/token/base/${TOKEN_ADDRESS}"
BASESCAN_URL="https://basescan.org/token/${TOKEN_ADDRESS}"
BASESCAN_TX_URL="https://basescan.org/tx/${TX_HASH}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo ""
echo "============================================"
echo "Token Information"
echo "============================================"
echo "Token Name: DISSENT"
echo "Token Symbol: DISSENT"
echo "Contract Address: $TOKEN_ADDRESS"
echo "Transaction Hash: $TX_HASH"
echo "Network: Base (Chain ID: 8453)"
echo "Mint Club URL: $MINT_CLUB_URL"
echo "BaseScan URL: $BASESCAN_URL"
echo ""

# Verify on BaseScan (optional API check)
echo "============================================"
echo "Step 1: Verify on BaseScan"
echo "============================================"
echo "Check the following at: $BASESCAN_URL"
echo "  - Contract is deployed"
echo "  - Token name is 'DISSENT'"
echo "  - Token symbol is 'DISSENT'"
echo "  - Decimals is 18"
echo ""
echo "Press Enter when verified..."
read

# Update .env.local
echo "============================================"
echo "Step 2: Update .env.local"
echo "============================================"

if [ -f ".env.local" ]; then
    # Check if already exists
    if grep -q "DISSENT_TOKEN_ADDRESS" .env.local; then
        echo "Updating existing DISSENT_TOKEN_ADDRESS..."
        sed -i "s|^DISSENT_TOKEN_ADDRESS=.*|DISSENT_TOKEN_ADDRESS=$TOKEN_ADDRESS|" .env.local
        sed -i "s|^DISSENT_MINT_CLUB_URL=.*|DISSENT_MINT_CLUB_URL=$MINT_CLUB_URL|" .env.local
    else
        echo "Adding DISSENT token configuration..."
        cat >> .env.local << EOF

# DISSENT Token (Contrarian) - Base Network
DISSENT_TOKEN_ADDRESS=$TOKEN_ADDRESS
DISSENT_MINT_CLUB_URL=$MINT_CLUB_URL
EOF
    fi
    echo "Updated .env.local"
else
    echo "Warning: .env.local not found"
    echo "Please add these lines manually:"
    echo ""
    echo "DISSENT_TOKEN_ADDRESS=$TOKEN_ADDRESS"
    echo "DISSENT_MINT_CLUB_URL=$MINT_CLUB_URL"
fi

# Create DISSENT_TOKEN_INFO.md
echo ""
echo "============================================"
echo "Step 3: Create DISSENT_TOKEN_INFO.md"
echo "============================================"

cat > DISSENT_TOKEN_INFO.md << EOF
# \$DISSENT Token Information

**Status**: DEPLOYED
**Deployed**: $TIMESTAMP
**Task**: [CVAULT-97] Deploy \$DISSENT token on Mint Club V2

---

## Token Specification

| Parameter | Value |
|-----------|-------|
| **Name** | DISSENT |
| **Symbol** | DISSENT |
| **Network** | Base (Chain ID: 8453) |
| **Backing Asset** | \$OPENWORK (\`0x299c30DD5974BF4D5bFE42C340CA40462816AB07\`) |
| **Bonding Curve** | Linear |
| **Initial Price** | 0.0001 OPENWORK per DISSENT |
| **Creator Royalty** | 2% |
| **Contract Address** | \`$TOKEN_ADDRESS\` |
| **Mint Club URL** | $MINT_CLUB_URL |

---

## Purpose

\$DISSENT is the **contrarian token** for Consensus Vault. It allows users to bet AGAINST the AI Council's consensus.

- **High AI Confidence** = Higher risk/reward for DISSENT holders
- **AI Wrong** = DISSENT appreciates
- **AI Right** = DISSENT depreciates

See \`docs/DISSENT_TOKEN_ECONOMICS.md\` for full mechanics.

---

## Deployment Information

| Field | Value |
|-------|-------|
| **Transaction Hash** | \`$TX_HASH\` |
| **BaseScan Contract** | $BASESCAN_URL |
| **BaseScan TX** | $BASESCAN_TX_URL |
| **Mint Club Trading** | $MINT_CLUB_URL |
| **Deployment Time** | $TIMESTAMP |
| **Deployed By** | 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C |

---

## Integration Checklist

- [x] Token deployed on Base
- [x] Verified on BaseScan
- [x] .env.local updated
- [x] DISSENT_TOKEN_INFO.md created
- [ ] Contrarian Mode UI connected to real token
- [ ] Git commit with token information

---

## Quick Links

- **Trade**: $MINT_CLUB_URL
- **Verify**: $BASESCAN_URL
- **Economics**: docs/DISSENT_TOKEN_ECONOMICS.md

---

**Last Updated**: $TIMESTAMP
EOF

echo "Created DISSENT_TOKEN_INFO.md"

# Summary
echo ""
echo "============================================"
echo "Post-Deployment Summary"
echo "============================================"
echo ""
echo "DISSENT Token Deployed Successfully!"
echo ""
echo "Contract: $TOKEN_ADDRESS"
echo "TX Hash:  $TX_HASH"
echo ""
echo "Links:"
echo "  Trade:  $MINT_CLUB_URL"
echo "  Verify: $BASESCAN_URL"
echo ""
echo "Files Updated:"
echo "  - .env.local (DISSENT_TOKEN_ADDRESS)"
echo "  - DISSENT_TOKEN_INFO.md (created)"
echo ""
echo "Remaining Tasks:"
echo "  1. Test buy/sell on Mint Club"
echo "  2. Verify token in MetaMask"
echo "  3. Connect UI to real token contract"
echo "  4. Git commit and push"
echo ""
echo "Git Commit Command:"
echo "  git add . && git commit -m '[CVAULT-97] DISSENT token deployed at $TOKEN_ADDRESS' && git push"
echo ""
echo "============================================"
