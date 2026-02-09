# Mobile Responsiveness Checklist - CVAULT-132

## Test Viewports

### 📱 Mobile (375px - iPhone SE)
- Smallest common mobile viewport
- Critical for mobile-first design

### 📱 Tablet (768px - iPad)
- Mid-size viewport
- Often uses different layout breakpoints

### 💻 Desktop (1024px+)
- Default development viewport
- Reference for responsive scaling

## Component Checklist

### ✅ Predict Page (`/predict`)

#### Layout
- [ ] Header fits within viewport without horizontal scroll
- [ ] "How It Works" button accessible on mobile (375px)
- [ ] Connection status indicators visible and readable
- [ ] Phase indicator displays correctly across all viewports

#### Empty States ✅
- [x] DisconnectedEmptyState - icon, title, description, retry button
- [x] WalletNotConnectedEmptyState - icon, title, description
- [x] NoRoundsEmptyState - icon, title, description
- [x] NoBetsEmptyState - icon, title, description
- [x] All text readable at 375px
- [x] Buttons meet 44px minimum tap target size

#### Responsive Classes Audit
**Line 339**: `md:grid-cols-2 lg:grid-cols-3`
- ✅ 375px: Single column (default)
- ✅ 768px: 2 columns
- ✅ 1024px: 3 columns

### BettingPanel Component

#### Line 273: Quick amount buttons grid
```tsx
className="grid grid-cols-4 gap-2"
```
- [ ] **Issue**: No responsive breakpoint - may be too narrow on 375px
- [ ] **Recommendation**: Change to `grid-cols-2 sm:grid-cols-4`
- [ ] Test button tap targets (should be ≥44px)

#### Line 310: Action buttons grid
```tsx
className="grid grid-cols-2 gap-4"
```
- [ ] Test AGREE/DISAGREE buttons at 375px
- [ ] Verify minimum 44px tap height
- [ ] Check font size is readable

#### Pool Display (Lines 185-205)
- [ ] Currency values don't overflow
- [ ] Two-column layout works on 375px
- [ ] Odds multipliers visible

### LivePnL Component

#### Line 237: Price display
```tsx
className="text-5xl sm:text-6xl font-bold"
```
- ✅ Responsive text sizing
- [ ] Test at 375px - should be `text-5xl`
- [ ] Test at 640px+ - should be `text-6xl`

#### Line 418: Layout container
```tsx
className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
```
- ✅ Mobile: Vertical stack
- ✅ Desktop: Horizontal row
- [ ] Verify spacing at breakpoint (640px)

#### Line 437: Icon group spacing
```tsx
className="flex items-center gap-6 sm:gap-8"
```
- [ ] Test icon spacing on mobile (6 units = 24px)
- [ ] Test on tablet (8 units = 32px)

### SettlementResult Component

#### Line 160: Result text
```tsx
className="text-3xl sm:text-4xl font-bold"
```
- [ ] Test at 375px (3xl)
- [ ] Test at 640px+ (4xl)

#### Line 415: Metrics grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 gap-4"
```
- [ ] Single column on mobile
- [ ] Two columns on tablet+

### CouncilVotes Component

#### Line 284: Header spacing
```tsx
className="flex items-start justify-between gap-1 sm:gap-2"
```
- [ ] Test minimal gap (4px) on mobile
- [ ] Test expanded gap (8px) on tablet

## Critical Touch Targets

All interactive elements should meet WCAG 2.1 Level AAA guidelines:

### Minimum 44×44px Touch Targets
- [ ] Quick amount buttons ($100, $250, $500, $1000)
- [ ] AGREE button
- [ ] DISAGREE button
- [ ] "How It Works" toggle
- [ ] Connect Wallet button
- [ ] Retry Connection button

## Typography Scaling

### Minimum Font Sizes
- Body text: ≥16px (prevents mobile browser zoom)
- Small text: ≥14px
- Labels: ≥12px

### Test Cases
- [ ] All text readable without zooming on iPhone SE (375px)
- [ ] Currency values don't truncate
- [ ] Time remaining counter visible
- [ ] Phase labels readable

## Horizontal Scroll Prevention

### Common Causes
1. Fixed-width elements exceeding viewport
2. Negative margins without container constraints
3. Absolute positioning outside viewport
4. Grid/flex items not wrapping properly

### Test Checklist
- [ ] No horizontal scroll on predict page (375px)
- [ ] Tables scroll horizontally in container (not page)
- [ ] Modal/popups fit within viewport
- [ ] Images scale responsively

## Spacing & Padding

### Container Padding
```tsx
className="container mx-auto px-4 py-6"
```
- [ ] Adequate padding on mobile (16px)
- [ ] Content doesn't touch screen edges

### Component Gaps
- [ ] Grid gaps appropriate for screen size
- [ ] Stack spacing consistent

## Testing Tools

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone SE (375×667)
4. Test all interactions
5. Select iPad (768×1024)
6. Repeat tests
7. Check touch emulation enabled

### Manual Testing
```bash
# Start dev server
npm run dev

# Access from mobile device on same network
# Server: http://10.0.0.204:3000
```

## Known Issues

### Issue 1: Quick Amount Buttons (BettingPanel)
- **Component**: BettingPanel.tsx:273
- **Current**: `grid-cols-4 gap-2`
- **Problem**: 4 columns may be cramped on 375px width
- **Fix**: Change to `grid-cols-2 sm:grid-cols-4 gap-2`
- **Impact**: Medium - affects bet placement UX

### Issue 2: No responsive breakpoints audit
- **Status**: Need systematic check of all components
- **Priority**: Medium
- **Action**: Create follow-up task CVAULT-XXX

## Recommendations

1. **Add Mobile-First Approach**
   - Default styles for mobile (375px)
   - Progressive enhancement for larger screens
   - Use `sm:`, `md:`, `lg:` prefixes consistently

2. **Touch Target Guidelines**
   - Minimum 44×44px for all interactive elements
   - Add padding to increase tap area without visual size
   - Test with touch emulation enabled

3. **Typography Scale**
   - Use responsive text classes (`text-sm sm:text-base`)
   - Ensure minimum 16px for body text
   - Test readability without zoom

4. **Container Strategy**
   - Use `container mx-auto px-4` for consistent padding
   - Add max-width constraints for very large screens
   - Ensure content doesn't touch edges

## Follow-Up Tasks

- [ ] CVAULT-XXX: Fix BettingPanel quick amount button grid for mobile
- [ ] CVAULT-XXX: Comprehensive responsive design audit
- [ ] CVAULT-XXX: Add mobile device testing to CI/CD
- [ ] CVAULT-XXX: Create responsive design system documentation
