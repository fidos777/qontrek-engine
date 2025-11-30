// ============================================
// SOLAR STATE DISTRIBUTION WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Show project distribution by state
// ============================================

import { z } from 'zod';
import type { WidgetSchema, StateDistribution } from '@/types/solar';

// Zod validation schema
export const StateDistributionSchema = z.object({
  state: z.string(),
  count: z.number(),
  value: z.number(),
  percentage: z.number().optional(),
});

export const SolarStateDistributionDataSchema = z.object({
  states: z.array(StateDistributionSchema),
  total_value: z.number(),
  total_count: z.number(),
});

export type SolarStateDistributionData = z.infer<typeof SolarStateDistributionDataSchema>;

// Color palette for states
export const STATE_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

// Widget definition
export const SOLAR_STATE_DISTRIBUTION_SCHEMA: WidgetSchema = {
  id: 'solar_state_distribution',
  name: 'Distribution by State',
  description: 'Donut chart showing project distribution by state',
  category: 'charts',
  vertical: 'solar',
  
  data_source: {
    type: 'mcp',
    mcp_tool: 'getPipelineSummary',
    params: {},
    fallback_file: '/data/g2_dashboard_v19.1.json',
  },
  
  ui_hints: {
    size: 'md',
    color: 'multi',
    animate: true,
    priority: 6,
  },
  
  refresh_interval_ms: 120000, // 2 minutes
};

// Data transformer
export function transformToStateDistributionData(mcpResponse: {
  state_distribution: StateDistribution[];
}): SolarStateDistributionData {
  const states = mcpResponse.state_distribution
    .filter(s => s.state !== 'Unknown' && s.state !== '')
    .slice(0, 10); // Top 10 states
  
  const totalValue = states.reduce((sum, s) => sum + s.value, 0);
  const totalCount = states.reduce((sum, s) => sum + s.count, 0);
  
  return {
    states: states.map((s, i) => ({
      ...s,
      percentage: totalValue > 0 ? (s.value / totalValue) * 100 : 0,
    })),
    total_value: totalValue,
    total_count: totalCount,
  };
}

// Chart config for recharts
export const STATE_CHART_CONFIG = {
  type: 'pie',
  innerRadius: '50%',
  outerRadius: '80%',
  dataKey: 'value',
  nameKey: 'state',
  valueFormatter: (value: number) => `RM ${value.toLocaleString()}`,
  colors: STATE_COLORS,
};

export default SOLAR_STATE_DISTRIBUTION_SCHEMA;
