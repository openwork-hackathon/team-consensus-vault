#!/bin/bash
# Post-deployment checklist for CONSENSUS (CONS) token
# Run this after creating the token on Mint Club V2
# Usage: ./scripts/post-token-deployment.sh

set -e

echo "============================================"
echo "CONSENSUS Token Post-Deployment Checklist"
echo "============================================"
echo ""
echo "This script will guide you through post-deployment tasks."
echo "Make sure you have the following information ready:"
echo "  1. Token contract address (0x...)"
echo "  2. Transaction hash from deployment"
echo "  3. Mint Club token page URL"
echo ""

# Prompt for token address
read -p "Enter token contract address (0x...): " TOKEN_ADDRESS

if [[ ! "$TOKEN_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "Error: Invalid address format"
    exit 1
fi

# Prompt for transaction hash
read -p "Enter deployment transaction hash (0x...): " TX_HASH

if [[ ! "$TX_HASH" =~ ^0x[a-fA-F0-9]{64}$ ]]; then
    echo "Error: Invalid transaction hash format"
    exit 1
fi

# Construct URLs
MINT_CLUB_URL="https://mint.club/token/base/${TOKEN_ADDRESS}"
BASESCAN_URL="https://basescan.org/token/${TOKEN_ADDRESS}"
BASESCAN_TX_URL="https://basescan.org/tx/${TX_HASH}"

echo ""
echo "============================================"
echo "Token Information"
echo "============================================"
echo "Contract Address: $TOKEN_ADDRESS"
echo "Transaction Hash: $TX_HASH"
echo "Mint Club URL: $MINT_CLUB_URL"
echo "BaseScan URL: $BASESCAN_URL"
echo "BaseScan TX: $BASESCAN_TX_URL"
echo ""

# Verify on BaseScan
echo "============================================"
echo "Step 1: Verify on BaseScan"
echo "============================================"
echo "Opening BaseScan in browser..."
echo "Please verify:"
echo "  ✓ Contract is deployed"
echo "  ✓ Token name is 'CONSENSUS'"
echo "  ✓ Token symbol is 'CONS'"
echo "  ✓ Decimals is 18"
echo ""
read -p "Press Enter when you've verified on BaseScan..."

# Register with Openwork
echo ""
echo "============================================"
echo "Step 2: Register with Openwork API"
echo "============================================"
./scripts/register-token-with-openwork.sh "$TOKEN_ADDRESS"

OPENWORK_STATUS=$?
if [ $OPENWORK_STATUS -eq 0 ]; then
    echo "✅ Openwork registration completed"
else
    echo "⚠️  Openwork registration may require manual action"
fi

# Update TOKEN_INFO.md
echo ""
echo "============================================"
echo "Step 3: Update TOKEN_INFO.md"
echo "============================================"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create backup
cp TOKEN_INFO.md TOKEN_INFO.md.backup

# Update the file
cat > TOKEN_INFO.md << EOF
# CONSENSUS Token Information

**Status**: ✅ DEPLOYED
**Deployed**: $TIMESTAMP

---

## Token Specification

| Parameter | Value |
|-----------|-------|
| **Name** | CONSENSUS |
| **Symbol** | CONS |
| **Network** | Base (Chain ID: 8453) |
| **Backing Asset** | \$OPENWORK (\`0x299c30DD5974BF4D5bFE42C340CA40462816AB07\`) |
| **Bonding Curve** | Linear |
| **Initial Price** | 0.0001 OPENWORK per CONS |
| **Creator Royalty** | 2% (80/20 split with Mint Club) |
| **Supply Model** | Unlimited (bonding curve) |
| **Contract Address** | \`$TOKEN_ADDRESS\` |
| **Mint Club URL** | $MINT_CLUB_URL |

---

## Deployment Information

**Deployment Transaction**: $TX_HASH
**BaseScan**: $BASESCAN_URL
**Deployment Time**: $TIMESTAMP
**Deployed By**: 0x676a8720a302Ad5C17A7632BF48C48e71C41B79C

---

## Verification Links

- **BaseScan Contract**: $BASESCAN_URL
- **BaseScan TX**: $BASESCAN_TX_URL
- **Mint Club Trading**: $MINT_CLUB_URL
- **Openwork Dashboard**: https://openwork.bot/dashboard

---

## Integration Status

- [x] Token deployed on Base
- [x] Verified on BaseScan
- [x] TOKEN_INFO.md updated
- [ ] .env.local updated with contract address
- [ ] src/lib/wagmi.ts updated with token constant
- [ ] README.md updated with token section
- [ ] Openwork API registration confirmed
- [ ] Test transaction completed
- [ ] Git commit with token information

---

## Post-Deployment Checklist

After creating this file, complete these tasks:

1. **Update Environment Variables**
   \`\`\`bash
   echo "NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=$TOKEN_ADDRESS" >> .env.local
   echo "NEXT_PUBLIC_CONSENSUS_TOKEN_SYMBOL=CONS" >> .env.local
   echo "NEXT_PUBLIC_MINT_CLUB_URL=$MINT_CLUB_URL" >> .env.local
   \`\`\`

2. **Update wagmi Configuration**
   Edit \`src/lib/wagmi.ts\` and add:
   \`\`\`typescript
   export const CONSENSUS_TOKEN = {
     address: '$TOKEN_ADDRESS' as \\\`0x\${string}\\\`,
     symbol: 'CONS',
     decimals: 18,
     name: 'CONSENSUS',
   } as const;
   \`\`\`

3. **Update README.md**
   Add token section with contract address and trading links

4. **Test Token**
   - Visit Mint Club: $MINT_CLUB_URL
   - Perform small test buy (e.g., 10 CONS)
   - Verify token appears in MetaMask
   - Verify trading works bidirectionally

5. **Git Commit**
   \`\`\`bash
   git add .
   git commit -m "[CVAULT-45] Token deployed: CONSENSUS (CONS) at $TOKEN_ADDRESS"
   git push origin main
   \`\`\`

---

**Last Updated**: $TIMESTAMP
**Status**: Deployment complete, integration in progress
EOF

echo "✅ TOKEN_INFO.md updated"
echo "   Backup saved to TOKEN_INFO.md.backup"

# Update .env.local
echo ""
echo "============================================"
echo "Step 4: Update .env.local"
echo "============================================"

if [ -f ".env.local" ]; then
    # Check if already exists
    if grep -q "NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS" .env.local; then
        echo "⚠️  Token address already in .env.local - skipping"
    else
        cat >> .env.local << EOF

# CONSENSUS Token (CONS) - Base Network
NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=$TOKEN_ADDRESS
NEXT_PUBLIC_CONSENSUS_TOKEN_SYMBOL=CONS
NEXT_PUBLIC_MINT_CLUB_URL=$MINT_CLUB_URL
NEXT_PUBLIC_OPENWORK_TOKEN_ADDRESS=0x299c30DD5974BF4D5bFE42C340CA40462816AB07
EOF
        echo "✅ .env.local updated"
    fi
else
    echo "⚠️  .env.local not found - please create it manually"
fi

# Summary
echo ""
echo "============================================"
echo "Post-Deployment Summary"
echo "============================================"
echo "✅ Token deployed: $TOKEN_ADDRESS"
echo "✅ TOKEN_INFO.md updated"
echo "✅ .env.local updated (if file exists)"
echo ""
echo "Manual tasks remaining:"
echo "  1. Update src/lib/wagmi.ts with token constant"
echo "  2. Update README.md with token section"
echo "  3. Test token purchase on Mint Club: $MINT_CLUB_URL"
echo "  4. Verify token in MetaMask wallet"
echo "  5. Git commit and push changes"
echo ""
echo "Useful commands:"
echo "  # View on BaseScan"
echo "  open $BASESCAN_URL"
echo ""
echo "  # Trade on Mint Club"
echo "  open $MINT_CLUB_URL"
echo ""
echo "  # Commit changes"
echo "  git add . && git commit -m '[CVAULT-45] Token deployed: CONSENSUS (CONS)' && git push"
echo ""
echo "============================================"
echo "Next: Test the token and integrate into UI"
echo "============================================"
