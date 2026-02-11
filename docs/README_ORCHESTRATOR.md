# Orchestrator Documentation

This directory contains comprehensive documentation for the CTO Orchestrator's dynamic model selection system.

## Quick Links

- **[Quick Start Guide](ORCHESTRATOR_MODEL_SELECTION_QUICKSTART.md)** - Get started in 5 minutes
- **[Complete Guide](ORCHESTRATOR_MODEL_SELECTION.md)** - Full documentation
- **[Configuration Examples](ORCHESTRATOR_CONFIG_EXAMPLES.md)** - Common use cases
- **[Task Summary](CVAULT-236-COMPLETION-SUMMARY.md)** - Implementation details

## What is Dynamic Model Selection?

The orchestrator can route tasks to different AI models based on:
- Task complexity and type
- Model capabilities and cost
- Token availability and budgets
- Historical performance data

This enables cost optimization while maintaining quality.

## Supported Models

### Claude (via Claude Code CLI)
- **haiku**: Fast, cheap, simple tasks
- **sonnet**: Balanced, coding, debugging
- **opus**: Complex, architecture, security

### External (via API)
- **deepseek**: Coding, debugging (tool calling)
- **minimax**: General purpose (tool calling)
- **kimi**: Research only (no tools)
- **glm**: Analysis only (no tools)
- **gemini**: Research (disabled by default)

## Configuration Methods

### 1. Environment Variables (Quick)
```bash
export CTO_MODEL=deepseek    # Change CTO model
export CTO_MODEL=opus        # Use Opus CTO
export CTO_MODEL=sonnet      # Use Sonnet CTO
```

### 2. Config File (Persistent)
Edit `~/clautonomous/linux/orchestrator_config.json`:
```json
{
  "cto_model": "deepseek",
  "model_selection_strategy": "cost_aware",
  "cost_optimization": {
    "enabled": true
  }
}
```

## Key Features

- ✅ **Runtime switching**: Change models without restart
- ✅ **Cost optimization**: Automatic routing to cheaper models
- ✅ **Tool calling**: External models can edit files, run commands
- ✅ **Performance tracking**: Historical data informs decisions
- ✅ **Automatic escalation**: Failed tasks get more capable models
- ✅ **Backward compatible**: Falls back to defaults if config missing

## Common Use Cases

| Goal | CTO Model | Cost Optimization | External Models |
|------|-----------|-------------------|-----------------|
| **Save money** | deepseek | ✅ Enabled | ✅ All enabled |
| **Max quality** | opus | ❌ Disabled | ❌ Disabled |
| **Balanced** | sonnet | ✅ Enabled | ⚠️ Research only |
| **Testing** | sonnet | ✅ Enabled | ✅ All enabled |

See [Configuration Examples](ORCHESTRATOR_CONFIG_EXAMPLES.md) for complete configs.

## Quick Commands

```bash
# Check current config
python3 orchestrator_config.py

# Validate config
python3 orchestrator_config.py validate

# View orchestrator status
python3 orchestrator.py --status

# Watch log
tail -f ~/clautonomous/linux/orchestrator.log

# View performance data
cat ~/clautonomous/linux/config/model_performance.json | jq
```

## Documentation Files

### [ORCHESTRATOR_MODEL_SELECTION_QUICKSTART.md](ORCHESTRATOR_MODEL_SELECTION_QUICKSTART.md)
**5-minute guide** with essential commands and quick fixes.

**Best for**: First-time users, quick reference

### [ORCHESTRATOR_MODEL_SELECTION.md](ORCHESTRATOR_MODEL_SELECTION.md)
**Complete guide** covering all features, configuration options, and troubleshooting.

**Best for**: In-depth understanding, advanced configuration

### [ORCHESTRATOR_CONFIG_EXAMPLES.md](ORCHESTRATOR_CONFIG_EXAMPLES.md)
**Example configurations** for 10 common scenarios with explanations.

**Best for**: Choosing a starting configuration, learning by example

### [CVAULT-236-COMPLETION-SUMMARY.md](CVAULT-236-COMPLETION-SUMMARY.md)
**Technical summary** of the implementation and requirements verification.

**Best for**: Understanding the codebase, verifying requirements

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ User Request / Plane Task                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 1: CTO Classification                             │
│ - Analyzes task complexity and type                     │
│ - Selects appropriate worker model                      │
│ - Model: configurable via CTO_MODEL env var             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Cost-Aware Override (optional)                 │
│ - Routes routine tasks to cheaper external models       │
│ - Preserves Claude tokens for complex work              │
│ - Disabled for critical tasks (opus, email, escalation) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Worker Execution                               │
│ ┌─────────────────┬──────────────────┬────────────────┐ │
│ │ Claude Models   │ Tool-Capable     │ Research-Only  │ │
│ │ (Claude Code)   │ (OpenAI API)     │ (Text API)     │ │
│ │ - haiku         │ - deepseek       │ - kimi         │ │
│ │ - sonnet        │ - minimax        │ - glm          │ │
│ │ - opus          │                  │                │ │
│ └─────────────────┴──────────────────┴────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Phase 4: CTO Review                                      │
│ - Validates output quality                               │
│ - Approves or escalates to more capable model            │
│ - Records performance data for future routing           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Result: Task Complete or Escalated                      │
└─────────────────────────────────────────────────────────┘
```

## Files and Locations

### Configuration
- **Config file**: `~/clautonomous/linux/orchestrator_config.json`
- **Config module**: `~/clautonomous/linux/orchestrator_config.py`
- **Tool definitions**: `~/clautonomous/linux/config/orchestrator_tools.json`

### Runtime
- **Main orchestrator**: `~/clautonomous/linux/orchestrator.py`
- **Tool worker**: `~/clautonomous/linux/tool_worker.py`
- **Orchestrator log**: `~/clautonomous/linux/orchestrator.log`

### Data
- **Performance data**: `~/clautonomous/linux/config/model_performance.json`
- **Agent configs**: `~/agents/{model}/config.json`

## Troubleshooting

### Model not being used?
1. Check if model is enabled in config
2. Verify agent config exists
3. Check API key is valid
4. Review orchestrator log

See [Quick Start Guide](ORCHESTRATOR_MODEL_SELECTION_QUICKSTART.md#troubleshooting) for more.

### Configuration invalid?
```bash
python3 orchestrator_config.py validate
```

### Need help?
1. Start with [Quick Start Guide](ORCHESTRATOR_MODEL_SELECTION_QUICKSTART.md)
2. Check [Configuration Examples](ORCHESTRATOR_CONFIG_EXAMPLES.md)
3. Read [Complete Guide](ORCHESTRATOR_MODEL_SELECTION.md)
4. Review [Task Summary](CVAULT-236-COMPLETION-SUMMARY.md)

## Support

For questions or issues:
1. Check documentation in this directory
2. Review orchestrator log: `~/clautonomous/linux/orchestrator.log`
3. Validate configuration: `python3 orchestrator_config.py validate`
4. Test with verbose logging: `python3 orchestrator.py --verbose`

## Contributing

When adding new models or features:
1. Update configuration schema in `orchestrator_config.py`
2. Add example config in `ORCHESTRATOR_CONFIG_EXAMPLES.md`
3. Update capability matrix in `ORCHESTRATOR_MODEL_SELECTION.md`
4. Document in this README

## Version History

- **2026-02-10**: Initial documentation created (CVAULT-236)
  - Complete guide with architecture overview
  - Quick start guide for rapid onboarding
  - 10 configuration examples for common use cases
  - Task completion summary with requirements verification

## License

Part of the Consensus Vault project. See main project README for license details.
