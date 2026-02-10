/**
 * Comprehensive API Testing Script
 * Tests all API endpoints and records response times and status
 */

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  responsePreview?: any;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const results: TestResult[] = [];

async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    const status = response.status;

    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType?.includes('text/')) {
      responseData = await response.text();
    } else {
      responseData = `[${contentType || 'unknown content type'}]`;
    }

    const result: TestResult = {
      endpoint,
      method,
      status,
      responseTime,
      success: status >= 200 && status < 300,
      responsePreview: typeof responseData === 'string'
        ? responseData.substring(0, 200)
        : responseData,
    };

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      method,
      status: 0,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Comprehensive API Tests...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Health & Status
  console.log('📊 Testing Health & Status Endpoints...');
  results.push(await testEndpoint('/api/health'));

  // Price & Market Data
  console.log('💰 Testing Price & Market Data...');
  results.push(await testEndpoint('/api/price'));
  results.push(await testEndpoint('/api/market-data'));

  // Consensus Endpoints
  console.log('🤝 Testing Consensus Endpoints...');
  results.push(await testEndpoint('/api/consensus'));
  results.push(await testEndpoint('/api/consensus-detailed'));
  results.push(await testEndpoint('/api/consensus-enhanced'));

  // AI Council
  console.log('🧠 Testing AI Council...');
  results.push(await testEndpoint('/api/council/evaluate', 'POST', {
    question: 'Test question',
    options: ['Option A', 'Option B'],
  }));

  // Chatroom Endpoints
  console.log('💬 Testing Chatroom APIs...');
  results.push(await testEndpoint('/api/chatroom/history'));
  results.push(await testEndpoint('/api/chatroom/consensus-snapshots'));
  // Note: /api/chatroom/stream is SSE, tested separately

  // Human Chat
  console.log('👤 Testing Human Chat...');
  results.push(await testEndpoint('/api/human-chat/post', 'POST', {
    message: 'Test message',
    username: 'TestUser',
  }));

  // Trading Endpoints
  console.log('📈 Testing Trading APIs...');
  results.push(await testEndpoint('/api/trading/history'));

  // Prediction Market
  console.log('🎯 Testing Prediction Market...');
  results.push(await testEndpoint('/api/prediction-market/bet', 'POST', {
    prediction: 'Test prediction',
    amount: 10,
  }));

  // Cron Jobs (these might fail if not properly configured, which is expected)
  console.log('⏰ Testing Cron Job Endpoints...');
  results.push(await testEndpoint('/api/cron/stale-trades'));
  results.push(await testEndpoint('/api/cron/cleanup-rolling-history'));

  // Print Results
  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  // Detailed Results
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.status || 'ERR';
    const time = `${result.responseTime}ms`;

    console.log(`${icon} [${status}] ${result.method} ${result.endpoint} (${time})`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (!result.success && result.responsePreview) {
      console.log(`   Response: ${JSON.stringify(result.responsePreview).substring(0, 100)}`);
    }
  });

  // Performance Statistics
  console.log('\n' + '='.repeat(80));
  console.log('⚡ PERFORMANCE STATISTICS');
  console.log('='.repeat(80) + '\n');

  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    const times = successfulTests.map(r => r.responseTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`Average Response Time: ${avgTime.toFixed(0)}ms`);
    console.log(`Fastest Response: ${minTime}ms`);
    console.log(`Slowest Response: ${maxTime}ms`);
  }

  // Known Issues
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  KNOWN ISSUES');
  console.log('='.repeat(80) + '\n');

  const minimaxFailures = results.filter(r =>
    !r.success && r.error?.includes('MiniMax')
  );

  if (minimaxFailures.length > 0) {
    console.log('• MiniMax API key is expired/invalid (401 errors expected)');
  }

  console.log('• SSE streaming endpoints (/stream) require separate testing');
  console.log('• Some endpoints may require authentication or specific state\n');

  return results;
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      const exitCode = results.some(r => !r.success && !r.error?.includes('MiniMax')) ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { runTests, testEndpoint };
