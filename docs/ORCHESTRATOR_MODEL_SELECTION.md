# Orchestrator Dynamic Model Selection

## Overview

The CTO Orchestrator supports dynamic model selection across multiple AI providers (Claude, DeepSeek, GPT-4, MiniMax, Kimi, GLM, Gemini). This system enables cost optimization by routing tasks to the most appropriate model based on complexity, capability, and token availability.

## Current Implementation

### Architecture Components

1. **Configuration System** (`orchestrator_config.py`)
   - Manages model selection via environment variables and config files
   - Supports runtime model switching without restart
   - Provides model capability detection (tool calling, cost, etc.)

2. **Configuration File** (`orchestrator_config.json`)
   - Defines available models and their capabilities
   - Configures fallback chains for model failures
   - Sets provider endpoints and API configurations
   - Enables/disables individual models

3. **Cost-Aware Routing** (`orchestrator.py`)
   - Automatically routes routine tasks to cheaper external models
   - Preserves Claude tokens for complex tasks
   - Gathers performance data across all models
   - Uses weighted random selection to balance data collection

4. **Tool Worker** (`tool_worker.py`)
   - Enables external models to perform system operations
   - Supports OpenAI and Anthropic tool calling formats
   - Provides file operations, command execution, and git integration

## Configuration

### Environment Variables

Configure the CTO model at runtime (no restart required):

```bash
# Set CTO model directly
export CTO_MODEL=deepseek        # Use DeepSeek for CTO
export CTO_MODEL=opus            # Use Claude Opus for CTO
export CTO_MODEL=gpt-4           # Use GPT-4 for CTO

# Or set provider
export MODEL_PROVIDER=claude     # Use Claude models
export MODEL_PROVIDER=openai     # Use OpenAI models

# Custom config file location
export ORCHESTRATOR_CONFIG=/path/to/custom_config.json
```

### Configuration File

Edit `~/clautonomous/linux/orchestrator_config.json`:

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
      "glm": { "enabled": true, "has_tools": false },
      "gemini": { "enabled": false, "has_tools": false }
    }
  },
  "fallback_chain": {
    "haiku": ["sonnet", "opus"],
    "sonnet": ["opus"],
    "deepseek": ["sonnet", "opus"]
  },
  "cost_optimization": {
    "enabled": true,
    "prefer_external_for_routine": true,
    "preserve_claude_tokens": true,
    "token_budget_per_day": {
      "claude": 100000,
      "external": 1000000
    }
  }
}
```

## Model Selection Logic

### Phase 1: CTO Classification

The CTO (configured via `CTO_MODEL` or config file) analyzes each task and selects an appropriate worker model based on:

- **Task complexity**: simple | moderate | complex
- **Task type**: bash_command | coding | research | analysis | email | deployment
- **Model capabilities**: tool calling, context window, cost
- **Historical performance**: success rates by task type

### Phase 2: Cost-Aware Override

If cost optimization is enabled, the orchestrator may override the CTO's choice:

- **Simple/moderate tasks** on Claude models → rerouted to external models
- **Research tasks** → rerouted to cheaper research-only models
- **Complex tasks** on opus → never overridden
- **Email tasks** → never overridden (need AgentMail SDK)
- **Escalations** → never overridden (already escalated)

This creates a weighted rotation that:
- Favors models with less historical data (for balanced data collection)
- Maintains quality by respecting CTO decisions on critical tasks
- Optimizes cost by using cheaper models when appropriate

### Phase 3: Worker Execution

Workers are routed to the appropriate execution engine:

1. **Claude models** (haiku, sonnet, opus): Full Claude Code sessions via CLI
2. **Tool-capable external models** (deepseek, minimax): OpenAI-compatible tool calling
3. **Research-only models** (kimi, glm): Text-in/text-out via API

### Phase 4: Escalation on Failure

If a worker fails, the task is automatically escalated:

- **haiku** → sonnet → opus
- **external models** → sonnet → opus
- **After 3 failures** → task marked as blocked

## Model Capabilities

### Claude Models

| Model | Provider | Tool Calling | Use Cases |
|-------|----------|--------------|-----------|
| haiku | Anthropic | ✅ Full system access | Simple tasks, bash commands, file operations |
| sonnet | Anthropic | ✅ Full system access | Coding, debugging, documentation |
| opus | Anthropic | ✅ Full system access | Architecture, planning, security, complex tasks |

### External Models with Tool Calling

| Model | Provider | Tool Calling | Use Cases |
|-------|----------|--------------|-----------|
| deepseek | DeepSeek | ✅ OpenAI format | Coding, debugging, system tasks (cheaper than Claude) |
| minimax | MiniMax | ✅ OpenAI format | General purpose, configuration, testing |

### Research-Only Models

| Model | Provider | Tool Calling | Use Cases |
|-------|----------|--------------|-----------|
| kimi | Moonshot | ❌ Text only | Research, analysis, brainstorming |
| glm | Zhipu AI | ❌ Text only | Analysis, explanations |
| gemini | Google | ❌ Text only | (Disabled by default) |

## Tool Calling Support

External models with tool calling support can:

- **read_file**: Read any file under `~/`
- **write_file**: Write files under `~/` (excluding system paths and credentials)
- **edit_file**: Find-and-replace edits within existing files
- **run_command**: Execute shell commands (with safety checks)
- **list_directory**: List directory contents
- **get_current_directory**: Get working directory

Safety features:
- Blocked system paths: `/etc/`, `/usr/`, `/var/`, `/boot/`, etc.
- Blocked credentials directory: `~/credentials/`
- Dangerous command detection: `rm -rf /`, `mkfs`, `--force-push`, etc.
- Git authorship injection: Automatic attribution to model identity
- Timeouts: 120s default, 300s maximum

## Provider Configuration

Each external model requires configuration at `~/agents/{model}/config.json`:

```json
{
  "provider": "openai",
  "api_key": "sk-...",
  "api_url": "https://api.example.com/v1/chat/completions",
  "model_id": "model-name",
  "supports_tools": true,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

Supported providers:
- **openai**: OpenAI-compatible APIs (DeepSeek, MiniMax, etc.)
- **anthropic**: Claude via Anthropic API (not used by orchestrator)

## Cost Optimization

The orchestrator tracks performance across all models and uses this data for future routing decisions:

- **Quality scores**: Tracked per model per task type
- **Success rates**: Approval rate by CTO review
- **Task completion**: Time and token usage
- **Escalation frequency**: How often tasks need re-work

This data is stored in `~/clautonomous/linux/config/model_performance.json` and used to inform:
- Weighted model selection for new tasks
- Fallback chain optimization
- CTO classification hints

## Validation

Validate your configuration:

```bash
cd ~/clautonomous/linux
python3 orchestrator_config.py validate
```

View current configuration:

```bash
python3 orchestrator_config.py
```

Check orchestrator status:

```bash
python3 orchestrator.py --status
```

## Adding New Models

To add a new model:

1. **Create agent configuration** at `~/agents/{model}/config.json`
2. **Add to orchestrator_config.json** under `worker_models.external`
3. **Configure provider endpoints** in `provider_endpoints`
4. **Set fallback chain** for the new model
5. **Enable the model** and restart orchestrator (or change env var)

Example for GPT-4:

```json
{
  "worker_models": {
    "external": {
      "gpt-4": {
        "enabled": true,
        "has_tools": true,
        "description": "OpenAI GPT-4 with tool calling"
      }
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

## Troubleshooting

### Model Not Being Used

1. Check if model is enabled in `orchestrator_config.json`
2. Verify agent config exists at `~/agents/{model}/config.json`
3. Check API key is valid and not expired
4. Review orchestrator log: `~/clautonomous/linux/orchestrator.log`

### Tool Calling Failures

1. Verify `supports_tools: true` in agent config
2. Check provider is set to `"openai"` or `"anthropic"`
3. Ensure API endpoint supports tool calling
4. Review tool definitions in `config/orchestrator_tools.json`

### Cost Optimization Not Working

1. Verify `cost_optimization.enabled: true` in config
2. Check `model_selection_strategy: "cost_aware"`
3. Review performance data in `config/model_performance.json`
4. Enable verbose logging: `python3 orchestrator.py --verbose`

## Performance Monitoring

Monitor model performance:

```bash
# View performance summary
cat ~/clautonomous/linux/config/model_performance.json | jq '.summary'

# Check specific model stats
cat ~/clautonomous/linux/config/model_performance.json | jq '.models.deepseek'

# Watch orchestrator log in real-time
tail -f ~/clautonomous/linux/orchestrator.log
```

Performance metrics tracked:
- Total tasks completed
- Success rate (CTO approval rate)
- Average quality score (1-10)
- Task type breakdown
- Escalation frequency

## Backward Compatibility

The system maintains backward compatibility:

- **No config file**: Uses hardcoded defaults (DeepSeek CTO, all models enabled)
- **Partial config**: Missing fields filled with defaults
- **Unknown models**: Assumed enabled for compatibility
- **Legacy model names**: Mapped to current identifiers

## Security Considerations

- **API keys**: Stored in `~/agents/{model}/config.json` with `chmod 600`
- **Credentials directory**: Write-blocked by tool worker
- **System paths**: Write-blocked to prevent privilege escalation
- **Command filtering**: Dangerous commands blocked before execution
- **Git authorship**: Automatic attribution prevents identity confusion

## References

- Main orchestrator: `~/clautonomous/linux/orchestrator.py`
- Config module: `~/clautonomous/linux/orchestrator_config.py`
- Config file: `~/clautonomous/linux/orchestrator_config.json`
- Tool worker: `~/clautonomous/linux/tool_worker.py`
- Tool definitions: `~/clautonomous/linux/config/orchestrator_tools.json`
- Performance data: `~/clautonomous/linux/config/model_performance.json`
