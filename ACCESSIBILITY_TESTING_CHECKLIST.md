# Accessibility Testing Checklist - CVAULT-155

Use this checklist to verify keyboard navigation and screen reader accessibility.

## Pre-Test Setup

1. **Disable your mouse/trackpad** - Unplug or disable to ensure keyboard-only testing
2. **Enable a screen reader**:
   - Windows: NVDA (free) or JAWS
   - Mac: VoiceOver (Cmd+F5 to toggle)
   - Linux: Orca
3. **Open browser DevTools** - Check for ARIA attributes in Elements panel

## Keyboard Navigation Tests

### Tab Navigation (Entire App)
- [ ] Can Tab to all interactive elements (buttons, links, inputs)
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Visible focus indicator appears on all elements
- [ ] Can Shift+Tab to navigate backwards
- [ ] Focus never gets "trapped" (except in modals where it should)

### Specific Components

#### Navigation
- [ ] Skip to main content link appears on first Tab (hidden until focused)
- [ ] Can Tab through all nav links
- [ ] Active page is indicated to screen reader (aria-current="page")
- [ ] Mobile menu: Enter/Space opens menu
- [ ] Mobile menu: Escape closes menu
- [ ] Mobile menu: Focus returns to menu button after close

#### Deposit/Withdraw Modals
- [ ] Tab cycles within modal (focus trap works)
- [ ] Shift+Tab cycles backwards within modal
- [ ] Escape key closes modal
- [ ] Focus returns to button that opened modal
- [ ] First element in modal is auto-focused
- [ ] Form inputs can be typed in
- [ ] Buttons can be activated with Enter/Space

#### Betting Panel
- [ ] Can Tab to all form inputs
- [ ] Can Tab to quick amount buttons
- [ ] Can Tab to AGREE/DISAGREE buttons
- [ ] Enter/Space activates buttons
- [ ] Error messages are announced
- [ ] Progress bar status is announced

#### Chat Room
- [ ] Can Tab to scroll-to-bottom button
- [ ] Enter/Space activates scroll button
- [ ] New messages are announced (aria-live)
- [ ] Connection status is announced

#### Toast Notifications
- [ ] Error toasts are announced immediately (assertive)
- [ ] Success/info toasts are announced politely
- [ ] Can Tab to close button
- [ ] Enter/Space closes toast

#### Analyst Cards
- [ ] Can Tab to retry buttons (if present)
- [ ] Enter/Space activates retry
- [ ] Card status is announced
- [ ] Error messages are announced
- [ ] Loading state is announced

#### Council Votes
- [ ] Each model vote card is announced
- [ ] Vote status (BUY/SELL/HOLD) is announced
- [ ] Confidence percentage is announced
- [ ] Loading state is announced

## Screen Reader Tests

### General
- [ ] Page title is announced
- [ ] Main landmark is identified
- [ ] Navigation landmarks are identified
- [ ] All interactive elements have accessible names

### Forms
- [ ] All inputs have associated labels
- [ ] Required fields are indicated
- [ ] Error messages are announced
- [ ] Help text is available (aria-describedby)

### Dynamic Content
- [ ] Consensus meter updates are announced
- [ ] Price changes are announced
- [ ] New chat messages are announced
- [ ] Toast notifications are announced
- [ ] Loading states are announced

### Modals
- [ ] Modal open is announced
- [ ] Modal title is announced
- [ ] Modal content is readable
- [ ] Modal close is announced (focus returned)

## Visual Accessibility Tests

### Focus Indicators
- [ ] Focus visible on all elements (2px outline)
- [ ] Focus indicator has good contrast
- [ ] Focus indicator is visible in both light and dark modes

### Color Contrast
- [ ] Text has minimum 4.5:1 contrast ratio
- [ ] Interactive elements have 3:1 contrast ratio
- [ ] Icons have text alternatives or sufficient contrast

### Text Sizing
- [ ] Text can be zoomed to 200% without horizontal scroll
- [ ] Text remains readable at 200% zoom

## Automated Tools

### Lighthouse Accessibility Audit
Run: `npm run lighthouse` or use Chrome DevTools > Lighthouse > Accessibility

Expected Score: **95+**

Check:
- [ ] Color contrast
- [ ] Image alt text
- [ ] Link text (not "click here")
- [ ] Labels on form inputs
- [ ] ARIA attributes valid

### axe DevTools
Run: Chrome DevTools > axe DevTools > Scan ALL of my page

Expected: **0 violations**

Check:
- [ ] No ARIA issues
- [ ] No color contrast issues
- [ ] No focus management issues
- [ ] No label issues

### WAVE Browser Extension
Run: Chrome/Firefox > WAVE extension

Check:
- [ ] No errors (red icons)
- [ ] No alerts (yellow icons) unless intentional
- [ ] All features are accessible

## Component-Specific Tests

### BettingPanel
- [ ] Input has label "Bet Amount (USD)"
- [ ] Input has aria-describedby for constraints
- [ ] Quick amount buttons have aria-label
- [ ] AGREE/DISAGREE buttons have descriptive aria-label
- [ ] Progress bar has role="progressbar" with all attributes
- [ ] Timer has role="timer" with aria-label
- [ ] Error messages have role="alert"

### DepositModal
- [ ] Has role="dialog" and aria-modal="true"
- [ ] Has aria-labelledby pointing to title
- [ ] Close button has aria-label="Close modal"
- [ ] Amount input has label and description
- [ ] MAX button has aria-label
- [ ] Error messages have role="alert"

### WithdrawModal
- [ ] Has role="dialog" and aria-modal="true"
- [ ] Has aria-labelledby and aria-describedby
- [ ] Close button has aria-label="Close modal"
- [ ] Amount input has label and description
- [ ] Error messages have role="alert"

### Navigation
- [ ] Skip link works (jumps to main content)
- [ ] Nav has role="navigation" with aria-label
- [ ] Mobile menu button has aria-expanded and aria-controls
- [ ] Active link has aria-current="page"

### ChatRoom
- [ ] Has role="region" with aria-label
- [ ] Message area has role="log"
- [ ] Message area has aria-live="polite"
- [ ] Scroll button has aria-label

### Toast
- [ ] Errors have role="alert" and aria-live="assertive"
- [ ] Success/info have role="status" and aria-live="polite"
- [ ] Close button has aria-label
- [ ] Toast has aria-atomic="true"

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

## Mobile Accessibility

- [ ] Touch targets are at least 44x44px
- [ ] Can navigate with swipe gestures
- [ ] Zoom works to 200%
- [ ] Screen reader works (TalkBack on Android, VoiceOver on iOS)

## Performance Impact

- [ ] Page load time is acceptable
- [ ] Focus transitions are smooth
- [ ] No lag when tabbing through elements

## Documentation

- [ ] All changes documented in CVAULT-155_ACCESSIBILITY_IMPROVEMENTS.md
- [ ] Work log updated (CVAULT-155_WORK_LOG.txt)

---

## How to Fix Issues Found

### Focus Not Visible
- Add `focus-visible` styles in globals.css
- Ensure outline has sufficient contrast

### Element Not Reachable via Tab
- Add `tabindex={0}` if non-interactive element needs focus
- Ensure element is not `display: none` or `visibility: hidden`

### Screen Reader Not Announcing
- Add `aria-label` for icon-only buttons
- Add `aria-live` for dynamic content
- Add `role` with appropriate value
- Ensure text alternatives exist for icons

### Modal Focus Issues
- Ensure focus trap is implemented
- Check that Escape key handler is active
- Verify focus restoration on close

### Form Validation Not Announced
- Add `role="alert"` to error messages
- Add `aria-live="assertive"` for immediate announcement
- Associate errors with inputs using `aria-describedby`

---

## Expected Results

✅ **Pass Criteria:**
- All keyboard navigation tests pass
- Lighthouse Accessibility score 95+
- No axe DevTools violations
- Screen reader can navigate entire app
- All interactive elements are reachable and usable via keyboard
- All dynamic content is announced to screen readers

✅ **Success Metrics:**
- 100% of high-priority components accessible
- 0 critical accessibility issues
- WCAG 2.1 AA compliant
