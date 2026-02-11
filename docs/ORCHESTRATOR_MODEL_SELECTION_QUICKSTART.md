# Orchestrator Model Selection - Quick Start Guide

## TL;DR

The orchestrator already supports dynamic model selection across Claude, DeepSeek, GPT-4, and other providers. Change models via environment variables or config file - no code changes needed.

## Quick Commands

### Check Current Configuration

```bash
cd ~/clautonomous/linux
python3 orchestrator_config.py
```

### Validate Configuration

```bash
python3 orchestrator_config.py validate
```

### Change CTO Model (Runtime)

```bash
# Use DeepSeek for CTO (cost-effective, preserves Claude tokens)
export CTO_MODEL=deepseek

# Use Claude Opus for CTO (most capable, highest cost)
export CTO_MODEL=opus

# Use Claude Sonnet for CTO (balanced)
export CTO_MODEL=sonnet

# Changes take effect immediately - no restart needed
```

### View Orchestrator Status

```bash
python3 orchestrator.py --status
```

### Watch Orchestrator Log

```bash
tail -f ~/clautonomous/linux/orchestrator.log
```

## Configuration File

Edit `~/clautonomous/linux/orchestrator_config.json` to:

- Enable/disable individual models
- Configure fallback chains
- Set provider API endpoints
- Adjust cost optimization settings

Example - disable a model:

```json
{
  "worker_models": {
    "external": {
      "kimi": {
        "enabled": false,  // Disable Kimi
        "has_tools": false
      }
    }
  }
}
```

## Model Selection Logic

1. **CTO analyzes task** → recommends model based on complexity
2. **Cost-aware routing** → may override to use cheaper external model
3. **Worker executes** → via Claude Code, tool calling, or text API
4. **On failure** → automatic escalation to more capable model

## Available Models

### Claude Models (Full System Access)
- **haiku**: Simple tasks, fast, cheap
- **sonnet**: Coding, debugging, balanced
- **opus**: Complex tasks, architecture, expensive

### External Models (Tool Calling)
- **deepseek**: Coding, debugging (cheaper than Claude)
- **minimax**: General purpose, configuration

### Research-Only Models (Text API)
- **kimi**: Research, analysis
- **glm**: Analysis, explanations

## Cost Optimization

**Enabled by default** - automatically routes routine tasks to cheaper models while preserving Claude tokens for complex work.

To disable:

```json
{
  "cost_optimization": {
    "enabled": false
  }
}
```

## Performance Monitoring

View model performance data:

```bash
cat ~/clautonomous/linux/config/model_performance.json | jq
```

Check specific model:

```bash
cat ~/clautonomous/linux/config/model_performance.json | jq '.models.deepseek'
```

## Adding New Models

1. Create config: `~/agents/{model}/config.json`
2. Add to `orchestrator_config.json`
3. Set fallback chain
4. Enable model

See full guide: `ORCHESTRATOR_MODEL_SELECTION.md`

## Troubleshooting

### Model not being used?
```bash
# Check if enabled
cat ~/clautonomous/linux/orchestrator_config.json | jq '.worker_models'

# Check agent config exists
ls ~/agents/{model}/config.json

# Check orchestrator log
tail -f ~/clautonomous/linux/orchestrator.log | grep -i model
```

### Configuration issues?
```bash
python3 orchestrator_config.py validate
```

### Need verbose logging?
```bash
python3 orchestrator.py --verbose
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `CTO_MODEL` | Set CTO model directly | `export CTO_MODEL=opus` |
| `MODEL_PROVIDER` | Set provider category | `export MODEL_PROVIDER=claude` |
| `ORCHESTRATOR_CONFIG` | Custom config path | `export ORCHESTRATOR_CONFIG=/path/to/config.json` |

## Key Files

- **Config**: `~/clautonomous/linux/orchestrator_config.json`
- **Code**: `~/clautonomous/linux/orchestrator_config.py`
- **Main**: `~/clautonomous/linux/orchestrator.py`
- **Tools**: `~/clautonomous/linux/tool_worker.py`
- **Performance**: `~/clautonomous/linux/config/model_performance.json`
- **Log**: `~/clautonomous/linux/orchestrator.log`

## Full Documentation

See `ORCHESTRATOR_MODEL_SELECTION.md` for complete details including:
- Architecture overview
- Model capabilities matrix
- Tool calling support
- Provider configuration
- Security considerations
- Adding new models
- Performance tuning
