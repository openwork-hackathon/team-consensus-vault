#!/usr/bin/env node

/**
 * API Response Time Profiler
 * Profiles all CVAULT API endpoints to identify bottlenecks
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
const TEST_ITERATIONS = 3;

const endpoints = [
  {
    path: '/api/health',
    method: 'GET',
    body: null,
    description: 'Health check endpoint'
  },
  {
    path: '/api/price?asset=BTC',
    method: 'GET',
    body: null,
    description: 'Price endpoint with caching'
  },
  {
    path: '/api/trading/history',
    method: 'GET',
    body: null,
    description: 'Trading history with 5s cache'
  },
  {
    path: '/api/consensus-detailed?asset=BTC',
    method: 'GET',
    body: null,
    description: 'Consensus detailed GET with 60s cache'
  },
  {
    path: '/api/prediction-market/bet',
    method: 'GET',
    body: null,
    description: 'Prediction market pool state'
  }
];

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (endpoint.body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(endpoint.body));
    }

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch {
          parsedData = { raw: data.substring(0, 100) + '...' };
        }

        resolve({
          statusCode: res.statusCode,
          responseTime,
          headers: res.headers,
          data: parsedData,
          cached: res.headers['x-cache-status'] === 'HIT'
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }

    req.end();
  });
}

async function profileEndpoint(endpoint, iteration) {
  try {
    console.log(`\n${endpoint.description} (Iteration ${iteration + 1})`);
    console.log(`  ${endpoint.method} ${endpoint.path}`);
    
    const result = await makeRequest(endpoint);
    
    console.log(`  Status: ${result.statusCode}`);
    console.log(`  Response Time: ${result.responseTime}ms`);
    console.log(`  Cache Status: ${result.headers['x-cache-status'] || 'Not specified'}`);
    console.log(`  Cache-Control: ${result.headers['cache-control'] || 'Not specified'}`);
    
    if (result.data.cached !== undefined) {
      console.log(`  Response cached field: ${result.data.cached}`);
    }
    
    if (result.data.responseTimeMs !== undefined) {
      console.log(`  Response time in JSON: ${result.data.responseTimeMs}ms`);
    }
    
    return {
      endpoint: endpoint.description,
      iteration,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      cacheStatus: result.headers['x-cache-status'] || 'NONE',
      cached: result.cached || false
    };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return {
      endpoint: endpoint.description,
      iteration,
      error: error.message,
      responseTime: null,
      statusCode: null,
      cacheStatus: 'ERROR'
    };
  }
}

async function runProfiling() {
  console.log('='.repeat(80));
  console.log('CVAULT API RESPONSE TIME PROFILER');
  console.log('='.repeat(80));
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Iterations per endpoint: ${TEST_ITERATIONS}`);
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`Profiling: ${endpoint.description}`);
    console.log(`${'='.repeat(40)}`);
    
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      // Add small delay between requests
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const result = await profileEndpoint(endpoint, i);
      results.push(result);
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  
  const summary = {};
  
  for (const result of results) {
    if (!result.error) {
      if (!summary[result.endpoint]) {
        summary[result.endpoint] = {
          responseTimes: [],
          cacheHits: 0,
          totalRequests: 0
        };
      }
      
      summary[result.endpoint].responseTimes.push(result.responseTime);
      summary[result.endpoint].totalRequests++;
      
      if (result.cached || result.cacheStatus === 'HIT') {
        summary[result.endpoint].cacheHits++;
      }
    }
  }
  
  for (const [endpoint, data] of Object.entries(summary)) {
    const avgTime = data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length;
    const minTime = Math.min(...data.responseTimes);
    const maxTime = Math.max(...data.responseTimes);
    const cacheHitRate = (data.cacheHits / data.totalRequests) * 100;
    
    console.log(`\n${endpoint}:`);
    console.log(`  Avg Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min Response Time: ${minTime}ms`);
    console.log(`  Max Response Time: ${maxTime}ms`);
    console.log(`  Cache Hit Rate: ${cacheHitRate.toFixed(1)}% (${data.cacheHits}/${data.totalRequests})`);
    console.log(`  Sample Size: ${data.responseTimes.length} requests`);
  }
  
  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `api_profile_${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: {
      baseUrl: API_BASE_URL,
      iterations: TEST_ITERATIONS
    },
    results,
    summary
  }, null, 2));
  
  console.log(`\nDetailed results saved to: ${filename}`);
}

// Check if server is running
async function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

async function main() {
  console.log('Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('Error: Server is not running on http://localhost:3000');
    console.error('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('Server is running. Starting profiling...');
  await runProfiling();
}

main().catch(console.error);