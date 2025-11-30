// ============================================
// SOLAR WIDGET COMPONENTS - INDEX
// Layer: L5 (Widget UI)
// Exports all Solar widget components
// ============================================

export { SolarKpiHero, default as SolarKpiHeroComponent } from './SolarKpiHero';
export { SolarStageBuckets, default as SolarStageBucketsComponent } from './SolarStageBuckets';
export { SolarKpiGrid, default as SolarKpiGridComponent } from './SolarKpiGrid';
export { SolarCriticalTable, default as SolarCriticalTableComponent } from './SolarCriticalTable';
export { SolarPipelineChart, default as SolarPipelineChartComponent } from './SolarPipelineChart';
export { SolarRecentWins, default as SolarRecentWinsComponent } from './SolarRecentWins';
export { SolarReminders, default as SolarRemindersComponent } from './SolarReminders';

// Widget component registry for dynamic rendering
import { SolarKpiHero } from './SolarKpiHero';
import { SolarStageBuckets } from './SolarStageBuckets';
import { SolarKpiGrid } from './SolarKpiGrid';
import { SolarCriticalTable } from './SolarCriticalTable';
import { SolarPipelineChart } from './SolarPipelineChart';
import { SolarRecentWins } from './SolarRecentWins';
import { SolarReminders } from './SolarReminders';

import type { ComponentType } from 'react';

export const SOLAR_WIDGET_COMPONENTS: Record<string, ComponentType<any>> = {
  solar_kpi_hero: SolarKpiHero,
  solar_stage_buckets: SolarStageBuckets,
  solar_kpi_grid: SolarKpiGrid,
  solar_critical_table: SolarCriticalTable,
  solar_pipeline_chart: SolarPipelineChart,
  solar_recent_wins: SolarRecentWins,
  solar_reminders: SolarReminders,
};

// Get component by widget ID
export function getSolarWidgetComponent(widgetId: string): ComponentType<any> | undefined {
  return SOLAR_WIDGET_COMPONENTS[widgetId];
}
