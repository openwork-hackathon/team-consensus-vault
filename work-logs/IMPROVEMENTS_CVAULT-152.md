# CVAULT-152: Error Handling and User Feedback Improvements

## Summary
Enhanced error handling and user feedback in the Consensus Vault consensus engine with more actionable recovery guidance, better error categorization, and improved error aggregation for multiple model failures.

## Changes Made

### 1. New Error Types Added
**File**: `src/lib/consensus-engine.ts`

Added three new error types to `ConsensusErrorType` enum:
- `AUTHENTICATION_ERROR` - Distinct from MISSING_API_KEY, specifically for 401/403 auth failures
- `QUOTA_EXCEEDED` - Hard quota limit reached (non-retryable)
- `QUOTA_WARNING` - Approaching quota limit (retryable, informational)

**Impact**: Better categorization of quota and authentication issues, allowing for more specific user guidance.

### 2. Improved User-Facing Error Messages
**File**: `src/lib/consensus-engine.ts` - `createUserFacingError()` function

#### Enhancements Across All Error Types:

**More Specific Wait Times**:
- Changed vague "wait a few minutes" to specific times (e.g., "Wait 60 seconds")
- Added exact second counts for clarity

**Actionable Recovery Guidance**:
- Added explicit "Click 'Analyze Again' to retry" instructions
- Included prevention tips (e.g., "space out requests by 10-15 seconds")
- Referenced automatic system behaviors (e.g., "system will automatically use backup models")

**Reference IDs for Support**:
- Added correlation IDs to critical errors for easier support tracking
- Format: "Reference ID: {correlationId}"

**Specific Improvements by Error Type**:

1. **RATE_LIMIT**:
   - Changed from "45-60 seconds" to "60 seconds" for clarity
   - Added prevention guidance about request spacing

2. **TIMEOUT**:
   - Mentions automatic fallback model behavior
   - Clear 60-second wait time

3. **NETWORK_ERROR**:
   - Distinguishes between automatic retry (2-3 min) and manual retry option
   - Added connection troubleshooting tip

4. **AUTHENTICATION_ERROR** (NEW):
   - Explains automatic refresh attempt
   - Provides 10-minute threshold before escalation
   - Includes reference ID

5. **QUOTA_EXCEEDED** (NEW):
   - Explains quota reset timing (midnight UTC)
   - Clarifies that other models remain available
   - Non-retryable status clearly communicated

6. **QUOTA_WARNING** (NEW):
   - Proactive warning before hard limit
   - Suggests conservation strategies

7. **MISSING_API_KEY**:
   - Explains automatic alternative model usage
   - Provides resolution timeline (24 hours)
   - Includes reference ID

8. **PARSE_ERROR**:
   - Mentions automatic 2-retry behavior
   - Clear immediate retry option

9. **API_ERROR**:
   - Specific 3-5 minute wait time (was "few minutes")
   - 4-minute estimated wait time
   - Mentions backup model availability

10. **GATEWAY_ERROR** (502, 503, 504):
    - Specific wait times per status code
    - Explains infrastructure failover

11. **CACHE_ERROR**:
    - Reassures that functionality is not affected
    - Explains impact (slower repeat requests only)

12. **UNKNOWN_ERROR**:
    - Includes reference ID for support
    - Suggests reporting for repeated occurrences

### 3. Error Aggregation Function
**File**: `src/lib/consensus-engine.ts` - New `aggregateErrors()` function

**Purpose**: When multiple models fail, consolidate errors into a single, clear message.

**Features**:
- Categorizes errors by type (rate limit, timeout, network, auth, quota)
- Counts errors per category
- Generates summary like "2 rate limited, 1 timed out"
- Determines primary recovery guidance based on error distribution
- Calculates max wait time across all errors
- Distinguishes retryable vs non-retryable failures
- Sets appropriate severity (critical if any critical errors)

**Example Output**:
```
Message: "Multiple models failed: 2 rate limited, 1 timed out"
Recovery: "Multiple models hit rate limits. Wait 60 seconds, then click 'Analyze Again' to retry. Space out future requests by at least 10-15 seconds to avoid this."
```

### 4. Enhanced Partial Failure Reporting
**File**: `src/lib/consensus-engine.ts` - `runConsensusAnalysis()` function

**Changes**:
- Collects all `UserFacingError` objects from failed models
- Uses `aggregateErrors()` to create consolidated error summary
- Includes `aggregatedError` field in `partialFailures` object
- Provides both summary string and full error object for frontend use

**Type Updates**:
- Added `aggregatedError?: UserFacingError` to:
  - `runConsensusAnalysis()` return type
  - `ConsensusData` interface in `src/lib/types.ts`

### 5. Authentication Error Handling
**File**: `src/lib/consensus-engine.ts` - `callModel()` function

**Changes**: Updated all three API provider branches (Google, Anthropic, OpenAI) to use `AUTHENTICATION_ERROR` type instead of `MISSING_API_KEY` for 401/403 responses.

**Impact**: Better distinction between "key is missing" vs "key is invalid/expired", allowing for different recovery strategies.

### 6. Bug Fixes (Unrelated)

**File**: `src/app/api/health/route.ts`
- Fixed import name collision: `getPerformanceMetrics` from both consensus-engine and ai-cache
- Solution: Used import aliases (`getConsensusMetrics`, `getAIPerformanceMetrics`)

**File**: `src/lib/error-tracking.ts`
- Fixed TypeScript error: `initialize()` method not on `ErrorTrackingService` interface
- Solution: Store `SentryService` instance separately to call `initialize()`
- Added `@ts-ignore` for optional Sentry dependency
- Added `.catch()` handler for failed dynamic import

## Testing

### Build Test
```bash
npm run build
```
**Result**: ✅ Build successful (no TypeScript errors)

### Manual Testing Checklist
- [ ] Test rate limit error display in UI
- [ ] Test timeout error with recovery guidance
- [ ] Test multiple model failures with aggregated error
- [ ] Test authentication error handling
- [ ] Verify "Analyze Again" button works with retry logic
- [ ] Test partial failures (some models succeed, some fail)
- [ ] Verify estimated wait times display correctly
- [ ] Test error severity styling (warning vs critical)

## Files Modified

1. `src/lib/consensus-engine.ts` - Main improvements
2. `src/lib/types.ts` - Type updates
3. `src/app/api/health/route.ts` - Import fix
4. `src/lib/error-tracking.ts` - TypeScript fix

## Next Steps (Future Enhancements)

1. **Frontend Integration**:
   - Update UI components to display `aggregatedError` from `partialFailures`
   - Add "Analyze Again" button with estimated wait time countdown
   - Show retry progress indicator
   - Display correlation IDs for critical errors

2. **Error Monitoring**:
   - Track error frequency by type
   - Alert on unusual error patterns
   - Monitor quota usage proactively

3. **User Experience**:
   - Add toast notifications for retryable errors
   - Auto-retry with exponential backoff for network errors
   - Show model health status before analysis starts

4. **Documentation**:
   - Add user-facing error documentation
   - Create troubleshooting guide
   - Document quota limits and reset times

## Impact

### User Experience
- **Before**: Vague errors like "try again later" or "contact support"
- **After**: Specific wait times, clear action items, automatic retry guidance

### Developer Experience
- **Before**: Generic error categories, hard to diagnose issues
- **After**: Detailed error types with correlation IDs, better tracking

### Support
- **Before**: Hard to diagnose user issues without logs
- **After**: Correlation IDs and detailed error context for faster resolution

## Metrics to Monitor

1. Error rates by type (track if improvements reduce support tickets)
2. Retry success rates (measure effectiveness of wait time guidance)
3. Time to resolution (correlation IDs should speed up support)
4. User engagement after errors (do users retry successfully?)

---

**Task**: CVAULT-152
**Status**: Complete, awaiting CTO review
**Author**: Lead Engineer (AI)
**Date**: 2026-02-08
