import { NextRequest } from 'next/server';

// This is a placeholder for the SSE endpoint
// CVAULT-2 will implement the actual backend logic
export async function GET(request: NextRequest) {
  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Mock streaming responses for development
      const mockAnalysts = [
        {
          id: 'deepseek',
          sentiment: 'bullish',
          confidence: 85,
          reasoning: 'Technical indicators show strong upward momentum. RSI cooling from overbought levels, MACD golden cross confirmed.',
          delay: 1500,
        },
        {
          id: 'kimi',
          sentiment: 'bullish',
          confidence: 78,
          reasoning: 'Macro environment favorable with dovish Fed stance. Institutional accumulation detected on-chain.',
          delay: 2200,
        },
        {
          id: 'minimax',
          sentiment: 'bullish',
          confidence: 82,
          reasoning: 'Social sentiment extremely positive across crypto Twitter and Reddit. Fear & Greed index entering greed zone.',
          delay: 1800,
        },
        {
          id: 'glm',
          sentiment: 'bullish',
          confidence: 91,
          reasoning: 'Break above key resistance at $45k with high volume. Fibonacci extension targets $52k next.',
          delay: 2500,
        },
        {
          id: 'gemini',
          sentiment: 'neutral',
          confidence: 65,
          reasoning: 'While technicals are bullish, regulatory headwinds and high funding rates suggest caution. Risk/reward ratio adequate but not exceptional.',
          delay: 3000,
        },
      ];

      // Send analyst updates with delays
      for (const analyst of mockAnalysts) {
        await new Promise(resolve => setTimeout(resolve, analyst.delay));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(analyst)}\n\n`)
        );
      }

      // Keep connection alive
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
