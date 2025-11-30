// ============================================
// SOLAR WIDGET SCHEMAS - INDEX
// Layer: L3 (Widget OS)
// Exports all Solar vertical widget schemas
// ============================================

// Widget Schemas
export { default as SOLAR_KPI_HERO_SCHEMA, transformToKpiHeroData } from './kpi-hero';
export { default as SOLAR_STAGE_BUCKETS_SCHEMA, transformToStageBucketsData } from './stage-buckets';
export { default as SOLAR_KPI_GRID_SCHEMA, transformToKpiGridData } from './kpi-grid';
export { default as SOLAR_CRITICAL_TABLE_SCHEMA, transformToCriticalTableData, getUrgencyLevel, getUrgencyColor, CRITICAL_TABLE_COLUMNS } from './critical-table';
export { default as SOLAR_PIPELINE_CHART_SCHEMA, transformToPipelineChartData, STAGE_COLORS, PIPELINE_CHART_CONFIG } from './pipeline-chart';
export { default as SOLAR_STATE_DISTRIBUTION_SCHEMA, transformToStateDistributionData, STATE_COLORS, STATE_CHART_CONFIG } from './state-distribution';
export { default as SOLAR_RECENT_WINS_SCHEMA, transformToRecentWinsData, formatRelativeTime } from './recent-wins';
export { default as SOLAR_REMINDERS_SCHEMA, transformToRemindersData, isOverdue, isDueToday, PRIORITY_COLORS } from './reminders';

// Re-export types
export type { SolarKpiHeroData } from './kpi-hero';
export type { SolarStageBucketsData, StageBucket } from './stage-buckets';
export type { SolarKpiGridData, KpiMetric } from './kpi-grid';
export type { SolarCriticalTableData } from './critical-table';
export type { SolarPipelineChartData } from './pipeline-chart';
export type { SolarStateDistributionData } from './state-distribution';
export type { SolarRecentWinsData } from './recent-wins';
export type { SolarRemindersData } from './reminders';

// Widget Registry - All Solar widgets
import SOLAR_KPI_HERO_SCHEMA from './kpi-hero';
import SOLAR_STAGE_BUCKETS_SCHEMA from './stage-buckets';
import SOLAR_KPI_GRID_SCHEMA from './kpi-grid';
import SOLAR_CRITICAL_TABLE_SCHEMA from './critical-table';
import SOLAR_PIPELINE_CHART_SCHEMA from './pipeline-chart';
import SOLAR_STATE_DISTRIBUTION_SCHEMA from './state-distribution';
import SOLAR_RECENT_WINS_SCHEMA from './recent-wins';
import SOLAR_REMINDERS_SCHEMA from './reminders';

import type { WidgetSchema } from '@/types/solar';

export const SOLAR_WIDGET_REGISTRY: Record<string, WidgetSchema> = {
  solar_kpi_hero: SOLAR_KPI_HERO_SCHEMA,
  solar_stage_buckets: SOLAR_STAGE_BUCKETS_SCHEMA,
  solar_kpi_grid: SOLAR_KPI_GRID_SCHEMA,
  solar_critical_table: SOLAR_CRITICAL_TABLE_SCHEMA,
  solar_pipeline_chart: SOLAR_PIPELINE_CHART_SCHEMA,
  solar_state_distribution: SOLAR_STATE_DISTRIBUTION_SCHEMA,
  solar_recent_wins: SOLAR_RECENT_WINS_SCHEMA,
  solar_reminders: SOLAR_REMINDERS_SCHEMA,
};

// Get all widget IDs
export const SOLAR_WIDGET_IDS = Object.keys(SOLAR_WIDGET_REGISTRY);

// Get widget by ID
export function getSolarWidget(id: string): WidgetSchema | undefined {
  return SOLAR_WIDGET_REGISTRY[id];
}

// Get widgets by category
export function getSolarWidgetsByCategory(category: string): WidgetSchema[] {
  return Object.values(SOLAR_WIDGET_REGISTRY).filter(w => w.category === category);
}

// Get widgets sorted by priority
export function getSolarWidgetsSortedByPriority(): WidgetSchema[] {
  return Object.values(SOLAR_WIDGET_REGISTRY).sort(
    (a, b) => (a.ui_hints.priority ?? 99) - (b.ui_hints.priority ?? 99)
  );
}
