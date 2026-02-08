#!/bin/bash
# Register CONSENSUS (CONS) token with Openwork API
# Usage: ./scripts/register-token-with-openwork.sh <token_contract_address>

set -e

if [ -z "$1" ]; then
    echo "Error: Token contract address required"
    echo "Usage: $0 <token_contract_address>"
    echo "Example: $0 0x1234567890abcdef1234567890abcdef12345678"
    exit 1
fi

TOKEN_ADDRESS="$1"
API_KEY_FILE="$HOME/openclaw-staging/credentials/openwork-api-key.txt"

if [ ! -f "$API_KEY_FILE" ]; then
    echo "Error: API key file not found at $API_KEY_FILE"
    exit 1
fi

API_KEY=$(cat "$API_KEY_FILE")

# Validate token address format (basic check)
if [[ ! "$TOKEN_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "Error: Invalid Ethereum address format: $TOKEN_ADDRESS"
    echo "Expected format: 0x followed by 40 hexadecimal characters"
    exit 1
fi

echo "============================================"
echo "Registering CONSENSUS (CONS) Token"
echo "============================================"
echo "Token Address: $TOKEN_ADDRESS"
echo "Network: Base (Chain ID: 8453)"
echo "Backing Asset: OPENWORK (0x299c30DD5974BF4D5bFE42C340CA40462816AB07)"
echo "============================================"
echo ""

# Construct the Mint Club URL
MINT_CLUB_URL="https://mint.club/token/base/${TOKEN_ADDRESS}"

# Try multiple possible API endpoints
# The exact endpoint is not documented, so we'll try common patterns

echo "Attempting token registration..."
echo ""

# Try endpoint 1: /api/hackathon/:id/token
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.openwork.bot/api/hackathon/team-consensus-vault/token" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"CONSENSUS\",
        \"symbol\": \"CONS\",
        \"contract_address\": \"${TOKEN_ADDRESS}\",
        \"chain_id\": 8453,
        \"network\": \"base\",
        \"backing_asset\": \"OPENWORK\",
        \"backing_asset_address\": \"0x299c30DD5974BF4D5bFE42C340CA40462816AB07\",
        \"bonding_curve_type\": \"linear\",
        \"initial_price\": \"0.0001\",
        \"creator_royalty\": \"2\",
        \"mint_club_url\": \"${MINT_CLUB_URL}\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response (Endpoint 1 - /api/hackathon/:id/token):"
echo "HTTP Status: $HTTP_CODE"
echo "Body: $BODY"
echo ""

# Try endpoint 2: /api/v1/tokens/register
RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.openwork.bot/api/v1/tokens/register" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"CONSENSUS\",
        \"symbol\": \"CONS\",
        \"contract_address\": \"${TOKEN_ADDRESS}\",
        \"chain_id\": 8453,
        \"network\": \"base\",
        \"backing_asset\": \"OPENWORK\",
        \"backing_asset_address\": \"0x299c30DD5974BF4D5bFE42C340CA40462816AB07\",
        \"bonding_curve_type\": \"linear\",
        \"initial_price\": \"0.0001\",
        \"creator_royalty\": \"2\",
        \"mint_club_url\": \"${MINT_CLUB_URL}\"
    }")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

echo "Response (Endpoint 2 - /api/v1/tokens/register):"
echo "HTTP Status: $HTTP_CODE2"
echo "Body: $BODY2"
echo ""

# Try endpoint 3: /api/tokens
RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.openwork.bot/api/tokens" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"CONSENSUS\",
        \"symbol\": \"CONS\",
        \"contract_address\": \"${TOKEN_ADDRESS}\",
        \"chain_id\": 8453,
        \"network\": \"base\",
        \"backing_asset\": \"OPENWORK\",
        \"backing_asset_address\": \"0x299c30DD5974BF4D5bFE42C340CA40462816AB07\",
        \"bonding_curve_type\": \"linear\",
        \"initial_price\": \"0.0001\",
        \"creator_royalty\": \"2\",
        \"mint_club_url\": \"${MINT_CLUB_URL}\"
    }")

HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

echo "Response (Endpoint 3 - /api/tokens):"
echo "HTTP Status: $HTTP_CODE3"
echo "Body: $BODY3"
echo ""

# Check if any endpoint succeeded (2xx status code)
if [[ "$HTTP_CODE" =~ ^2 ]] || [[ "$HTTP_CODE2" =~ ^2 ]] || [[ "$HTTP_CODE3" =~ ^2 ]]; then
    echo "✅ SUCCESS: Token registration completed!"
    echo ""
    echo "Next steps:"
    echo "1. Update TOKEN_INFO.md with contract address: $TOKEN_ADDRESS"
    echo "2. Update .env.local with NEXT_PUBLIC_CONSENSUS_TOKEN_ADDRESS=$TOKEN_ADDRESS"
    echo "3. Update src/lib/wagmi.ts with token constant"
    echo "4. Verify on BaseScan: https://basescan.org/token/${TOKEN_ADDRESS}"
    echo "5. Test on Mint Club: ${MINT_CLUB_URL}"
    exit 0
else
    echo "⚠️  WARNING: All endpoints returned non-2xx status codes"
    echo "This may mean:"
    echo "  - API endpoints have changed (check https://openwork.bot/api/docs)"
    echo "  - Authorization required differs from expected format"
    echo "  - Manual submission required via Openwork dashboard"
    echo ""
    echo "Manual submission information:"
    echo "  Token: CONSENSUS (CONS)"
    echo "  Contract: $TOKEN_ADDRESS"
    echo "  Network: Base (8453)"
    echo "  Mint Club: ${MINT_CLUB_URL}"
    echo ""
    echo "Please check the Openwork documentation or dashboard for the correct submission process."
    exit 1
fi
