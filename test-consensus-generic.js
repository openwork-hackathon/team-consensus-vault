/**
 * Test script for /api/consensus endpoint (generic query version)
 * Tests the new POST endpoint that accepts any query
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testConsensusAPI() {
  console.log('🧪 Testing /api/consensus endpoint (generic query)...\n');

  // Test 1: Valid query
  console.log('Test 1: Valid query about crypto');
  try {
    const response = await fetch(`${BASE_URL}/api/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Should I invest in Bitcoin right now? What are the risks and opportunities?',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log('- consensus:', typeof data.consensus, data.consensus?.substring(0, 100) + '...');
    console.log('- individual_responses:', Array.isArray(data.individual_responses), data.individual_responses?.length);
    console.log('- metadata.total_time_ms:', data.metadata?.total_time_ms);
    console.log('- metadata.models_succeeded:', data.metadata?.models_succeeded);

    if (data.individual_responses) {
      console.log('\nIndividual model responses:');
      data.individual_responses.forEach((resp) => {
        console.log(`  - ${resp.model}: ${resp.status} (${resp.response.substring(0, 50)}...)`);
      });
    }

    console.log('✅ Test 1 passed\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Generic question (not crypto-related)
  console.log('Test 2: Generic question');
  try {
    const response = await fetch(`${BASE_URL}/api/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What are the best practices for building a scalable web application?',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Models succeeded:', data.metadata?.models_succeeded, '/ 5');
    console.log('Total time:', data.metadata?.total_time_ms, 'ms');
    console.log('✅ Test 2 passed\n');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Missing query parameter
  console.log('Test 3: Missing query parameter (should return 400)');
  try {
    const response = await fetch(`${BASE_URL}/api/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Error:', data.error);

    if (response.status === 400) {
      console.log('✅ Test 3 passed\n');
    } else {
      console.log('❌ Test 3 failed: Expected 400 status\n');
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test 4: Invalid query type
  console.log('Test 4: Invalid query type (should return 400)');
  try {
    const response = await fetch(`${BASE_URL}/api/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 123 }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Error:', data.error);

    if (response.status === 400) {
      console.log('✅ Test 4 passed\n');
    } else {
      console.log('❌ Test 4 failed: Expected 400 status\n');
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  // Test 5: Verify response structure matches spec
  console.log('Test 5: Validate response structure matches specification');
  try {
    const response = await fetch(`${BASE_URL}/api/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Is Ethereum a good investment?',
      }),
    });

    const data = await response.json();

    // Check required fields
    const hasConsensus = typeof data.consensus === 'string';
    const hasResponses = Array.isArray(data.individual_responses);
    const hasMetadata = data.metadata && typeof data.metadata === 'object';
    const hasTimeMs = typeof data.metadata?.total_time_ms === 'number';
    const hasSuccessCount = typeof data.metadata?.models_succeeded === 'number';

    // Check individual response structure
    const responsesValid = data.individual_responses?.every((r) => {
      return (
        typeof r.model === 'string' &&
        typeof r.response === 'string' &&
        ['success', 'timeout', 'error'].includes(r.status)
      );
    });

    console.log('Structure validation:');
    console.log('- consensus (string):', hasConsensus ? '✅' : '❌');
    console.log('- individual_responses (array):', hasResponses ? '✅' : '❌');
    console.log('- metadata (object):', hasMetadata ? '✅' : '❌');
    console.log('- metadata.total_time_ms (number):', hasTimeMs ? '✅' : '❌');
    console.log('- metadata.models_succeeded (number):', hasSuccessCount ? '✅' : '❌');
    console.log('- individual_responses structure:', responsesValid ? '✅' : '❌');

    if (
      hasConsensus &&
      hasResponses &&
      hasMetadata &&
      hasTimeMs &&
      hasSuccessCount &&
      responsesValid
    ) {
      console.log('✅ Test 5 passed\n');
    } else {
      console.log('❌ Test 5 failed: Response structure invalid\n');
    }
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('🎉 Test suite complete!');
}

// Run tests
testConsensusAPI().catch(console.error);
