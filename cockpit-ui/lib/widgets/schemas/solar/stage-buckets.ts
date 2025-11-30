// ============================================
// SOLAR STAGE BUCKETS WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Display payment stage buckets (80%, 20%, Handover)
// ============================================

import { z } from 'zod';
import type { WidgetSchema } from '@/types/solar';

// Zod validation schema for widget data
export const StageBucketSchema = z.object({
  label: z.string(),
  count: z.number(),
  value: z.number(),
  percentage: z.number(),
  color: z.string(),
});

export const SolarStageBucketsDataSchema = z.object({
  buckets: z.array(StageBucketSchema),
  total_value: z.number(),
});

export type StageBucket = z.infer<typeof StageBucketSchema>;
export type SolarStageBucketsData = z.infer<typeof SolarStageBucketsDataSchema>;

// Widget definition
export const SOLAR_STAGE_BUCKETS_SCHEMA: WidgetSchema = {
  id: 'solar_stage_buckets',
  name: 'Payment Stage Buckets',
  description: 'Shows count and value for each payment stage',
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
    color: 'multi',
    animate: true,
    priority: 2,
  },
  
  refresh_interval_ms: 30000,
};

// Data transformer
export function transformToStageBucketsData(mcpResponse: {
  summary: {
    pending_80_count: number;
    pending_80_value: number;
    pending_20_count: number;
    pending_20_value: number;
    handover_count: number;
    handover_value: number;
    total_recoverable: number;
  };
}): SolarStageBucketsData {
  const { summary } = mcpResponse;
  const total = summary.total_recoverable;
  
  return {
    buckets: [
      {
        label: 'Pending 80%',
        count: summary.pending_80_count,
        value: summary.pending_80_value,
        percentage: total > 0 ? (summary.pending_80_value / total) * 100 : 0,
        color: 'orange',
      },
      {
        label: 'Pending 20%',
        count: summary.pending_20_count,
        value: summary.pending_20_value,
        percentage: total > 0 ? (summary.pending_20_value / total) * 100 : 0,
        color: 'yellow',
      },
      {
        label: 'Pending Handover',
        count: summary.handover_count,
        value: summary.handover_value,
        percentage: total > 0 ? (summary.handover_value / total) * 100 : 0,
        color: 'sky',
      },
    ],
    total_value: total,
  };
}

export default SOLAR_STAGE_BUCKETS_SCHEMA;
