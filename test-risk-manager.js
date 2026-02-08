/**
 * Test suite for Gemini Risk Manager API endpoint
 * Run with: node test-risk-manager.js
 * Requires: npm run dev (in another terminal)
 */

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGetRequest() {
  log('blue', '\n=== Test 1: GET Request ===');

  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/risk-manager?asset=BTC&context=High volatility environment`);
    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (response.status !== 200) {
      log('red', `❌ Expected status 200, got ${response.status}`);
      console.log('Response:', data);
      return { pass: false, responseTime };
    }

    // Validate response structure
    const required = ['asset', 'analyst', 'signal', 'confidence', 'reasoning', 'timestamp'];
    for (const field of required) {
      if (!(field in data)) {
        log('red', `❌ Missing required field: ${field}`);
        return { pass: false, responseTime };
      }
    }

    // Validate analyst structure
    if (!data.analyst.id || !data.analyst.name || !data.analyst.role) {
      log('red', '❌ Invalid analyst structure');
      return { pass: false, responseTime };
    }

    // Validate signal values
    if (!['bullish', 'bearish', 'neutral'].includes(data.signal)) {
      log('red', `❌ Invalid signal value: ${data.signal}`);
      return { pass: false, responseTime };
    }

    // Validate confidence range
    if (data.confidence < 0 || data.confidence > 1) {
      log('red', `❌ Confidence out of range: ${data.confidence}`);
      return { pass: false, responseTime };
    }

    // Check response time target (< 30s)
    if (responseTime > 30000) {
      log('yellow', `⚠️ Response time: ${responseTime}ms (target: < 30s)`);
    } else {
      log('green', `✓ Response time: ${responseTime}ms (within target)`);
    }

    log('green', '✓ GET request successful');
    log('yellow', `  Signal: ${data.signal} (confidence: ${(data.confidence * 100).toFixed(0)}%)`);
    log('yellow', `  Reasoning: ${data.reasoning.substring(0, 80)}...`);
    return { pass: true, responseTime };
  } catch (error) {
    log('red', `❌ GET request failed: ${error.message}`);
    return { pass: false, responseTime: 0 };
  }
}

async function testPostRequest() {
  log('blue', '\n=== Test 2: POST Request ===');

  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/risk-manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'ETH',
        context: 'Analyze risk factors during market uncertainty'
      })
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (response.status !== 200) {
      log('red', `❌ Expected status 200, got ${response.status}`);
      console.log('Response:', data);
      return { pass: false, responseTime };
    }

    // Basic validation
    if (!data.signal || data.confidence === undefined || !data.reasoning) {
      log('red', '❌ Invalid response structure');
      return { pass: false, responseTime };
    }

    // Check analyst ID
    if (data.analyst.id !== 'gemini') {
      log('red', `❌ Wrong analyst ID: ${data.analyst.id}`);
      return { pass: false, responseTime };
    }

    // Check response time target
    if (responseTime > 30000) {
      log('yellow', `⚠️ Response time: ${responseTime}ms (target: < 30s)`);
    } else {
      log('green', `✓ Response time: ${responseTime}ms (within target)`);
    }

    log('green', '✓ POST request successful');
    log('yellow', `  Asset: ${data.asset}`);
    log('yellow', `  Signal: ${data.signal} (confidence: ${(data.confidence * 100).toFixed(0)}%)`);
    return { pass: true, responseTime };
  } catch (error) {
    log('red', `❌ POST request failed: ${error.message}`);
    return { pass: false, responseTime: 0 };
  }
}

async function testMissingAsset() {
  log('blue', '\n=== Test 3: Missing Asset Parameter ===');

  try {
    const response = await fetch(`${BASE_URL}/api/risk-manager`);
    const data = await response.json();

    if (response.status !== 400) {
      log('red', `❌ Expected status 400, got ${response.status}`);
      return { pass: false };
    }

    if (!data.error || !data.error.includes('asset')) {
      log('red', '❌ Missing proper error message');
      return { pass: false };
    }

    log('green', '✓ Missing asset error handled correctly');
    return { pass: true };
  } catch (error) {
    log('red', `❌ Error handling test failed: ${error.message}`);
    return { pass: false };
  }
}

async function testInvalidJson() {
  log('blue', '\n=== Test 4: Invalid JSON ===');

  try {
    const response = await fetch(`${BASE_URL}/api/risk-manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{'
    });

    const data = await response.json();

    if (response.status !== 400) {
      log('red', `❌ Expected status 400, got ${response.status}`);
      return { pass: false };
    }

    log('green', '✓ Invalid JSON handled correctly');
    return { pass: true };
  } catch (error) {
    log('red', `❌ Invalid JSON test failed: ${error.message}`);
    return { pass: false };
  }
}

async function testRiskSpecific() {
  log('blue', '\n=== Test 5: Risk-Specific Analysis ===');

  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/risk-manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'SOL',
        context: 'High funding rates and elevated volatility detected. Analyze risk exposure and portfolio considerations.'
      })
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (response.status !== 200) {
      log('red', `❌ Expected status 200, got ${response.status}`);
      console.log('Response:', data);
      return { pass: false, responseTime };
    }

    // Validate risk manager specific response
    if (!data.reasoning || data.reasoning.length < 20) {
      log('red', '❌ Reasoning too short for risk analysis');
      return { pass: false, responseTime };
    }

    // Check if reasoning mentions risk-related terms
    const riskKeywords = ['risk', 'volatility', 'correlation', 'liquidation', 'funding', 'exposure'];
    const hasRiskContent = riskKeywords.some(keyword => 
      data.reasoning.toLowerCase().includes(keyword)
    );

    if (!hasRiskContent) {
      log('yellow', '⚠️ Risk-specific reasoning could be more detailed');
    }

    log('green', '✓ Risk-specific request successful');
    log('yellow', `  Asset: ${data.asset}`);
    log('yellow', `  Reasoning: ${data.reasoning}`);
    
    if (responseTime > 30000) {
      log('yellow', `⚠️ Response time: ${responseTime}ms (target: < 30s)`);
    } else {
      log('green', `✓ Response time: ${responseTime}ms (within target)`);
    }
    
    return { pass: true, responseTime };
  } catch (error) {
    log('red', `❌ Risk-specific test failed: ${error.message}`);
    return { pass: false, responseTime: 0 };
  }
}

async function runAllTests() {
  log('blue', '\n╔════════════════════════════════════════════════╗');
  log('blue', '║  Gemini Risk Manager API Test Suite           ║');
  log('blue', '╚════════════════════════════════════════════════╝');

  const tests = [
    { name: 'GET Request', fn: testGetRequest },
    { name: 'POST Request', fn: testPostRequest },
    { name: 'Missing Asset', fn: testMissingAsset },
    { name: 'Invalid JSON', fn: testInvalidJson },
    { name: 'Risk-Specific Analysis', fn: testRiskSpecific },
  ];

  let passed = 0;
  let failed = 0;
  let totalResponseTime = 0;
  let successfulTests = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result.pass) {
      passed++;
      totalResponseTime += result.responseTime || 0;
      successfulTests++;
    } else {
      failed++;
    }
  }

  log('blue', '\n╔════════════════════════════════════════════════╗');
  log('blue', '║  Test Results                                  ║');
  log('blue', '╚════════════════════════════════════════════════╝');
  log('green', `  ✓ Passed: ${passed}`);
  if (failed > 0) {
    log('red', `  ✗ Failed: ${failed}`);
  }
  log('blue', `  Total:  ${passed + failed}`);

  if (successfulTests > 0) {
    const avgResponseTime = Math.round(totalResponseTime / successfulTests);
    log('blue', `  Avg Response Time: ${avgResponseTime}ms`);
  }

  if (failed === 0) {
    log('green', '\n🎉 All tests passed!');
  } else {
    log('red', '\n⚠️  Some tests failed. Please review the output above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log('red', `\n❌ Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});