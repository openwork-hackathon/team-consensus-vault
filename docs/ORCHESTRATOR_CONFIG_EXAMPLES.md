# Orchestrator Configuration Examples

This document provides example configurations for common use cases.

## Example 1: Maximum Cost Savings (Default)

**Use case**: Save Claude tokens by using external models for routine work

```json
{
  "cto_model": "deepseek",
  "model_selection_strategy": "cost_aware",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": true, "has_tools": true },
      "minimax": { "enabled": true, "has_tools": true },
      "kimi": { "enabled": true, "has_tools": false },
      "glm": { "enabled": true, "has_tools": false }
    }
  },
  "cost_optimization": {
    "enabled": true,
    "prefer_external_for_routine": true,
    "preserve_claude_tokens": true
  }
}
```

**Environment**:
```bash
export CTO_MODEL=deepseek
```

**Result**: DeepSeek CTO classifies tasks, external models handle simple/moderate work, Claude handles complex tasks only.

---

## Example 2: Claude-Only (High Quality)

**Use case**: Maximum quality, no external models, cost is not a concern

```json
{
  "cto_model": "opus",
  "model_selection_strategy": "quality",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": false },
      "minimax": { "enabled": false },
      "kimi": { "enabled": false },
      "glm": { "enabled": false }
    }
  },
  "cost_optimization": {
    "enabled": false
  }
}
```

**Environment**:
```bash
export CTO_MODEL=opus
```

**Result**: Opus CTO makes all decisions, Claude models handle all work, no external models used.

---

## Example 3: Balanced Approach

**Use case**: Use external models for research, Claude for coding

```json
{
  "cto_model": "sonnet",
  "model_selection_strategy": "balanced",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": false },
      "minimax": { "enabled": false },
      "kimi": { "enabled": true, "has_tools": false },
      "glm": { "enabled": true, "has_tools": false }
    }
  },
  "cost_optimization": {
    "enabled": true,
    "prefer_external_for_routine": false
  }
}
```

**Result**: Claude handles all coding, Kimi/GLM handle research tasks only.

---

## Example 4: DeepSeek-First Strategy

**Use case**: Prefer DeepSeek for all non-critical work

```json
{
  "cto_model": "deepseek",
  "model_selection_strategy": "cost_aware",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": true, "has_tools": true },
      "minimax": { "enabled": false },
      "kimi": { "enabled": false },
      "glm": { "enabled": false }
    }
  },
  "fallback_chain": {
    "deepseek": ["sonnet", "opus"],
    "haiku": ["deepseek", "sonnet"],
    "sonnet": ["opus"]
  },
  "cost_optimization": {
    "enabled": true,
    "prefer_external_for_routine": true
  }
}
```

**Result**: DeepSeek handles most work, Claude as fallback and for complex tasks.

---

## Example 5: Development/Testing

**Use case**: Test all models equally to gather performance data

```json
{
  "cto_model": "sonnet",
  "model_selection_strategy": "balanced",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": true, "has_tools": true },
      "minimax": { "enabled": true, "has_tools": true },
      "kimi": { "enabled": true, "has_tools": false },
      "glm": { "enabled": true, "has_tools": false }
    }
  },
  "cost_optimization": {
    "enabled": true,
    "prefer_external_for_routine": true
  }
}
```

**Result**: All models enabled, weighted rotation for data collection.

---

## Example 6: Emergency Mode (External APIs Down)

**Use case**: External APIs are down or rate-limited

```bash
# Quick override - no file edit needed
export CTO_MODEL=opus

# Or edit config:
```

```json
{
  "cto_model": "opus",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": false },
      "minimax": { "enabled": false },
      "kimi": { "enabled": false },
      "glm": { "enabled": false }
    }
  },
  "cost_optimization": {
    "enabled": false
  }
}
```

**Result**: All work routed to Claude models only.

---

## Example 7: GPT-4 Integration (Future)

**Use case**: Add OpenAI GPT-4 as an option

```json
{
  "cto_model": "deepseek",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": true, "has_tools": true },
      "gpt-4": { "enabled": true, "has_tools": true },
      "minimax": { "enabled": true, "has_tools": true }
    }
  },
  "provider_endpoints": {
    "gpt-4": {
      "api_url": "https://api.openai.com/v1/chat/completions",
      "model_id": "gpt-4-turbo",
      "config_path": "~/agents/gpt-4/config.json"
    }
  },
  "fallback_chain": {
    "gpt-4": ["sonnet", "opus"]
  }
}
```

**Agent config** (`~/agents/gpt-4/config.json`):
```json
{
  "provider": "openai",
  "api_key": "sk-...",
  "api_url": "https://api.openai.com/v1/chat/completions",
  "model_id": "gpt-4-turbo",
  "supports_tools": true,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

**Result**: GPT-4 available for task assignment alongside other models.

---

## Example 8: Custom Token Budgets

**Use case**: Limit daily token usage per provider

```json
{
  "cto_model": "deepseek",
  "model_selection_strategy": "cost_aware",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": true, "has_tools": true }
    }
  },
  "cost_optimization": {
    "enabled": true,
    "token_budget_per_day": {
      "claude": 50000,
      "external": 2000000
    }
  }
}
```

**Result**: Strict token limits enforced, prevents runaway costs.

---

## Example 9: Minimal Setup (Just DeepSeek)

**Use case**: Simplest possible configuration

```json
{
  "cto_model": "deepseek",
  "worker_models": {
    "external": {
      "deepseek": { "enabled": true, "has_tools": true }
    }
  }
}
```

**Result**: DeepSeek handles everything (CTO and all workers).

---

## Example 10: Research-Only External Models

**Use case**: Use external models only for analysis, not for coding

```json
{
  "cto_model": "sonnet",
  "model_selection_strategy": "balanced",
  "worker_models": {
    "claude": {
      "haiku": { "enabled": true },
      "sonnet": { "enabled": true },
      "opus": { "enabled": true }
    },
    "external": {
      "deepseek": { "enabled": false },
      "minimax": { "enabled": false },
      "kimi": { "enabled": true, "has_tools": false },
      "glm": { "enabled": true, "has_tools": false }
    }
  },
  "cost_optimization": {
    "enabled": true,
    "prefer_external_for_routine": true
  }
}
```

**Result**: Claude handles all coding/system tasks, Kimi/GLM handle research only.

---

## Environment Variable Overrides

All configurations can be overridden at runtime:

```bash
# Quick testing - try different CTO models
export CTO_MODEL=opus       # Use Opus CTO
export CTO_MODEL=sonnet     # Use Sonnet CTO
export CTO_MODEL=deepseek   # Use DeepSeek CTO

# Override provider
export MODEL_PROVIDER=claude

# Custom config location
export ORCHESTRATOR_CONFIG=/path/to/test_config.json
```

Changes take effect immediately - no restart required.

---

## Switching Between Configurations

### Method 1: Environment Variables (Temporary)

```bash
export CTO_MODEL=opus
python3 orchestrator.py
# Opus CTO for this session only
```

### Method 2: Edit Config File (Persistent)

```bash
vim ~/clautonomous/linux/orchestrator_config.json
# Changes persist across sessions
# Next task pickup uses new config
```

### Method 3: Multiple Config Files

```bash
# Development
export ORCHESTRATOR_CONFIG=~/clautonomous/linux/config_dev.json

# Production
export ORCHESTRATOR_CONFIG=~/clautonomous/linux/orchestrator_config.json

# Testing
export ORCHESTRATOR_CONFIG=~/clautonomous/linux/config_test.json
```

---

## Validation

Test any configuration:

```bash
cd ~/clautonomous/linux

# Validate default config
python3 orchestrator_config.py validate

# Validate custom config
ORCHESTRATOR_CONFIG=/path/to/config.json python3 orchestrator_config.py validate

# View current active config
python3 orchestrator_config.py
```

---

## Performance Tuning

Monitor which configuration works best:

```bash
# View performance by model
cat ~/clautonomous/linux/config/model_performance.json | jq '.models'

# Check success rates
cat ~/clautonomous/linux/config/model_performance.json | jq '.models | to_entries[] | {model: .key, success_rate: (.value.success_rate // 0)}'

# Find best model for task type
cat ~/clautonomous/linux/config/model_performance.json | jq '.models.deepseek.task_types'
```

Use this data to tune your configuration for optimal cost/quality balance.

---

## Quick Comparison

| Configuration | CTO Model | Cost | Quality | Best For |
|---------------|-----------|------|---------|----------|
| Maximum Savings | deepseek | $ | ★★★☆ | High-volume routine work |
| Claude-Only | opus | $$$ | ★★★★★ | Critical projects, quality-first |
| Balanced | sonnet | $$ | ★★★★ | Most use cases |
| DeepSeek-First | deepseek | $ | ★★★☆ | Cost-sensitive with Claude fallback |
| Development/Testing | sonnet | $$ | ★★★★ | Data collection, experimentation |
| Research-Only External | sonnet | $$ | ★★★★ | Coding-heavy with cheap research |

---

## See Also

- **Full Guide**: `ORCHESTRATOR_MODEL_SELECTION.md`
- **Quick Start**: `ORCHESTRATOR_MODEL_SELECTION_QUICKSTART.md`
- **Task Summary**: `CVAULT-236-COMPLETION-SUMMARY.md`
