# CVAULT-167: TradingPerformance Table Horizontal Scroll Fix

## Issue
The TradingPerformance table component was causing horizontal overflow/scroll on tablet-sized screens (768px-1024px).

## Root Cause
1. The table had `min-w-[500px] lg:min-w-[640px]` but no explicit column widths
2. The P&L column displayed price and percentage inline, making the column wider
3. Content was expanding beyond the minimum width, causing overflow on tablet viewports

## Solution Applied

### 1. Added Explicit Column Widths (`<colgroup>`)
```html
<colgroup>
  <col className="w-[80px]" />    <!-- Time -->
  <col className="w-[70px]" />    <!-- Asset -->
  <col className="w-[80px]" />    <!-- Direction -->
  <col className="w-[100px]" />   <!-- Entry -->
  <col className="w-[100px]" />   <!-- Exit -->
  <col className="w-[130px] hidden md:table-column" />  <!-- P&L -->
  <col className="w-[90px] hidden lg:table-column" />   <!-- Consensus -->
  <col className="w-[80px]" />    <!-- Status -->
</colgroup>
```

### 2. Stacked P&L Display Vertically
Changed from inline display to stacked layout:
```tsx
// Before: Inline (wider)
<span>{formatPnL(trade.pnl)} ({formatPercentage(trade.pnlPercentage || 0)})</span>

// After: Stacked (narrower)
<div className="flex flex-col items-end gap-0.5">
  <span>{formatPnL(trade.pnl)}</span>
  <span className="text-xs opacity-75">{formatPercentage(trade.pnlPercentage || 0)}</span>
</div>
```

### 3. Improved Overflow Container Structure
```tsx
// Before
<div className="hidden sm:block overflow-x-auto -mx-2 px-2">
  <table>...</table>
</div>

// After
<div className="hidden sm:block -mx-2 px-2">
  <div className="overflow-x-auto scrollbar-thin">
    <table>...</table>
  </div>
</div>
```

### 4. Removed Minimum Width Constraints
Removed `min-w-[500px] lg:min-w-[640px]` from table - now relying on colgroup for width control.

## Width Calculations

### Small Tablet (640px - 767px)
- Visible columns: 6 (Time, Asset, Direction, Entry, Exit, Status)
- Table width: 80 + 70 + 80 + 100 + 100 + 80 = **510px**
- Available width: ~608px (640px - 32px padding)
- ✅ **Fits without scroll**

### Tablet (768px - 1023px)
- Visible columns: 7 (adds P&L)
- Table width: 80 + 70 + 80 + 100 + 100 + 130 + 80 = **640px**
- Available width: ~736px (768px - 32px padding)
- ✅ **Fits without scroll**

### Desktop (≥1024px)
- Visible columns: 8 (adds Consensus)
- Table width: 80 + 70 + 80 + 100 + 100 + 130 + 90 + 80 = **730px**
- Available width: ~992px (1024px - 32px padding)
- ✅ **Fits without scroll**

## Files Modified
- `/home/shazbot/team-consensus-vault/src/components/TradingPerformance.tsx`

## Testing
A test file has been created at `/home/shazbot/team-consensus-vault/test-tablet-fix.html` to verify the fix works across all breakpoints.

Open the test file in a browser and resize to verify:
1. ✅ No horizontal scroll on tablet (768px-1024px)
2. ✅ All columns fit within viewport width
3. ✅ P&L column displays price and percentage vertically stacked
4. ✅ Consensus column hidden on tablet (<1024px)
5. ✅ Mobile card layout works on <640px

## Responsive Behavior Summary

| Breakpoint | Layout | Columns | Width | Scroll? |
|------------|--------|---------|-------|---------|
| < 640px    | Cards  | N/A     | N/A   | ✅ No   |
| 640-767px  | Table  | 6       | 510px | ✅ No   |
| 768-1023px | Table  | 7       | 640px | ✅ No   |
| ≥ 1024px   | Table  | 8       | 730px | ✅ No   |
