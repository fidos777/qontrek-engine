# Qontrek Widget System - ChatGPT Apps Integration Guide

## Overview

The Qontrek Widget System provides a comprehensive set of JSON schemas for building ChatGPT Apps compatible UI widgets. Each widget is designed with:

- **Dynamic Data Binding**: Use `{{path.to.data}}` syntax for dynamic values
- **Conditional Rendering**: Show/hide elements based on data conditions
- **Accessibility First**: Full ARIA support and keyboard navigation
- **Mobile-First Responsive**: Adaptive layouts for all screen sizes
- **Action Handlers**: Execute functions on user interactions

## Quick Start

### 1. Install Dependencies

```bash
cd cockpit-ui
npm install
```

### 2. Import the Widget Registry

```typescript
import { WidgetRegistry, createKPICard } from '@/lib/widgets/registry';
import type { KPICardSchema, RenderContext } from '@/lib/widgets/types';

// Get the singleton registry instance
const registry = WidgetRegistry.getInstance();
```

### 3. Create a Widget Schema

```typescript
const kpiWidget = createKPICard({
  title: 'Total Revenue',
  metric: {
    value: '{{data.totalRevenue}}',
    label: 'Revenue',
    format: 'currency',
    currency: 'USD',
  },
  trend: {
    value: '{{data.revenueTrend}}',
    compareLabel: 'vs last month',
  },
});
```

### 4. Render with Data

```typescript
const context: RenderContext = {
  data: {
    data: {
      totalRevenue: 1250000,
      revenueTrend: 12.5,
    },
  },
  breakpoint: 'desktop',
  theme: 'light',
  locale: 'en-US',
  timezone: 'America/New_York',
};

const result = registry.renderWidget(kpiWidget, context);
```

## Widget Types

### 1. KPI Card (`kpi_card`)

Displays a single metric with trend indicator and optional sparkline.

**Use Cases:**
- Dashboard metrics
- Performance indicators
- Financial summaries

**Key Properties:**
- `metric`: Main value with format (number, currency, percentage)
- `trend`: Change indicator with comparison
- `sparkline`: Mini chart data
- `goal`: Target value

```typescript
import { createKPICard } from '@/lib/widgets/registry';

const widget = createKPICard({
  title: 'Monthly Revenue',
  metric: {
    value: '{{metrics.revenue}}',
    label: 'Revenue',
    format: 'currency',
    currency: 'USD',
  },
  trend: {
    value: '{{metrics.revenueTrend}}',
    compareLabel: 'vs last month',
  },
  styling: {
    urgency: 'info',
    size: 'lg',
  },
});
```

### 2. Lead Detail Card (`lead_detail_card`)

Full lead information display with collapsible sections.

**Use Cases:**
- CRM lead views
- Contact details
- Customer profiles

**Key Properties:**
- `header`: Avatar, name, subtitle, status
- `sections`: Collapsible field groups
- `quickActions`: Action buttons
- `timeline`: Activity history

```typescript
import { createLeadDetailCard } from '@/lib/widgets/registry';

const widget = createLeadDetailCard({
  title: 'Lead Details',
  header: {
    name: '{{lead.name}}',
    subtitle: '{{lead.company}}',
    status: '{{lead.status}}',
    statusColorMap: {
      qualified: 'green',
      nurturing: 'blue',
      cold: 'gray',
    },
  },
  sections: [
    {
      id: 'contact',
      title: 'Contact Info',
      fields: [
        { id: 'email', label: 'Email', binding: '{{lead.email}}', format: 'email' },
        { id: 'phone', label: 'Phone', binding: '{{lead.phone}}', format: 'phone' },
      ],
    },
  ],
  quickActions: [
    { id: 'call', label: 'Call', type: 'primary', icon: 'phone', handler: 'initiateCall' },
  ],
});
```

### 3. Pipeline Board (`pipeline_board`)

Kanban-style view with drag-and-drop support.

**Use Cases:**
- Sales pipelines
- Project boards
- Task management

**Key Properties:**
- `columns`: Board columns with items
- `cardTemplate`: Card display template
- `draggable`: Enable drag-and-drop
- `dropRules`: Column movement restrictions

```typescript
import { createPipelineBoard } from '@/lib/widgets/registry';

const widget = createPipelineBoard({
  title: 'Sales Pipeline',
  columns: [
    { id: 'prospecting', title: 'Prospecting', items: '{{pipeline.prospecting}}' },
    { id: 'qualification', title: 'Qualification', items: '{{pipeline.qualification}}' },
    { id: 'proposal', title: 'Proposal', items: '{{pipeline.proposal}}' },
    { id: 'closed', title: 'Closed Won', items: '{{pipeline.closed}}' },
  ],
  cardTemplate: {
    title: '{{item.company}}',
    subtitle: '{{item.contact}}',
    value: { path: '{{item.dealValue}}', format: 'currency' },
  },
  draggable: true,
  onDrop: 'updateLeadStage',
});
```

### 4. Action Panel (`action_panel`)

Contextual action buttons grouped by function.

**Use Cases:**
- Toolbars
- Context menus
- Quick actions

**Key Properties:**
- `layout`: horizontal, vertical, or grid
- `groups`: Action button groups
- `context`: Current selection display

```typescript
import { createActionPanel } from '@/lib/widgets/registry';

const widget = createActionPanel({
  title: 'Actions',
  layout: 'horizontal',
  context: {
    title: '{{selection.name}}',
    subtitle: '{{selection.type}}',
  },
  groups: [
    {
      id: 'primary',
      title: 'Primary Actions',
      actions: [
        { id: 'edit', label: 'Edit', type: 'primary', icon: 'edit', handler: 'editItem' },
        { id: 'delete', label: 'Delete', type: 'danger', icon: 'trash', handler: 'deleteItem' },
      ],
    },
  ],
});
```

### 5. Governance Status (`governance_status`)

G13-G21 gate status display with compliance scoring.

**Use Cases:**
- Compliance dashboards
- Security audits
- Certification tracking

**Key Properties:**
- `overallScore`: Compliance percentage
- `gates`: Individual gate statuses
- `certification`: Cert status and validity

```typescript
import { createGovernanceStatus } from '@/lib/widgets/registry';

const widget = createGovernanceStatus({
  title: 'Governance Compliance',
  overallScore: {
    value: '{{governance.score}}',
    threshold: 85,
  },
  layout: 'list',
  gates: [
    {
      id: 'g13',
      gateId: 'G13',
      name: 'Data Privacy',
      status: '{{governance.gates.g13.status}}',
      progress: '{{governance.gates.g13.progress}}',
    },
  ],
});
```

### 6. Approval Flow (`approval_flow`)

Multi-step approval workflow visualization.

**Use Cases:**
- Contract approvals
- Document workflows
- Request processing

**Key Properties:**
- `steps`: Workflow steps with approvers
- `currentStep`: Active step indicator
- `layout`: horizontal or vertical
- `globalActions`: Flow-level actions

```typescript
import { createApprovalFlow } from '@/lib/widgets/registry';

const widget = createApprovalFlow({
  title: 'Contract Approval',
  layout: 'horizontal',
  currentStep: '{{approval.currentStep}}',
  steps: [
    { id: 'legal', name: 'Legal Review', status: '{{approval.steps.legal}}' },
    { id: 'finance', name: 'Finance Review', status: '{{approval.steps.finance}}' },
    { id: 'executive', name: 'Executive Approval', status: '{{approval.steps.executive}}' },
  ],
});
```

### 7. Alert Widget (`alert_widget`)

Notifications and warnings display.

**Use Cases:**
- System alerts
- Notifications
- Warning messages

**Key Properties:**
- `alerts`: Alert items or data path
- `groupBySeverity`: Group by urgency level
- `sound`: Notification sounds
- `bulkActions`: Multi-select actions

```typescript
import { createAlertWidget } from '@/lib/widgets/registry';

const widget = createAlertWidget({
  title: 'System Alerts',
  alerts: '{{alerts.active}}',
  maxVisible: 10,
  groupBySeverity: true,
  showFilter: true,
  sound: {
    enabled: true,
    critical: '/sounds/critical.mp3',
  },
});
```

### 8. Proof Modal (`proof_modal`)

Cryptographic proof viewer with verification chain.

**Use Cases:**
- Transaction verification
- Document proofs
- Audit trails

**Key Properties:**
- `proofType`: transaction, document, approval, governance
- `sections`: Hash, signature, merkle, certificate displays
- `chain`: Verification chain blocks
- `showQR`: QR code for external verification

```typescript
import { createProofModal } from '@/lib/widgets/registry';

const widget = createProofModal({
  title: 'Transaction Proof',
  proofId: '{{proof.id}}',
  proofType: 'transaction',
  sections: [
    { id: 'hash', title: 'Document Hash', type: 'hash', data: '{{proof.hash}}' },
    { id: 'sig', title: 'Signature', type: 'signature', data: '{{proof.signature}}' },
  ],
  downloadable: true,
  showQR: true,
});
```

### 9. Form Generator (`form_generator`)

Dynamic form creation from schema with validation.

**Use Cases:**
- Data entry forms
- Lead capture
- Configuration screens

**Key Properties:**
- `sections`: Form field groups
- `layout`: single, wizard, or tabs
- `onSubmit`: Submit handler
- `validation`: Field validation rules

```typescript
import { createFormGenerator } from '@/lib/widgets/registry';

const widget = createFormGenerator({
  title: 'New Lead',
  formId: 'new_lead',
  layout: 'single',
  sections: [
    {
      id: 'basic',
      title: 'Basic Info',
      fields: [
        {
          id: 'name',
          name: 'name',
          label: 'Name',
          type: 'text',
          validation: [{ type: 'required', message: 'Name is required' }],
        },
        {
          id: 'email',
          name: 'email',
          label: 'Email',
          type: 'email',
          validation: [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Invalid email format' },
          ],
        },
      ],
    },
  ],
  onSubmit: 'createLead',
  submitLabel: 'Create Lead',
});
```

## Data Binding

### Template Syntax

Use double curly braces for dynamic values:

```typescript
// Simple path
"{{lead.name}}"

// Nested path
"{{lead.company.address.city}}"

// Array access
"{{leads[0].name}}"
```

### Data Binding Object

For advanced transformations:

```typescript
{
  path: "lead.name",
  fallback: "Unknown",
  transform: "uppercase"
}
```

**Available Transforms:**
- `uppercase`: Convert to uppercase
- `lowercase`: Convert to lowercase
- `capitalize`: Capitalize first letter
- `truncate`: Truncate to 50 chars
- `format_currency`: Format as currency
- `format_date`: Format as date
- `format_number`: Format with locale

## Conditional Rendering

### Show/Hide Conditions

```typescript
{
  conditions: {
    show: [
      { field: "lead.status", operator: "eq", value: "qualified" }
    ],
    hide: [
      { field: "lead.archived", operator: "eq", value: true }
    ]
  }
}
```

### Operators

| Operator | Description |
|----------|-------------|
| `eq` | Equal |
| `neq` | Not equal |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `contains` | String contains |
| `not_contains` | String doesn't contain |
| `in` | Value in array |
| `not_in` | Value not in array |
| `exists` | Field exists |
| `not_exists` | Field doesn't exist |
| `matches` | Regex match |

### Logic Combination

```typescript
{
  conditions: {
    show: [
      { field: "lead.status", operator: "eq", value: "qualified" },
      { field: "lead.value", operator: "gte", value: 10000, logic: "and" }
    ]
  }
}
```

## Action Handlers

### Registering Handlers

```typescript
const registry = WidgetRegistry.getInstance();

registry.registerHandler('createLead', async (params) => {
  const response = await fetch('/api/leads', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.json();
});
```

### Action Configuration

```typescript
{
  actions: [
    {
      id: "save",
      label: "Save",
      type: "primary",
      icon: "save",
      handler: "createLead",
      params: {
        leadId: "{{lead.id}}"
      },
      confirm: {
        title: "Save Changes?",
        message: "This will update the lead record.",
        confirmLabel: "Save",
        cancelLabel: "Cancel"
      },
      loadingLabel: "Saving...",
      successMessage: "Lead saved successfully!",
      errorMessage: "Failed to save lead."
    }
  ]
}
```

## Accessibility

### Built-in ARIA Support

```typescript
{
  accessibility: {
    ariaLabel: "Lead details for {{lead.name}}",
    ariaDescription: "Displays contact information and opportunity details",
    role: "article",
    tabIndex: 0,
    ariaLive: "polite"
  }
}
```

### Keyboard Navigation

All interactive elements support:
- Tab navigation
- Enter/Space activation
- Escape to close modals
- Arrow keys for lists

## Responsive Design

### Breakpoint Configuration

```typescript
{
  responsive: {
    hideOn: ["mobile"],
    showOn: ["tablet", "desktop", "wide"],
    columns: {
      mobile: 12,
      tablet: 6,
      desktop: 4,
      wide: 3
    },
    stack: {
      mobile: "vertical",
      tablet: "horizontal"
    }
  }
}
```

### Breakpoints

| Breakpoint | Width |
|------------|-------|
| `mobile` | < 640px |
| `tablet` | 640px - 1024px |
| `desktop` | 1024px - 1440px |
| `wide` | > 1440px |

## ChatGPT Apps Integration

### Response Format

```typescript
import { WidgetRegistry } from '@/lib/widgets/registry';

const registry = WidgetRegistry.getInstance();

// Create a ChatGPT App response
const response = registry.createWidgetResponse(
  widget,
  context,
  {
    dataEndpoint: '/api/widgets/data',
    realtimeChannel: 'ws://api.example.com/realtime',
    actionCallback: '/api/widgets/actions',
  }
);

// Response structure:
// {
//   type: "widget",
//   widget: {
//     schema: { ... },
//     context: { ... },
//     dataEndpoint: "...",
//     realtimeChannel: "...",
//     actionCallback: "..."
//   }
// }
```

### Error Handling

```typescript
// Error response
{
  type: "error",
  error: {
    code: "VALIDATION_ERROR",
    message: "Widget title is required",
    retry: false
  }
}
```

## File Structure

```
lib/widgets/
├── types.ts              # TypeScript type definitions
├── registry.ts           # WidgetRegistry class and factory functions
├── schemas/
│   ├── KPICard.json
│   ├── LeadDetailCard.json
│   ├── PipelineBoard.json
│   ├── ActionPanel.json
│   ├── GovernanceStatus.json
│   ├── ApprovalFlow.json
│   ├── AlertWidget.json
│   ├── ProofModal.json
│   └── FormGenerator.json
├── examples/
│   └── render-outputs.json
└── INTEGRATION_GUIDE.md
```

## Best Practices

1. **Use Semantic IDs**: Give meaningful IDs to fields and actions
2. **Provide Fallbacks**: Always specify fallback values for optional data
3. **Add Accessibility**: Include ARIA labels for all interactive elements
4. **Test Responsively**: Verify layouts on all breakpoints
5. **Handle Errors**: Register error handlers for all actions
6. **Validate Schemas**: Use the registry's validateWidget before rendering

## Support

For issues or feature requests, contact the Qontrek team or open an issue in the repository.
