# 🌞 Qontrek Solar Vertical Package

**Production-ready Solar payment recovery dashboard for Voltek**

## 📦 Package Contents

```
qontrek-solar-package/
├── types/
│   └── solar.ts                 # TypeScript types (L1)
├── lib/
│   ├── widgets/schemas/solar/   # Widget schemas (L3)
│   │   ├── kpi-hero.ts
│   │   ├── stage-buckets.ts
│   │   ├── kpi-grid.ts
│   │   ├── critical-table.ts
│   │   ├── pipeline-chart.ts
│   │   ├── state-distribution.ts
│   │   ├── recent-wins.ts
│   │   ├── reminders.ts
│   │   └── index.ts
│   ├── verticals/
│   │   └── solar.ts             # Vertical pack config (L4)
│   ├── workflows/
│   │   ├── solar_ingestion.ts   # Workflow definition (L8)
│   │   ├── pipeline_normalizer.ts
│   │   └── workflow_runner.ts   # Execution with ledger
│   └── ledger/                  # 🆕 L9 PROOF INFRASTRUCTURE
│       ├── proof-ledger.ts      # Immutable audit trail
│       └── index.ts
├── components/widgets/solar/    # React components (L5)
│   ├── SolarKpiHero.tsx
│   ├── SolarStageBuckets.tsx
│   ├── SolarKpiGrid.tsx
│   ├── SolarCriticalTable.tsx
│   ├── SolarPipelineChart.tsx
│   ├── SolarRecentWins.tsx
│   ├── SolarReminders.tsx
│   └── index.ts
├── app/
│   ├── api/mcp/solar/
│   │   └── route.ts             # MCP API endpoint (L2)
│   └── demo/solar/
│       └── page.tsx             # Dashboard page
├── supabase/migrations/
│   ├── 001_solar_schema.sql     # Core tables
│   └── 002_ledger_schema.sql    # 🆕 Ledger tables
└── README.md
```

## 🔐 L9 LEDGER - PROOF INFRASTRUCTURE (NEW)

**Every data mutation is logged for Tower verification.**

### Why L9 Matters

Without L9, governance gates (G13-G18) are cosmetic. With L9:
- ✅ Tower can verify who uploaded data
- ✅ Tower can verify field mappings applied
- ✅ Tower can verify pipeline calculations
- ✅ Full audit trail for compliance

### Ledger Entry Types

| Entry Type | When Logged | Gates Affected |
|------------|-------------|----------------|
| `UPLOAD_INITIATED` | User starts upload | G13, G16 |
| `UPLOAD_RECEIVED` | File validated | G13, G14 |
| `PARSE_COMPLETED` | Excel parsed | G14 |
| `MAPPING_APPLIED` | Fields mapped | G14, G15 |
| `VALIDATION_RUN` | Rows validated | G14, G15 |
| `RECORD_INSERTED` | Row inserted | G13, G18 |
| `BATCH_COMMITTED` | Batch saved | G13, G18 |
| `WORKFLOW_COMPLETED` | Workflow done | G13-G18 |
| `PROOF_GENERATED` | Digest created | G14, G18 |
| `TOWER_ACK` | Tower confirms | G14, G18 |
| `ACTION_LOGGED` | Recovery action | G13, G18 |

### Chain Integrity

Entries are chained using SHA-256 hashes:
```
Entry 1 → checksum → Entry 2 → checksum → Entry 3...
```

### Proof Digest

After each workflow, a proof digest is generated:
```typescript
{
  merkle_root: 'sha256:...',
  chain_valid: true,
  summary: {
    records_processed: 808,
    records_inserted: 750,
    records_updated: 58
  }
}
```

## 🚀 Quick Start (5 Minutes)

### Step 1: Copy Files to Your Project

```bash
# Copy to your cockpit-ui project
cp -r qontrek-solar-package/types/* cockpit-ui/types/
cp -r qontrek-solar-package/lib/* cockpit-ui/lib/
cp -r qontrek-solar-package/components/widgets/solar cockpit-ui/components/widgets/
cp -r qontrek-solar-package/app/api/mcp/solar cockpit-ui/app/api/mcp/
cp -r qontrek-solar-package/app/demo/solar cockpit-ui/app/demo/
```

### Step 2: Add Dashboard Data

```bash
# Copy the dashboard JSON to your public folder
cp g2_dashboard_v19.1.json cockpit-ui/public/data/
```

### Step 3: Install Dependencies (if not already)

```bash
cd cockpit-ui
npm install framer-motion zod lucide-react
```

### Step 4: Test

```bash
npm run dev
# Open http://localhost:3000/demo/solar
```

## 📊 What It Shows

### Hero KPI
- **Total Recoverable: RM 1,067,295.50**
- 808 total projects, 553 active
- Animated count-up effect

### Stage Buckets (3 Cards)
| Stage | Count | Value | % |
|-------|-------|-------|---|
| Pending 80% | 87 | RM 1,021,805 | 95.7% |
| Pending 20% | 13 | RM 33,890 | 3.2% |
| Handover | 126 | RM 11,600 | 1.1% |

### KPI Grid (5 Metrics)
- 7-Day Recovery: 45%
- 30-Day Recovery: 54%
- Avg Days to Pay: 6.1
- Escalation Rate: 11.4%
- Contact Success: 79.6%

### Critical Leads Table
- 15 high-priority leads
- Sortable by amount, days overdue
- Action buttons (Call, SMS, WhatsApp)
- Expandable details

### Pipeline Chart
- Horizontal bar chart by stage
- Color-coded segments
- Percentage labels

### Recent Wins
- Last 5 successful recoveries
- RM 22,114 total recovered
- Average 7.2 days to pay

### Active Reminders
- 8 pending actions
- Priority badges (HIGH/MEDIUM/LOW)
- Overdue indicators

## 🛠 Architecture Layers

| Layer | Purpose | Files |
|-------|---------|-------|
| L1 | Data Types | `types/solar.ts` |
| L2 | MCP Tools | `app/api/mcp/solar/route.ts` |
| L3 | Widget Schemas | `lib/widgets/schemas/solar/*.ts` |
| L4 | Vertical Pack | `lib/verticals/solar.ts` |
| L5 | UI Components | `components/widgets/solar/*.tsx` |
| L8 | Workflows | `lib/workflows/*.ts` |

## 🔌 MCP Tools Available

```typescript
// POST /api/mcp/solar
{
  tool: 'getPipelineSummary' | 'getCriticalLeads' | 'logRecoveryAction' | 'getGovernanceStatus' | 'refreshProof',
  params: { ... }
}
```

### getPipelineSummary
Returns full dashboard data including summary, KPIs, leads, etc.

### getCriticalLeads
```typescript
{
  limit: 15,
  stage: '80%' | '20%' | 'HANDOVER',
  sort_by: 'amount' | 'days_overdue' | 'last_contact',
  sort_order: 'asc' | 'desc'
}
```

### logRecoveryAction
```typescript
{
  project_id: 'uuid',
  action_type: 'CALL' | 'SMS' | 'WHATSAPP' | 'EMAIL' | 'SITE_VISIT',
  result: 'CONNECTED' | 'NO_ANSWER' | 'PROMISED_PAYMENT' | 'SCHEDULED' | 'ESCALATED',
  notes: 'string',
  next_action_date: '2025-12-01'
}
```

### getGovernanceStatus
```typescript
{
  include_details: true
}
// Returns: { trust_index: 100, gates: { G13: 'pass', ... }, last_sync: '...' }
```

### refreshProof
```typescript
{
  force: true
}
// Returns: { freshness_ms: 0, last_sync: '...', source: 'cache' }
```

## 📱 Responsive Design

- **Mobile (< 768px)**: Single column, stacked widgets
- **Tablet (768-1024px)**: 2-column grid
- **Desktop (> 1024px)**: Full 3-column layout

## 🔄 Auto-Refresh

Dashboard auto-refreshes every 30 seconds. Manual refresh available via button.

## 🎨 Customization

### Change Colors
Edit `lib/widgets/schemas/solar/pipeline-chart.ts`:
```typescript
export const STAGE_COLORS: Record<string, string> = {
  'Pending 80%': '#f97316', // Change to your brand color
  'Pending 20%': '#eab308',
  'Handover': '#0ea5e9',
};
```

### Add New Widget
1. Create schema in `lib/widgets/schemas/solar/new-widget.ts`
2. Create component in `components/widgets/solar/NewWidget.tsx`
3. Export from `index.ts` files
4. Add to dashboard layout in `lib/verticals/solar.ts`

## 🔐 Governance

- Trust Index: 100%
- Gates G13-G21 certified
- Data source: Real Voltek data
- Version: 19.1

## 📈 Next Steps

1. **Connect Supabase**: Update MCP route to query real database
2. **Add Excel Upload**: Implement L8 workflow UI
3. **Enable Real-time**: Add Supabase subscriptions
4. **AI Suggestions**: Implement L6 DIA Skills

## 📞 Support

Questions? Check the integration guide or open an issue.

---

**Built with Qontrek Engine • Tower Federation Certified**
