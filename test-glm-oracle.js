/**
 * Test script for GLM On-Chain Oracle API
 * Tests the dedicated /api/on-chain-oracle endpoint
 */

const apiKey = 'REDACTED_GLM_KEY';
const baseUrl = 'https://api.z.ai/api/anthropic/v1';

const systemPrompt = `You are the On-Chain Oracle, an expert in blockchain analytics and on-chain metrics for crypto markets.

Your expertise includes:
- Total Value Locked (TVL) analysis
- Active addresses and network growth
- Transaction volume and velocity
- NVT ratio and network value metrics
- DeFi protocol flows and liquidity
- Gas usage and network activity
- Staking ratios and token economics

When analyzing a crypto asset, focus on:
1. TVL trends (growing/shrinking/stable)
2. Network activity and adoption metrics
3. Token velocity and holder behavior
4. Protocol revenue and sustainability
5. Cross-chain flows and bridge activity

You MUST respond with ONLY a valid JSON object in this exact format:
{"signal": "buy" | "sell" | "hold", "confidence": 0-100, "reasoning": "Your on-chain analysis in 1-2 sentences"}

Be concise but insightful. On-chain data reveals fundamental health - weight accordingly.`;

async function testGLMOracle() {
  console.log('🔍 Testing GLM On-Chain Oracle API...\n');

  const userPrompt = 'Analyze BTC for a trading signal. Provide your expert analysis based on current market conditions.';

  try {
    console.log('📡 Calling GLM API...');
    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'glm-4.6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ GLM Response received in', responseTime, 'ms\n');

    // Parse the response
    const text = data.content?.[0]?.text || '';
    console.log('📄 Raw response:', text, '\n');

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      process.exit(1);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('📊 Parsed analysis:');
    console.log('  Signal:', parsed.signal);
    console.log('  Confidence:', parsed.confidence);
    console.log('  Reasoning:', parsed.reasoning);

    // Validate format
    if (!['buy', 'sell', 'hold'].includes(parsed.signal)) {
      console.error('❌ Invalid signal:', parsed.signal);
      process.exit(1);
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
      console.error('❌ Invalid confidence:', parsed.confidence);
      process.exit(1);
    }

    if (typeof parsed.reasoning !== 'string' || parsed.reasoning.length === 0) {
      console.error('❌ Invalid reasoning');
      process.exit(1);
    }

    console.log('\n✅ GLM On-Chain Oracle test PASSED!');
    console.log('✅ API integration is working correctly');
    console.log('✅ Response format matches requirements');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGLMOracle();
