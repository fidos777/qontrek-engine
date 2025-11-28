// lib/verticals/types.ts
// Type definitions for vertical templates and dashboards

export type VerticalId = 'solar' | 'takaful' | 'ecommerce' | 'training' | 'construction' | 'automotive';

export interface WidgetPosition {
  col: number;
  row: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  widget_type: string;
  position: WidgetPosition;
  config?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  columns?: number;
}

export interface KPIDefinition {
  id: string;
  label: string;
  binding: string;
  format: 'currency' | 'percentage' | 'number' | 'date';
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface StageConfig {
  id: string;
  name: string;
  order: number;
  color?: string;
  icon?: string;
}

export interface VerticalTemplate {
  id: VerticalId;
  name: string;
  description: string;
  icon?: string;
  dashboards: DashboardLayout[];
  kpis: KPIDefinition[];
  stages?: StageConfig[];
  defaultDashboardId?: string;
}
