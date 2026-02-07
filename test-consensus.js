#!/usr/bin/env node
/**
 * Test script for Consensus Engine API
 * Run with: node test-consensus.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testPostEndpoint() {
  console.log('Testing POST /api/consensus...\n');

  try {
    const response = await fetch(`${API_URL}/api/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'BTC',
        context: 'Current market conditions with recent volatility',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Asset:', data.asset);
    console.log('\nAnalyst Results:');

    for (const analyst of data.analysts) {
      const status = analyst.error ? `ERROR: ${analyst.error}` :
        `${analyst.sentiment.toUpperCase()} (${analyst.confidence}%)`;
      console.log(`  ${analyst.name || analyst.id}: ${status}`);
      if (analyst.reasoning) {
        console.log(`    "${analyst.reasoning}"`);
      }
    }

    console.log('\nConsensus:');
    console.log(`  Signal: ${data.consensus.signal || 'none'}`);
    console.log(`  Level: ${data.consensus.consensusLevel}%`);
    console.log(`  Recommendation: ${data.consensus.recommendation || 'INSUFFICIENT DATA'}`);

    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

async function testSSEEndpoint() {
  console.log('\n\nTesting SSE GET /api/consensus...\n');

  try {
    const response = await fetch(`${API_URL}/api/consensus?asset=ETH`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('Streaming results:');

    const timeout = setTimeout(() => {
      console.log('\n(Timeout - closing stream after 30s)');
      reader.cancel();
    }, 30000);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'connected') {
            console.log(`  Connected - analyzing ${data.asset}`);
          } else if (data.type === 'consensus') {
            console.log(`  CONSENSUS: ${data.recommendation || 'N/A'} (${data.consensusLevel}%)`);
          } else if (data.type === 'complete') {
            console.log('  Analysis complete!');
            clearTimeout(timeout);
            reader.cancel();
            return true;
          } else if (data.type === 'error') {
            console.log(`  ERROR: ${data.message}`);
          } else if (data.id) {
            const status = data.error ? `ERROR` : data.sentiment.toUpperCase();
            console.log(`  ${data.id}: ${status} (${data.confidence}%)`);
          }
        }
      }
    }

    clearTimeout(timeout);
    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Consensus Vault - API Test Suite');
  console.log('='.repeat(60));
  console.log(`Testing against: ${API_URL}`);
  console.log('');

  const postResult = await testPostEndpoint();
  const sseResult = await testSSEEndpoint();

  console.log('\n' + '='.repeat(60));
  console.log('Results:');
  console.log(`  POST endpoint: ${postResult ? 'PASS' : 'FAIL'}`);
  console.log(`  SSE endpoint: ${sseResult ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(60));

  process.exit(postResult && sseResult ? 0 : 1);
}

main();
