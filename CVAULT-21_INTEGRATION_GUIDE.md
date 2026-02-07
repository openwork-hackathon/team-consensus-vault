# SignalHistory - Quick Integration Guide

## 🚀 Ready to Use

The SignalHistory component is complete and ready for integration. Here's how to add it to the dashboard.

## Step 1: Import the Component

```typescript
// In src/app/page.tsx
import SignalHistory, { SignalHistoryEntry } from '@/components/SignalHistory';
```

## Step 2: Add State Management

```typescript
export default function Dashboard() {
  // ... existing code ...

  // Add signal history state
  const [signalHistory, setSignalHistory] = useState<SignalHistoryEntry[]>([]);
```

## Step 3: Capture Signals from Consensus

Add this function to capture consensus results:

```typescript
  // Add this callback when consensus analysis completes
  const handleConsensusComplete = useCallback((consensusData: any) => {
    // Create signal entry
    const signal: SignalHistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      query: 'BTC/USD analysis', // or from user input
      asset: 'BTC/USD',
      signalType: consensusData.recommendation, // 'BUY' | 'SELL' | 'HOLD'
      confidence: consensusData.consensusLevel,
      reasoning: consensusData.analysts
        .filter((a: any) => !a.error)
        .map((a: any) => `${a.name}: ${a.reasoning}`)
        .join('\n\n')
    };

    // Add to history
    setSignalHistory(prev => [...prev, signal]);

    // Optional: persist to localStorage
    localStorage.setItem('signal_history', JSON.stringify([...signalHistory, signal]));
  }, [signalHistory]);
```

## Step 4: Add Component to Layout

Add the component to your page layout (example placement):

```typescript
  return (
    <main className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* ... existing components ... */}

        {/* Consensus Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConsensusMeter ... />
          <TradeSignal ... />
        </div>

        {/* Performance Section */}
        <TradingPerformance />

        {/* NEW: Signal History Section */}
        <SignalHistory signals={signalHistory} maxEntries={10} />

      </div>
    </main>
  );
```

## Step 5: Optional - Load from LocalStorage

Load persisted signals on mount:

```typescript
  useEffect(() => {
    // Load signal history from localStorage on mount
    const stored = localStorage.getItem('signal_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSignalHistory(parsed);
      } catch (e) {
        console.error('Failed to load signal history:', e);
      }
    }
  }, []);
```

## Alternative: API-Based Storage

If you prefer API-based storage:

### Create API Route

```typescript
// src/app/api/signals/history/route.ts
import { NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
let signals: SignalHistoryEntry[] = [];

export async function GET() {
  return NextResponse.json({ success: true, signals });
}

export async function POST(request: Request) {
  const signal = await request.json();
  signals.push(signal);

  // Keep only last 50 signals
  if (signals.length > 50) {
    signals = signals.slice(-50);
  }

  return NextResponse.json({ success: true });
}
```

### Fetch from API

```typescript
  // Fetch signals on mount
  useEffect(() => {
    async function fetchSignals() {
      try {
        const response = await fetch('/api/signals/history');
        const data = await response.json();
        if (data.success) {
          setSignalHistory(data.signals);
        }
      } catch (error) {
        console.error('Failed to fetch signals:', error);
      }
    }
    fetchSignals();
  }, []);

  // Save signal to API
  const saveSignal = async (signal: SignalHistoryEntry) => {
    try {
      await fetch('/api/signals/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal)
      });
      setSignalHistory(prev => [...prev, signal]);
    } catch (error) {
      console.error('Failed to save signal:', error);
    }
  };
```

## Testing

Test with mock data:

```typescript
// Add a "Generate Test Signal" button for testing
const addTestSignal = () => {
  const types: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
  const signal: SignalHistoryEntry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    query: 'Test analysis',
    asset: 'BTC/USD',
    signalType: types[Math.floor(Math.random() * 3)],
    confidence: Math.floor(Math.random() * 40) + 60,
    reasoning: 'This is a test signal for demonstration purposes.'
  };
  setSignalHistory(prev => [...prev, signal]);
};

// Add button to UI
<button onClick={addTestSignal}>Generate Test Signal</button>
```

## Complete Example

See `src/components/SignalHistory.example.tsx` for complete integration examples.

## That's It!

The component is ready to use. It will automatically:
- Display signals in reverse chronological order
- Format timestamps intelligently
- Color-code by signal type
- Allow expanding/collapsing reasoning
- Show empty state when no signals exist
- Handle responsive layout

## Questions?

See `CVAULT-21_IMPLEMENTATION.md` for complete technical documentation.
