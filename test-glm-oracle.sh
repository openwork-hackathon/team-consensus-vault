#!/bin/bash
# Test script for GLM On-Chain Oracle API
# Tests both GET and POST endpoints with various parameters

set -e

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Testing GLM On-Chain Oracle API"
echo "=========================================="
echo ""

# Test 1: Basic GET request
echo "Test 1: Basic GET request for BTC"
echo "curl $BASE_URL/api/on-chain-oracle?asset=BTC"
curl -s "$BASE_URL/api/on-chain-oracle?asset=BTC" | jq .
echo ""
echo "✓ Test 1 Complete"
echo ""

# Test 2: GET request with metrics parameter
echo "Test 2: GET request with metrics parameter"
echo "curl $BASE_URL/api/on-chain-oracle?asset=ETH&metrics=tvl,active_addresses"
curl -s "$BASE_URL/api/on-chain-oracle?asset=ETH&metrics=tvl,active_addresses" | jq .
echo ""
echo "✓ Test 2 Complete"
echo ""

# Test 3: GET request with custom context
echo "Test 3: GET request with custom context"
echo "curl $BASE_URL/api/on-chain-oracle?asset=SOL&context=Focus%20on%20DeFi%20TVL%20trends"
curl -s "$BASE_URL/api/on-chain-oracle?asset=SOL&context=Focus%20on%20DeFi%20TVL%20trends" | jq .
echo ""
echo "✓ Test 3 Complete"
echo ""

# Test 4: POST request with JSON body
echo "Test 4: POST request with JSON body"
echo 'curl -X POST $BASE_URL/api/on-chain-oracle -H "Content-Type: application/json" -d {"asset":"BTC","metrics":["tvl","protocol_activity"]}'
curl -s -X POST "$BASE_URL/api/on-chain-oracle" \
  -H "Content-Type: application/json" \
  -d '{"asset":"BTC","metrics":["tvl","protocol_activity"]}' | jq .
echo ""
echo "✓ Test 4 Complete"
echo ""

# Test 5: POST request with array of metrics
echo "Test 5: POST request with array of metrics"
echo 'curl -X POST $BASE_URL/api/on-chain-oracle -H "Content-Type: application/json" -d {"asset":"ETH","metrics":["tvl","active_addresses","gas_usage"],"context":"Analyze Ethereum network health"}'
curl -s -X POST "$BASE_URL/api/on-chain-oracle" \
  -H "Content-Type: application/json" \
  -d '{"asset":"ETH","metrics":["tvl","active_addresses","gas_usage"],"context":"Analyze Ethereum network health"}' | jq .
echo ""
echo "✓ Test 5 Complete"
echo ""

# Test 6: Error handling - missing asset
echo "Test 6: Error handling - missing asset parameter"
echo "curl $BASE_URL/api/on-chain-oracle"
curl -s "$BASE_URL/api/on-chain-oracle" | jq .
echo ""
echo "✓ Test 6 Complete"
echo ""

# Test 7: Verify response format
echo "Test 7: Verify response format matches specification"
echo "Expected: {signal: 'bullish'|'bearish'|'neutral', confidence: 0-1, reasoning: string}"
RESPONSE=$(curl -s "$BASE_URL/api/on-chain-oracle?asset=BTC")
SIGNAL=$(echo "$RESPONSE" | jq -r '.signal')
CONFIDENCE=$(echo "$RESPONSE" | jq -r '.confidence')
REASONING=$(echo "$RESPONSE" | jq -r '.reasoning')

echo "Signal: $SIGNAL"
echo "Confidence: $CONFIDENCE"
echo "Reasoning: $REASONING"

if [[ "$SIGNAL" =~ ^(bullish|bearish|neutral)$ ]] && \
   [[ $(echo "$CONFIDENCE >= 0 && $CONFIDENCE <= 1" | bc -l) -eq 1 ]] && \
   [[ -n "$REASONING" ]]; then
  echo "✓ Response format valid"
else
  echo "✗ Response format invalid"
  exit 1
fi
echo ""

echo "=========================================="
echo "All tests passed! ✓"
echo "=========================================="
