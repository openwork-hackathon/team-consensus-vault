# Model Configuration System

## Overview

The CVAULT application uses a hybrid approach for AI model configuration:

1. **Active Configuration**: Environment variables (see `.env.example`)
2. **Legacy Configuration**: JSON-based configuration (`.model-configs.json`)

## Current Status

### Active Configuration (Recommended)
The application currently uses environment variables defined in `.env.example`:
- `DEEPSEEK_API_KEY`
- `KIMI_API_KEY` 
- `MINIMAX_API_KEY`
- `GLM_API_KEY`
- `GEMINI_API_KEY`

These are loaded in `src/lib/models.ts` and used by the consensus engine.

### Legacy Configuration (Deprecated)
The `.model-configs.json` file contains:
- Model definitions with encrypted API keys
- Agent configurations
- Role definitions

**⚠️ Security Notice**: This file is now ignored by git and should NOT be committed.

## Security Considerations

1. **Recent Security Incident**: Commit `dcc82d7` removed `VERCEL_ENV_SETUP.md` containing plaintext API keys
2. **Encryption Method**: The JSON config used Fernet encryption, but encrypted keys should still not be in version control
3. **Best Practice**: API keys (even encrypted) should be stored in environment variables or secure key management systems

## Migration Path

To fully migrate away from the JSON configuration:

1. ✅ Environment variables are already in use
2. ✅ The consensus engine uses `process.env` variables
3. ✅ `.model-configs.json` is now git-ignored
4. ❓ Complete removal of JSON config parsing (if still present in codebase)

## Files

- `.env.example` - Template for environment variables
- `.model-configs.json` - Legacy config (git-ignored, contains sensitive data)
- `.model-configs.example.json` - Template showing structure without real keys
- `src/lib/models.ts` - Active configuration loading

## Recommendations

1. **Do not commit** `.model-configs.json` even with encrypted keys
2. **Use environment variables** for all API keys
3. **Rotate API keys** that may have been exposed in git history
4. **Document** any future model configuration requirements in `.env.example`