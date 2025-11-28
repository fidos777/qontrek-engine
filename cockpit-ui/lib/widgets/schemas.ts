// lib/widgets/schemas.ts
// Widget schema presets for common configurations

import type {
  KPICardConfig,
  TrustMeterConfig,
  PipelineFunnelConfig,
  RecoveryChartConfig,
  LeadTableConfig,
  ReminderListConfig,
  SuccessFeedConfig,
  GovernanceStripConfig,
  LeadHeatmapConfig,
  WASessionCardConfig,
  WAConversationTimelineConfig,
  WACostBreakdownConfig,
  WASendPanelConfig,
  CFOTabMetricsConfig,
  VarianceCardConfig,
} from "./types";

/**
 * KPI Card presets
 */
export const kpiCardSchemas: Record<string, Partial<KPICardConfig>> = {
  total_leads: {
    id: "kpi_total_leads",
    widget_type: "kpi_card",
    title: "Total Leads",
    title_ms: "Jumlah Lead",
    metric_key: "total_leads",
    format: "number",
    icon: "users",
    color: "info",
  },
  hot_leads: {
    id: "kpi_hot_leads",
    widget_type: "kpi_card",
    title: "Hot Leads",
    title_ms: "Lead Panas",
    metric_key: "hot_leads",
    format: "number",
    icon: "flame",
    color: "danger",
  },
  conversion_rate: {
    id: "kpi_conversion_rate",
    widget_type: "kpi_card",
    title: "Conversion Rate",
    title_ms: "Kadar Penukaran",
    metric_key: "conversion_rate",
    format: "percentage",
    icon: "trending-up",
    trend_direction: "up_good",
    color: "success",
  },
  total_recoverable: {
    id: "kpi_total_recoverable",
    widget_type: "kpi_card",
    title: "Total Recoverable",
    title_ms: "Jumlah Boleh Dikutip",
    metric_key: "total_recoverable",
    format: "currency",
    icon: "dollar-sign",
    color: "warning",
  },
  recovery_rate_7d: {
    id: "kpi_recovery_rate_7d",
    widget_type: "kpi_card",
    title: "7-Day Recovery Rate",
    title_ms: "Kadar Kutipan 7 Hari",
    metric_key: "recovery_rate_7d",
    format: "percentage",
    icon: "activity",
    trend_direction: "up_good",
    color: "success",
  },
  pending_cases: {
    id: "kpi_pending_cases",
    widget_type: "kpi_card",
    title: "Pending Cases",
    title_ms: "Kes Tertangguh",
    metric_key: "pending_cases",
    format: "number",
    icon: "clock",
    trend_direction: "down_good",
    color: "warning",
  },
  total_revenue: {
    id: "kpi_total_revenue",
    widget_type: "kpi_card",
    title: "Total Revenue",
    title_ms: "Jumlah Hasil",
    metric_key: "total_revenue",
    format: "currency",
    icon: "dollar-sign",
    color: "success",
  },
  avg_margin: {
    id: "kpi_avg_margin",
    widget_type: "kpi_card",
    title: "Average Margin",
    title_ms: "Margin Purata",
    metric_key: "avg_margin",
    format: "percentage",
    icon: "percent",
    trend_direction: "up_good",
    color: "info",
  },
};

/**
 * Trust Meter presets
 */
export const trustMeterSchemas: Record<string, Partial<TrustMeterConfig>> = {
  governance_trust: {
    id: "trust_governance",
    widget_type: "trust_meter",
    title: "Governance Trust Score",
    title_ms: "Skor Kepercayaan Tadbir Urus",
    score_key: "trust_score",
    show_breakdown: true,
    thresholds: {
      danger: 50,
      warning: 80,
      success: 100,
    },
  },
  lead_quality: {
    id: "trust_lead_quality",
    widget_type: "trust_meter",
    title: "Lead Quality Score",
    title_ms: "Skor Kualiti Lead",
    score_key: "quality_score",
    show_breakdown: false,
    thresholds: {
      danger: 40,
      warning: 70,
      success: 100,
    },
  },
};

/**
 * Pipeline Funnel presets
 */
export const pipelineFunnelSchemas: Record<string, Partial<PipelineFunnelConfig>> = {
  sales_funnel: {
    id: "funnel_sales",
    widget_type: "pipeline_funnel",
    title: "Sales Pipeline",
    title_ms: "Talian Jualan",
    stages: [
      { key: "lead", label: "Lead", label_ms: "Lead", color: "#3b82f6" },
      { key: "qualified", label: "Qualified", label_ms: "Layak", color: "#22c55e" },
      { key: "proposal", label: "Proposal", label_ms: "Cadangan", color: "#eab308" },
      { key: "negotiation", label: "Negotiation", label_ms: "Rundingan", color: "#f97316" },
      { key: "closed", label: "Closed", label_ms: "Ditutup", color: "#10b981" },
    ],
    show_conversion: true,
  },
  recovery_funnel: {
    id: "funnel_recovery",
    widget_type: "pipeline_funnel",
    title: "Recovery Pipeline",
    title_ms: "Talian Kutipan",
    stages: [
      { key: "overdue", label: "Overdue", label_ms: "Tertunggak", color: "#ef4444" },
      { key: "contacted", label: "Contacted", label_ms: "Dihubungi", color: "#f97316" },
      { key: "promised", label: "Promised", label_ms: "Dijanjikan", color: "#eab308" },
      { key: "partial", label: "Partial Payment", label_ms: "Bayaran Separa", color: "#22c55e" },
      { key: "paid", label: "Paid", label_ms: "Dibayar", color: "#10b981" },
    ],
    show_conversion: true,
  },
};

/**
 * Recovery Chart presets
 */
export const recoveryChartSchemas: Record<string, Partial<RecoveryChartConfig>> = {
  recovery_7d: {
    id: "chart_recovery_7d",
    widget_type: "recovery_chart",
    title: "7-Day Recovery Trend",
    title_ms: "Trend Kutipan 7 Hari",
    period: "7d",
    show_target: true,
    target_rate: 0.8,
  },
  recovery_30d: {
    id: "chart_recovery_30d",
    widget_type: "recovery_chart",
    title: "30-Day Recovery Trend",
    title_ms: "Trend Kutipan 30 Hari",
    period: "30d",
    show_target: true,
    target_rate: 0.75,
  },
};

/**
 * Lead Table presets
 */
export const leadTableSchemas: Record<string, Partial<LeadTableConfig>> = {
  critical_leads: {
    id: "table_critical_leads",
    widget_type: "lead_table",
    title: "Critical Leads",
    title_ms: "Lead Kritikal",
    columns: [
      { key: "name", label: "Name", label_ms: "Nama", format: "text", sortable: true },
      { key: "stage", label: "Stage", label_ms: "Tahap", format: "status" },
      { key: "amount", label: "Amount", label_ms: "Jumlah", format: "currency", sortable: true },
      { key: "overdue_days", label: "Overdue", label_ms: "Tertunggak", format: "text", sortable: true },
      { key: "last_reminder_at", label: "Last Reminder", label_ms: "Peringatan Terakhir", format: "date" },
    ],
    filter_key: "stage",
    filter_values: ["OVERDUE", "CRITICAL"],
    row_actions: ["view", "contact"],
    max_rows: 10,
  },
  all_leads: {
    id: "table_all_leads",
    widget_type: "lead_table",
    title: "All Leads",
    title_ms: "Semua Lead",
    columns: [
      { key: "company", label: "Company", label_ms: "Syarikat", format: "text", sortable: true },
      { key: "contact", label: "Contact", label_ms: "Kenalan", format: "text" },
      { key: "status", label: "Status", format: "status", sortable: true },
      { key: "score", label: "Score", label_ms: "Skor", format: "text", sortable: true },
      { key: "source", label: "Source", label_ms: "Sumber", format: "text" },
      { key: "last_contact", label: "Last Contact", label_ms: "Hubungan Terakhir", format: "date", sortable: true },
    ],
    row_actions: ["view", "edit", "contact"],
    max_rows: 20,
  },
  activity_table: {
    id: "table_activity",
    widget_type: "lead_table",
    title: "Recent Activity",
    title_ms: "Aktiviti Terkini",
    columns: [
      { key: "company", label: "Company", label_ms: "Syarikat", format: "text" },
      { key: "contact", label: "Contact", label_ms: "Kenalan", format: "text" },
      { key: "status", label: "Status", format: "status" },
      { key: "score", label: "Score", label_ms: "Skor", format: "score" },
      { key: "source", label: "Source", label_ms: "Sumber", format: "text" },
      { key: "response_time", label: "Response", label_ms: "Respons", format: "text" },
      { key: "last_contact", label: "Last Contact", label_ms: "Hubungan Terakhir", format: "date" },
    ],
    max_rows: 10,
  },
};

/**
 * Reminder List presets
 */
export const reminderListSchemas: Record<string, Partial<ReminderListConfig>> = {
  active_reminders: {
    id: "list_active_reminders",
    widget_type: "reminder_list",
    title: "Active Reminders",
    title_ms: "Peringatan Aktif",
    channels: ["email", "whatsapp", "sms"],
    show_scheduled_time: true,
    max_items: 10,
  },
  today_reminders: {
    id: "list_today_reminders",
    widget_type: "reminder_list",
    title: "Today's Reminders",
    title_ms: "Peringatan Hari Ini",
    show_scheduled_time: true,
    max_items: 5,
  },
};

/**
 * Success Feed presets
 */
export const successFeedSchemas: Record<string, Partial<SuccessFeedConfig>> = {
  recent_payments: {
    id: "feed_recent_payments",
    widget_type: "success_feed",
    title: "Recent Payments",
    title_ms: "Bayaran Terkini",
    success_type: "payment",
    max_items: 5,
    show_details: true,
  },
  recent_wins: {
    id: "feed_recent_wins",
    widget_type: "success_feed",
    title: "Recent Wins",
    title_ms: "Kejayaan Terkini",
    success_type: "deal",
    max_items: 5,
    show_details: true,
  },
};

/**
 * Governance Strip presets
 */
export const governanceStripSchemas: Record<string, Partial<GovernanceStripConfig>> = {
  full_strip: {
    id: "strip_governance_full",
    widget_type: "governance_strip",
    title: "Governance Gates",
    title_ms: "Pintu Tadbir Urus",
    gates: ["G13", "G14", "G15", "G16", "G17", "G18", "G19", "G20", "G21"],
    compact: false,
  },
  compact_strip: {
    id: "strip_governance_compact",
    widget_type: "governance_strip",
    title: "Governance",
    title_ms: "Tadbir Urus",
    gates: ["G13", "G14", "G15", "G16", "G17", "G18", "G19", "G20", "G21"],
    compact: true,
  },
};

/**
 * Lead Heatmap presets
 */
export const leadHeatmapSchemas: Record<string, Partial<LeadHeatmapConfig>> = {
  activity_heatmap: {
    id: "heatmap_activity",
    widget_type: "lead_heatmap",
    title: "Lead Activity Heatmap",
    title_ms: "Peta Haba Aktiviti Lead",
    dimension_x: "hour",
    dimension_y: "status",
    metric: "count",
  },
  source_heatmap: {
    id: "heatmap_source",
    widget_type: "lead_heatmap",
    title: "Lead Source Heatmap",
    title_ms: "Peta Haba Sumber Lead",
    dimension_x: "source",
    dimension_y: "score_bucket",
    metric: "count",
  },
};

/**
 * WhatsApp Session Card presets
 */
export const waSessionCardSchemas: Record<string, Partial<WASessionCardConfig>> = {
  default: {
    id: "wa_session_default",
    widget_type: "wa_session_card",
    title: "WhatsApp Session",
    title_ms: "Sesi WhatsApp",
    show_cost: true,
    show_status: true,
  },
};

/**
 * WhatsApp Conversation Timeline presets
 */
export const waConversationTimelineSchemas: Record<string, Partial<WAConversationTimelineConfig>> = {
  default: {
    id: "wa_conversation_default",
    widget_type: "wa_conversation_timeline",
    title: "Conversation",
    title_ms: "Perbualan",
    max_messages: 20,
    show_timestamps: true,
  },
};

/**
 * WhatsApp Cost Breakdown presets
 */
export const waCostBreakdownSchemas: Record<string, Partial<WACostBreakdownConfig>> = {
  daily_cost: {
    id: "wa_cost_daily",
    widget_type: "wa_cost_breakdown",
    title: "Daily WhatsApp Cost",
    title_ms: "Kos WhatsApp Harian",
    period: "day",
    show_by_category: true,
  },
  monthly_cost: {
    id: "wa_cost_monthly",
    widget_type: "wa_cost_breakdown",
    title: "Monthly WhatsApp Cost",
    title_ms: "Kos WhatsApp Bulanan",
    period: "month",
    show_by_category: true,
  },
};

/**
 * WhatsApp Send Panel presets
 */
export const waSendPanelSchemas: Record<string, Partial<WASendPanelConfig>> = {
  default: {
    id: "wa_send_default",
    widget_type: "wa_send_panel",
    title: "Send Message",
    title_ms: "Hantar Mesej",
    allow_custom: true,
  },
};

/**
 * CFO Tab Metrics presets
 */
export const cfoTabMetricsSchemas: Record<string, Partial<CFOTabMetricsConfig>> = {
  cashflow: {
    id: "cfo_cashflow",
    widget_type: "cfo_tab_metrics",
    title: "Cashflow",
    title_ms: "Aliran Tunai",
    tab_id: "cashflow",
    metrics: [
      { key: "cash_in_30d", label: "Cash In (30d)", format: "currency" },
      { key: "cash_out_30d", label: "Cash Out (30d)", format: "currency" },
      { key: "net_cashflow", label: "Net Cashflow", format: "currency" },
      { key: "runway_months", label: "Runway (months)", format: "number" },
    ],
  },
  recovery: {
    id: "cfo_recovery",
    widget_type: "cfo_tab_metrics",
    title: "Recovery",
    title_ms: "Kutipan",
    tab_id: "recovery",
    metrics: [
      { key: "total_recoverable", label: "Total Recoverable", format: "currency" },
      { key: "recovered_mtd", label: "Recovered MTD", format: "currency" },
      { key: "recovery_rate", label: "Recovery Rate", format: "percentage" },
    ],
  },
};

/**
 * Variance Card presets
 */
export const varianceCardSchemas: Record<string, Partial<VarianceCardConfig>> = {
  revenue_variance: {
    id: "variance_revenue",
    widget_type: "variance_card",
    title: "Revenue Variance",
    title_ms: "Varians Hasil",
    metric_key: "revenue_variance",
    format: "percentage",
    show_sparkline: true,
  },
  cost_variance: {
    id: "variance_cost",
    widget_type: "variance_card",
    title: "Cost Variance",
    title_ms: "Varians Kos",
    metric_key: "cost_variance",
    format: "percentage",
    show_sparkline: true,
  },
};

/**
 * All widget schemas combined
 */
export const widgetSchemas = {
  kpi_card: kpiCardSchemas,
  trust_meter: trustMeterSchemas,
  pipeline_funnel: pipelineFunnelSchemas,
  recovery_chart: recoveryChartSchemas,
  lead_table: leadTableSchemas,
  reminder_list: reminderListSchemas,
  success_feed: successFeedSchemas,
  governance_strip: governanceStripSchemas,
  lead_heatmap: leadHeatmapSchemas,
  wa_session_card: waSessionCardSchemas,
  wa_conversation_timeline: waConversationTimelineSchemas,
  wa_cost_breakdown: waCostBreakdownSchemas,
  wa_send_panel: waSendPanelSchemas,
  cfo_tab_metrics: cfoTabMetricsSchemas,
  variance_card: varianceCardSchemas,
};

export type WidgetSchemas = typeof widgetSchemas;
