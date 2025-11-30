# Impact Summary Modal

## Overview

The Impact Summary modal displays before/after KPI comparisons when data imports complete. It shows animated deltas for key metrics and celebrates significant improvements with confetti.

## Components

### `ImpactSummaryModal.tsx`

The main modal component that displays KPI deltas with animations.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal closes
- `before: Snapshot | null` - Previous snapshot data
- `after: Snapshot | null` - Current snapshot data

**Features:**
- Animated counter transitions (ease-out curve)
- Color-coded deltas (green for positive, red for negative)
- Confetti celebration when `trust_index` increases by ≥3 points
- Responsive design with Tailwind CSS

### Store: `lib/voltek/snapshotStore.ts`

Manages snapshot state for KPI tracking.

**Functions:**
- `getSnapshot()` - Returns current snapshot
- `getPrevSnapshot()` - Returns previous snapshot
- `updateSnapshot(snapshot)` - Updates snapshots (current → previous, new → current)
- `initializeSnapshot(data)` - Initialize from partial data
- `resetSnapshots()` - Clear all snapshots (for testing)

**Snapshot Interface:**
```ts
interface Snapshot {
  recovery_rate_7d: number;  // 0-1 range (e.g., 0.32 = 32%)
  success_rate: number;      // 0-1 range
  trust_index: number;       // 0-100 scale
  timestamp: string;         // ISO 8601
}
```

### Hooks: `lib/voltek/useImpactSummary.ts`

React hooks for modal management and event integration.

**`useImpactSummary()`**
Returns modal state and controls:
```ts
const { isOpen, openModal, closeModal, beforeSnapshot, afterSnapshot } = useImpactSummary();
```

**`useImportCompletedListener(callback)`**
Auto-trigger callback on `import:completed` events:
```ts
useImportCompletedListener(impact.openModal);
```

**`dispatchImportCompleted()`**
Fire the import completion event:
```ts
dispatchImportCompleted();
```

## Usage Example

### Basic Integration

```tsx
import { useImpactSummary, useImportCompletedListener } from '@/lib/voltek';
import { ImpactSummaryModal } from '@/components/voltek';

function MyApp() {
  const impact = useImpactSummary();

  // Auto-open modal when imports complete
  useImportCompletedListener(impact.openModal);

  return (
    <>
      <YourContent />
      <ImpactSummaryModal
        isOpen={impact.isOpen}
        onClose={impact.closeModal}
        before={impact.beforeSnapshot}
        after={impact.afterSnapshot}
      />
    </>
  );
}
```

### Triggering the Modal

When your import completes:

```ts
import { updateSnapshot, dispatchImportCompleted } from '@/lib/voltek';

async function handleImport() {
  // Fetch new data
  const data = await fetchLatestMetrics();

  // Update snapshot
  updateSnapshot({
    recovery_rate_7d: data.recovery_rate_7d,
    success_rate: data.success_rate,
    trust_index: data.trust_index,
    timestamp: new Date().toISOString(),
  });

  // Trigger modal
  dispatchImportCompleted();
}
```

### Demo Component

See `ImpactSummaryExample.tsx` for a complete working example with simulated import.

## Dependencies

- `canvas-confetti` - Confetti animations for celebrations
- `@types/canvas-confetti` - TypeScript definitions
- React 18+
- Tailwind CSS (for styling)

## Event Flow

1. User triggers import operation
2. System calls `updateSnapshot()` with new data
3. System calls `dispatchImportCompleted()`
4. `useImportCompletedListener` receives event
5. Modal opens with before/after snapshots
6. User sees animated deltas
7. If trust_index Δ ≥ 3, confetti fires
8. User clicks "Continue" to close

## Styling

The modal uses Tailwind CSS utility classes. Colors:
- **Green**: `text-green-600`, `bg-green-50` (positive deltas)
- **Red**: `text-red-600`, `bg-red-50` (negative deltas)
- **Gray**: Neutral/unchanged values

## Testing

```ts
import { resetSnapshots, initializeSnapshot, updateSnapshot } from '@/lib/voltek';

// Reset state
resetSnapshots();

// Create test snapshots
initializeSnapshot({ recovery_rate_7d: 0.30, success_rate: 0.90, trust_index: 85.0 });
updateSnapshot({ recovery_rate_7d: 0.35, success_rate: 0.95, trust_index: 92.0, timestamp: new Date().toISOString() });

// Now getPrevSnapshot() and getSnapshot() return test data
```

## Files Created

```
cockpit-ui/
├── components/voltek/
│   ├── ImpactSummaryModal.tsx      # Main modal component
│   ├── ImpactSummaryExample.tsx    # Demo/example
│   ├── index.ts                     # Exports
│   └── README.md                    # This file
└── lib/voltek/
    ├── snapshotStore.ts             # State management
    ├── useImpactSummary.ts          # React hooks
    └── index.ts                     # Exports
```

## Session Info

- **Session ID**: 2B
- **Branch**: `claude/impact-summary-modal-011CUUtDgiGuqSXQ8Y2GKynf`
- **Goal**: Impact summary modal with KPI deltas and confetti on trust_index ≥ 3
