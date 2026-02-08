#!/bin/bash

# Test script for GLM On-Chain Oracle API Endpoint
# Tests the /api/glm endpoint

echo "🧪 Testing GLM On-Chain Oracle API Endpoint"
echo "============================================"
echo ""

# Test 1: OPTIONS request (CORS preflight)
echo "Test 1: OPTIONS request (CORS preflight)"
echo "----------------------------------------"
curl -s -X OPTIONS http://localhost:3000/api/glm \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "\nHTTP Status: %{http_code}\n" | head -20
echo ""

# Test 2: GET request without asset parameter (should return 400)
echo "Test 2: GET request without asset parameter (expect 400)"
echo "--------------------------------------------------------"
curl -s http://localhost:3000/api/glm \
  -w "\nHTTP Status: %{http_code}\n" | head -20
echo ""

# Test 3: GET request with asset parameter
echo "Test 3: GET request with asset=BTC"
echo "-----------------------------------"
curl -s "http://localhost:3000/api/glm?asset=BTC" \
  -w "\nHTTP Status: %{http_code}\n" | head -30
echo ""

# Test 4: POST request without body (should return 400)
echo "Test 4: POST request without body (expect 400)"
echo "-----------------------------------------------"
curl -s -X POST http://localhost:3000/api/glm \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" | head -20
echo ""

# Test 5: POST request with invalid JSON (should return 400)
echo "Test 5: POST request with invalid JSON (expect 400)"
echo "----------------------------------------------------"
curl -s -X POST http://localhost:3000/api/glm \
  -H "Content-Type: application/json" \
  -d "invalid json" \
  -w "\nHTTP Status: %{http_code}\n" | head -20
echo ""

# Test 6: POST request with valid body
echo "Test 6: POST request with asset=ETH"
echo "------------------------------------"
curl -s -X POST http://localhost:3000/api/glm \
  -H "Content-Type: application/json" \
  -d '{"asset":"ETH","context":"Test context for on-chain analysis"}' \
  -w "\nHTTP Status: %{http_code}\n" | head -30
echo ""

echo "✅ Test suite completed"
echo ""
echo "Note: For full integration tests, start the Next.js dev server with:"
echo "  npm run dev"
echo ""
