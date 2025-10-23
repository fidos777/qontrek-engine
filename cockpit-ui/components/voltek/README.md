# Voltek Governance Components

R1.5.2 - Governance Feedback Layer

A collection of animated UI components for Tower governance visualization, proof freshness tracking, and AI-powered suggestions.

## Components

### GovernanceHeaderStrip

Animated header strip displaying governance badges (G13-G18) with cycling animations and real-time sync status.

**Features:**
- Cycles through badges every 3 seconds
- Glowing pulse effects on active badge
- Hover tooltips showing badge names
- Animated Shield and CheckCircle2 icons
- Real-time sync status footer
- Respects `prefers-reduced-motion`

**Usage:**
```tsx
import GovernanceHeaderStrip from '@/components/voltek/GovernanceHeaderStrip';

<GovernanceHeaderStrip
  cycleInterval={3000}
  showFooter={true}
  lastSync={new Date()}
/>
```

### HologramBadge

Holographic badge with animated gradient background and scanning line effect.

**Features:**
- SVG gradient background (blue-purple shifting)
- Animated gradient stops
- Cycling shadow effects (blue→purple→blue)
- White scanning line animation
- Corner accent decorations

**Usage:**
```tsx
import HologramBadge from '@/components/voltek/HologramBadge';

<HologramBadge text="Tower Federation Certified" />
```

### ProofFreshnessIndicator

Real-time proof freshness indicator with color-coded states.

**Features:**
- Updates every second
- Color states based on freshness:
  - Green (< 60s): Fresh with pulsing icon
  - Blue (60-300s): Recent
  - Yellow (300-3600s): Aging
  - Orange (> 3600s): Stale with rotating icon
- Emits `proof.sync` events
- Compact version available

**Usage:**
```tsx
import ProofFreshnessIndicator, { ProofFreshnessIndicatorCompact } from '@/components/voltek/ProofFreshnessIndicator';

<ProofFreshnessIndicator
  lastUpdated={new Date()}
  source="tower-api"
/>

// Compact version for tight spaces
<ProofFreshnessIndicatorCompact lastUpdated={new Date()} />
```

### AISuggestionBadge

AI-powered suggestion badge with sparkle animations and confidence display.

**Features:**
- Action-specific icons (call, SMS, WhatsApp, escalate)
- Confidence percentage display
- Rotating sparkles icon
- Hover tooltip with reasoning
- Confidence progress bar
- Compact version available

**Usage:**
```tsx
import AISuggestionBadge, { AISuggestionBadgeCompact } from '@/components/voltek/AISuggestionBadge';

<AISuggestionBadge
  action="call"
  confidence={87}
  reasoning="High engagement history, optimal time window"
  onClick={() => console.log('Action clicked')}
/>

// Compact version for table cells
<AISuggestionBadgeCompact action="whatsapp" confidence={92} />
```

## Event System

### Governance Events

Central event bus for governance layer communication.

**Event Types:**
- `proof.sync`: Proof synchronization updates
- `tower.receipt`: Tower receipt events
- `ai.suggestion`: AI suggestion events
- `recovery.success`: Successful recovery events
- `badge.cycle`: Badge cycling notifications

**Usage:**
```ts
import { governanceEvents, emitAISuggestion } from '@/lib/events/governance-events';

// Emit events
emitAISuggestion('lead-123', 'call', 87, 'High engagement history');

// Subscribe to events
governanceEvents.on('ai.suggestion', (event) => {
  console.log('AI suggestion:', event.data);
});
```

## Hooks

### useAISuggestions

Hook for subscribing to AI suggestions from the governance event bus.

**Usage:**
```tsx
import { useAISuggestions } from '@/lib/hooks/useAISuggestions';

function MyComponent() {
  const suggestions = useAISuggestions();

  return (
    <div>
      {suggestions.map(s => (
        <AISuggestionBadge
          key={s.leadId}
          action={s.action}
          confidence={s.confidence}
          reasoning={s.reasoning}
        />
      ))}
    </div>
  );
}
```

### Additional Hooks

- `useRecoveryEvents()`: Track successful recovery events
- `useBadgeCycle()`: Monitor badge cycling state

## Performance

All components are optimized for 60fps performance:

- Use CSS transforms for animations (GPU-accelerated)
- Respect `prefers-reduced-motion` setting
- Efficient re-rendering with React hooks
- Low CPU usage even with multiple animations

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Reduced motion support
- Color contrast compliance

## Integration Example

See `app/gates/g2/page.tsx` for a complete integration example.

```tsx
import GovernanceHeaderStrip from '@/components/voltek/GovernanceHeaderStrip';
import HologramBadge from '@/components/voltek/HologramBadge';
import ProofFreshnessIndicator from '@/components/voltek/ProofFreshnessIndicator';
import { useAISuggestions } from '@/lib/hooks/useAISuggestions';

export default function Dashboard() {
  const [dataLoadedAt, setDataLoadedAt] = useState(new Date());
  const aiSuggestions = useAISuggestions();

  return (
    <>
      <GovernanceHeaderStrip lastSync={dataLoadedAt} />

      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1>Dashboard</h1>
          <ProofFreshnessIndicator lastUpdated={dataLoadedAt} />
        </div>

        {/* Your content here */}

        <HologramBadge text="Tower Federation Certified" />
      </div>
    </>
  );
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with CSS transforms support

## Dependencies

- `framer-motion`: Animation library
- `lucide-react`: Icon library
- `react`: 18.2+
- `tailwindcss`: 3.4+
