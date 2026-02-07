/**
 * Test script for Kimi Whale Watcher API endpoint
 * Tests both GET and POST methods
 */

const BASE_URL = 'http://localhost:3000';

async function testGET() {
  console.log('\n=== Testing GET /api/whale-watcher ===\n');

  try {
    const url = `${BASE_URL}/api/whale-watcher?asset=BTC&context=Recent whale movements`;
    console.log(`GET ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ GET test passed');
      // Validate structure
      if (data.signal && data.confidence !== undefined && data.reasoning) {
        console.log('✅ Response structure is correct');
      } else {
        console.log('❌ Response structure missing required fields');
      }
    } else {
      console.log('❌ GET test failed');
    }
  } catch (error) {
    console.error('❌ GET test error:', error.message);
  }
}

async function testPOST() {
  console.log('\n=== Testing POST /api/whale-watcher ===\n');

  try {
    const url = `${BASE_URL}/api/whale-watcher`;
    const body = {
      asset: 'ETH',
      wallets: ['0x123...', '0x456...'],
      context: 'Analyze recent accumulation patterns'
    };

    console.log(`POST ${url}`);
    console.log('Body:', JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ POST test passed');

      // Validate structure matches task spec
      if (
        data.signal &&
        typeof data.confidence === 'number' &&
        data.confidence >= 0 &&
        data.confidence <= 1 &&
        data.reasoning &&
        typeof data.reasoning === 'string'
      ) {
        console.log('✅ Response structure matches spec: {signal, confidence: 0-1, reasoning}');
      } else {
        console.log('❌ Response structure does not match spec');
      }
    } else {
      console.log('❌ POST test failed');
    }
  } catch (error) {
    console.error('❌ POST test error:', error.message);
  }
}

async function testErrors() {
  console.log('\n=== Testing Error Handling ===\n');

  // Test missing asset parameter
  try {
    console.log('Testing GET without asset parameter...');
    const response = await fetch(`${BASE_URL}/api/whale-watcher`);
    const data = await response.json();

    if (response.status === 400 && data.error) {
      console.log('✅ Correctly returns 400 for missing asset');
    } else {
      console.log('❌ Did not handle missing asset correctly');
    }
  } catch (error) {
    console.error('❌ Error test failed:', error.message);
  }

  // Test invalid POST body
  try {
    console.log('Testing POST with invalid body...');
    const response = await fetch(`${BASE_URL}/api/whale-watcher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' }),
    });
    const data = await response.json();

    if (response.status === 400 && data.error) {
      console.log('✅ Correctly returns 400 for invalid body');
    } else {
      console.log('❌ Did not handle invalid body correctly');
    }
  } catch (error) {
    console.error('❌ Error test failed:', error.message);
  }
}

async function runTests() {
  console.log('🐋 Kimi Whale Watcher API Tests');
  console.log('================================\n');
  console.log('Make sure the dev server is running: npm run dev\n');

  await testGET();
  await testPOST();
  await testErrors();

  console.log('\n================================');
  console.log('Tests complete!');
}

runTests();
