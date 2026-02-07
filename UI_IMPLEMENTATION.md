# Consensus Vault - UI Implementation (CVAULT-3)

## Overview
Real-time consensus dashboard UI for the Consensus Vault hackathon project. Built with Next.js 14, Tailwind CSS, and Framer Motion.

## ✅ Implemented Features

### 1. AI Analyst Cards (5 Total)
- **Color-coded design**: Each analyst has unique avatar, border, and background colors
- **Real-time status**: Displays current thesis (bullish/bearish/neutral) with sentiment icons
- **Confidence display**: Prominent percentage display (0-100%)
- **Streaming reasoning**: Text appears with smooth fade-in animation
- **Typing indicator**: Animated "Analyzing ●●●" while models are processing
- **Progress bar**: Visual streaming indicator at bottom of card during analysis

**Analysts:**
1. 📊 **DeepSeek Quant** (Blue) - Technical analysis specialist
2. 🌍 **Kimi Macro** (Purple) - Macroeconomic perspective
3. 💭 **MiniMax Sentiment** (Pink) - Social sentiment analysis
4. 📈 **GLM Technical** (Green) - Chart patterns and indicators
5. ⚖️ **Gemini Risk** (Orange) - Risk assessment

### 2. Real-time SSE Integration
- **Dual-mode streaming**: Supports both real SSE endpoint and mock data fallback
- **Auto-detection**: Automatically tries SSE endpoint, falls back to mock if unavailable
- **Event handling**: Proper SSE connection management with cleanup
- **API route**: `/api/consensus` endpoint ready for backend integration (CVAULT-2)
- **Mock streaming**: Realistic timing delays (1.5s - 3s) for demo purposes

### 3. Consensus Meter
- **Visual progress bar**: Animated gradient fill (0-100%)
- **Color transitions**:
  - Red (0-40%): Disagreement/divergent
  - Yellow (40-70%): Building consensus
  - Green (70-100%): Strong agreement
- **Threshold marker**: Visual indicator at 80% (configurable)
- **Status text**: Dynamic labels based on consensus level
- **Pulsing effect**: When threshold is reached, bar pulses to draw attention

### 4. Trade Signal
- **Conditional display**: Only appears when consensus ≥ threshold
- **Signal types**: BUY (🚀), SELL (⚠️), HOLD (⏸️)
- **Animated appearance**: Smooth scale and fade-in entrance
- **Pulsing background**: Continuous pulse effect to draw attention
- **Action button**: "Execute Trade" with hover/tap animations
- **Gradient backgrounds**: Color-coded by signal type

### 5. Mobile Responsive Design
- **Breakpoint strategy**:
  - Mobile (< 640px): Single column, stacked layout
  - Tablet (640-1024px): 2 columns
  - Desktop (1024-1280px): 3 columns
  - Large (> 1280px): 5 columns (one per analyst)
- **Touch-optimized**: All buttons have `touch-manipulation` class
- **Responsive typography**: Text scales down on mobile (text-xs sm:text-sm)
- **Flexible spacing**: Reduced gaps on mobile (gap-3 sm:gap-4)
- **Truncation**: Analyst names truncate on very small screens
- **Sticky header**: Navigation stays visible during scroll

## Technical Implementation

### Component Architecture
```
src/
├── app/
│   ├── api/consensus/route.ts    # SSE endpoint (mock + ready for backend)
│   ├── layout.tsx                # Root layout with dark mode
│   ├── page.tsx                  # Main dashboard
│   └── globals.css               # Dark theme variables
├── components/
│   ├── AnalystCard.tsx           # Individual analyst display
│   ├── ConsensusMeter.tsx        # Progress bar visualization
│   └── TradeSignal.tsx           # Alert when consensus reached
└── lib/
    ├── types.ts                  # TypeScript interfaces
    └── useConsensusStream.ts     # SSE hook + consensus logic
```

### State Management
- **Custom hook**: `useConsensusStream()` handles all consensus logic
- **Real-time updates**: State updates as each analyst response arrives
- **Consensus calculation**: Agreement ratio × average confidence
- **Recommendation logic**: Based on majority sentiment when threshold met

### Animations (Framer Motion)
- **Staggered entrance**: Cards appear with 0.1s delay between each
- **Smooth transitions**: 0.3-0.8s easing on all state changes
- **Pulsing effects**: Infinite loops for attention-grabbing elements
- **Typing indicator**: Opacity pulse (0.3 → 1 → 0.3)
- **Progress bars**: Animated width changes with easeOut

### Styling (Tailwind CSS)
- **Dark mode**: Enabled by default with `className="dark"` on html
- **Custom colors**:
  - `bullish`: Green (hsl(142 76% 36%))
  - `bearish`: Red (hsl(0 84% 60%))
  - `neutral`: Gray (hsl(0 0% 50%))
- **Backdrop blur**: Used for modern glass-morphism effect
- **Gradient backgrounds**: Multi-color gradients for visual interest

## Integration Points

### Backend Integration (CVAULT-2)
The UI is ready to connect to the real backend:

1. **SSE Endpoint**: Update `apiEndpoint` prop if not using `/api/consensus`
2. **Event format**: Backend should emit JSON events:
```json
{
  "id": "deepseek",
  "sentiment": "bullish",
  "confidence": 85,
  "reasoning": "Technical indicators show..."
}
```

3. **Auto-detection**: UI will automatically switch from mock to real SSE

### Environment Variables (Optional)
```env
NEXT_PUBLIC_API_ENDPOINT=/api/consensus  # SSE endpoint URL
NEXT_PUBLIC_CONSENSUS_THRESHOLD=80       # Threshold percentage
```

## Performance Optimizations

1. **Lazy animations**: Only animate visible elements
2. **Debounced updates**: State batching prevents excessive re-renders
3. **Stream cleanup**: Proper EventSource closure on unmount
4. **Conditional rendering**: Trade signal only renders when active
5. **CSS transitions**: Hardware-accelerated transforms

## Testing for Judges

### Mobile Testing (iPhone)
1. Open `https://team-consensus-vault.vercel.app` on mobile
2. Verify:
   - Cards stack vertically
   - Text is readable (not too small)
   - Touch targets are at least 44x44px
   - Animations are smooth (60fps)
   - No horizontal scrolling

### Demo Flow
1. **Loading state**: All analysts show "Analyzing ●●●"
2. **Streaming**: Analysts update one by one (1.5-3s intervals)
3. **Consensus builds**: Progress bar fills from red → yellow → green
4. **Trade signal**: Appears with pulse when threshold hit
5. **Final state**: All analysts complete, recommendation shown

## Future Enhancements (Post-Hackathon)

- [ ] Historical consensus tracking graph
- [ ] Analyst confidence history sparklines
- [ ] WebSocket fallback for browsers without SSE
- [ ] Sound effects on consensus reached
- [ ] Export trade signals to CSV/JSON
- [ ] Multi-asset support (ETH, SOL, etc.)
- [ ] Custom threshold adjustment slider
- [ ] Analyst weight configuration (trust some more than others)

## Known Issues

- **Build optimization**: First production build may be slow (Next.js 14 optimization)
- **SSE in Vercel**: May need edge runtime configuration for SSE streaming
- **Mobile Safari**: Animated gradients occasionally jank (use will-change: transform)

## Files Modified/Created

### Created:
- `src/app/api/consensus/route.ts` - SSE endpoint

### Modified:
- `src/components/AnalystCard.tsx` - Mobile responsiveness improvements
- `src/components/TradeSignal.tsx` - Mobile layout and touch optimization
- `src/app/page.tsx` - Grid layout adjustments
- `src/lib/useConsensusStream.ts` - SSE integration + auto-detection

## Development Commands

```bash
# Development server
npm run dev              # http://localhost:3000

# Production build
npm run build
npm run start            # Requires build first

# Linting
npm run lint
```

## Deployment

The project is configured for Vercel deployment:
- Auto-deploys from main branch
- Preview deployments on PRs
- Environment variables in Vercel dashboard
- Edge runtime ready (add `export const runtime = 'edge'` to API routes if needed)

---

**Status**: ✅ Complete and ready for demo
**Mobile**: ✅ iPhone optimized
**SSE**: ✅ Integration ready (using mock data until CVAULT-2 complete)
**Animations**: ✅ Smooth and polished
**Demo**: https://team-consensus-vault.vercel.app
