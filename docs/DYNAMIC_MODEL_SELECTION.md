# Dynamic Model Selection Guide

**CVAULT-236** | Orchestrator Infrastructure Enhancement

## Overview

The Consensus Vault orchestrator now supports **dynamic model selection**, enabling runtime switching between different LLM providers (Claude, DeepSeek, GPT-4, etc.) without code changes. This feature enables:

- **Cost Optimization**: Automatically select the most cost-effective model for your needs
- **Token Crisis Management**: Graceful fallback when quota limits are reached
- **A/B Testing**: Compare different models side-by-side
- **Runtime Configuration**: Change models without redeploying
- **Single Model Mode**: Force use of a specific model for testing or debugging

## Quick Start

### 1. Environment Variable Configuration (Simplest)

Override any model setting using environment variables:

```bash
# Disable a model
MODEL_DEEPSEEK_ENABLED=false

# Change model version
MODEL_DEEPSEEK_MODEL=deepseek-chat-v2

# Change endpoint
MODEL_DEEPSEEK_BASE_URL=https://custom.endpoint.com/v1

# Set priority for cost optimization
MODEL_DEEPSEEK_PRIORITY=secondary

# Adjust timeout
MODEL_DEEPSEEK_TIMEOUT=45000
```

### 2. Configuration File (Advanced)

Create `model-config.json` in your project root:

```bash
cp model-config.example.json model-config.json
# Edit model-config.json with your settings
```

## Configuration Sources (Priority Order)

The orchestrator loads configuration from multiple sources, merged in this priority order:

1. **ORCHESTRATOR_MODEL** (highest priority) - Single model override
2. **CONSENSUS_AI_MODELS** - Multi-model selection
3. **MODEL_<MODEL_ID>_* env vars** - Per-model overrides
4. **Configuration File** (`model-config.json`)
5. **Default Configuration** (`src/lib/models.ts`)

## Environment Variable Reference

### ORCHESTRATOR_MODEL - Single Model Override (Highest Priority)

Use `ORCHESTRATOR_MODEL` to force the orchestrator to use a single model for all analysis. This overrides `CONSENSUS_AI_MODELS` and any other model selection settings.

**When to use:**
- Testing a specific model's responses
- Debugging issues with a particular provider
- Cost control (using only the cheapest model)
- Single-provider production deployments

**Example:**
```bash
# Force use of only DeepSeek
ORCHESTRATOR_MODEL=deepseek

# Force use of only Gemini
ORCHESTRATOR_MODEL=gemini

# Force use of only Kimi
ORCHESTRATOR_MODEL=kimi
```

**Valid values:** `deepseek`, `kimi`, `minimax`, `glm`, `gemini`

**Note:** When `ORCHESTRATOR_MODEL` is set, the consensus system will use only that one model. The 4/5 consensus threshold doesn't apply in single-model mode.

### CONSENSUS_AI_MODELS - Multi-Model Selection

Use `CONSENSUS_AI_MODELS` to select which models participate in the multi-model consensus.

**Format:** Comma-separated list of model IDs or special keywords

**Examples:**
```bash
# All models (default)
CONSENSUS_AI_MODELS=deepseek,kimi,minimax,glm,gemini

# Just 3 models
CONSENSUS_AI_MODELS=deepseek,kimi,gemini

# Priority range (1-3 = deepseek,kimi,minimax)
CONSENSUS_AI_MODELS=1-3

# All except specific models
CONSENSUS_AI_MODELS=all,-glm,-kimi
```

**Special keywords:**
- `all` or `*` - All enabled models
- `1-N` - Models by priority range (e.g., `1-3`)
- `all,-model1,-model2` - All except excluded models

### MODEL_<MODEL_ID>_<SETTING>=value - Per-Model Overrides

| Setting | Type | Description | Example |
|---------|------|-------------|---------|
| `ENABLED` | boolean | Enable/disable model | `MODEL_DEEPSEEK_ENABLED=true` |
| `BASE_URL` | string | API endpoint URL | `MODEL_DEEPSEEK_BASE_URL=https://api.example.com` |
| `MODEL` | string | Model identifier | `MODEL_DEEPSEEK_MODEL=deepseek-chat-v2` |
| `PRIORITY` | string | Priority level | `MODEL_DEEPSEEK_PRIORITY=secondary` |
| `TIMEOUT` | number | Request timeout (ms) | `MODEL_DEEPSEEK_TIMEOUT=30000` |
| `PROVIDER` | string | API provider type | `MODEL_DEEPSEEK_PROVIDER=openai` |
| `MAX_TOKENS` | number | Context window size | `MODEL_DEEPSEEK_MAX_TOKENS=32000` |
| `COST_PER_TOKEN` | number | Cost per 1K tokens | `MODEL_DEEPSEEK_COST_PER_TOKEN=0.0001` |
| `REGION` | string | Geographic region | `MODEL_DEEPSEEK_REGION=us-east-1` |

### Available Model IDs

- `deepseek` - Momentum Hunter (Technical Analysis)
- `kimi` - Whale Watcher (Large Holder Movements)
- `minimax` - Sentiment Scout (Social Sentiment)
- `glm` - On-Chain Oracle (On-Chain Metrics)
- `gemini` - Risk Manager (Risk Assessment)

## Configuration File Structure

```json
{
  "version": "1.0.0",
  "defaultProvider": "openai",
  "models": {
    "deepseek": {
      "id": "deepseek",
      "name": "Momentum Hunter",
      "role": "Technical Analysis & Trend Detection",
      "baseUrl": "https://api.deepseek.com/v1",
      "apiKeyEnv": "DEEPSEEK_API_KEY",
      "model": "deepseek-chat",
      "provider": "openai",
      "timeout": 30000,
      "priority": "primary",
      "costPerToken": 0.00014,
      "maxTokens": 16000,
      "enabled": true,
      "systemPrompt": "..."
    }
  },
  "fallbackChains": {
    "deepseek": ["minimax", "glm", "kimi", "gemini"]
  }
}
```

### Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique model identifier |
| `name` | string | Yes | Display name |
| `role` | string | Yes | Analyst role description |
| `baseUrl` | string | Yes | API endpoint URL |
| `apiKeyEnv` | string | Yes | Environment variable name for API key |
| `model` | string | Yes | Model identifier |
| `provider` | string | Yes | Provider type: `openai`, `anthropic`, `google`, `custom` |
| `timeout` | number | Yes | Request timeout in milliseconds (1000-300000) |
| `priority` | string | No | Priority level: `primary`, `secondary`, `fallback`, `emergency` |
| `costPerToken` | number | No | Cost per 1K tokens (for optimization) |
| `maxTokens` | number | No | Maximum context window size |
| `enabled` | boolean | No | Whether model is enabled (default: true) |
| `region` | string | No | Geographic region for deployment |
| `systemPrompt` | string | Yes | System prompt for the model |

## Priority Levels

Models can be assigned priority levels for automatic selection during token crises:

| Priority | Description | Use Case |
|----------|-------------|----------|
| `primary` | First choice | Default models for normal operation |
| `secondary` | Backup options | Used when primary models are unavailable |
| `fallback` | Emergency backup | Used when primary/secondary are down |
| `emergency` | Last resort | High-cost or premium models for critical operations |

## Cost Optimization

The orchestrator can automatically select the most cost-effective model based on:

1. **Priority Level**: Prefers `primary` > `secondary` > `fallback` > `emergency`
2. **Cost Per Token**: Within same priority, selects lowest cost
3. **Availability**: Excludes models without API keys or disabled models

Example usage:

```typescript
import { getBestAvailableModel } from '@/lib/model-factory';

// Get best available model (excludes failed models)
const bestModel = getBestAvailableModel(['deepseek']); // Skip deepseek if it failed

// Use the model for analysis
const result = await callModel(bestModel, asset, context);
```

## Runtime Model Switching

### Disable a Model Temporarily

```bash
# Via environment variable
export MODEL_MINIMAX_ENABLED=false
# Restart server

# Or via API (if implemented)
POST /api/admin/models/minimax/disable
```

### Change Model Priority

```bash
# Promote a model to primary during token crisis
export MODEL_GEMINI_PRIORITY=primary
# Restart server
```

### Switch Model Version

```bash
# Upgrade to newer model version
export MODEL_DEEPSEEK_MODEL=deepseek-chat-v2
# Restart server
```

## Fallback Chains

When a model fails, the orchestrator tries alternative models in order:

```json
{
  "fallbackChains": {
    "deepseek": ["minimax", "glm", "kimi", "gemini"]
  }
}
```

**Fallback Logic:**
1. Primary model fails
2. Try first fallback (`minimax`)
3. If that fails, try next fallback (`glm`)
4. Continue until success or all models exhausted

## Adding New Models

### Via Configuration File

Add to `model-config.json`:

```json
{
  "models": {
    "claude-opus": {
      "id": "claude-opus",
      "name": "Claude Opus",
      "role": "Advanced Analysis",
      "baseUrl": "https://api.anthropic.com/v1",
      "apiKeyEnv": "ANTHROPIC_API_KEY",
      "model": "claude-3-opus-20240229",
      "provider": "anthropic",
      "timeout": 60000,
      "priority": "emergency",
      "costPerToken": 0.015,
      "enabled": false,
      "systemPrompt": "You are an advanced AI analyst..."
    }
  }
}
```

### Via Environment Variables

```bash
export MODEL_CLAUDE_OPUS_ENABLED=true
export MODEL_CLAUDE_OPUS_BASE_URL=https://api.anthropic.com/v1
export MODEL_CLAUDE_OPUS_MODEL=claude-3-opus-20240229
export MODEL_CLAUDE_OPUS_PROVIDER=anthropic
export MODEL_CLAUDE_OPUS_PRIORITY=emergency
export ANTHROPIC_API_KEY=your_key_here
```

## Validation

The model factory validates all configurations:

```typescript
import { validateModelConfigs } from '@/lib/model-factory';

const { valid, modelErrors } = validateModelConfigs();

if (!valid) {
  console.error('Configuration errors:', modelErrors);
  // {
  //   "deepseek": ["Invalid timeout: must be between 1000 and 300000"],
  //   "gemini": ["Invalid baseUrl: https://invalid.url"]
  // }
}
```

## Monitoring & Statistics

Get statistics about configured models:

```typescript
import { getModelStatistics } from '@/lib/model-factory';

const stats = getModelStatistics();
console.log(stats);
// {
//   totalModels: 7,
//   enabledModels: 5,
//   modelsByProvider: { openai: 3, anthropic: 2, google: 2 },
//   modelsByPriority: { primary: 2, secondary: 2, fallback: 1, emergency: 2 }
// }
```

## API Key Management

### Required Environment Variables

```bash
# Primary Models
DEEPSEEK_API_KEY=your_deepseek_key
KIMI_API_KEY=your_kimi_key
MINIMAX_API_KEY=your_minimax_key
GLM_API_KEY=your_glm_key
GEMINI_API_KEY=your_gemini_key

# Optional Models
ANTHROPIC_API_KEY=your_anthropic_key  # For Claude
OPENAI_API_KEY=your_openai_key        # For GPT-4
```

### Proxy Mode

When using the AI proxy service, set:

```bash
PROXY_ENABLED=true
# Proxy manages API keys automatically
```

## Use Cases

### 1. Cost Optimization

Configure cheaper models as primary, expensive as emergency:

```json
{
  "deepseek": { "priority": "primary", "costPerToken": 0.00014 },
  "gpt4": { "priority": "emergency", "costPerToken": 0.01 }
}
```

### 2. Token Crisis Management

When hitting quota limits, disable the affected model:

```bash
# DeepSeek quota exhausted
MODEL_DEEPSEEK_ENABLED=false
# System automatically falls back to other models
```

### 3. A/B Testing

Compare models by enabling/disabling:

```bash
# Test with DeepSeek only
MODEL_MINIMAX_ENABLED=false
MODEL_GLM_ENABLED=false
MODEL_KIMI_ENABLED=false
MODEL_GEMINI_ENABLED=false
```

### 4. Regional Deployment

Route to regional endpoints:

```bash
MODEL_DEEPSEEK_REGION=eu-central-1
MODEL_DEEPSEEK_BASE_URL=https://eu.api.deepseek.com/v1
```

## Troubleshooting

### Model Not Loading

```bash
# Check configuration is valid
curl http://localhost:3000/api/health/models

# Validate config file
cat model-config.json | jq .
```

### API Key Missing

```bash
# Verify environment variable is set
echo $DEEPSEEK_API_KEY

# Check in Node.js console
process.env.DEEPSEEK_API_KEY
```

### Model Always Failing

```bash
# Check if model is disabled
MODEL_DEEPSEEK_ENABLED  # Should be "true" or "1"

# Check timeout is reasonable
MODEL_DEEPSEEK_TIMEOUT  # Should be >= 5000 (ms)

# Verify endpoint is reachable
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

## Backward Compatibility

The dynamic model selection is **fully backward compatible**:

- Existing `ANALYST_MODELS` from `models.ts` are loaded as defaults
- If no config file exists, uses defaults
- If no env vars are set, uses defaults
- Existing API routes work unchanged

## Migration Guide

### From Hard-coded Models

**Before:**
```typescript
import { ANALYST_MODELS } from '@/lib/models';
const model = ANALYST_MODELS.find(m => m.id === 'deepseek');
```

**After:**
```typescript
import { getModelConfig } from '@/lib/model-factory';
const model = getModelConfig('deepseek');
```

### Adding Configuration

1. Copy example config:
   ```bash
   cp model-config.example.json model-config.json
   ```

2. Edit with your settings:
   ```bash
   nano model-config.json
   ```

3. Restart server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check

```bash
GET /api/health/models
```

Returns model configuration status and validation results.

### Model Statistics

```bash
GET /api/admin/models/stats
```

Returns usage statistics and performance metrics.

## Configuration Examples

### Development Setup

```bash
# Use only free/cheap models for development
MODEL_MINIMAX_ENABLED=true
MODEL_GEMINI_ENABLED=true
MODEL_DEEPSEEK_ENABLED=false
MODEL_KIMI_ENABLED=false
MODEL_GLM_ENABLED=false
```

### Production Setup

```bash
# Use all models with proper priorities
MODEL_DEEPSEEK_PRIORITY=primary
MODEL_KIMI_PRIORITY=primary
MODEL_MINIMAX_PRIORITY=secondary
MODEL_GLM_PRIORITY=secondary
MODEL_GEMINI_PRIORITY=fallback
```

### Cost-Conscious Setup

```bash
# Use only cheapest models
MODEL_DEEPSEEK_ENABLED=true
MODEL_MINIMAX_ENABLED=true
MODEL_GEMINI_ENABLED=true
MODEL_KIMI_ENABLED=false
MODEL_GLM_ENABLED=false
```

## Best Practices

1. **Always set priorities** - Ensures predictable fallback behavior
2. **Monitor costs** - Set `costPerToken` for all models
3. **Test fallbacks** - Regularly test that fallback chains work
4. **Use environment vars** - For quick changes without redeployment
5. **Document changes** - Keep track of model switches in changelog
6. **Set timeouts** - Prevent hanging requests with appropriate timeouts
7. **Validate configs** - Run validation before deploying to production

## Security Considerations

- **Never commit API keys** to version control
- **Use environment variables** for sensitive data
- **Rotate keys regularly** - Update `apiKeyEnv` references
- **Monitor usage** - Track token usage and costs
- **Implement rate limits** - Prevent abuse and cost overruns

## Support

For issues or questions about dynamic model selection:

1. Check this documentation
2. Review `model-config.example.json`
3. Check logs for configuration errors
4. Run validation: `validateModelConfigs()`
5. Open an issue with tag `CVAULT-236`

## Changelog

### v1.0.0 (CVAULT-236)
- Initial implementation of dynamic model selection
- Environment variable configuration support
- Configuration file support (JSON)
- Factory pattern for model instantiation
- Priority-based model selection
- Cost optimization features
- Validation system
- Backward compatibility with existing models
