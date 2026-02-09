# CVAULT-147: Dependency Cleanup Report

**Date**: 2026-02-08
**Task**: Review and clean up unused dependencies in package.json

## Summary

Removed 2 unused devDependencies, resulting in the removal of 109 total packages (including transitive dependencies).

## Dependencies Removed

### Unused DevDependencies
1. **`chrome-launcher`** (^1.2.1)
   - **Reason**: Used only in `run-lighthouse.js` and `extract-lighthouse-details.js`, which were removed in CVAULT-115
   - **Impact**: Removed 1 direct dependency + transitive deps

2. **`lighthouse`** (^12.8.2)
   - **Reason**: Used only in `run-lighthouse.js` and `extract-lighthouse-details.js`, which were removed in CVAULT-115
   - **Impact**: Removed 1 direct dependency + 107 transitive deps (lighthouse has many dependencies)

### Total Impact
- **Direct dependencies removed**: 2
- **Total packages removed**: 109 (including transitive dependencies)
- **Build status**: ✅ Successful (verified with `npm run build`)

## Dependencies Verified as USED

### Production Dependencies (all required)
- `@lifi/widget` - Used in SwapWidget.tsx
- `@rainbow-me/rainbowkit` - Used in 6 files, optimized in next.config.mjs
- `@tanstack/react-query` - Used in Providers.tsx
- `@vercel/kv` - Used in rate-limit.ts, kv-store.ts, storage.ts
- `framer-motion` - Used in 29 files, transpiled in next.config.mjs
- `next` - Core framework
- `react`, `react-dom` - Core framework
- `react-toastify` - Used in predict/page.tsx, BettingPanel.tsx
- `recharts` - Used in ConsensusVsContrarian.tsx, optimized in next.config.mjs
- `sharp` - Required by Next.js for image optimization
- `viem` - Used in DepositModal.tsx, SwapWidget.tsx
- `wagmi` - Used in 8 files

### Dev Dependencies (all required)
- `@types/node`, `@types/react`, `@types/react-dom` - TypeScript type definitions
- `@vitest/ui` - Testing UI (referenced in package.json scripts)
- `autoprefixer` - Used in postcss.config.mjs
- `eslint`, `eslint-config-next` - Used in eslint.config.mjs
- `postcss` - Used in postcss.config.mjs
- `puppeteer` - Used in demo/generate-demo.js for video generation
- `tailwindcss` - Used in postcss.config.mjs and tailwind.config.ts
- `typescript` - Required for TypeScript compilation
- `vitest` - Testing framework (referenced in vitest.config.ts and scripts)

## Verification Steps Performed

1. ✅ Read package.json to list all dependencies
2. ✅ Searched codebase for imports of each dependency using grep
3. ✅ Checked config files (next.config.mjs, tailwind.config.ts, postcss.config.mjs, etc.)
4. ✅ Verified lighthouse/chrome-launcher scripts were removed in CVAULT-115
5. ✅ Removed confirmed unused dependencies from package.json
6. ✅ Ran `npm install` to update package-lock.json
7. ✅ Ran `npm run build` to verify the app still builds successfully

## Files Modified

- `/home/shazbot/team-consensus-vault/package.json` - Removed 2 devDependencies
- `/home/shazbot/team-consensus-vault/package-lock.json` - Auto-updated by npm install

## Build Verification

```bash
$ npm run build

✓ Compiled successfully in 22.8s
✓ Generating static pages using 5 workers (9/9) in 386.5ms

Route (app)
├ ○ /
├ ○ /_not-found
├ ƒ /api/chatroom/stream
├ ƒ /api/consensus
├ ƒ /api/consensus-detailed
├ ƒ /api/prediction-market/bet
├ ƒ /api/prediction-market/stream
├ ƒ /api/price
├ ƒ /api/trading/close
├ ƒ /api/trading/execute
├ ƒ /api/trading/history
├ ○ /chatroom
├ ○ /predict
└ ○ /rounds

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Build Status**: ✅ Success

## Security Audit

The cleanup revealed 3 high severity vulnerabilities remain in the dependency tree (not introduced by this change). These are pre-existing and unrelated to the removed packages.

## Conclusion

Successfully removed 2 unused dependencies that were left over from one-off performance auditing scripts removed in CVAULT-115. The removal of `lighthouse` and `chrome-launcher` eliminated 109 packages from node_modules, reducing the project's dependency footprint without affecting functionality. Build verification confirms all remaining dependencies are properly integrated and the application builds successfully.
