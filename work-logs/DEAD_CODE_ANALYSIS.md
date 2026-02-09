# Dead Code Analysis - CVAULT-115

Analysis performed: 2026-02-08

## Components to Remove

### 1. SignalHistory.example.tsx
- **Location**: `src/components/SignalHistory.example.tsx`
- **Reason**: Example/demo file, not imported anywhere
- **Grep check**: Only self-reference in the file itself
- **Status**: SAFE TO DELETE

### 2. ApiErrorBoundary.tsx
- **Location**: `src/components/ApiErrorBoundary.tsx`
- **Reason**: Not imported anywhere, has `useApiErrorHandler` hook that's never used
- **Note**: ErrorBoundary.tsx is used instead (imported in Providers.tsx)
- **Status**: SAFE TO DELETE

### 3. EnhancedToastContainer.tsx
- **Location**: `src/components/EnhancedToastContainer.tsx`
- **Reason**: Not imported anywhere, ToastContainer.tsx is used instead
- **Note**: Has duplicate `useToast` hook (exists in hooks/useToast.ts)
- **Status**: SAFE TO DELETE

### 4. GracefulDegradation.tsx
- **Location**: `src/components/GracefulDegradation.tsx`
- **Reason**: Not imported anywhere, no references in codebase
- **Status**: SAFE TO DELETE

### 5. Header.tsx
- **Location**: `src/components/Header.tsx`
- **Reason**: Not imported anywhere (Navigation.tsx is used instead in layout.tsx)
- **Status**: SAFE TO DELETE

### 6. LoadingSpinner.tsx
- **Location**: `src/components/LoadingSpinner.tsx`
- **Reason**: Not imported anywhere, LoadingSkeleton.tsx is used instead
- **Status**: SAFE TO DELETE

## Hooks to Remove

### 1. useApiError.ts
- **Location**: `src/hooks/useApiError.ts`
- **Reason**: Not imported or used anywhere
- **Status**: SAFE TO DELETE

### 2. useAsync.ts
- **Location**: `src/hooks/useAsync.ts`
- **Reason**: Not imported or used anywhere
- **Status**: SAFE TO DELETE

### 3. useToast.ts
- **Location**: `src/hooks/useToast.ts`
- **Reason**: Not imported or used anywhere (duplicate functionality exists in ToastContainer.tsx)
- **Status**: SAFE TO DELETE

## Lib Files to Remove

### 1. storage.ts
- **Location**: `src/lib/storage.ts`
- **Reason**: Only imported by paper-trading-engine.ts, but paper trading is not actively used
- **Note**: Keep for now - it's used by paper-trading-engine which IS imported
- **Status**: KEEP

### 2. wallet-utils.ts
- **Location**: `src/lib/wallet-utils.ts`
- **Reason**: Not imported anywhere in the codebase
- **Status**: SAFE TO DELETE

## Root Test Scripts (Already in .gitignore, but taking up space)

These are all in .gitignore but should be removed from tracking:

1. `test-consensus.js` - Old test script, replaced by vitest tests
2. `test-consensus-generic.js` - Old test script
3. `test-glm-oracle.js` - Individual model test (not needed)
4. `test-glm-oracle.sh` - Shell wrapper
5. `test-minimax.js` - Individual model test (not needed)
6. `test-momentum-hunter.js` - Individual analyst test
7. `test-whale-watcher.js` - Individual analyst test
8. `test-cvault-47-comprehensive.js` - One-off task test
9. `test-iphone-se-analysis.js` - One-off viewport test
10. `test-iphone-se-viewport.sh` - Shell wrapper
11. `test-tablet-viewport.sh` - Shell wrapper

## Root Analysis Scripts

1. `analyze-mobile-viewport.js` - One-off analysis
2. `analyze-tablet-viewport.js` - One-off analysis
3. `check-trades-state.js` - Debug script
4. `extract-lighthouse-details.js` - One-off lighthouse analysis
5. `inspect-mobile-content.js` - One-off analysis
6. `manual-viewport-test.js` - One-off test
7. `run-lighthouse.js` - One-off lighthouse run
8. `verify-mobile-display.js` - One-off verification

## Root Documentation/Report Files (Already in .gitignore)

These should be removed as they're session artifacts:
- All `CVAULT-*.md` files (task reports)
- All `*_REPORT.md`, `*_SUMMARY.md`, `*_STATUS.md` files
- `ACTIVITY*.log` and `*.md` files
- Lighthouse JSON files
- Demo generation scripts

## Summary

**Components**: 6 files to delete
**Hooks**: 3 files to delete
**Lib**: 1 file to delete
**Root scripts**: 16 files to delete
**Total**: 26 files to remove

## Safety Notes

- All deletions verified with grep searches
- No files are imported or referenced in active code
- LoadingSkeleton, ToastContainer, ErrorBoundary, and Navigation are the active versions being used
- Paper trading engine and its dependencies (storage.ts) are kept as they're imported in API routes
