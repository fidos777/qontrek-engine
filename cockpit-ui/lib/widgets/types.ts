/**
 * Qontrek Widget System - TypeScript Types
 * ChatGPT Apps Compatible Widget Definitions
 *
 * Supports dynamic data binding with {{variable.path}} syntax
 * Mobile-first responsive design with accessibility hints
 */

// ============================================================================
// Core Widget System Types
// ============================================================================

export type WidgetType =
  | "kpi_card"
  | "lead_detail_card"
  | "pipeline_board"
  | "action_panel"
  | "governance_status"
  | "approval_flow"
  | "alert_widget"
  | "proof_modal"
  | "form_generator";

export type FieldFormat =
  | "text"
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "badge"
  | "progress"
  | "trend"
  | "avatar"
  | "icon"
  | "color"
  | "json"
  | "markdown"
  | "html"
  | "file"
  | "image"
  | "signature"
  | "hash";

export type ActionType =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "ghost"
  | "link";

export type UrgencyLevel = "critical" | "high" | "medium" | "low" | "info";

export type ResponsiveBreakpoint = "mobile" | "tablet" | "desktop" | "wide";

// ============================================================================
// Base Schema Components
// ============================================================================

export interface DataBinding {
  /** Path to data field using dot notation, e.g., "lead.company.name" */
  path: string;
  /** Fallback value if path resolves to undefined */
  fallback?: string | number | boolean;
  /** Transform function name to apply */
  transform?: "uppercase" | "lowercase" | "capitalize" | "truncate" | "format_currency" | "format_date" | "format_number";
}

export interface ConditionRule {
  /** Field path to evaluate */
  field: string;
  /** Comparison operator */
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "in" | "not_in" | "exists" | "not_exists" | "matches";
  /** Value to compare against */
  value?: unknown;
  /** Logical combination with other conditions */
  logic?: "and" | "or";
}

export interface Condition {
  /** When conditions are met, show this element */
  show?: ConditionRule[];
  /** When conditions are met, hide this element */
  hide?: ConditionRule[];
  /** When conditions are met, enable this element */
  enable?: ConditionRule[];
  /** When conditions are met, disable this element */
  disable?: ConditionRule[];
}

export interface AccessibilityHints {
  /** ARIA label for screen readers */
  ariaLabel?: string;
  /** ARIA description for additional context */
  ariaDescription?: string;
  /** ARIA role override */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Live region announcement type */
  ariaLive?: "polite" | "assertive" | "off";
}

export interface ResponsiveHints {
  /** Hide on specific breakpoints */
  hideOn?: ResponsiveBreakpoint[];
  /** Show only on specific breakpoints */
  showOn?: ResponsiveBreakpoint[];
  /** Columns span per breakpoint */
  columns?: Partial<Record<ResponsiveBreakpoint, number>>;
  /** Stack direction per breakpoint */
  stack?: Partial<Record<ResponsiveBreakpoint, "horizontal" | "vertical">>;
}

export interface StyleHints {
  /** Urgency level affects color scheme */
  urgency?: UrgencyLevel;
  /** Theme variant */
  variant?: "default" | "outlined" | "filled" | "ghost";
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Custom CSS class names */
  className?: string;
  /** Inline style overrides (use sparingly) */
  style?: Record<string, string | number>;
  /** Animation hints */
  animation?: "none" | "fade" | "slide" | "scale" | "pulse";
}

// ============================================================================
// Field Definitions
// ============================================================================

export interface BaseField {
  /** Unique field identifier */
  id: string;
  /** Display label with template support */
  label: string;
  /** Data binding configuration */
  binding: string | DataBinding;
  /** Field format for rendering */
  format: FieldFormat;
  /** Conditional visibility/state */
  conditions?: Condition;
  /** Accessibility attributes */
  accessibility?: AccessibilityHints;
  /** Responsive behavior */
  responsive?: ResponsiveHints;
  /** Style customization */
  styling?: StyleHints;
}

export interface TextField extends BaseField {
  format: "text" | "email" | "phone" | "url" | "markdown" | "html";
  /** Max characters to display before truncation */
  maxLength?: number;
  /** Enable copy to clipboard */
  copyable?: boolean;
}

export interface NumberField extends BaseField {
  format: "number" | "currency" | "percentage";
  /** Decimal places */
  precision?: number;
  /** Currency code for currency format */
  currency?: string;
  /** Locale for number formatting */
  locale?: string;
  /** Show trend indicator */
  showTrend?: boolean;
  /** Trend comparison field path */
  trendCompare?: string;
}

export interface DateField extends BaseField {
  format: "date" | "datetime";
  /** Date format string */
  dateFormat?: string;
  /** Show relative time (e.g., "2 hours ago") */
  relative?: boolean;
  /** Timezone */
  timezone?: string;
}

export interface BadgeField extends BaseField {
  format: "badge";
  /** Map of value to color */
  colorMap?: Record<string, string>;
  /** Icon to show with badge */
  icon?: string;
}

export interface ProgressField extends BaseField {
  format: "progress";
  /** Maximum value (default 100) */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Color thresholds */
  thresholds?: Array<{ value: number; color: string }>;
}

export interface TrendField extends BaseField {
  format: "trend";
  /** Field path for comparison value */
  compareWith: string;
  /** Invert trend colors (e.g., for costs where down is good) */
  invertColors?: boolean;
  /** Show absolute change */
  showAbsolute?: boolean;
  /** Show percentage change */
  showPercentage?: boolean;
}

export interface HashField extends BaseField {
  format: "hash" | "signature";
  /** Truncate hash for display */
  truncate?: number;
  /** Show verification status */
  verified?: boolean;
  /** Link to proof viewer */
  proofLink?: string;
}

export type WidgetField =
  | TextField
  | NumberField
  | DateField
  | BadgeField
  | ProgressField
  | TrendField
  | HashField
  | BaseField;

// ============================================================================
// Action Definitions
// ============================================================================

export interface WidgetAction {
  /** Unique action identifier */
  id: string;
  /** Display label with template support */
  label: string;
  /** Action visual type */
  type: ActionType;
  /** Icon name (from icon library) */
  icon?: string;
  /** Action handler identifier */
  handler: string;
  /** Parameters to pass to handler */
  params?: Record<string, string | DataBinding>;
  /** Confirmation dialog before execution */
  confirm?: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  /** Loading state label */
  loadingLabel?: string;
  /** Success toast message */
  successMessage?: string;
  /** Error toast message */
  errorMessage?: string;
  /** Conditional visibility/state */
  conditions?: Condition;
  /** Accessibility attributes */
  accessibility?: AccessibilityHints;
  /** Style customization */
  styling?: StyleHints;
  /** Keyboard shortcut */
  shortcut?: string;
}

// ============================================================================
// Base Widget Schema
// ============================================================================

export interface BaseWidgetSchema {
  /** Widget type identifier */
  type: WidgetType;
  /** Schema version for compatibility */
  schemaVersion: string;
  /** Widget title with template support */
  title: string;
  /** Widget subtitle/description */
  subtitle?: string;
  /** Data fields to display */
  fields: WidgetField[];
  /** Available user actions */
  actions?: WidgetAction[];
  /** Conditional display rules */
  conditions?: Condition;
  /** Style customization */
  styling?: StyleHints;
  /** Responsive behavior */
  responsive?: ResponsiveHints;
  /** Accessibility attributes */
  accessibility?: AccessibilityHints;
  /** Refresh interval in seconds (0 = no auto-refresh) */
  refreshInterval?: number;
  /** Loading skeleton hint */
  loadingSkeleton?: "card" | "list" | "table" | "custom";
  /** Empty state configuration */
  emptyState?: {
    icon?: string;
    title: string;
    message?: string;
    action?: WidgetAction;
  };
}

// ============================================================================
// KPI Card Widget
// ============================================================================

export interface KPICardSchema extends BaseWidgetSchema {
  type: "kpi_card";
  /** Main metric field */
  metric: {
    value: string | DataBinding;
    label: string;
    format: "number" | "currency" | "percentage";
    precision?: number;
    currency?: string;
  };
  /** Trend indicator */
  trend?: {
    value: string | DataBinding;
    compareLabel?: string;
    invertColors?: boolean;
  };
  /** Secondary metrics */
  secondaryMetrics?: Array<{
    value: string | DataBinding;
    label: string;
    format: FieldFormat;
  }>;
  /** Sparkline data path */
  sparkline?: string | DataBinding;
  /** Goal/target value */
  goal?: {
    value: string | DataBinding;
    label?: string;
  };
}

// ============================================================================
// Lead Detail Card Widget
// ============================================================================

export interface LeadSection {
  id: string;
  title: string;
  collapsed?: boolean;
  fields: WidgetField[];
  conditions?: Condition;
}

export interface LeadDetailCardSchema extends BaseWidgetSchema {
  type: "lead_detail_card";
  /** Lead header configuration */
  header: {
    avatar?: string | DataBinding;
    name: string | DataBinding;
    subtitle?: string | DataBinding;
    status: string | DataBinding;
    statusColorMap?: Record<string, string>;
  };
  /** Collapsible sections */
  sections: LeadSection[];
  /** Quick action bar */
  quickActions?: WidgetAction[];
  /** Activity timeline path */
  timeline?: string | DataBinding;
  /** Related leads path */
  relatedLeads?: string | DataBinding;
}

// ============================================================================
// Pipeline Board Widget
// ============================================================================

export interface PipelineColumn {
  id: string;
  title: string;
  /** Data path for items in this column */
  items: string | DataBinding;
  /** Column styling */
  styling?: StyleHints;
  /** Maximum items to show before "Show more" */
  maxVisible?: number;
  /** Aggregate value to show in header */
  aggregate?: {
    path: string | DataBinding;
    format: "count" | "sum" | "currency";
    label?: string;
  };
}

export interface PipelineCard {
  /** Card title field */
  title: string | DataBinding;
  /** Card subtitle field */
  subtitle?: string | DataBinding;
  /** Card value/amount field */
  value?: {
    path: string | DataBinding;
    format: FieldFormat;
  };
  /** Card badge/status field */
  badge?: {
    path: string | DataBinding;
    colorMap?: Record<string, string>;
  };
  /** Card avatar field */
  avatar?: string | DataBinding;
  /** Additional fields to show */
  fields?: WidgetField[];
  /** Card actions */
  actions?: WidgetAction[];
}

export interface PipelineBoardSchema extends BaseWidgetSchema {
  type: "pipeline_board";
  /** Board columns configuration */
  columns: PipelineColumn[];
  /** Card template */
  cardTemplate: PipelineCard;
  /** Enable drag-and-drop */
  draggable?: boolean;
  /** Drag handler identifier */
  onDrop?: string;
  /** Column drop restrictions */
  dropRules?: Array<{
    from: string;
    to: string[];
    condition?: ConditionRule;
  }>;
  /** Search/filter configuration */
  searchable?: boolean;
  searchFields?: string[];
}

// ============================================================================
// Action Panel Widget
// ============================================================================

export interface ActionGroup {
  id: string;
  title?: string;
  actions: WidgetAction[];
  layout?: "horizontal" | "vertical" | "grid";
  conditions?: Condition;
}

export interface ActionPanelSchema extends BaseWidgetSchema {
  type: "action_panel";
  /** Layout of action groups */
  layout: "horizontal" | "vertical" | "grid";
  /** Action groups */
  groups: ActionGroup[];
  /** Show dividers between groups */
  showDividers?: boolean;
  /** Context display (shows current selection info) */
  context?: {
    title: string | DataBinding;
    subtitle?: string | DataBinding;
    icon?: string;
  };
}

// ============================================================================
// Governance Status Widget
// ============================================================================

export interface GateStatus {
  id: string;
  /** Gate identifier (G13-G21) */
  gateId: string;
  /** Gate name */
  name: string;
  /** Status field path */
  status: string | DataBinding;
  /** Status color mapping */
  statusColorMap?: Record<string, string>;
  /** Completion percentage */
  progress?: string | DataBinding;
  /** Last updated timestamp */
  lastUpdated?: string | DataBinding;
  /** Responsible party */
  owner?: string | DataBinding;
  /** Gate-specific actions */
  actions?: WidgetAction[];
  /** Sub-checks within this gate */
  checks?: Array<{
    id: string;
    name: string;
    status: string | DataBinding;
    message?: string | DataBinding;
  }>;
}

export interface GovernanceStatusSchema extends BaseWidgetSchema {
  type: "governance_status";
  /** Overall compliance score */
  overallScore?: {
    value: string | DataBinding;
    threshold: number;
  };
  /** Gate statuses */
  gates: GateStatus[];
  /** Gate layout */
  layout: "list" | "grid" | "timeline";
  /** Show progress bar */
  showProgress?: boolean;
  /** Certification status */
  certification?: {
    status: string | DataBinding;
    certId?: string | DataBinding;
    validUntil?: string | DataBinding;
  };
}

// ============================================================================
// Approval Flow Widget
// ============================================================================

export interface ApprovalStep {
  id: string;
  /** Step name */
  name: string;
  /** Step status path */
  status: string | DataBinding;
  /** Approver info */
  approver?: {
    name?: string | DataBinding;
    avatar?: string | DataBinding;
    role?: string | DataBinding;
  };
  /** Timestamp when approved/rejected */
  timestamp?: string | DataBinding;
  /** Approval comments */
  comments?: string | DataBinding;
  /** Required approvals count */
  requiredApprovals?: number;
  /** Current approvals count */
  currentApprovals?: string | DataBinding;
  /** Step-specific actions */
  actions?: WidgetAction[];
  /** Conditional requirements */
  conditions?: Condition;
}

export interface ApprovalFlowSchema extends BaseWidgetSchema {
  type: "approval_flow";
  /** Approval steps */
  steps: ApprovalStep[];
  /** Current step index or path */
  currentStep: number | string | DataBinding;
  /** Flow layout */
  layout: "horizontal" | "vertical";
  /** Show step connector lines */
  showConnectors?: boolean;
  /** Allow step navigation */
  navigable?: boolean;
  /** Global approval actions */
  globalActions?: WidgetAction[];
  /** Submission info */
  submission?: {
    submittedBy: string | DataBinding;
    submittedAt: string | DataBinding;
    title: string | DataBinding;
  };
}

// ============================================================================
// Alert Widget
// ============================================================================

export interface AlertItem {
  id: string;
  /** Alert type/severity */
  severity: UrgencyLevel;
  /** Alert title */
  title: string | DataBinding;
  /** Alert message */
  message: string | DataBinding;
  /** Timestamp */
  timestamp?: string | DataBinding;
  /** Source system */
  source?: string | DataBinding;
  /** Related entity */
  entity?: {
    type: string;
    id: string | DataBinding;
    name?: string | DataBinding;
  };
  /** Alert-specific actions */
  actions?: WidgetAction[];
  /** Dismissible */
  dismissible?: boolean;
  /** Auto-dismiss after ms */
  autoDismiss?: number;
}

export interface AlertWidgetSchema extends BaseWidgetSchema {
  type: "alert_widget";
  /** Alert items path or inline */
  alerts: string | DataBinding | AlertItem[];
  /** Maximum alerts to display */
  maxVisible?: number;
  /** Group by severity */
  groupBySeverity?: boolean;
  /** Sort order */
  sortBy?: "timestamp" | "severity";
  sortOrder?: "asc" | "desc";
  /** Show severity filter */
  showFilter?: boolean;
  /** Notification sound */
  sound?: {
    enabled: boolean;
    critical?: string;
    high?: string;
  };
  /** Bulk actions */
  bulkActions?: WidgetAction[];
}

// ============================================================================
// Proof Modal Widget
// ============================================================================

export interface ProofSection {
  id: string;
  title: string;
  /** Section type */
  type: "hash" | "signature" | "merkle" | "certificate" | "timeline" | "raw";
  /** Data path */
  data: string | DataBinding;
  /** Verification status */
  verified?: string | DataBinding;
  /** Expandable JSON view */
  expandable?: boolean;
  /** Copy button */
  copyable?: boolean;
}

export interface ProofModalSchema extends BaseWidgetSchema {
  type: "proof_modal";
  /** Proof identifier */
  proofId: string | DataBinding;
  /** Proof type */
  proofType: "transaction" | "document" | "approval" | "governance" | "custom";
  /** Proof sections */
  sections: ProofSection[];
  /** Verification chain */
  chain?: {
    blocks: string | DataBinding;
    currentBlock: string | DataBinding;
  };
  /** Download proof bundle */
  downloadable?: boolean;
  /** Verify externally link */
  externalVerifyUrl?: string;
  /** QR code for verification */
  showQR?: boolean;
  /** Timestamp info */
  timestamp?: {
    created: string | DataBinding;
    verified?: string | DataBinding;
    expires?: string | DataBinding;
  };
}

// ============================================================================
// Form Generator Widget
// ============================================================================

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "password"
  | "date"
  | "datetime"
  | "time"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "toggle"
  | "slider"
  | "file"
  | "image"
  | "signature"
  | "rich_text"
  | "code"
  | "json"
  | "currency"
  | "percentage"
  | "color"
  | "hidden";

export interface FormValidationRule {
  type: "required" | "min" | "max" | "minLength" | "maxLength" | "pattern" | "email" | "url" | "phone" | "custom";
  value?: unknown;
  message: string;
  /** Custom validation function name */
  customValidator?: string;
}

export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface FormField {
  id: string;
  /** Field name for form data */
  name: string;
  /** Display label */
  label: string;
  /** Field type */
  type: FormFieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Options for select/radio/checkbox */
  options?: FormFieldOption[] | string | DataBinding;
  /** Validation rules */
  validation?: FormValidationRule[];
  /** Conditional visibility */
  conditions?: Condition;
  /** Field is read-only */
  readOnly?: boolean;
  /** Field is disabled */
  disabled?: boolean;
  /** Accessibility hints */
  accessibility?: AccessibilityHints;
  /** Responsive hints */
  responsive?: ResponsiveHints;
  /** Style hints */
  styling?: StyleHints;
  /** Auto-complete hint */
  autoComplete?: string;
  /** Field group (for grouping related fields) */
  group?: string;
  /** Mask pattern for input */
  mask?: string;
  /** Step for number inputs */
  step?: number;
  /** Min/max for number/date inputs */
  min?: number | string;
  max?: number | string;
  /** Rows for textarea */
  rows?: number;
  /** Accept types for file upload */
  accept?: string;
  /** Max file size in bytes */
  maxFileSize?: number;
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  collapsed?: boolean;
  conditions?: Condition;
}

export interface FormGeneratorSchema extends BaseWidgetSchema {
  type: "form_generator";
  /** Form identifier */
  formId: string;
  /** Form sections */
  sections: FormSection[];
  /** Submit handler */
  onSubmit: string;
  /** Submit button label */
  submitLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel handler */
  onCancel?: string;
  /** Auto-save draft */
  autoSave?: boolean;
  /** Auto-save interval in seconds */
  autoSaveInterval?: number;
  /** Show progress indicator for multi-section forms */
  showProgress?: boolean;
  /** Form layout */
  layout?: "single" | "wizard" | "tabs";
  /** Pre-fill data path */
  prefillData?: string | DataBinding;
  /** Success redirect or message */
  onSuccess?: {
    message?: string;
    redirect?: string;
    action?: WidgetAction;
  };
  /** Error handling */
  onError?: {
    message?: string;
    retry?: boolean;
  };
}

// ============================================================================
// Widget Union Type
// ============================================================================

export type WidgetSchema =
  | KPICardSchema
  | LeadDetailCardSchema
  | PipelineBoardSchema
  | ActionPanelSchema
  | GovernanceStatusSchema
  | ApprovalFlowSchema
  | AlertWidgetSchema
  | ProofModalSchema
  | FormGeneratorSchema;

// ============================================================================
// Render Output Types
// ============================================================================

export interface RenderContext {
  /** Data object for template binding */
  data: Record<string, unknown>;
  /** Current user info */
  user?: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
  };
  /** Current breakpoint */
  breakpoint: ResponsiveBreakpoint;
  /** Theme mode */
  theme: "light" | "dark" | "system";
  /** Locale for formatting */
  locale: string;
  /** Timezone */
  timezone: string;
}

export interface RenderedWidget {
  /** Rendered HTML/component output */
  content: string;
  /** Extracted action handlers */
  handlers: Record<string, (params: Record<string, unknown>) => Promise<void>>;
  /** Error state */
  error?: {
    code: string;
    message: string;
  };
  /** Loading state */
  loading?: boolean;
  /** Last render timestamp */
  renderedAt: string;
}

// ============================================================================
// ChatGPT Apps Integration Types
// ============================================================================

export interface ChatGPTAppWidget {
  /** Widget schema */
  schema: WidgetSchema;
  /** Render context */
  context: RenderContext;
  /** API endpoint for data */
  dataEndpoint?: string;
  /** WebSocket for real-time updates */
  realtimeChannel?: string;
  /** Callback URL for actions */
  actionCallback?: string;
}

export interface ChatGPTAppResponse {
  /** Response type */
  type: "widget" | "message" | "error";
  /** Widget to render */
  widget?: ChatGPTAppWidget;
  /** Plain text message */
  message?: string;
  /** Error details */
  error?: {
    code: string;
    message: string;
    retry?: boolean;
  };
}
