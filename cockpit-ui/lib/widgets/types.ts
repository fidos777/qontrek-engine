/**
 * Widget System Types for L5 UI Shell
 * Defines the schema for widget configuration and instances
 */

export interface WidgetFieldAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
}

export interface WidgetField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'badge' | 'action' | 'progress' | 'chart' | 'list';
  binding: string;
  format?: string;
  style?: Record<string, any>;
  actions?: WidgetFieldAction[];
}

export interface WidgetDataSource {
  mcp_tool: string;
  params?: Record<string, any>;
  refresh_interval_ms?: number;
}

export interface WidgetLayout {
  min_width: number;
  min_height: number;
  default_width: number;
  default_height: number;
}

export interface WidgetGovernance {
  requires_approval?: boolean;
  approval_roles?: string[];
  audit_level?: 'none' | 'basic' | 'full';
}

export type WidgetCategory = 'metrics' | 'data' | 'communication' | 'governance' | 'whatsapp';

export interface WidgetSchema {
  id: string;
  type: string;
  version: string;
  title: string;
  category: WidgetCategory;
  data_source: WidgetDataSource;
  fields: WidgetField[];
  layout: WidgetLayout;
  display: Record<string, any>;
  governance?: WidgetGovernance;
}

export type WidgetState = 'loading' | 'ready' | 'error' | 'stale';

export interface WidgetInstance {
  instance_id: string;
  schema: WidgetSchema;
  data: Record<string, any>;
  state: WidgetState;
  last_updated: string;
  error?: string;
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetInstance[];
  layout: {
    columns: number;
    gap: number;
  };
}
