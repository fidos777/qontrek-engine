// ============================================
// SOLAR KPI HERO WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Display total recoverable pipeline as hero metric
// ============================================

import { z } from 'zod';
import type { WidgetSchema } from '@/types/solar';

// Zod validation schema for widget data
export const SolarKpiHeroDataSchema = z.object({
  total_recoverable: z.number(),
  total_projects: z.number(),
  active_projects: z.number(),
  change_7d: z.number().optional(),
  change_30d: z.number().optional(),
});

export type SolarKpiHeroData = z.infer<typeof SolarKpiHeroDataSchema>;

// Widget definition
export const SOLAR_KPI_HERO_SCHEMA: WidgetSchema = {
  id: 'solar_kpi_hero',
  name: 'Total Recoverable Pipeline',
  description: 'Hero metric showing total RM value in recovery pipeline',
  category: 'metrics',
  vertical: 'solar',
  
  data_source: {
    type: 'mcp',
    mcp_tool: 'getPipelineSummary',
    params: {},
    fallback_file: '/data/g2_dashboard_v19.1.json',
  },
  
  ui_hints: {
    size: 'lg',
    color: 'amber',
    icon: 'solar-panel',
    show_trend: true,
    animate: true,
    priority: 1,
  },
  
  refresh_interval_ms: 30000, // 30 seconds
};

// Data transformer - extracts hero data from MCP response
export function transformToKpiHeroData(mcpResponse: {
  summary: {
    total_recoverable: number;
    total_projects: number;
    active_projects: number;
  };
}): SolarKpiHeroData {
  return {
    total_recoverable: mcpResponse.summary.total_recoverable,
    total_projects: mcpResponse.summary.total_projects,
    active_projects: mcpResponse.summary.active_projects,
  };
}

export default SOLAR_KPI_HERO_SCHEMA;
