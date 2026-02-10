#!/usr/bin/env node
/**
 * Manual comprehensive regression test
 * Tests all pages and API endpoints
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';
const results = [];

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          duration,
          data: data.substring(0, 500),
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        status: 0,
        duration,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        status: 0,
        duration,
        error: 'Request timeout',
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', body = null) {
  process.stdout.write(`Testing ${name}... `);
  const result = await makeRequest(path, method, body);

  const icon = result.success ? '✅' : '❌';
  const status = result.status || 'ERR';
  console.log(`${icon} [${status}] ${result.duration}ms`);

  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  results.push({
    name,
    path,
    method,
    ...result,
  });

  return result;
}

async function runTests() {
  console.log('═'.repeat(80));
  console.log('🧪 CONSENSUS VAULT - MANUAL REGRESSION TEST');
  console.log('═'.repeat(80));
  console.log('');

  // Test API Endpoints
  console.log('📡 API ENDPOINTS');
  console.log('─'.repeat(80));

  await testEndpoint('Health Check', '/api/health');
  await testEndpoint('Price Data', '/api/price');
  await testEndpoint('Market Data', '/api/market-data');
  await testEndpoint('Consensus Basic', '/api/consensus');
  await testEndpoint('Consensus Detailed', '/api/consensus-detailed');
  await testEndpoint('Consensus Enhanced', '/api/consensus-enhanced');
  await testEndpoint('Chatroom History', '/api/chatroom/history');
  await testEndpoint('Chatroom Snapshots', '/api/chatroom/consensus-snapshots');
  await testEndpoint('Trading History', '/api/trading/history');

  console.log('');

  // Test Pages (HTML)
  console.log('📄 PAGE ROUTES');
  console.log('─'.repeat(80));

  await testEndpoint('Home Page', '/');
  await testEndpoint('Arena Page', '/arena');
  await testEndpoint('Chatroom Page', '/chatroom');
  await testEndpoint('Enhanced Consensus', '/enhanced-consensus');
  await testEndpoint('Human Chat', '/human-chat');
  await testEndpoint('Predict Page', '/predict');
  await testEndpoint('Rounds Page', '/rounds');
  await testEndpoint('Admin Page', '/admin/moderation');

  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`Total Tests:    ${total}`);
  console.log(`✅ Passed:      ${passed}`);
  console.log(`❌ Failed:      ${failed}`);
  console.log(`Success Rate:   ${((passed / total) * 100).toFixed(1)}%`);
  console.log('');

  // Performance stats for successful tests
  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    const times = successfulTests.map(r => r.duration);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log('⚡ PERFORMANCE');
    console.log('─'.repeat(80));
    console.log(`Average Response: ${avgTime.toFixed(0)}ms`);
    console.log(`Fastest:          ${minTime}ms`);
    console.log(`Slowest:          ${maxTime}ms`);
    console.log('');
  }

  // Failed tests detail
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('❌ FAILURES');
    console.log('─'.repeat(80));
    failedTests.forEach(test => {
      console.log(`• ${test.name} (${test.path})`);
      console.log(`  Status: ${test.status}`);
      if (test.error) {
        console.log(`  Error: ${test.error}`);
      }
    });
    console.log('');
  }

  return results;
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await makeRequest('/api/health');
      if (result.success) {
        console.log('✅ Dev server is ready!\n');
        return true;
      }
    } catch (err) {
      // Ignore
    }
    process.stdout.write(`Waiting for dev server... (${i + 1}/${maxAttempts})\r`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n❌ Dev server failed to start');
  return false;
}

(async () => {
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  await runTests();

  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
})();
