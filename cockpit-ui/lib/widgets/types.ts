// lib/widgets/types.ts
// Widget type definitions for L3 Widget OS

/**
 * Base widget configuration shared by all widgets
 */
export interface BaseWidgetConfig {
  id: string;
  widget_type: WidgetType;
  title: string;
  title_ms?: string;
  description?: string;
  description_ms?: string;
  refreshInterval?: number; // seconds
  position?: WidgetPosition;
}

/**
 * Widget position in grid layout
 */
export interface WidgetPosition {
  col: number;
  row: number;
  width: number;
  height: number;
}

/**
 * All supported widget types
 */
export type WidgetType =
  // Core Metrics
  | "kpi_card"
  | "trust_meter"
  | "pipeline_funnel"
  | "recovery_chart"
  // Data Display
  | "lead_table"
  | "reminder_list"
  | "success_feed"
  | "governance_strip"
  | "lead_heatmap"
  // WhatsApp
  | "wa_session_card"
  | "wa_conversation_timeline"
  | "wa_cost_breakdown"
  | "wa_send_panel"
  // CFO
  | "cfo_tab_metrics"
  | "variance_card"
  // Generic
  | "custom";

/**
 * Widget state for loading/error handling
 */
export type WidgetState = "loading" | "ready" | "error" | "empty";

/**
 * KPI Card Configuration
 */
export interface KPICardConfig extends BaseWidgetConfig {
  widget_type: "kpi_card";
  metric_key: string;
  format: "currency" | "percentage" | "number" | "time" | "text";
  icon?: string;
  trend_key?: string;
  trend_direction?: "up_good" | "down_good";
  color?: "default" | "success" | "warning" | "danger" | "info";
}

export interface KPICardData {
  value: number | string;
  trend?: number;
  trend_label?: string;
  previous_value?: number | string;
}

/**
 * Trust Meter Configuration
 */
export interface TrustMeterConfig extends BaseWidgetConfig {
  widget_type: "trust_meter";
  score_key: string;
  show_breakdown?: boolean;
  thresholds?: {
    danger: number;
    warning: number;
    success: number;
  };
}

export interface TrustMeterData {
  score: number;
  breakdown?: {
    key: string;
    label: string;
    value: number;
    weight: number;
  }[];
  last_updated?: string;
}

/**
 * Pipeline Funnel Configuration
 */
export interface PipelineFunnelConfig extends BaseWidgetConfig {
  widget_type: "pipeline_funnel";
  stages: {
    key: string;
    label: string;
    label_ms?: string;
    color: string;
  }[];
  show_conversion?: boolean;
}

export interface PipelineFunnelData {
  stages: {
    key: string;
    count: number;
    value: number;
  }[];
  conversions?: {
    from: string;
    to: string;
    rate: number;
  }[];
}

/**
 * Recovery Chart Configuration
 */
export interface RecoveryChartConfig extends BaseWidgetConfig {
  widget_type: "recovery_chart";
  period: "7d" | "30d" | "90d";
  show_target?: boolean;
  target_rate?: number;
}

export interface RecoveryChartData {
  series: {
    date: string;
    recovered: number;
    outstanding: number;
    rate: number;
  }[];
  summary: {
    total_recovered: number;
    total_outstanding: number;
    average_rate: number;
  };
}

/**
 * Lead Table Configuration
 */
export interface LeadTableConfig extends BaseWidgetConfig {
  widget_type: "lead_table";
  columns: {
    key: string;
    label: string;
    label_ms?: string;
    format?: "text" | "currency" | "date" | "status" | "score";
    sortable?: boolean;
    width?: string;
  }[];
  filter_key?: string;
  filter_values?: string[];
  row_actions?: ("view" | "edit" | "contact" | "delete")[];
  max_rows?: number;
}

export interface LeadTableData {
  rows: Record<string, unknown>[];
  total: number;
  page?: number;
  page_size?: number;
}

/**
 * Reminder List Configuration
 */
export interface ReminderListConfig extends BaseWidgetConfig {
  widget_type: "reminder_list";
  channels?: ("email" | "whatsapp" | "sms" | "call")[];
  show_scheduled_time?: boolean;
  max_items?: number;
}

export interface ReminderListData {
  reminders: {
    id: string;
    recipient: string;
    channel: "email" | "whatsapp" | "sms" | "call";
    scheduled_at: string;
    status: "queued" | "sent" | "failed" | "cancelled";
    message_preview?: string;
    entity_name?: string;
  }[];
}

/**
 * Success Feed Configuration
 */
export interface SuccessFeedConfig extends BaseWidgetConfig {
  widget_type: "success_feed";
  success_type: "payment" | "conversion" | "deal" | "generic";
  max_items?: number;
  show_details?: boolean;
}

export interface SuccessFeedData {
  items: {
    id: string;
    entity_name: string;
    value: number;
    completed_at: string;
    metric_label?: string;
    metric_value?: number | string;
    badge?: string;
  }[];
}

/**
 * Governance Strip Configuration (G13-G21 badges)
 */
export interface GovernanceStripConfig extends BaseWidgetConfig {
  widget_type: "governance_strip";
  gates: string[];
  compact?: boolean;
}

export interface GovernanceStripData {
  gates: {
    id: string;
    name: string;
    status: "pass" | "partial" | "pending" | "fail";
    last_checked?: string;
    evidence_count?: number;
  }[];
  summary: {
    passed: number;
    total: number;
  };
}

/**
 * Lead Heatmap Configuration
 */
export interface LeadHeatmapConfig extends BaseWidgetConfig {
  widget_type: "lead_heatmap";
  dimension_x: "hour" | "day" | "source";
  dimension_y: "status" | "score_bucket" | "channel";
  metric: "count" | "value" | "rate";
}

export interface LeadHeatmapData {
  cells: {
    x: string;
    y: string;
    value: number;
  }[];
  x_labels: string[];
  y_labels: string[];
  max_value: number;
}

/**
 * WhatsApp Session Card Configuration
 */
export interface WASessionCardConfig extends BaseWidgetConfig {
  widget_type: "wa_session_card";
  show_cost?: boolean;
  show_status?: boolean;
}

export interface WASessionCardData {
  session_id: string;
  phone_number: string;
  status: "active" | "inactive" | "expired";
  started_at: string;
  last_activity?: string;
  message_count: number;
  cost?: number;
}

/**
 * WhatsApp Conversation Timeline Configuration
 */
export interface WAConversationTimelineConfig extends BaseWidgetConfig {
  widget_type: "wa_conversation_timeline";
  max_messages?: number;
  show_timestamps?: boolean;
}

export interface WAConversationTimelineData {
  messages: {
    id: string;
    direction: "inbound" | "outbound";
    content: string;
    timestamp: string;
    status?: "sent" | "delivered" | "read" | "failed";
    media_type?: "text" | "image" | "document" | "audio";
  }[];
  session_info: {
    contact_name: string;
    phone_number: string;
  };
}

/**
 * WhatsApp Cost Breakdown Configuration
 */
export interface WACostBreakdownConfig extends BaseWidgetConfig {
  widget_type: "wa_cost_breakdown";
  period: "day" | "week" | "month";
  show_by_category?: boolean;
}

export interface WACostBreakdownData {
  total_cost: number;
  breakdown: {
    category: string;
    count: number;
    cost: number;
  }[];
  period_start: string;
  period_end: string;
}

/**
 * WhatsApp Send Panel Configuration
 */
export interface WASendPanelConfig extends BaseWidgetConfig {
  widget_type: "wa_send_panel";
  templates?: {
    id: string;
    name: string;
    preview: string;
  }[];
  allow_custom?: boolean;
}

export interface WASendPanelData {
  recent_contacts: {
    phone: string;
    name: string;
    last_contact?: string;
  }[];
  templates: {
    id: string;
    name: string;
    preview: string;
    variables?: string[];
  }[];
}

/**
 * CFO Tab Metrics Configuration
 */
export interface CFOTabMetricsConfig extends BaseWidgetConfig {
  widget_type: "cfo_tab_metrics";
  tab_id: string;
  metrics: {
    key: string;
    label: string;
    format: "currency" | "percentage" | "number";
  }[];
}

export interface CFOTabMetricsData {
  metrics: Record<string, number | string>;
}

/**
 * Variance Card Configuration
 */
export interface VarianceCardConfig extends BaseWidgetConfig {
  widget_type: "variance_card";
  metric_key: string;
  format: "currency" | "percentage" | "number";
  show_sparkline?: boolean;
}

export interface VarianceCardData {
  actual: number;
  target: number;
  variance: number;
  variance_percent: number;
  trend?: number[];
}

/**
 * Union types for all widget configs and data
 */
export type WidgetConfig =
  | KPICardConfig
  | TrustMeterConfig
  | PipelineFunnelConfig
  | RecoveryChartConfig
  | LeadTableConfig
  | ReminderListConfig
  | SuccessFeedConfig
  | GovernanceStripConfig
  | LeadHeatmapConfig
  | WASessionCardConfig
  | WAConversationTimelineConfig
  | WACostBreakdownConfig
  | WASendPanelConfig
  | CFOTabMetricsConfig
  | VarianceCardConfig
  | BaseWidgetConfig;

export type WidgetData =
  | KPICardData
  | TrustMeterData
  | PipelineFunnelData
  | RecoveryChartData
  | LeadTableData
  | ReminderListData
  | SuccessFeedData
  | GovernanceStripData
  | LeadHeatmapData
  | WASessionCardData
  | WAConversationTimelineData
  | WACostBreakdownData
  | WASendPanelData
  | CFOTabMetricsData
  | VarianceCardData
  | Record<string, unknown>;

/**
 * Widget props passed to all widget components
 */
export interface WidgetProps<
  C extends BaseWidgetConfig = BaseWidgetConfig,
  D = Record<string, unknown>
> {
  config: C;
  data?: D;
  state: WidgetState;
  error?: string;
  onRefresh?: () => void;
}
