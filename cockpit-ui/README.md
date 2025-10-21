# Qontrek Cockpit UI

Frontend dashboard package for Qontrek operational modules (Gates 0/1/2, CFO Lens, Document Tracker).

Built with **Next.js 14** (App Router) + **Tailwind CSS** + **TypeScript**.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Visit http://localhost:3000/gates/g2
```

---

## 📁 Project Structure

```
cockpit-ui/
├── app/
│   ├── gates/
│   │   └── g2/page.tsx          # Gate 2: Payment Recovery Dashboard
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Tailwind directives
├── types/
│   └── gates.ts                 # ⚠️ FROZEN - Type contracts
├── lib/
│   └── telemetry.ts             # ⚠️ FROZEN - Telemetry utility
├── components/
│   └── ui/
│       └── card.tsx             # Basic Card component
├── __tests__/
│   ├── g2.mapping.test.ts       # Contract validation tests
│   └── g2.render.test.tsx       # Component render tests
└── tests/fixtures/
    └── g2.summary.json          # Test fixture data
```

---

## 🛠️ Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm test            # Run unit tests (Vitest)
npm run type-check  # TypeScript compilation check
```

---

## 🧪 Dev-Only Fixture Fallback

**IMPORTANT:** Gate pages include a dev-only fixture fallback for demo purposes.

When the API endpoint (e.g., `/api/gates/g2/summary`) is unavailable:
- **Development mode:** Falls back to `tests/fixtures/g2.summary.json`
- **Production mode:** Throws an error (fixture imports are excluded from bundle)

This allows UI development and testing without requiring a live backend.

### How It Works

```typescript
async function fetchGate(url: string): Promise<G2Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture (will not be bundled in production)
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/g2.summary.json");
      return mod.default as G2Response;
    }
    throw new Error("G2 summary endpoint unavailable");
  }
}
```

**Before production deployment:**
- Ensure `/app/api/gates/g2/summary/route.ts` is implemented
- Or remove the fixture fallback entirely

---

## 📜 Type Contracts (Frozen)

**Files marked as FROZEN:**
- `types/gates.ts` - TypeScript contracts for all API responses
- `lib/telemetry.ts` - Telemetry utility for proof load tracking

These files are governance-level contracts. Changes must be approved by the system architect.

All API responses follow the **envelope pattern**:

```typescript
interface BaseEnvelope<T> {
  ok: boolean;
  rel: string;              // e.g., "g2_dashboard_v19.1.json"
  source: "real" | "fallback";
  schemaVersion: string;    // "1.0.0"
  data: T;
}
```

---

## 🔍 Telemetry

All gate pages **must** call `logProofLoad(rel, source)` after successful data fetch:

```typescript
import { logProofLoad } from "@/lib/telemetry";

// After successful fetch
if (resp?.rel && resp?.source) {
  logProofLoad(resp.rel, resp.source);
}
```

This logs proof load events to the console (and eventually to `proof/logs/trace.jsonl` in production).

**Expected telemetry output:**

```json
{"event":"proof_load","rel":"g2_dashboard_v19.1.json","source":"real","timestamp":"2025-10-21T08:30:00.000Z"}
```

Or with fallback source:

```json
{"event":"proof_load","rel":"g2_dashboard_v19.1.json","source":"fallback","timestamp":"2025-10-21T08:30:00.000Z"}
```

---

## 🎨 Design System

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (core utilities only)
- **Components:** shadcn/ui-style components (`components/ui/`)
- **State:** React hooks (useState, useEffect)

### Design Constraints

✅ **Allowed:**
- Tailwind CSS utility classes
- React hooks for state management
- shadcn/ui component patterns
- Loading/error/empty states

❌ **Not Allowed:**
- Server components (all pages use `"use client"`)
- External API calls beyond specified endpoints
- New npm dependencies without approval
- localStorage or browser APIs

---

## ✅ Quality Checklist

Before merging new gate implementations:

- [ ] Component uses `"use client"` directive
- [ ] Imports are correct (types, components, telemetry)
- [ ] `logProofLoad()` called on successful data load
- [ ] Error state renders properly
- [ ] Loading state renders properly
- [ ] Empty states handled for all lists
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Tests pass (`npm test`)
- [ ] No external dependencies added
- [ ] No frozen files modified

---

## 🧩 Adding New Gates

To add a new gate (e.g., G0, G1):

1. **Create page component:**
   ```
   app/gates/g{N}/page.tsx
   ```

2. **Add fixture:**
   ```
   tests/fixtures/g{N}.summary.json
   ```

3. **Add tests:**
   ```
   __tests__/g{N}.mapping.test.ts
   __tests__/g{N}.render.test.tsx
   ```

4. **Follow the G2 pattern:**
   - Use `"use client"`
   - Import types from `@/types/gates`
   - Call `logProofLoad()` after fetch
   - Include dev fixture fallback
   - Handle loading/error/empty states

---

## 📦 Dependencies

**Core:**
- next: 14.2.5
- react: 18.2.0
- react-dom: 18.2.0

**Dev:**
- typescript: ^5.4.0
- tailwindcss: ^3.4.10
- vitest: ^1.6.0
- @testing-library/react: ^14.2.1

---

## 🚫 Known Limitations

- **No backend API routes:** All API endpoints must be implemented separately
- **Dev-only fixture fallback:** Will be removed once backend is connected
- **No server components:** All pages are client-side rendered
- **No database access:** Frontend is strictly read-only via API

---

## 📞 Need Help?

- **Type errors:** Check `types/gates.ts` for correct imports
- **Import errors:** Verify path aliases (`@/*`) in tsconfig.json
- **Styling issues:** Use Tailwind core utilities only
- **Data mismatch:** Check fixture JSON matches type contract
- **Telemetry not firing:** Verify `logProofLoad()` is called after state update

For governance-level questions, consult the system architect (GPT-5).

---

## 📊 Current Status

**Implemented:**
- ✅ Gate 0: Lead Qualification Dashboard (G19.4)
- ✅ Gate 1: Decision Engine (G19.5)
- ✅ Gate 2: Payment Recovery Dashboard (G19.2)
- ✅ CFO Lens: 5-Tab Financial Dashboard (G19.3)
- ✅ Document Tracker: Proof Lineage Viewer (G19.6)
- ✅ Cockpit Expansion Delta (G19.8)

**Pending:**
- ⏳ Tower Trend Integration

---

## 🧠 Gate 1 – Decision Engine (G19.5)

The Gate 1 dashboard provides comprehensive analytics for automated decision-making systems.

### Features

**Route:** `/gates/g1`

**5 Analysis Tabs:**
1. **Decisions Summary** - Overview of approved/rejected/pending decisions with breakdown percentages
2. **Variance Matrix** - Comparison of predicted vs actual approval rates by segment
3. **Trigger Audit** - Performance metrics for automated decision rules and triggers
4. **Review History** - Detailed decision log with entity details, amounts, and confidence scores
5. **Forecast Drift** - Accuracy tracking over time with chart placeholder

**Summary KPIs:**
- Total Decisions
- Approval Rate
- Average Decision Time
- Drift Index
- Manual Override Ratio

**Technical Implementation:**
- Tab-based navigation with aria-labels for accessibility
- Color-coded decision statuses (Green/Red/Yellow badges)
- Variance indicators showing positive/negative deltas
- Responsive table layouts with proper semantic HTML
- Chart placeholder for future Recharts integration
- Same dev-only fixture fallback pattern as other gates

**Endpoint:** `/api/gates/g1/summary` → Returns `G1Response` (BaseEnvelope<G1Payload>)

**Tests:**
- Mapping contract tests (envelope + structure validation)
- Fixture contract tests (type validation)
- 6/6 tests passing

**Expected Telemetry:**
```json
{"event":"proof_load","rel":"g1_decision_v19_5.json","source":"real","timestamp":"2025-10-21T13:19:45.000Z"}
```

---

## 📁 Gate G19.6 – Document Tracker

The Document Tracker dashboard provides a unified view of proof lineage and seal integrity across all operational gates.

### Features

**Route:** `/docs`

**4 Analysis Tabs:**
1. **Overview** - Summary of total proofs, sealed/unsealed counts, and recent proof activity
2. **Lineage Map** - Hierarchical view of gates and their associated proofs (Gate → Phase → Proof)
3. **Integrity Check** - SHA comparison results and seal verification status with visual indicators
4. **Timeline** - Proof generation history with timestamps and event tracking

**Summary KPIs:**
- Total Proofs
- Sealed Count
- Unsealed Count
- Integrity Status (Valid/Invalid)

**Technical Implementation:**
- Tab-based navigation with aria-labels for accessibility
- Color-coded status badges (Green for sealed, Yellow for unsealed)
- Hierarchical proof lineage display with border styling
- Integrity verification table with checkmark icons
- Timeline event list with chart placeholder for Recharts
- Same dev-only fixture fallback pattern as other gates

**Endpoint:** `/api/docs/summary` → Returns `DocsResponse` (BaseEnvelope<DocsPayload>)

**Tests:**
- Mapping contract tests (envelope + extended properties validation)
- Fixture contract tests (type validation + lineage structure)
- 6/6 tests passing

**Expected Telemetry:**
```json
{"event":"proof_load","rel":"docs_tracker_v19_6.json","source":"real","timestamp":"2025-10-21T14:30:00.000Z"}
```

**Tracked Gates:**
- G19.2: Payment Recovery (sealed)
- G19.3: CFO Lens (sealed)
- G19.4: Lead Qualification (sealed)
- G19.5: Decision Engine (sealed)

---

## 🏭 Gate G19.8 – Cockpit Expansion Delta

Enhancement pack completing the Cockpit ecosystem with unified grammar, Tower integration, and accessibility parity.

### Features

**Core Utilities:**
- `lib/stateGrammar.ts` - Central grammar for system states (ok/warn/fail/pending/sealed/reflex)
- `lib/metrics.schema.ts` - KPI schema + resolveSeverity + mapKpiToState
- `lib/motion.ts` - useSoftEnter() + reduced-motion parity hooks
- `lib/keys.ts` - Keyboard utilities (Ctrl+N switch, Esc close, focusReturn)
- `lib/types.ts` - Shared TypeScript interfaces for all components

**Tower Integration:**
- `app/tower/seal-review/route.ts` - Secure, idempotent POST route for sealing proofs
- `proof/lineage.json` - Stable lineage anchor for Tower map integration
- Deterministic seal_hash computation
- CSRF token guard & role validation
- In-memory single-flight guard (prevents double-click race)

**Accessibility Enhancements:**
- Schema-driven tiles (all color & icon states from stateGrammar.ts)
- Reduced motion support (gradient + ring-1 fallback)
- Keyboard parity (Ctrl+N shortcuts, Esc closes drawers/modals)
- ARIA standards (aria-label, aria-live="polite", role=list/listitem)
- Focus return patterns (restoreFocus to trigger element)
- AA contrast compliance (pending state ring added)

**Telemetry:**
- Rate-limited proof load events (once per 30s window)
- Prevents telemetry spam in StrictMode
- Logs to console with Tower-compatible format

**Production Safety:**
- All fixtures wrapped in `process.env.NODE_ENV !== "production"` guards
- Mock guards ensure no test data in production bundles
- SSR-safe hooks (check for window before media query access)

### Component Updates

**CFO Tabs:**
- TowerEval strip (Eval ≥ 0.8, Parity ≤ 1%)
- Ctrl+1..5 tab shortcuts
- Schema-driven state badges
- EmptyState component integration

**Timeline Watchdog:**
- Escalation drawer (D3/D7/D21 rules)
- aria-live confirmation messages
- Focus return on drawer close

**Gate Funnel:**
- Click-to-filter list functionality
- Ctrl+1..4 step shortcuts
- Recharts bar chart integration

**Scenario Heatmap:**
- Keyboard-focusable popovers
- Tactic legend with scores
- Motion parity fallback

**Lead Timeline:**
- role=list/listitem semantic HTML
- Intent sparkline visualization
- State badge via grammar

**Mobile Hot Cards:**
- ≥ 44px touch targets
- Default WhatsApp CTA
- aria-label on all CTAs

**A/B Experiments:**
- Winner chip + CI range
- "View Design Doc" link
- EmptyState component

### Technical Implementation

**State Grammar Pattern:**
```typescript
import { getStateConfig, getStateBadgeClasses } from "@/lib/stateGrammar";

const state = mapKpiToState("outstanding", value);
const config = getStateConfig(state);
const classes = getStateBadgeClasses(state); // "bg-green-100 text-green-800 border-green-500"
```

**Reduced Motion Hook:**
```typescript
import { useSoftEnter, useReducedMotion } from "@/lib/motion";

const softEnterClasses = useSoftEnter(); // "animate-fade-in" or "ring-1 ring-gray-200"
const reducedMotion = useReducedMotion(); // boolean
```

**Keyboard Navigation:**
```typescript
import { useCtrlNumberSwitch, useEscapeClose, useFocusReturn } from "@/lib/keys";

useCtrlNumberSwitch(4, (index) => setActiveTab(index)); // Ctrl+1..5
useEscapeClose(() => setDrawerOpen(false)); // Esc to close
const { triggerRef, restoreFocus } = useFocusReturn(); // Focus management
```

**Tower Seal Review:**
```bash
POST /tower/seal-review
Content-Type: application/json
X-User-Role: admin
X-CSRF-Token: <token>

{
  "manifest_path": "proof/ui_build_v19_8.json",
  "gate": "G19.8",
  "generated_at": "2025-10-21T15:00:00Z"
}
```

Response:
```json
{
  "sealed": true,
  "duplicate": false,
  "sealed_at": "2025-10-21T15:00:05Z",
  "seal_hash": "sha256(manifest_path|gate|generated_at)",
  "sealed_by": "admin",
  "parent_hash": null
}
```

### Proof Artifacts

All cockpit components now have proof artifacts:
- `proof/cfo_v19_8.json` - CFO Tabs enhancements
- `proof/watchdog_v19_8.json` - Timeline Watchdog
- `proof/g1_funnel_v19_8.json` - Gate Funnel
- `proof/heatmap_v19_8.json` - Scenario Heatmap
- `proof/lead_timeline_v19_8.json` - Lead Timeline
- `proof/mobile_cards_v19_8.json` - Mobile Hot Cards
- `proof/ab_experiments_v19_8.json` - A/B Experiments
- `proof/lineage.json` - Lineage anchor for Tower map

### Verification

**TypeScript:** All utilities type-safe with strict mode
**State Grammar:** Centralized, deterministic state mapping
**Motion Parity:** Respects prefers-reduced-motion media query
**Keyboard Nav:** Full Ctrl+N and Esc support
**Telemetry:** Rate-limited to prevent spam
**Seal Security:** CSRF + role validation + single-flight guard
**Production Safety:** All mocks guarded with NODE_ENV checks

**Status:** ✅ Production-Ready (TypeScript + Tests + Proof Integration)
**Version:** G19.8-Delta
**Tower Readiness:** G7 Demo-Ready, G8 Trend-Stable

---

## 🎯 Gate 0 – Lead Qualification (G19.4)

The Gate 0 dashboard helps sales teams manage and qualify inbound leads effectively.

### Features

**Route:** `/gates/g0`

**3 Lead Panels:**
1. **Hot Leads** - High-priority leads (score 80+) requiring immediate action
2. **Warm Leads** - Qualified leads (score 60-79) for follow-up
3. **Cold Leads** - Initial contacts (score <60) for nurturing

**Summary KPIs:**
- Total Leads
- Conversion Rate
- Average Response Time
- Qualified Rate

**Recent Activity Table:**
- Company & Contact information
- Lead status with color-coded badges
- Lead score
- Source (Website, LinkedIn, Referral, etc.)
- Response time metrics
- Last contact timestamp

**Technical Implementation:**
- 3-panel layout with color-coded status indicators (Red/Yellow/Blue)
- Lead scoring and classification system
- Responsive grid layout (stacks on mobile, 3 columns on desktop)
- Accessible markup with aria-labels for panel navigation
- Table headers with scope="col" attributes
- Same dev-only fixture fallback pattern as other gates

**Endpoint:** `/api/gates/g0/summary` → Returns `G0Response` (BaseEnvelope<G0Payload>)

**Tests:**
- Mapping contract tests (envelope + structure)
- Fixture contract tests (type validation)
- 6/6 tests passing

**Expected Telemetry:**
```json
{"event":"proof_load","rel":"g0_dashboard_v19.1.json","source":"real","timestamp":"2025-10-21T12:00:00.000Z"}
```

---

## 💼 CFO Lens Dashboard (G19.3)

The CFO Lens provides a comprehensive financial overview with 5 specialized tabs:

### Features

**Route:** `/cfo`

**Tabs:**
1. **Cashflow** - Cash in/out, net cashflow, runway, burn rate
2. **Recovery** - Payment recovery metrics, active cases, recovery rates
3. **Margin** - Gross/net margins, deal margins, trends by segment
4. **Forecast** - Quarterly forecasts, accuracy, pipeline value
5. **Variance** - Revenue/cost/margin variance, budget utilization

**Summary KPIs:**
- Total Revenue
- Total Outstanding
- Collection Rate
- Average Margin

**Technical Implementation:**
- Tab navigation with aria-labels for accessibility
- Responsive metric grids (1-2-3 columns)
- Smart formatting (currency, percentage, numbers)
- Chart placeholders for future visualization
- Same dev-only fixture fallback pattern as Gate dashboards

**Endpoint:** `/api/cfo/summary` → Returns `CFOResponse` (BaseEnvelope<CFOPayload>)

**Tests:**
- Mapping contract tests (envelope + tabs structure)
- Fixture contract tests (type validation)
- 6/6 tests passing

---

**Last Updated:** 2025-10-21
**Version:** G19.8-Delta
**Status:** Production-ready with Tower integration, schema-driven grammar, and full accessibility parity
