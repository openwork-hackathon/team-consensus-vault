# Consensus API Endpoint

Multi-model AI consensus system that queries 5 different AI models in parallel and aggregates their responses.

## Endpoint

`POST /api/consensus`

## Description

Accepts any query and sends it to 5 AI models in parallel:
- **DeepSeek** (Momentum Hunter) - Technical analysis specialist
- **Kimi** (Whale Watcher) - Large holder movements specialist
- **MiniMax** (Sentiment Scout) - Social sentiment specialist
- **GLM** (On-Chain Oracle) - On-chain metrics specialist
- **Gemini** (Risk Manager) - Risk assessment specialist

Each model analyzes the query from its area of expertise and provides a response. The system handles timeouts (30s per model) and errors gracefully, returning results from models that succeed even if some fail or timeout.

## Request Format

```json
{
  "query": "Your question here"
}
```

### Parameters

- `query` (required, string): Any question or prompt you want analyzed by the AI models

### Example Requests

```bash
# Crypto investment question
curl -X POST http://localhost:3000/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"query": "Should I invest in Bitcoin right now? What are the risks?"}'

# Generic tech question
curl -X POST http://localhost:3000/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the key factors for building a scalable web app?"}'

# Market analysis
curl -X POST http://localhost:3000/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"query": "Analyze Ethereum'\''s current market position and future outlook"}'
```

## Response Format

```json
{
  "consensus": "Combined summary of all model responses",
  "individual_responses": [
    {
      "model": "deepseek",
      "response": "Model's analysis text",
      "status": "success"
    },
    {
      "model": "kimi",
      "response": "Model's analysis text",
      "status": "success"
    },
    {
      "model": "minimax",
      "response": "Request timed out after 30 seconds",
      "status": "timeout"
    },
    {
      "model": "glm",
      "response": "API error message",
      "status": "error"
    },
    {
      "model": "gemini",
      "response": "Model's analysis text",
      "status": "success"
    }
  ],
  "metadata": {
    "total_time_ms": 2847,
    "models_succeeded": 3
  }
}
```

### Response Fields

- `consensus` (string): Aggregated summary combining insights from all successful model responses
- `individual_responses` (array): Individual results from each model
  - `model` (string): Model identifier (deepseek, kimi, minimax, glm, gemini)
  - `response` (string): The model's analysis or error message
  - `status` (string): One of "success", "timeout", or "error"
- `metadata` (object): Execution metadata
  - `total_time_ms` (number): Total time taken for the entire request in milliseconds
  - `models_succeeded` (number): Count of models that successfully returned results (0-5)

## Error Handling

### 400 Bad Request
Missing or invalid `query` parameter:
```json
{
  "error": "Missing or invalid query parameter"
}
```

### 500 Internal Server Error
Unexpected server error:
```json
{
  "error": "Error message"
}
```

## Timeout & Resilience

- Each model has a **30-second timeout**
- Uses `Promise.allSettled` for parallel execution
- Partial failures are graceful - returns results from successful models
- Consensus generation requires at least 3 successful responses
- If fewer than 3 models succeed, returns an explanatory message

## Implementation Details

### Model Configuration

All 5 models are called with:
- 30-second timeout per model
- Temperature: 0.7
- Max tokens: 500
- Generic system prompts focused on their specialty area

### API Providers

- **DeepSeek, Kimi, MiniMax**: OpenAI-compatible API format
- **GLM**: Anthropic-compatible API format
- **Gemini**: Google Generative AI API format

### Environment Variables Required

```env
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

KIMI_API_KEY=sk-...
KIMI_BASE_URL=https://api.moonshot.cn/v1

MINIMAX_API_KEY=eyJ...
MINIMAX_BASE_URL=https://api.minimax.io/v1

GLM_API_KEY=...
GLM_BASE_URL=https://api.z.ai/api/anthropic/v1

GEMINI_API_KEY=AIza...
```

## Development Mode

When `NODE_ENV=development` and API keys are not configured, the endpoint returns mock data for testing:

```json
{
  "consensus": "Mock consensus summary",
  "individual_responses": [...],
  "metadata": {
    "total_time_ms": 2500,
    "models_succeeded": 5
  }
}
```

## Usage Examples

### Basic Query
```javascript
const response = await fetch('/api/consensus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What are the current trends in AI development?'
  })
});

const data = await response.json();
console.log('Consensus:', data.consensus);
console.log('Succeeded:', data.metadata.models_succeeded, '/ 5');
```

### With Error Handling
```javascript
try {
  const response = await fetch('/api/consensus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Your question' })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();

  // Filter successful responses
  const successful = data.individual_responses.filter(
    r => r.status === 'success'
  );

  console.log(`${successful.length} models responded successfully`);
  successful.forEach(r => {
    console.log(`${r.model}: ${r.response}`);
  });

} catch (error) {
  console.error('Request failed:', error);
}
```

## Performance Characteristics

- **Typical response time**: 2-5 seconds (limited by slowest model up to 30s timeout)
- **Parallel execution**: All 5 models called simultaneously
- **Graceful degradation**: Returns partial results if some models fail
- **Memory efficient**: Streams responses as they arrive (internal optimization)

## See Also

- `/api/momentum-hunter` - DeepSeek technical analysis endpoint
- `/api/whale-watcher` - Kimi whale movement analysis endpoint
- Main consensus frontend at `/`
