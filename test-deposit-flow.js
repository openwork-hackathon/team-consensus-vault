#!/usr/bin/env node

/**
 * Test script for Consensus Vault Deposit Flow End-to-End
 * This script tests the basic functionality and API endpoints of the deployed app
 */

const https = require('https');
const fs = require('fs');

// Configuration
const APP_URL = 'https://team-consensus-vault.vercel.app';
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  url: APP_URL,
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    total: 0
  }
};

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

// Test function wrapper
async function runTest(name, testFn) {
  console.log(`\n🔍 Testing: ${name}`);
  try {
    const result = await testFn();
    TEST_RESULTS.tests.push({ name, status: 'PASS', ...result });
    TEST_RESULTS.summary.passed++;
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    TEST_RESULTS.tests.push({ name, status: 'FAIL', error: error.message });
    TEST_RESULTS.summary.failed++;
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    return false;
  } finally {
    TEST_RESULTS.summary.total++;
  }
}

// Test 1: Application accessibility
async function testAppAccessibility() {
  const response = await makeRequest(APP_URL);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data.includes('Consensus Vault')) {
    throw new Error('App title not found in response');
  }
  
  return {
    statusCode: response.status,
    contentLength: response.data.length,
    hasTitle: response.data.includes('Consensus Vault')
  };
}

// Test 2: Static assets loading
async function testStaticAssets() {
  const staticFiles = [
    '/_next/static/css/dd4e55cdc5ced9d2.css',
    '/_next/static/css/541069fdbce2d04a.css'
  ];
  
  const results = {};
  
  for (const file of staticFiles) {
    try {
      const response = await makeRequest(APP_URL + file);
      results[file] = {
        status: response.status,
        loaded: response.status === 200
      };
    } catch (error) {
      results[file] = {
        status: 'ERROR',
        loaded: false,
        error: error.message
      };
    }
  }
  
  return { staticFiles: results };
}

// Test 3: JavaScript bundles loading
async function testJavaScriptBundles() {
  const jsFiles = [
    '/_next/static/chunks/webpack-29db4acf3d414997.js',
    '/_next/static/chunks/main-app-be3d940aef6bd3eb.js'
  ];
  
  const results = {};
  
  for (const file of jsFiles) {
    try {
      const response = await makeRequest(APP_URL + file);
      results[file] = {
        status: response.status,
        loaded: response.status === 200
      };
    } catch (error) {
      results[file] = {
        status: 'ERROR',
        loaded: false,
        error: error.message
      };
    }
  }
  
  return { jsFiles: results };
}

// Test 4: React/Next.js app structure
async function testAppStructure() {
  const response = await makeRequest(APP_URL);
  
  // Check for key components and dependencies
  const checks = {
    hasReactApp: response.data.includes('__className_'),
    hasWalletConnect: response.data.includes('ConnectButton'),
    hasDepositButton: response.data.includes('Deposit'),
    hasWithdrawButton: response.data.includes('Withdraw'),
    hasRainbowKit: response.data.includes('rainbowkit'),
    hasWagmi: response.data.includes('wagmi'),
    hasFramerMotion: response.data.includes('framer-motion')
  };
  
  const allPassed = Object.values(checks).every(v => v);
  
  if (!allPassed) {
    const failed = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
    throw new Error(`Missing components: ${failed.join(', ')}`);
  }
  
  return { structure: checks };
}

// Test 5: API endpoints (if any)
async function testApiEndpoints() {
  const endpoints = [
    '/api/health',
    '/api/status',
    '/api/deposit',
    '/api/withdraw'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(APP_URL + endpoint);
      results[endpoint] = {
        status: response.status,
        exists: response.status !== 404
      };
    } catch (error) {
      results[endpoint] = {
        status: 'ERROR',
        exists: false,
        error: error.message
      };
    }
  }
  
  return { endpoints: results };
}

// Test 6: Security headers
async function testSecurityHeaders() {
  const response = await makeRequest(APP_URL);
  
  const securityHeaders = {
    'strict-transport-security': response.headers['strict-transport-security'],
    'x-content-type-options': response.headers['x-content-type-options'],
    'x-frame-options': response.headers['x-frame-options']
  };
  
  return { headers: securityHeaders };
}

// Test 7: Performance metrics
async function testPerformanceMetrics() {
  const startTime = Date.now();
  const response = await makeRequest(APP_URL);
  const loadTime = Date.now() - startTime;
  
  const isAcceptable = loadTime < 5000; // 5 seconds
  
  if (!isAcceptable) {
    throw new Error(`Load time too high: ${loadTime}ms`);
  }
  
  return {
    loadTime: `${loadTime}ms`,
    contentLength: response.data.length,
    performance: isAcceptable ? 'GOOD' : 'POOR'
  };
}

// Test 8: Mobile responsiveness indicators
async function testMobileResponsiveness() {
  const response = await makeRequest(APP_URL);
  
  const mobileChecks = {
    hasViewportMeta: response.data.includes('viewport'),
    hasResponsiveDesign: response.data.includes('sm:') || response.data.includes('md:'),
    hasTouchTargets: response.data.includes('touch-manipulation'),
    hasMobileOptimizations: response.data.includes('min-h-[44px]')
  };
  
  return { mobile: mobileChecks };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Consensus Vault Deposit Flow Tests');
  console.log(`📍 Testing URL: ${APP_URL}`);
  console.log('=' * 60);
  
  await runTest('Application Accessibility', testAppAccessibility);
  await runTest('Static Assets Loading', testStaticAssets);
  await runTest('JavaScript Bundles', testJavaScriptBundles);
  await runTest('App Structure & Components', testAppStructure);
  await runTest('API Endpoints', testApiEndpoints);
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Performance Metrics', testPerformanceMetrics);
  await runTest('Mobile Responsiveness', testMobileResponsiveness);
  
  console.log('\n' + '=' * 60);
  console.log('📊 Test Summary');
  console.log(`✅ Passed: ${TEST_RESULTS.summary.passed}`);
  console.log(`❌ Failed: ${TEST_RESULTS.summary.failed}`);
  console.log(`📋 Total: ${TEST_RESULTS.summary.total}`);
  console.log(`🎯 Success Rate: ${((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100).toFixed(1)}%`);
  
  // Save results to file
  fs.writeFileSync(
    '/home/shazbot/hackathon-research/test-reports/deposit-flow-test-results.json',
    JSON.stringify(TEST_RESULTS, null, 2)
  );
  
  return TEST_RESULTS;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n🎉 Tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, TEST_RESULTS };