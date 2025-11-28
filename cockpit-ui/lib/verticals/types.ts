// lib/verticals/types.ts
// Vertical template type definitions for L4 Vertical Templates

import type { WidgetConfig, WidgetPosition } from "@/lib/widgets/types";

/**
 * Supported industry verticals
 */
export type VerticalId =
  | "solar"
  | "takaful"
  | "ecommerce"
  | "logistics"
  | "manufacturing"
  | "healthcare";

/**
 * Vertical metadata
 */
export interface VerticalMeta {
  id: VerticalId;
  name: string;
  name_ms: string;
  description: string;
  description_ms: string;
  icon: string;
  color: string;
  version: string;
}

/**
 * Dashboard definition within a vertical
 */
export interface DashboardDefinition {
  id: string;
  name: string;
  name_ms: string;
  description?: string;
  description_ms?: string;
  icon?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  default?: boolean;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  columns: number; // Grid columns (e.g., 12)
  row_height: number; // Row height in pixels
  gap: number; // Gap between widgets in pixels
  breakpoints?: {
    sm?: number; // columns at sm breakpoint
    md?: number; // columns at md breakpoint
    lg?: number; // columns at lg breakpoint
  };
}

/**
 * Widget placement in dashboard
 */
export interface DashboardWidget {
  widget_id: string;
  config: WidgetConfig;
  position: WidgetPosition;
  data_source?: WidgetDataSource;
  visible?: boolean;
}

/**
 * Widget data source configuration
 */
export interface WidgetDataSource {
  type: "api" | "static" | "computed";
  endpoint?: string;
  params?: Record<string, string | number | boolean>;
  static_data?: Record<string, unknown>;
  transform?: string; // Function name for data transformation
  refresh_interval?: number; // seconds
}

/**
 * Complete vertical template
 */
export interface VerticalTemplate {
  meta: VerticalMeta;
  dashboards: DashboardDefinition[];
  data_sources?: Record<string, WidgetDataSource>;
  theme?: VerticalTheme;
}

/**
 * Vertical-specific theme overrides
 */
export interface VerticalTheme {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  surface?: string;
}

/**
 * API response for vertical config
 */
export interface VerticalConfigResponse {
  ok: boolean;
  vertical: VerticalTemplate;
  timestamp: string;
}
