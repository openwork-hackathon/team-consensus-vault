# CVAULT-150: Error Handling and User Feedback Analysis

## Current State Assessment

### Strengths
1. **Comprehensive error classification**: `ConsensusErrorType` enum covers most common error scenarios
2. **User-facing error transformation**: `createUserFacingError()` function provides actionable messages
3. **Circuit breaker pattern**: Prevents calling consistently failing models
4. **Retry logic**: Exponential backoff for transient errors
5. **Progress tracking**: `ProgressUpdate` system for slow models
6. **Partial failure reporting**: `partialFailures` object in consensus results
7. **Error aggregator**: Deduplicates repeated errors across models

### Identified Gaps

#### 1. Missing Error Types
- **VALIDATION_ERROR**: For data validation failures (confidence out of range, invalid signal values)
- **CONFIGURATION_ERROR**: For misconfigured model settings beyond missing API keys
- **CACHE_ERROR**: For caching-related failures

#### 2. Inconsistent Error Population
- `runConsensusAnalysis` and `runDetailedConsensusAnalysis` don't populate `userFacingError` when promises reject
- Fallback model errors don't preserve user-facing error information
- Stream consensus doesn't include error details in yielded results

#### 3. Error Deduplication Issues
- Error aggregator uses 5-second window but doesn't account for model retries
- Same error from same model during retries could trigger multiple notifications
- No mechanism to suppress errors for models in circuit breaker state

#### 4. Progress Update Improvements
- No progress updates for fallback model attempts
- Estimated remaining time calculation is simplistic (50% of elapsed time)
- No progress updates during retry delays

#### 5. Error Message Clarity
- Some API error messages are too technical
- Missing guidance for specific HTTP status codes
- No differentiation between temporary vs permanent failures

## Proposed Improvements

### 1. Add Missing Error Types
```typescript
export enum ConsensusErrorType {
  // ... existing types
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
}
```

### 2. Ensure Consistent userFacingError Population
- Update `runConsensusAnalysis` and `runDetailedConsensusAnalysis` to include user-facing errors
- Preserve error context through fallback chain
- Include error details in streamed results

### 3. Enhance Error Deduplication
- Track error context (model, retry attempt) in aggregator
- Suppress notifications for models in circuit breaker state
- Add model-specific error cooldown periods

### 4. Improve Progress Updates
- Add progress updates for fallback attempts
- Better remaining time estimation based on model performance history
- Progress updates during retry delays

### 5. Clarify Error Messages
- More actionable recovery guidance
- User-friendly explanations for technical errors
- Clear differentiation between user-actionable vs system issues

## Implementation Plan

1. **Add missing error types** to `ConsensusErrorType` enum
2. **Update error creation** to handle new error types
3. **Fix userFacingError population** in all error paths
4. **Enhance error aggregator** for better retry handling
5. **Improve progress tracking** for fallbacks and retries
6. **Update error messages** for better clarity

## Testing Strategy

1. Unit tests for new error types
2. Integration tests for error propagation through fallback chain
3. Verification of error deduplication during retries
4. Progress update timing validation
5. User-facing error message readability assessment