#!/bin/bash

# Token Verification Script for CONSENSUS Token on Base
# Usage: ./scripts/verify-token.sh <TOKEN_CONTRACT_ADDRESS>

set -e

TOKEN_ADDRESS="${1:-}"
BASE_RPC="https://mainnet.base.org"
OPENWORK_TOKEN="0x299c30DD5974BF4D5bFE42C340CA40462816AB07"

if [ -z "$TOKEN_ADDRESS" ]; then
    echo "❌ Error: Token contract address required"
    echo "Usage: $0 <TOKEN_CONTRACT_ADDRESS>"
    echo "Example: $0 0x1234...5678"
    exit 1
fi

echo "🔍 Verifying CONSENSUS Token on Base..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Token Address: $TOKEN_ADDRESS"
echo "Network: Base (Chain ID: 8453)"
echo "Backing Asset: $OPENWORK_TOKEN"
echo ""

# Check if cast is installed (from Foundry)
if ! command -v cast &> /dev/null; then
    echo "⚠️  Warning: 'cast' command not found (install Foundry for on-chain verification)"
    echo "   Install: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    echo ""
    echo "📋 Manual Verification Steps:"
    echo "1. Visit BaseScan: https://basescan.org/token/$TOKEN_ADDRESS"
    echo "2. Verify token name is 'CONSENSUS'"
    echo "3. Verify token symbol is 'CONSENSUS'"
    echo "4. Check Mint Club page: https://mint.club/token/base/$TOKEN_ADDRESS"
    echo "5. Test buy small amount (e.g., 10 CONSENSUS)"
    exit 0
fi

echo "📡 Querying on-chain data..."
echo ""

# Get token name
echo "🏷️  Token Name:"
NAME=$(cast call "$TOKEN_ADDRESS" "name()(string)" --rpc-url "$BASE_RPC" 2>/dev/null || echo "Error: Unable to read")
echo "   $NAME"

# Get token symbol
echo "🔤 Token Symbol:"
SYMBOL=$(cast call "$TOKEN_ADDRESS" "symbol()(string)" --rpc-url "$BASE_RPC" 2>/dev/null || echo "Error: Unable to read")
echo "   $SYMBOL"

# Get token decimals
echo "🔢 Decimals:"
DECIMALS=$(cast call "$TOKEN_ADDRESS" "decimals()(uint8)" --rpc-url "$BASE_RPC" 2>/dev/null || echo "Error: Unable to read")
echo "   $DECIMALS"

# Get total supply
echo "📊 Total Supply:"
TOTAL_SUPPLY=$(cast call "$TOKEN_ADDRESS" "totalSupply()(uint256)" --rpc-url "$BASE_RPC" 2>/dev/null || echo "Error: Unable to read")
if [ "$TOTAL_SUPPLY" != "Error: Unable to read" ]; then
    # Convert from wei to token units (assuming 18 decimals)
    SUPPLY_FORMATTED=$(echo "scale=2; $TOTAL_SUPPLY / 10^18" | bc)
    echo "   $SUPPLY_FORMATTED CONSENSUS"
else
    echo "   $TOTAL_SUPPLY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate results
if [ "$NAME" == "CONSENSUS" ] && [ "$SYMBOL" == "CONSENSUS" ]; then
    echo "✅ Token verified successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update TOKEN_INFO.md with contract address"
    echo "2. Update .env.local:"
    echo "   NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=$TOKEN_ADDRESS"
    echo "3. Update src/lib/wagmi.ts with token constant"
    echo "4. Test token buy on Mint Club"
    echo "5. Commit changes to git"
else
    echo "⚠️  Warning: Token name/symbol mismatch"
    echo "   Expected: CONSENSUS / CONSENSUS"
    echo "   Got: $NAME / $SYMBOL"
    echo ""
    echo "   Verify manually at: https://basescan.org/token/$TOKEN_ADDRESS"
fi

echo ""
echo "🔗 Quick Links:"
echo "   BaseScan: https://basescan.org/token/$TOKEN_ADDRESS"
echo "   Mint Club: https://mint.club/token/base/$TOKEN_ADDRESS"
