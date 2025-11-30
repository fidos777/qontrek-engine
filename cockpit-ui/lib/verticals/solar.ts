// ============================================
// SOLAR VERTICAL PACK
// Layer: L4 (Vertical Configuration)
// Purpose: Define Solar dashboard layout and behavior
// ============================================

import { SOLAR_WIDGET_IDS } from '@/lib/widgets/schemas/solar';

// ============================================
// TYPES
// ============================================

export interface VerticalPack {
  id: string;
  name: string;
  description: string;
  version: string;
  tenant: string;
  icon: string;
  color: string;
  
  // Dashboard definitions
  dashboards: DashboardDefinition[];
  
  // Default settings
  defaults: {
    refresh_interval_ms: number;
    date_range_days: number;
    theme: 'light' | 'dark' | 'system';
  };
  
  // MCP configuration
  mcp: {
    base_endpoint: string;
    tools: string[];
  };
  
  // Feature flags
  features: {
    real_time_updates: boolean;
    export_enabled: boolean;
    actions_enabled: boolean;
    ai_suggestions: boolean;
  };
}

export interface DashboardDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Widget layout
  layout: DashboardLayout;
  
  // Filters
  filters?: DashboardFilter[];
  
  // Actions
  actions?: DashboardAction[];
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns?: number;
  gap?: number;
  rows: LayoutRow[];
}

export interface LayoutRow {
  id: string;
  widgets: LayoutWidget[];
  height?: string;
}

export interface LayoutWidget {
  id: string;
  widget_id: string;
  span?: number; // Column span (1-12)
  height?: string;
}

export interface DashboardFilter {
  id: string;
  type: 'select' | 'date_range' | 'search';
  label: string;
  options?: { value: string; label: string }[];
  default_value?: string;
}

export interface DashboardAction {
  id: string;
  label: string;
  icon: string;
  action: 'export' | 'refresh' | 'filter' | 'custom';
  endpoint?: string;
}

// ============================================
// SOLAR VERTICAL PACK DEFINITION
// ============================================

export const SOLAR_VERTICAL_PACK: VerticalPack = {
  id: 'voltek_solar_v1',
  name: 'Voltek Solar Recovery',
  description: 'Payment recovery dashboard for Voltek solar installations',
  version: '1.0.0',
  tenant: 'voltek',
  icon: 'sun',
  color: '#f97316', // Orange-500
  
  dashboards: [
    {
      id: 'recovery_overview',
      name: 'Recovery Overview',
      description: 'Main payment recovery dashboard',
      icon: 'layout-dashboard',
      
      layout: {
        type: 'grid',
        columns: 12,
        gap: 16,
        rows: [
          // Row 1: Hero KPI (full width)
          {
            id: 'row_hero',
            widgets: [
              { id: 'w1', widget_id: 'solar_kpi_hero', span: 12 },
            ],
            height: 'auto',
          },
          
          // Row 2: Stage Buckets (3 cards)
          {
            id: 'row_buckets',
            widgets: [
              { id: 'w2', widget_id: 'solar_stage_buckets', span: 12 },
            ],
            height: 'auto',
          },
          
          // Row 3: KPI Grid + Pipeline Chart
          {
            id: 'row_kpi_pipeline',
            widgets: [
              { id: 'w3', widget_id: 'solar_kpi_grid', span: 6 },
              { id: 'w4', widget_id: 'solar_pipeline_chart', span: 6 },
            ],
            height: '300px',
          },
          
          // Row 4: Critical Leads Table (full width)
          {
            id: 'row_critical',
            widgets: [
              { id: 'w5', widget_id: 'solar_critical_table', span: 12 },
            ],
            height: 'auto',
          },
          
          // Row 5: State Distribution + Recent Wins + Reminders
          {
            id: 'row_bottom',
            widgets: [
              { id: 'w6', widget_id: 'solar_state_distribution', span: 4 },
              { id: 'w7', widget_id: 'solar_recent_wins', span: 4 },
              { id: 'w8', widget_id: 'solar_reminders', span: 4 },
            ],
            height: '350px',
          },
        ],
      },
      
      filters: [
        {
          id: 'stage_filter',
          type: 'select',
          label: 'Payment Stage',
          options: [
            { value: 'ALL', label: 'All Stages' },
            { value: '80%', label: 'Pending 80%' },
            { value: '20%', label: 'Pending 20%' },
            { value: 'HANDOVER', label: 'Handover' },
          ],
          default_value: 'ALL',
        },
        {
          id: 'state_filter',
          type: 'select',
          label: 'State',
          options: [
            { value: '', label: 'All States' },
            { value: 'SELANGOR', label: 'Selangor' },
            { value: 'JOHOR', label: 'Johor' },
            { value: 'KUALA LUMPUR', label: 'Kuala Lumpur' },
            { value: 'NEGERI SEMBILAN', label: 'Negeri Sembilan' },
            { value: 'MELAKA', label: 'Melaka' },
            { value: 'PERAK', label: 'Perak' },
          ],
          default_value: '',
        },
        {
          id: 'date_range',
          type: 'date_range',
          label: 'Date Range',
          default_value: '30d',
        },
      ],
      
      actions: [
        {
          id: 'refresh',
          label: 'Refresh',
          icon: 'refresh-cw',
          action: 'refresh',
        },
        {
          id: 'export',
          label: 'Export',
          icon: 'download',
          action: 'export',
        },
      ],
    },
  ],
  
  defaults: {
    refresh_interval_ms: 30000,
    date_range_days: 30,
    theme: 'system',
  },
  
  mcp: {
    base_endpoint: '/api/mcp/solar',
    tools: [
      'getPipelineSummary',
      'getCriticalLeads',
      'logRecoveryAction',
      'getGovernanceStatus',
      'refreshProof',
    ],
  },
  
  features: {
    real_time_updates: false, // Enable when Supabase connected
    export_enabled: true,
    actions_enabled: true,
    ai_suggestions: false, // Enable in Tier 2
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSolarDashboard(dashboardId: string): DashboardDefinition | undefined {
  return SOLAR_VERTICAL_PACK.dashboards.find(d => d.id === dashboardId);
}

export function getDefaultSolarDashboard(): DashboardDefinition {
  return SOLAR_VERTICAL_PACK.dashboards[0];
}

export function getSolarWidgetLayout(dashboardId: string, widgetId: string): LayoutWidget | undefined {
  const dashboard = getSolarDashboard(dashboardId);
  if (!dashboard) return undefined;
  
  for (const row of dashboard.layout.rows) {
    const widget = row.widgets.find(w => w.widget_id === widgetId);
    if (widget) return widget;
  }
  return undefined;
}

export default SOLAR_VERTICAL_PACK;
