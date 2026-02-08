/**
 * Test script for MiniMax Sentiment Scout API endpoint
 * Tests both GET and POST methods
 */

const BASE_URL = 'http://localhost:3000';

async function testGET() {
  console.log('\n=== Testing GET /api/sentiment-scout ===\n');

  try {
    const url = `${BASE_URL}/api/sentiment-scout?asset=BTC&context=Social media sentiment analysis`;
    console.log(`GET ${url}`);

    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response Time:', responseTime + 'ms');
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ GET test passed');
      
      // Validate structure matches expected schema
      const requiredFields = ['recommendation', 'confidence', 'analysis', 'analyst'];
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        return { pass: false, responseTime };
      }
      
      // Validate recommendation values
      const validRecommendations = ['BUY', 'HOLD', 'SELL'];
      if (!validRecommendations.includes(data.recommendation)) {
        console.log('❌ Invalid recommendation value:', data.recommendation);
        return { pass: false, responseTime };
      }
      
      // Validate confidence range
      if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
        console.log('❌ Invalid confidence value:', data.confidence);
        return { pass: false, responseTime };
      }
      
      // Validate analysis is a string
      if (typeof data.analysis !== 'string' || data.analysis.length === 0) {
        console.log('❌ Invalid analysis field');
        return { pass: false, responseTime };
      }
      
      // Validate analyst name
      if (typeof data.analyst !== 'string' || data.analyst.length === 0) {
        console.log('❌ Invalid analyst field');
        return { pass: false, responseTime };
      }
      
      console.log('✅ Response structure matches expected schema');
      return { pass: true, responseTime };
    } else {
      console.log('❌ GET test failed');
      return { pass: false, responseTime };
    }
  } catch (error) {
    console.error('❌ GET test error:', error.message);
    return { pass: false, responseTime: 0 };
  }
}

async function testPOST() {
  console.log('\n=== Testing POST /api/sentiment-scout ===\n');

  try {
    const url = `${BASE_URL}/api/sentiment-scout`;
    const body = {
      asset: 'ETH',
      context: 'Analyze social media sentiment and news impact'
    };

    console.log(`POST ${url}`);
    console.log('Body:', JSON.stringify(body, null, 2));

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const responseTime = Date.now() - startTime;
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response Time:', responseTime + 'ms');
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ POST test passed');

      // Validate structure matches expected schema
      const requiredFields = ['recommendation', 'confidence', 'analysis', 'analyst'];
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        return { pass: false, responseTime };
      }
      
      // Validate recommendation values
      const validRecommendations = ['BUY', 'HOLD', 'SELL'];
      if (!validRecommendations.includes(data.recommendation)) {
        console.log('❌ Invalid recommendation value:', data.recommendation);
        return { pass: false, responseTime };
      }
      
      // Validate confidence range
      if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
        console.log('❌ Invalid confidence value:', data.confidence);
        return { pass: false, responseTime };
      }
      
      console.log('✅ Response structure matches expected schema');
      return { pass: true, responseTime };
    } else {
      console.log('❌ POST test failed');
      return { pass: false, responseTime };
    }
  } catch (error) {
    console.error('❌ POST test error:', error.message);
    return { pass: false, responseTime: 0 };
  }
}

async function testErrors() {
  console.log('\n=== Testing Error Handling ===\n');

  // Test missing asset parameter
  try {
    console.log('Testing GET without asset parameter...');
    const response = await fetch(`${BASE_URL}/api/sentiment-scout`);
    const data = await response.json();

    if (response.status === 400 && data.error) {
      console.log('✅ Correctly returns 400 for missing asset');
      return { pass: true };
    } else {
      console.log('❌ Did not handle missing asset correctly');
      return { pass: false };
    }
  } catch (error) {
    console.error('❌ Error test failed:', error.message);
    return { pass: false };
  }
}

async function runTests() {
  console.log('📊 MiniMax Sentiment Scout API Tests');
  console.log('=====================================\n');
  console.log('Testing API endpoint: /api/sentiment-scout\n');

  const results = [];
  
  const getResult = await testGET();
  results.push({ test: 'GET Request', ...getResult });
  
  const postResult = await testPOST();
  results.push({ test: 'POST Request', ...postResult });
  
  const errorResult = await testErrors();
  results.push({ test: 'Error Handling', ...errorResult });

  console.log('\n=====================================');
  console.log('Test Summary:');
  console.log('=====================================');
  
  let passed = 0;
  let failed = 0;
  let totalResponseTime = 0;
  let successfulTests = 0;
  
  results.forEach(result => {
    if (result.pass) {
      console.log(`✅ ${result.test}: PASSED${result.responseTime ? ` (${result.responseTime}ms)` : ''}`);
      passed++;
      if (result.responseTime) {
        totalResponseTime += result.responseTime;
        successfulTests++;
      }
    } else {
      console.log(`❌ ${result.test}: FAILED`);
      failed++;
    }
  });
  
  if (successfulTests > 0) {
    const avgResponseTime = Math.round(totalResponseTime / successfulTests);
    console.log(`\n📊 Average Response Time: ${avgResponseTime}ms`);
  }
  
  console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

runTests();