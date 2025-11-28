// lib/verticals/templates.ts
// Industry vertical template definitions

import type { VerticalTemplate, VerticalId, VerticalMeta } from "./types";
import {
  kpiCardSchemas,
  trustMeterSchemas,
  pipelineFunnelSchemas,
  leadTableSchemas,
  reminderListSchemas,
  successFeedSchemas,
  governanceStripSchemas,
  recoveryChartSchemas,
} from "@/lib/widgets/schemas";

/**
 * Solar Industry Vertical Template
 */
export const solarTemplate: VerticalTemplate = {
  meta: {
    id: "solar",
    name: "Solar CRM",
    name_ms: "CRM Solar",
    description: "Solar panel sales and installation CRM",
    description_ms: "CRM jualan dan pemasangan panel solar",
    icon: "sun",
    color: "#f59e0b",
    version: "1.0.0",
  },
  dashboards: [
    {
      id: "overview",
      name: "Overview",
      name_ms: "Gambaran Keseluruhan",
      description: "Sales pipeline and lead overview",
      icon: "layout-dashboard",
      default: true,
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_total_leads",
          config: {
            ...kpiCardSchemas.total_leads,
            id: "kpi_total_leads",
            widget_type: "kpi_card",
            title: "Total Leads",
            metric_key: "total_leads",
            format: "number",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "kpi_card", metric: "total_leads" } },
        },
        {
          widget_id: "kpi_hot_leads",
          config: {
            ...kpiCardSchemas.hot_leads,
            id: "kpi_hot_leads",
            widget_type: "kpi_card",
            title: "Hot Leads",
            metric_key: "hot_leads",
            format: "number",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "kpi_card", metric: "hot_leads" } },
        },
        {
          widget_id: "kpi_conversion_rate",
          config: {
            ...kpiCardSchemas.conversion_rate,
            id: "kpi_conversion_rate",
            widget_type: "kpi_card",
            title: "Conversion Rate",
            metric_key: "conversion_rate",
            format: "percentage",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "kpi_card", metric: "conversion_rate" } },
        },
        {
          widget_id: "trust_governance",
          config: {
            ...trustMeterSchemas.governance_trust,
            id: "trust_governance",
            widget_type: "trust_meter",
            title: "Trust Score",
            score_key: "trust_score",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "trust_meter" } },
        },
        {
          widget_id: "funnel_sales",
          config: {
            ...pipelineFunnelSchemas.sales_funnel,
            id: "funnel_sales",
            widget_type: "pipeline_funnel",
            title: "Sales Pipeline",
          },
          position: { col: 0, row: 1, width: 6, height: 3 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "pipeline_funnel" } },
        },
        {
          widget_id: "table_all_leads",
          config: {
            ...leadTableSchemas.all_leads,
            id: "table_all_leads",
            widget_type: "lead_table",
            title: "Recent Leads",
          },
          position: { col: 6, row: 1, width: 6, height: 3 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "lead_table", variant: "all_leads" } },
        },
        {
          widget_id: "strip_governance",
          config: {
            ...governanceStripSchemas.compact_strip,
            id: "strip_governance",
            widget_type: "governance_strip",
            title: "Governance",
          },
          position: { col: 0, row: 4, width: 12, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/governance" },
        },
      ],
    },
    {
      id: "recovery",
      name: "Payment Recovery",
      name_ms: "Kutipan Bayaran",
      description: "Track overdue payments and recovery",
      icon: "dollar-sign",
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_total_recoverable",
          config: {
            ...kpiCardSchemas.total_recoverable,
            id: "kpi_total_recoverable",
            widget_type: "kpi_card",
            title: "Total Recoverable",
            metric_key: "total_recoverable",
            format: "currency",
          },
          position: { col: 0, row: 0, width: 4, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "kpi_card", metric: "total_recoverable" } },
        },
        {
          widget_id: "kpi_recovery_rate",
          config: {
            ...kpiCardSchemas.recovery_rate_7d,
            id: "kpi_recovery_rate",
            widget_type: "kpi_card",
            title: "Recovery Rate (7d)",
            metric_key: "recovery_rate_7d",
            format: "percentage",
          },
          position: { col: 4, row: 0, width: 4, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "kpi_card", metric: "recovery_rate_7d" } },
        },
        {
          widget_id: "kpi_pending",
          config: {
            ...kpiCardSchemas.pending_cases,
            id: "kpi_pending",
            widget_type: "kpi_card",
            title: "Pending Cases",
            metric_key: "pending_cases",
            format: "number",
          },
          position: { col: 8, row: 0, width: 4, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "kpi_card", metric: "pending_cases" } },
        },
        {
          widget_id: "table_critical",
          config: {
            ...leadTableSchemas.critical_leads,
            id: "table_critical",
            widget_type: "lead_table",
            title: "Critical Leads",
          },
          position: { col: 0, row: 1, width: 6, height: 3 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "lead_table", variant: "critical_leads" } },
        },
        {
          widget_id: "list_reminders",
          config: {
            ...reminderListSchemas.active_reminders,
            id: "list_reminders",
            widget_type: "reminder_list",
            title: "Active Reminders",
          },
          position: { col: 6, row: 1, width: 6, height: 2 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "reminder_list" } },
        },
        {
          widget_id: "feed_payments",
          config: {
            ...successFeedSchemas.recent_payments,
            id: "feed_payments",
            widget_type: "success_feed",
            title: "Recent Payments",
          },
          position: { col: 6, row: 3, width: 6, height: 1 },
          data_source: { type: "api", endpoint: "/api/mcp/tools/getWidgetData", params: { widget_type: "success_feed" } },
        },
      ],
    },
  ],
  theme: {
    primary: "#f59e0b",
    secondary: "#d97706",
    accent: "#fbbf24",
  },
};

/**
 * Takaful (Islamic Insurance) Vertical Template
 */
export const takafulTemplate: VerticalTemplate = {
  meta: {
    id: "takaful",
    name: "Takaful CRM",
    name_ms: "CRM Takaful",
    description: "Islamic insurance sales and policy management",
    description_ms: "Jualan insurans Islam dan pengurusan polisi",
    icon: "shield",
    color: "#059669",
    version: "1.0.0",
  },
  dashboards: [
    {
      id: "overview",
      name: "Overview",
      name_ms: "Gambaran Keseluruhan",
      description: "Policy sales and lead overview",
      icon: "layout-dashboard",
      default: true,
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_total_leads",
          config: {
            ...kpiCardSchemas.total_leads,
            id: "kpi_total_leads",
            widget_type: "kpi_card",
            title: "Prospects",
            title_ms: "Prospek",
            metric_key: "total_leads",
            format: "number",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_active_policies",
          config: {
            id: "kpi_active_policies",
            widget_type: "kpi_card",
            title: "Active Policies",
            title_ms: "Polisi Aktif",
            metric_key: "active_policies",
            format: "number",
            icon: "file-check",
            color: "success",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_premium_mtd",
          config: {
            id: "kpi_premium_mtd",
            widget_type: "kpi_card",
            title: "Premium MTD",
            title_ms: "Premium BTS",
            metric_key: "premium_mtd",
            format: "currency",
            icon: "trending-up",
            color: "success",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_renewal_rate",
          config: {
            id: "kpi_renewal_rate",
            widget_type: "kpi_card",
            title: "Renewal Rate",
            title_ms: "Kadar Pembaharuan",
            metric_key: "renewal_rate",
            format: "percentage",
            icon: "refresh-cw",
            trend_direction: "up_good",
            color: "info",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "trust_governance",
          config: {
            ...trustMeterSchemas.governance_trust,
            id: "trust_governance",
            widget_type: "trust_meter",
            title: "Shariah Compliance",
            title_ms: "Pematuhan Syariah",
            score_key: "compliance_score",
          },
          position: { col: 0, row: 1, width: 4, height: 2 },
        },
        {
          widget_id: "funnel_policy",
          config: {
            id: "funnel_policy",
            widget_type: "pipeline_funnel",
            title: "Policy Pipeline",
            title_ms: "Talian Polisi",
            stages: [
              { key: "prospect", label: "Prospect", label_ms: "Prospek", color: "#3b82f6" },
              { key: "quoted", label: "Quoted", label_ms: "Sebut Harga", color: "#22c55e" },
              { key: "proposed", label: "Proposed", label_ms: "Dicadangkan", color: "#eab308" },
              { key: "approved", label: "Approved", label_ms: "Diluluskan", color: "#f97316" },
              { key: "issued", label: "Issued", label_ms: "Dikeluarkan", color: "#10b981" },
            ],
            show_conversion: true,
          },
          position: { col: 4, row: 1, width: 8, height: 2 },
        },
        {
          widget_id: "table_prospects",
          config: {
            id: "table_prospects",
            widget_type: "lead_table",
            title: "Recent Prospects",
            title_ms: "Prospek Terkini",
            columns: [
              { key: "name", label: "Name", label_ms: "Nama", format: "text", sortable: true },
              { key: "product", label: "Product", label_ms: "Produk", format: "text" },
              { key: "premium", label: "Premium", format: "currency", sortable: true },
              { key: "status", label: "Status", format: "status" },
              { key: "agent", label: "Agent", label_ms: "Ejen", format: "text" },
              { key: "created_at", label: "Created", label_ms: "Dicipta", format: "date", sortable: true },
            ],
            max_rows: 10,
          },
          position: { col: 0, row: 3, width: 8, height: 3 },
        },
        {
          widget_id: "list_renewals",
          config: {
            id: "list_renewals",
            widget_type: "reminder_list",
            title: "Upcoming Renewals",
            title_ms: "Pembaharuan Akan Datang",
            channels: ["email", "whatsapp", "sms"],
            show_scheduled_time: true,
            max_items: 5,
          },
          position: { col: 8, row: 3, width: 4, height: 3 },
        },
        {
          widget_id: "strip_governance",
          config: {
            ...governanceStripSchemas.compact_strip,
            id: "strip_governance",
            widget_type: "governance_strip",
            title: "Governance",
          },
          position: { col: 0, row: 6, width: 12, height: 1 },
        },
      ],
    },
    {
      id: "claims",
      name: "Claims",
      name_ms: "Tuntutan",
      description: "Claims processing and status",
      icon: "file-text",
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_pending_claims",
          config: {
            id: "kpi_pending_claims",
            widget_type: "kpi_card",
            title: "Pending Claims",
            title_ms: "Tuntutan Tertangguh",
            metric_key: "pending_claims",
            format: "number",
            icon: "clock",
            color: "warning",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_approved_mtd",
          config: {
            id: "kpi_approved_mtd",
            widget_type: "kpi_card",
            title: "Approved MTD",
            title_ms: "Diluluskan BTS",
            metric_key: "approved_claims_mtd",
            format: "currency",
            icon: "check-circle",
            color: "success",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_avg_processing",
          config: {
            id: "kpi_avg_processing",
            widget_type: "kpi_card",
            title: "Avg Processing",
            title_ms: "Purata Pemprosesan",
            metric_key: "avg_processing_days",
            format: "number",
            icon: "clock",
            trend_direction: "down_good",
            color: "info",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_rejection_rate",
          config: {
            id: "kpi_rejection_rate",
            widget_type: "kpi_card",
            title: "Rejection Rate",
            title_ms: "Kadar Penolakan",
            metric_key: "rejection_rate",
            format: "percentage",
            icon: "x-circle",
            trend_direction: "down_good",
            color: "danger",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "table_claims",
          config: {
            id: "table_claims",
            widget_type: "lead_table",
            title: "Claims Queue",
            title_ms: "Barisan Tuntutan",
            columns: [
              { key: "claim_id", label: "Claim ID", format: "text", sortable: true },
              { key: "policyholder", label: "Policyholder", label_ms: "Pemegang Polisi", format: "text" },
              { key: "type", label: "Type", label_ms: "Jenis", format: "text" },
              { key: "amount", label: "Amount", label_ms: "Jumlah", format: "currency", sortable: true },
              { key: "status", label: "Status", format: "status" },
              { key: "submitted_at", label: "Submitted", label_ms: "Dihantar", format: "date", sortable: true },
            ],
            max_rows: 15,
          },
          position: { col: 0, row: 1, width: 12, height: 4 },
        },
      ],
    },
  ],
  theme: {
    primary: "#059669",
    secondary: "#047857",
    accent: "#10b981",
  },
};

/**
 * E-commerce Vertical Template
 */
export const ecommerceTemplate: VerticalTemplate = {
  meta: {
    id: "ecommerce",
    name: "E-commerce CRM",
    name_ms: "CRM E-Dagang",
    description: "Online store sales and customer management",
    description_ms: "Jualan kedai dalam talian dan pengurusan pelanggan",
    icon: "shopping-cart",
    color: "#8b5cf6",
    version: "1.0.0",
  },
  dashboards: [
    {
      id: "overview",
      name: "Overview",
      name_ms: "Gambaran Keseluruhan",
      description: "Sales and order overview",
      icon: "layout-dashboard",
      default: true,
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_total_orders",
          config: {
            id: "kpi_total_orders",
            widget_type: "kpi_card",
            title: "Orders Today",
            title_ms: "Pesanan Hari Ini",
            metric_key: "orders_today",
            format: "number",
            icon: "shopping-bag",
            color: "info",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_revenue_today",
          config: {
            id: "kpi_revenue_today",
            widget_type: "kpi_card",
            title: "Revenue Today",
            title_ms: "Hasil Hari Ini",
            metric_key: "revenue_today",
            format: "currency",
            icon: "dollar-sign",
            color: "success",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_avg_order",
          config: {
            id: "kpi_avg_order",
            widget_type: "kpi_card",
            title: "Avg Order Value",
            title_ms: "Nilai Purata Pesanan",
            metric_key: "avg_order_value",
            format: "currency",
            icon: "trending-up",
            trend_direction: "up_good",
            color: "info",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_cart_abandonment",
          config: {
            id: "kpi_cart_abandonment",
            widget_type: "kpi_card",
            title: "Cart Abandonment",
            title_ms: "Pengabaian Troli",
            metric_key: "cart_abandonment_rate",
            format: "percentage",
            icon: "shopping-cart",
            trend_direction: "down_good",
            color: "warning",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "funnel_sales",
          config: {
            id: "funnel_sales",
            widget_type: "pipeline_funnel",
            title: "Sales Funnel",
            title_ms: "Corong Jualan",
            stages: [
              { key: "visitors", label: "Visitors", label_ms: "Pelawat", color: "#3b82f6" },
              { key: "add_to_cart", label: "Add to Cart", label_ms: "Tambah Troli", color: "#22c55e" },
              { key: "checkout", label: "Checkout", label_ms: "Pembayaran", color: "#eab308" },
              { key: "completed", label: "Completed", label_ms: "Selesai", color: "#10b981" },
            ],
            show_conversion: true,
          },
          position: { col: 0, row: 1, width: 6, height: 3 },
        },
        {
          widget_id: "table_recent_orders",
          config: {
            id: "table_recent_orders",
            widget_type: "lead_table",
            title: "Recent Orders",
            title_ms: "Pesanan Terkini",
            columns: [
              { key: "order_id", label: "Order ID", format: "text", sortable: true },
              { key: "customer", label: "Customer", label_ms: "Pelanggan", format: "text" },
              { key: "total", label: "Total", label_ms: "Jumlah", format: "currency", sortable: true },
              { key: "status", label: "Status", format: "status" },
              { key: "created_at", label: "Date", label_ms: "Tarikh", format: "date", sortable: true },
            ],
            max_rows: 10,
          },
          position: { col: 6, row: 1, width: 6, height: 3 },
        },
        {
          widget_id: "strip_governance",
          config: {
            ...governanceStripSchemas.compact_strip,
            id: "strip_governance",
            widget_type: "governance_strip",
            title: "Governance",
          },
          position: { col: 0, row: 4, width: 12, height: 1 },
        },
      ],
    },
  ],
  theme: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
  },
};

/**
 * Logistics Vertical Template
 */
export const logisticsTemplate: VerticalTemplate = {
  meta: {
    id: "logistics",
    name: "Logistics CRM",
    name_ms: "CRM Logistik",
    description: "Freight and delivery management",
    description_ms: "Pengurusan kargo dan penghantaran",
    icon: "truck",
    color: "#0891b2",
    version: "1.0.0",
  },
  dashboards: [
    {
      id: "overview",
      name: "Overview",
      name_ms: "Gambaran Keseluruhan",
      description: "Fleet and delivery overview",
      icon: "layout-dashboard",
      default: true,
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_active_shipments",
          config: {
            id: "kpi_active_shipments",
            widget_type: "kpi_card",
            title: "Active Shipments",
            title_ms: "Penghantaran Aktif",
            metric_key: "active_shipments",
            format: "number",
            icon: "package",
            color: "info",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_on_time_rate",
          config: {
            id: "kpi_on_time_rate",
            widget_type: "kpi_card",
            title: "On-Time Rate",
            title_ms: "Kadar Tepat Masa",
            metric_key: "on_time_rate",
            format: "percentage",
            icon: "clock",
            trend_direction: "up_good",
            color: "success",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_fleet_utilization",
          config: {
            id: "kpi_fleet_utilization",
            widget_type: "kpi_card",
            title: "Fleet Utilization",
            title_ms: "Penggunaan Armada",
            metric_key: "fleet_utilization",
            format: "percentage",
            icon: "truck",
            color: "info",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_pending_pickups",
          config: {
            id: "kpi_pending_pickups",
            widget_type: "kpi_card",
            title: "Pending Pickups",
            title_ms: "Kutipan Tertangguh",
            metric_key: "pending_pickups",
            format: "number",
            icon: "map-pin",
            trend_direction: "down_good",
            color: "warning",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "table_shipments",
          config: {
            id: "table_shipments",
            widget_type: "lead_table",
            title: "Active Shipments",
            title_ms: "Penghantaran Aktif",
            columns: [
              { key: "tracking_id", label: "Tracking ID", format: "text", sortable: true },
              { key: "origin", label: "Origin", label_ms: "Asal", format: "text" },
              { key: "destination", label: "Destination", label_ms: "Destinasi", format: "text" },
              { key: "status", label: "Status", format: "status" },
              { key: "eta", label: "ETA", format: "date", sortable: true },
            ],
            max_rows: 15,
          },
          position: { col: 0, row: 1, width: 12, height: 4 },
        },
        {
          widget_id: "strip_governance",
          config: {
            ...governanceStripSchemas.compact_strip,
            id: "strip_governance",
            widget_type: "governance_strip",
            title: "Governance",
          },
          position: { col: 0, row: 5, width: 12, height: 1 },
        },
      ],
    },
  ],
  theme: {
    primary: "#0891b2",
    secondary: "#0e7490",
    accent: "#22d3ee",
  },
};

/**
 * Manufacturing Vertical Template
 */
export const manufacturingTemplate: VerticalTemplate = {
  meta: {
    id: "manufacturing",
    name: "Manufacturing CRM",
    name_ms: "CRM Pembuatan",
    description: "B2B sales and order management",
    description_ms: "Jualan B2B dan pengurusan pesanan",
    icon: "factory",
    color: "#dc2626",
    version: "1.0.0",
  },
  dashboards: [
    {
      id: "overview",
      name: "Overview",
      name_ms: "Gambaran Keseluruhan",
      description: "Sales and production overview",
      icon: "layout-dashboard",
      default: true,
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_total_orders",
          config: {
            id: "kpi_total_orders",
            widget_type: "kpi_card",
            title: "Active Orders",
            title_ms: "Pesanan Aktif",
            metric_key: "active_orders",
            format: "number",
            icon: "clipboard-list",
            color: "info",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_pipeline_value",
          config: {
            id: "kpi_pipeline_value",
            widget_type: "kpi_card",
            title: "Pipeline Value",
            title_ms: "Nilai Talian",
            metric_key: "pipeline_value",
            format: "currency",
            icon: "dollar-sign",
            color: "success",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_production_capacity",
          config: {
            id: "kpi_production_capacity",
            widget_type: "kpi_card",
            title: "Capacity Used",
            title_ms: "Kapasiti Digunakan",
            metric_key: "capacity_utilization",
            format: "percentage",
            icon: "activity",
            color: "info",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_fulfillment_rate",
          config: {
            id: "kpi_fulfillment_rate",
            widget_type: "kpi_card",
            title: "Fulfillment Rate",
            title_ms: "Kadar Pemenuhan",
            metric_key: "fulfillment_rate",
            format: "percentage",
            icon: "check-circle",
            trend_direction: "up_good",
            color: "success",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "funnel_sales",
          config: {
            id: "funnel_sales",
            widget_type: "pipeline_funnel",
            title: "B2B Pipeline",
            title_ms: "Talian B2B",
            stages: [
              { key: "inquiry", label: "Inquiry", label_ms: "Pertanyaan", color: "#3b82f6" },
              { key: "quotation", label: "Quotation", label_ms: "Sebut Harga", color: "#22c55e" },
              { key: "negotiation", label: "Negotiation", label_ms: "Rundingan", color: "#eab308" },
              { key: "po_received", label: "PO Received", label_ms: "PO Diterima", color: "#f97316" },
              { key: "production", label: "Production", label_ms: "Pengeluaran", color: "#10b981" },
            ],
            show_conversion: true,
          },
          position: { col: 0, row: 1, width: 6, height: 3 },
        },
        {
          widget_id: "table_orders",
          config: {
            id: "table_orders",
            widget_type: "lead_table",
            title: "Active Orders",
            title_ms: "Pesanan Aktif",
            columns: [
              { key: "po_number", label: "PO Number", format: "text", sortable: true },
              { key: "customer", label: "Customer", label_ms: "Pelanggan", format: "text" },
              { key: "value", label: "Value", label_ms: "Nilai", format: "currency", sortable: true },
              { key: "status", label: "Status", format: "status" },
              { key: "delivery_date", label: "Delivery", label_ms: "Penghantaran", format: "date", sortable: true },
            ],
            max_rows: 10,
          },
          position: { col: 6, row: 1, width: 6, height: 3 },
        },
        {
          widget_id: "strip_governance",
          config: {
            ...governanceStripSchemas.compact_strip,
            id: "strip_governance",
            widget_type: "governance_strip",
            title: "Governance",
          },
          position: { col: 0, row: 4, width: 12, height: 1 },
        },
      ],
    },
  ],
  theme: {
    primary: "#dc2626",
    secondary: "#b91c1c",
    accent: "#f87171",
  },
};

/**
 * Healthcare Vertical Template
 */
export const healthcareTemplate: VerticalTemplate = {
  meta: {
    id: "healthcare",
    name: "Healthcare CRM",
    name_ms: "CRM Penjagaan Kesihatan",
    description: "Patient management and appointments",
    description_ms: "Pengurusan pesakit dan temu janji",
    icon: "heart-pulse",
    color: "#ec4899",
    version: "1.0.0",
  },
  dashboards: [
    {
      id: "overview",
      name: "Overview",
      name_ms: "Gambaran Keseluruhan",
      description: "Patient and appointment overview",
      icon: "layout-dashboard",
      default: true,
      layout: {
        columns: 12,
        row_height: 80,
        gap: 16,
        breakpoints: { sm: 1, md: 6, lg: 12 },
      },
      widgets: [
        {
          widget_id: "kpi_appointments_today",
          config: {
            id: "kpi_appointments_today",
            widget_type: "kpi_card",
            title: "Appointments Today",
            title_ms: "Temu Janji Hari Ini",
            metric_key: "appointments_today",
            format: "number",
            icon: "calendar",
            color: "info",
          },
          position: { col: 0, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_new_patients",
          config: {
            id: "kpi_new_patients",
            widget_type: "kpi_card",
            title: "New Patients",
            title_ms: "Pesakit Baru",
            metric_key: "new_patients_mtd",
            format: "number",
            icon: "user-plus",
            color: "success",
          },
          position: { col: 3, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_revenue_mtd",
          config: {
            id: "kpi_revenue_mtd",
            widget_type: "kpi_card",
            title: "Revenue MTD",
            title_ms: "Hasil BTS",
            metric_key: "revenue_mtd",
            format: "currency",
            icon: "dollar-sign",
            color: "success",
          },
          position: { col: 6, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "kpi_no_show_rate",
          config: {
            id: "kpi_no_show_rate",
            widget_type: "kpi_card",
            title: "No-Show Rate",
            title_ms: "Kadar Tidak Hadir",
            metric_key: "no_show_rate",
            format: "percentage",
            icon: "user-x",
            trend_direction: "down_good",
            color: "warning",
          },
          position: { col: 9, row: 0, width: 3, height: 1 },
        },
        {
          widget_id: "table_appointments",
          config: {
            id: "table_appointments",
            widget_type: "lead_table",
            title: "Today's Appointments",
            title_ms: "Temu Janji Hari Ini",
            columns: [
              { key: "time", label: "Time", label_ms: "Masa", format: "text", sortable: true },
              { key: "patient", label: "Patient", label_ms: "Pesakit", format: "text" },
              { key: "doctor", label: "Doctor", label_ms: "Doktor", format: "text" },
              { key: "type", label: "Type", label_ms: "Jenis", format: "text" },
              { key: "status", label: "Status", format: "status" },
            ],
            max_rows: 15,
          },
          position: { col: 0, row: 1, width: 8, height: 4 },
        },
        {
          widget_id: "list_reminders",
          config: {
            id: "list_reminders",
            widget_type: "reminder_list",
            title: "Appointment Reminders",
            title_ms: "Peringatan Temu Janji",
            channels: ["sms", "whatsapp"],
            show_scheduled_time: true,
            max_items: 10,
          },
          position: { col: 8, row: 1, width: 4, height: 4 },
        },
        {
          widget_id: "strip_governance",
          config: {
            ...governanceStripSchemas.compact_strip,
            id: "strip_governance",
            widget_type: "governance_strip",
            title: "Governance",
          },
          position: { col: 0, row: 5, width: 12, height: 1 },
        },
      ],
    },
  ],
  theme: {
    primary: "#ec4899",
    secondary: "#db2777",
    accent: "#f472b6",
  },
};

/**
 * All vertical templates
 */
export const verticalTemplates: Record<VerticalId, VerticalTemplate> = {
  solar: solarTemplate,
  takaful: takafulTemplate,
  ecommerce: ecommerceTemplate,
  logistics: logisticsTemplate,
  manufacturing: manufacturingTemplate,
  healthcare: healthcareTemplate,
};

/**
 * Get template by vertical ID
 */
export function getVerticalTemplate(verticalId: string): VerticalTemplate | undefined {
  return verticalTemplates[verticalId as VerticalId];
}

/**
 * Get all vertical metadata for navigation
 */
export function getAllVerticalsMeta(): VerticalMeta[] {
  return Object.values(verticalTemplates).map((t) => t.meta);
}

/**
 * Validate vertical ID
 */
export function isValidVerticalId(id: string): id is VerticalId {
  return id in verticalTemplates;
}
