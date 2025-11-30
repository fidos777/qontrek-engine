// ============================================
// SOLAR KPI GRID WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Display recovery performance metrics grid
// ============================================

import { z } from 'zod';
import type { WidgetSchema } from '@/types/solar';

// Zod validation schema
export const KpiMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  trend_value: z.number().optional(),
  color: z.string(),
  icon: z.string().optional(),
});

export const SolarKpiGridDataSchema = z.object({
  metrics: z.array(KpiMetricSchema),
});

export type KpiMetric = z.infer<typeof KpiMetricSchema>;
export type SolarKpiGridData = z.infer<typeof SolarKpiGridDataSchema>;

// Widget definition
export const SOLAR_KPI_GRID_SCHEMA: WidgetSchema = {
  id: 'solar_kpi_grid',
  name: 'Recovery Performance',
  description: 'Grid of key performance indicators',
  category: 'metrics',
  vertical: 'solar',
  
  data_source: {
    type: 'mcp',
    mcp_tool: 'getPipelineSummary',
    params: {},
    fallback_file: '/data/g2_dashboard_v19.1.json',
  },
  
  ui_hints: {
    size: 'md',
    animate: true,
    priority: 3,
  },
  
  refresh_interval_ms: 60000, // 1 minute
};

// Data transformer
export function transformToKpiGridData(mcpResponse: {
  kpi: {
    recovery_rate_7d: number;
    recovery_rate_30d: number;
    avg_days_to_payment: number;
    escalation_rate: number;
    contact_success_rate: number;
  };
}): SolarKpiGridData {
  const { kpi } = mcpResponse;
  
  return {
    metrics: [
      {
        id: 'recovery_7d',
        label: '7-Day Recovery',
        value: kpi.recovery_rate_7d,
        unit: '%',
        trend: kpi.recovery_rate_7d >= 50 ? 'up' : 'down',
        color: kpi.recovery_rate_7d >= 50 ? 'green' : 'orange',
        icon: 'trending-up',
      },
      {
        id: 'recovery_30d',
        label: '30-Day Recovery',
        value: kpi.recovery_rate_30d,
        unit: '%',
        trend: kpi.recovery_rate_30d >= 60 ? 'up' : 'down',
        color: kpi.recovery_rate_30d >= 60 ? 'green' : 'orange',
        icon: 'calendar',
      },
      {
        id: 'avg_days',
        label: 'Avg Days to Pay',
        value: kpi.avg_days_to_payment,
        unit: 'days',
        trend: kpi.avg_days_to_payment <= 7 ? 'up' : 'down',
        color: kpi.avg_days_to_payment <= 7 ? 'green' : 'yellow',
        icon: 'clock',
      },
      {
        id: 'escalation',
        label: 'Escalation Rate',
        value: kpi.escalation_rate,
        unit: '%',
        trend: kpi.escalation_rate <= 15 ? 'up' : 'down',
        color: kpi.escalation_rate <= 15 ? 'green' : 'red',
        icon: 'alert-triangle',
      },
      {
        id: 'contact_success',
        label: 'Contact Success',
        value: kpi.contact_success_rate,
        unit: '%',
        trend: kpi.contact_success_rate >= 70 ? 'up' : 'down',
        color: kpi.contact_success_rate >= 70 ? 'green' : 'orange',
        icon: 'phone',
      },
    ],
  };
}

export default SOLAR_KPI_GRID_SCHEMA;
