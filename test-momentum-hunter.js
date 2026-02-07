/**
 * Test suite for DeepSeek Momentum Hunter API endpoint
 * Run with: node test-momentum-hunter.js
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
    const response = await fetch(`${BASE_URL}/api/momentum-hunter?asset=BTC`);
    const data = await response.json();

    if (response.status !== 200) {
      log('red', `❌ Expected status 200, got ${response.status}`);
      console.log('Response:', data);
      return false;
    }

    // Validate response structure
    const required = ['asset', 'analyst', 'signal', 'confidence', 'reasoning', 'timestamp'];
    for (const field of required) {
      if (!(field in data)) {
        log('red', `❌ Missing required field: ${field}`);
        return false;
      }
    }

    // Validate analyst structure
    if (!data.analyst.id || !data.analyst.name || !data.analyst.role) {
      log('red', '❌ Invalid analyst structure');
      return false;
    }

    // Validate signal values
    if (!['bullish', 'bearish', 'neutral'].includes(data.signal)) {
      log('red', `❌ Invalid signal value: ${data.signal}`);
      return false;
    }

    // Validate confidence range
    if (data.confidence < 0 || data.confidence > 1) {
      log('red', `❌ Confidence out of range: ${data.confidence}`);
      return false;
    }

    log('green', '✓ GET request successful');
    log('yellow', `  Signal: ${data.signal} (confidence: ${(data.confidence * 100).toFixed(0)}%)`);
    log('yellow', `  Reasoning: ${data.reasoning.substring(0, 80)}...`);
    return true;
  } catch (error) {
    log('red', `❌ GET request failed: ${error.message}`);
    return false;
  }
}

async function testPostRequest() {
  log('blue', '\n=== Test 2: POST Request ===');

  try {
    const response = await fetch(`${BASE_URL}/api/momentum-hunter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'ETH',
        context: 'Analyze momentum indicators and trend strength'
      })
    });

    const data = await response.json();

    if (response.status !== 200) {
      log('red', `❌ Expected status 200, got ${response.status}`);
      console.log('Response:', data);
      return false;
    }

    // Basic validation
    if (!data.signal || !data.confidence || !data.reasoning) {
      log('red', '❌ Invalid response structure');
      return false;
    }

    // Check analyst ID
    if (data.analyst.id !== 'deepseek') {
      log('red', `❌ Wrong analyst ID: ${data.analyst.id}`);
      return false;
    }

    log('green', '✓ POST request successful');
    log('yellow', `  Asset: ${data.asset}`);
    log('yellow', `  Signal: ${data.signal} (confidence: ${(data.confidence * 100).toFixed(0)}%)`);
    return true;
  } catch (error) {
    log('red', `❌ POST request failed: ${error.message}`);
    return false;
  }
}

async function testMissingAsset() {
  log('blue', '\n=== Test 3: Missing Asset Parameter ===');

  try {
    const response = await fetch(`${BASE_URL}/api/momentum-hunter`);
    const data = await response.json();

    if (response.status !== 400) {
      log('red', `❌ Expected status 400, got ${response.status}`);
      return false;
    }

    if (!data.error || !data.error.includes('asset')) {
      log('red', '❌ Missing proper error message');
      return false;
    }

    log('green', '✓ Missing asset error handled correctly');
    return true;
  } catch (error) {
    log('red', `❌ Error handling test failed: ${error.message}`);
    return false;
  }
}

async function testInvalidJson() {
  log('blue', '\n=== Test 4: Invalid JSON ===');

  try {
    const response = await fetch(`${BASE_URL}/api/momentum-hunter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{'
    });

    const data = await response.json();

    if (response.status !== 400) {
      log('red', `❌ Expected status 400, got ${response.status}`);
      return false;
    }

    log('green', '✓ Invalid JSON handled correctly');
    return true;
  } catch (error) {
    log('red', `❌ Invalid JSON test failed: ${error.message}`);
    return false;
  }
}

async function testWithContext() {
  log('blue', '\n=== Test 5: Request with Technical Context ===');

  try {
    const response = await fetch(`${BASE_URL}/api/momentum-hunter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'SOL',
        context: 'Check for RSI divergence and MACD crossover signals'
      })
    });

    const data = await response.json();

    if (response.status !== 200) {
      log('red', `❌ Expected status 200, got ${response.status}`);
      console.log('Response:', data);
      return false;
    }

    log('green', '✓ Context-enhanced request successful');
    log('yellow', `  Asset: ${data.asset}`);
    log('yellow', `  Reasoning: ${data.reasoning}`);
    return true;
  } catch (error) {
    log('red', `❌ Context test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('blue', '\n╔════════════════════════════════════════════════╗');
  log('blue', '║  DeepSeek Momentum Hunter API Test Suite      ║');
  log('blue', '╚════════════════════════════════════════════════╝');

  const tests = [
    { name: 'GET Request', fn: testGetRequest },
    { name: 'POST Request', fn: testPostRequest },
    { name: 'Missing Asset', fn: testMissingAsset },
    { name: 'Invalid JSON', fn: testInvalidJson },
    { name: 'With Context', fn: testWithContext },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
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
