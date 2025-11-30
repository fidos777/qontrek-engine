// ============================================
// SOLAR PIPELINE CHART WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Visualize pipeline by payment stage
// ============================================

import { z } from 'zod';
import type { WidgetSchema, PipelineStage } from '@/types/solar';

// Zod validation schema
export const PipelineStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
  value: z.number(),
  percentage: z.number(),
});

export const SolarPipelineChartDataSchema = z.object({
  stages: z.array(PipelineStageSchema),
  total_value: z.number(),
  total_count: z.number(),
});

export type SolarPipelineChartData = z.infer<typeof SolarPipelineChartDataSchema>;

// Chart colors by stage
export const STAGE_COLORS: Record<string, string> = {
  'Pending 80%': '#f97316', // orange-500
  'Pending 20%': '#eab308', // yellow-500
  'Handover': '#0ea5e9',    // sky-500
};

// Widget definition
export const SOLAR_PIPELINE_CHART_SCHEMA: WidgetSchema = {
  id: 'solar_pipeline_chart',
  name: 'Pipeline by Stage',
  description: 'Bar chart showing pipeline distribution',
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
    priority: 5,
  },
  
  refresh_interval_ms: 60000,
};

// Data transformer
export function transformToPipelineChartData(mcpResponse: {
  pipeline_by_stage: PipelineStage[];
  summary: {
    total_recoverable: number;
  };
}): SolarPipelineChartData {
  const stages = mcpResponse.pipeline_by_stage;
  
  return {
    stages,
    total_value: mcpResponse.summary.total_recoverable,
    total_count: stages.reduce((sum, s) => sum + s.count, 0),
  };
}

// Chart config for recharts
export const PIPELINE_CHART_CONFIG = {
  type: 'bar',
  layout: 'horizontal',
  dataKey: 'value',
  labelKey: 'stage',
  valueFormatter: (value: number) => `RM ${value.toLocaleString()}`,
  colors: Object.values(STAGE_COLORS),
};

export default SOLAR_PIPELINE_CHART_SCHEMA;
