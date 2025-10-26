# Voltek Data Model & Store

Session 1A implementation of canonical data types, validation schemas, and computed metrics store for the Voltek project.

## Overview

This module provides:

1. **TypeScript type definitions** for Voltek domain entities (leads, projects, datasets)
2. **Zod schemas** for runtime validation
3. **Computed metrics store** with KPI calculation and governance tracking
4. **Event-driven updates** via window.dispatchEvent
5. **Cryptographic proof hashing** for data integrity

## Files

### Core Data Model

- **`types.ts`** - Canonical TypeScript interfaces for all domain entities
  - `VoltekLead` - Lead/prospect entity
  - `VoltekProject` - Project entity
  - `VoltekDataset` - Complete dataset snapshot
  - `KpiSummary` - Computed KPI metrics
  - `GovernanceState` - Governance compliance state
  - `ComputedSnapshot` - Full snapshot with computed metrics

- **`schemas.ts`** - Zod validation schemas
  - Runtime validation for all data types
  - `safeParseDataset()` - Safe validation with error reporting
  - `safeParseLead()`, `safeParseProject()` - Entity-level validation
  - `validateDataset()` - Strict validation (throws on error)

- **`example.ts`** - Usage examples and mock data
  - `createMockDataset()` - Generate sample dataset
  - `runExamples()` - Demonstrates all features

### State Management

- **`../state/voltekStore.ts`** - Lightweight event-driven store
  - `setSnapshot()` - Load dataset and compute metrics
  - `getSnapshot()` - Retrieve current snapshot
  - `subscribe()` - Subscribe to changes
  - `computeKpis()` - Calculate KPIs from dataset
  - `computeGovernance()` - Calculate governance score
  - `hashSnapshot()` - Generate SHA-256 proof hash

### UI Components

- **`../ui/ProofChip.tsx`** - React component for proof hash display
  - Displays truncated hash in a pill-style button
  - Emits `open-proof-modal` event on click
  - Multiple variants (default, success, warning, info)
  - Multiple sizes (xs, sm, md)

## Usage

### Basic Usage

```typescript
import { setSnapshot, getSnapshot, subscribe } from "@/lib/state/voltekStore";
import { safeParseDataset } from "@/lib/data/schemas";
import { createMockDataset } from "@/lib/data/example";

// Create and validate dataset
const mockData = createMockDataset();
const result = safeParseDataset(mockData);

if (result.ok) {
  // Load into store (triggers computation and events)
  await setSnapshot(result.data, "manual");

  // Get computed snapshot
  const snapshot = getSnapshot();
  console.log("KPIs:", snapshot.summary);
  console.log("Governance:", snapshot.governance);
  console.log("Proof hash:", snapshot.hash);
}
```

### Subscribe to Changes

```typescript
const unsubscribe = subscribe((snapshot) => {
  console.log("Updated:", {
    projects: snapshot.totals.projects,
    trust_index: snapshot.summary.trust_index,
    governance_score: snapshot.governance.score,
  });
});

// Later: cleanup
unsubscribe();
```

### Listen to Proof Events

```typescript
window.addEventListener("proof.updated", (event: CustomEvent) => {
  const { freshness, source, hash } = event.detail;
  console.log(`Proof updated from ${source}, freshness: ${freshness}min`);
});
```

### Using ProofChip

```tsx
import { ProofChip } from "@/lib/ui/ProofChip";

export function MyComponent() {
  const snapshot = getSnapshot();

  return (
    <div>
      <h2>Dataset Proof</h2>
      {snapshot && (
        <ProofChip
          hash={snapshot.hash}
          variant="success"
          size="sm"
        />
      )}
    </div>
  );
}
```

## Computed Metrics

### KPI Summary

The store automatically computes:

- **recovery_rate_7d** - 7-day recovery rate (0-100)
- **success_rate** - Overall success rate (0-100)
- **trust_index** - Composite trust metric (0-100)
- **total_leads** - Count of all leads
- **total_projects** - Count of all projects
- **active_projects** - Count of active projects
- **total_revenue** - Sum of all project revenue
- **average_project_value** - Mean project value
- **lead_conversion_rate** - % of leads converted (0-100)

### Governance State

Governance scoring based on:

- **Data presence** (30 points) - Leads and projects exist
- **Data quality** (40 points) - Completeness of metrics and contact info
- **Recency** (30 points) - Age of import (<24h = 30pts, <72h = 20pts, <168h = 10pts)

Default badges: `["G13", "G14", "G15", "G16", "G17", "G18"]`

Compliance levels:
- **full** - Score ≥ 80
- **partial** - Score ≥ 50
- **none** - Score < 50

## Events

### `proof.updated`

Fired on `window` whenever `setSnapshot()` is called.

**Event detail:**
```typescript
{
  freshness: number,      // Minutes since import
  source: string,         // "import" | "supabase" | "manual"
  hash: string,           // Full SHA-256 hash
  timestamp: string       // ISO 8601 timestamp
}
```

### `open-proof-modal`

Fired when ProofChip is clicked.

**Event detail:**
```typescript
{
  hash: string  // Full hash string
}
```

## Type Safety

All data structures are:
- Typed with TypeScript interfaces
- Validated at runtime with Zod schemas
- Exported for use throughout the application

Use `safeParseDataset()` for safe validation with error handling, or `validateDataset()` for strict validation that throws on errors.

## Hashing

Proof hashes are generated using:
- **Web Crypto API** (SHA-256) in browsers
- **Fallback hash** (simple numeric hash) in Node.js environments

The hash is stable for identical datasets and provides cryptographic proof of data integrity.

## Testing

Run type-check:
```bash
npm run type-check
```

Run examples:
```typescript
import { runExamples } from "@/lib/data/example";
await runExamples();
```
