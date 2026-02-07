# Consensus Vault - Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with dark theme
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles and CSS variables
├── components/
│   ├── AnalystCard.tsx     # Individual AI analyst display
│   ├── ConsensusMeter.tsx  # Consensus progress visualization
│   └── TradeSignal.tsx     # Trade alert when consensus reached
└── lib/
    ├── types.ts            # TypeScript type definitions
    └── useConsensusStream.ts # SSE client hook (currently mocked)
```

## Key Features

### 1. AI Analyst Cards
- **5 analysts**: DeepSeek, Kimi, MiniMax, GLM, Gemini
- Color-coded by sentiment (green=bullish, red=bearish, gray=neutral)
- Real-time confidence percentages
- Streaming reasoning text with typing indicators

### 2. Consensus Meter
- Animated progress bar showing agreement level (0-100%)
- Color transitions: red → yellow → green
- Threshold marker at 80%
- Updates in real-time as analysts complete

### 3. Trade Signal
- Activates when consensus ≥ 80%
- Shows BUY/SELL/HOLD recommendation
- Pulsing animation to draw attention
- Displays consensus percentage

### 4. Mobile Responsive
- Stacks analyst cards vertically on mobile
- Touch-friendly interactions
- Optimized for iPhone (judges test on mobile)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Integration with Backend

The frontend is ready for SSE integration. To connect to the consensus engine (CVAULT-2):

1. Update `src/lib/useConsensusStream.ts`
2. Replace mock simulation with actual EventSource connection
3. Set SSE endpoint in environment variable

Example SSE integration:

```typescript
useEffect(() => {
  const eventSource = new EventSource('/api/consensus-stream');
  
  eventSource.onmessage = (event) => {
    const { analystId, sentiment, confidence, reasoning } = JSON.parse(event.data);
    
    setConsensusData(prev => ({
      ...prev,
      analysts: prev.analysts.map(a => 
        a.id === analystId 
          ? { ...a, sentiment, confidence, reasoning, isTyping: false }
          : a
      ),
    }));
  };
  
  return () => eventSource.close();
}, []);
```

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SSE_ENDPOINT=/api/consensus-stream
```

## Mobile Testing

Test on actual iPhone or use browser dev tools:
- iPhone 12 Pro: 390x844
- iPhone 14 Pro Max: 430x932
- Chrome DevTools → Toggle device toolbar

## Performance

- First Load JS: ~128 kB (excellent)
- Static generation enabled
- All components use client-side rendering for real-time updates
- Framer Motion animations optimized with CSS transforms

## Design Decisions

1. **Dark theme by default** - fintech aesthetic, easier on eyes
2. **Color psychology** - Green (bullish), Red (bearish), Gray (neutral)
3. **Unique analyst identities** - Each has distinct color, emoji, role
4. **Progressive disclosure** - Info appears as analysts complete
5. **Prominent signals** - Trade alerts use size, color, animation

## Next Steps

- [ ] Connect to actual SSE endpoint from CVAULT-2
- [ ] Add wallet connection (CVAULT-6)
- [ ] Integrate with paper trading engine (CVAULT-5)
- [ ] Deploy to Vercel
- [ ] Test on iPhone
