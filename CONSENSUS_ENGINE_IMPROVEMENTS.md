# Consensus Engine Enhancements - PR #1

## Overview
This PR implements comprehensive improvements to the Consensus Vault consensus engine, focusing on three key areas: better prompts, robust error handling, and proper timeout management.

## Changes Made

### 1. Enhanced Error Handling

#### New Error Type System
- **ConsensusError class**: Custom error class with structured error types
- **Error Types**:
  - `TIMEOUT`: Request exceeded timeout limit
  - `API_ERROR`: API returned an error response
  - `PARSE_ERROR`: Failed to parse model response
  - `NETWORK_ERROR`: Network connectivity issues
  - `RATE_LIMIT`: API rate limit exceeded
  - `MISSING_API_KEY`: Required API key not found
  - `INVALID_RESPONSE`: Empty or malformed response

#### Improved Error Handling in `callModel()`
- Specific error detection for rate limiting (429 responses)
- Empty response validation
- Network error detection
- Structured error logging with error types and original errors
- Better error context with model ID tracking

#### Enhanced Response Parsing
- Validates all required JSON fields (signal, confidence, reasoning)
- Validates signal values ("buy", "sell", "hold")
- Validates confidence range (0-100)
- Validates reasoning length (minimum 10 characters)
- Clear error messages for validation failures

### 2. Timeout Management

#### Configurable Timeout System
```typescript
export const TIMEOUT_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_TIMEOUT: 60000,     // 60 seconds maximum
  MIN_TIMEOUT: 5000,      // 5 seconds minimum
  RETRY_ATTEMPTS: 2,      // Retry on transient errors
  RETRY_DELAY: 1000,      // 1 second between retries
};
```

#### Retry Logic
- Automatic retry for transient errors (TIMEOUT, NETWORK_ERROR)
- Configurable retry attempts with exponential backoff capability
- Smart retry - only for errors that are likely temporary
- No retry for permanent errors (MISSING_API_KEY, PARSE_ERROR, RATE_LIMIT)

#### Timeout Bounds Checking
- Ensures timeouts are within acceptable range (5-60 seconds)
- Prevents extremely short or long timeouts
- Clamps configuration values to safe bounds

### 3. Improved AI Prompts

#### Enhanced User Prompt Structure
New `buildEnhancedPrompt()` function that:
- Provides clear, structured instructions to AI models
- Emphasizes the need for specific metrics and data points
- Reminds models to respond in exact JSON format
- Contextualizes the analysis request better

#### Updated System Prompts for All 5 Analysts

**Momentum Hunter (Technical Analysis)**
- Added specific indicator examples (e.g., "RSI at 68", "MACD golden cross")
- Clearer signal selection guidelines
- Detailed confidence scoring criteria (0-100 scale with ranges)
- Emphasis on quantifiable metrics

**Whale Watcher (On-Chain Behavior)**
- Added concrete examples (e.g., "100M tokens moved to cold storage")
- Specific guidance on exchange flow interpretation
- Quantified confidence criteria based on whale activity volume
- Emphasis on amounts, percentages, and timeframes

**Sentiment Scout (Social Sentiment)**
- Added metrics-based guidance (e.g., "Twitter mentions up 200%")
- Fear & Greed Index integration examples
- Specific social platform indicators
- Quantifiable engagement metrics

**On-Chain Oracle (Blockchain Metrics)**
- Added TVL trend examples with numbers (e.g., "TVL up 25% to $500M")
- Active address metrics and growth rates
- Transaction volume tracking
- Protocol revenue indicators

**Risk Manager (Risk Assessment)**
- Added volatility metrics (e.g., "30-day volatility at 45%")
- Funding rate interpretation
- Correlation metrics with specific values
- Clear risk/reward assessment guidance

#### Key Prompt Improvements
1. **Specificity**: Models now instructed to cite specific numbers, percentages, and levels
2. **Structure**: Clear 5-step analysis framework for each role
3. **Confidence Calibration**: Detailed scoring rubrics (80-100, 60-79, 40-59, 20-39, 0-19)
4. **Signal Guidelines**: Explicit criteria for BUY/SELL/HOLD decisions
5. **Examples**: Concrete examples in system prompts showing desired output format

### 4. Enhanced Logging

#### Structured Error Logging
- Logs include error type, message, model ID, and original error
- Different log levels for different error types
- Retry attempt logging with context

#### Response Time Tracking
- Accurate timing even on failures
- Timeout duration logged
- Performance metrics preserved

## Technical Details

### Files Modified
- `src/lib/consensus-engine.ts`: Core consensus engine with error handling and timeout logic
- `src/lib/models.ts`: All 5 analyst system prompts enhanced

### Backward Compatibility
- All changes are backward compatible
- Existing API contracts unchanged
- Response format remains the same
- Tests continue to pass

### Testing
- Build completes successfully (`npm run build`)
- No breaking changes to existing functionality
- Error handling tested across all API providers (OpenAI, Anthropic, Google)

## Benefits

1. **Reliability**: Automatic retries handle transient failures gracefully
2. **Debuggability**: Structured errors make issues easier to diagnose
3. **Quality**: Enhanced prompts produce more consistent, specific outputs
4. **Resilience**: Graceful degradation when individual models fail
5. **Performance**: Configurable timeouts prevent hung requests
6. **Maintainability**: Clear error types and logging aid troubleshooting

## Impact

### For Users
- More reliable consensus results with fewer complete failures
- Better quality analysis with specific metrics and data points
- Faster recovery from transient errors via automatic retry

### For Developers
- Easier debugging with structured error types
- Clear logging of error paths
- Configurable timeout and retry parameters
- Better code organization and maintainability

## Next Steps

Potential future enhancements:
1. Add metrics/telemetry for error rates by type
2. Implement circuit breaker pattern for failing models
3. Add caching layer to reduce API calls
4. Fine-tune retry backoff strategy
5. Add unit tests for error handling paths
6. Implement fallback strategies per error type

## Related Issues
- Addresses need for robust error handling in production
- Improves consensus quality through better prompts
- Prevents hung requests with timeout management
