# CVAULT-137: Consensus Engine Error Handling Improvements

## Summary

This document details the targeted improvements made to error handling and user feedback in the Consensus Vault consensus engine (`src/lib/consensus-engine.ts`).

## Changes Made

### 1. Circuit Breaker Implementation (WIRED UP)

**Status:** The circuit breaker pattern was defined but NOT being used. Now fully wired up.

**New Functions Added:**
- `isCircuitOpen(modelId: string)`: Checks if circuit is open and auto-resets after timeout
- `recordCircuitBreakerFailure(modelId: string)`: Tracks failures and opens circuit at threshold
- `recordCircuitBreakerSuccess(modelId: string)`: Resets failure count on successful calls

**Integration Points:**
- `callModel()` now checks circuit breaker BEFORE making API calls (line ~434)
- Success paths call `recordCircuitBreakerSuccess()` after successful responses (lines ~549, ~616, ~686)
- Failure paths call `recordCircuitBreakerFailure()` in error handlers (lines ~714, ~743)

**Configuration:**
- `FAILURE_THRESHOLD: 3` - Opens circuit after 3 consecutive failures
- `RESET_TIMEOUT: 10 minutes` - Circuit auto-resets after timeout
- Prevents wasting time on consistently failing models

### 2. Enhanced JSDoc Documentation

**Functions Documented:**
- `createUserFacingError()` - Examples of error transformation
- `createProgressUpdate()` - Progress tracking for slow models
- `callModel()` - Comprehensive docs on retry logic, circuit breaker, timeouts
- `parseModelResponse()` - JSON extraction and validation details
- `getAnalystOpinion()` - Fallback strategy and error handling
- `runConsensusAnalysis()` - Partial failure handling and progress tracking

**Benefit:** Developers can now understand error handling flow without reading implementation.

### 3. Improved Edge Case Handling

**HTTP Status Code Handling:**
Added specific handling for:
- `401/403`: Authentication errors → mapped to MISSING_API_KEY error type
- `429`: Rate limiting (already existed)
- `500+`: Server errors → clear user messaging about service unavailability

**Malformed Response Handling:**
- Error responses that aren't valid JSON (HTML error pages, plain text)
- Now captures response text (first 200 chars) for better error messages
- Added fallback text extraction when JSON parsing fails
- Separated successful response JSON parsing with explicit try-catch

**Applied to all 3 API providers:**
- Google Gemini (lines ~507-573)
- Anthropic-compatible (Kimi, GLM) (lines ~575-650)
- OpenAI-compatible (DeepSeek, MiniMax) (lines ~652-731)

### 4. Error Propagation Review

**Confirmed working:**
- All `ConsensusError` objects flow through `createUserFacingError()`
- `getAnalystOpinion()` wraps all errors in `UserFacingError` objects (lines ~771-778, ~836-842)
- Failed models include `userFacingError` field in `AnalystResult`
- Frontend receives structured error objects with recovery guidance

**Error Types Mapped:**
| Internal Error | User-Facing Type | Severity | Retryable | Wait Time |
|----------------|------------------|----------|-----------|-----------|
| RATE_LIMIT | rate_limit | warning | yes | 45s |
| TIMEOUT | timeout | warning | yes | - |
| NETWORK_ERROR | network | warning | yes | - |
| MISSING_API_KEY | configuration | critical | no | - |
| PARSE_ERROR | parse_error | warning | yes | - |
| INVALID_RESPONSE | invalid_response | warning | yes | - |
| API_ERROR (quota) | quota_exceeded | critical | no | - |
| API_ERROR (other) | api_error | warning | yes | - |

## Testing Recommendations

While this was a code review and targeted improvement task (not a testing task), here are scenarios to verify:

1. **Circuit Breaker:**
   - Simulate 3 consecutive failures → verify circuit opens
   - Wait 10 minutes → verify circuit auto-resets
   - Successful call after failures → verify immediate reset

2. **HTTP Error Handling:**
   - Trigger 401/403 → verify "Authentication failed" message
   - Trigger 500+ → verify "server error" message
   - HTML error page response → verify captures text, not JSON parse error

3. **User Feedback:**
   - Each error type → verify message is clear and actionable
   - Rate limit → verify 45s wait time is displayed
   - Check that retryable/non-retryable flags are correct

## What Was NOT Changed

Following the task requirements, I did NOT:
- Rewrite working code unnecessarily
- Add new dependencies
- Change the existing error type enum (API contract preserved)
- Modify the fallback logic (already working well)
- Change retry configuration (already appropriate)
- Alter progress tracking (already functional)

## Impact

**Improved reliability:**
- Circuit breaker prevents wasting time on dead models
- Better HTTP status handling prevents cryptic errors

**Improved user experience:**
- All errors now have clear, actionable recovery guidance
- Authentication errors are distinct from transient failures
- Users understand which errors are worth retrying

**Improved debugging:**
- JSDoc comments explain error flow
- HTML error pages captured in error messages (not lost)
- Circuit breaker logs model failures

## Files Modified

- `/home/shazbot/team-consensus-vault/src/lib/consensus-engine.ts` (primary changes)

## Related Files (Reference Only)

- `/home/shazbot/team-consensus-vault/src/lib/types.ts` (UserFacingError, ProgressUpdate interfaces)
- `/home/shazbot/team-consensus-vault/src/lib/chatroom/error-types.ts` (reference implementation for chatroom)

## Commit Message Suggestion

```
Improve error handling in consensus engine (CVAULT-137)

- Wire up circuit breaker pattern (was defined but not used)
- Add specific HTTP status code handling (401/403/500+)
- Improve malformed response handling (HTML error pages)
- Add comprehensive JSDoc comments for error functions
- Ensure all errors propagate as UserFacingError objects

The circuit breaker now prevents wasting time on consistently
failing models (3 failure threshold, 10min reset). All API
providers (Gemini, Anthropic, OpenAI) now handle edge cases
like HTML error pages and unexpected status codes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
