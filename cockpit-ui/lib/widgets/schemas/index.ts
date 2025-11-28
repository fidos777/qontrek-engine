/**
 * Core Widget Schemas
 *
 * JSON schema definitions for the 9 core dashboard widgets.
 * Import these to register widgets with the WidgetRegistry.
 */

import type { WidgetSchema } from '../types';
import { validateWidgetSchema } from '../types';

// Import raw JSON schemas
import trustMeterRaw from './trust-meter.json';
import pipelineFunnelRaw from './pipeline-funnel.json';
import recoveryChartRaw from './recovery-chart.json';
import leadHeatmapRaw from './lead-heatmap.json';
import kpiCardRaw from './kpi-card.json';
import leadTableRaw from './lead-table.json';
import reminderListRaw from './reminder-list.json';
import successFeedRaw from './success-feed.json';
import governanceStripRaw from './governance-strip.json';

// Validate and export typed schemas
export const trustMeterSchema: WidgetSchema = validateWidgetSchema(trustMeterRaw);
export const pipelineFunnelSchema: WidgetSchema = validateWidgetSchema(pipelineFunnelRaw);
export const recoveryChartSchema: WidgetSchema = validateWidgetSchema(recoveryChartRaw);
export const leadHeatmapSchema: WidgetSchema = validateWidgetSchema(leadHeatmapRaw);
export const kpiCardSchema: WidgetSchema = validateWidgetSchema(kpiCardRaw);
export const leadTableSchema: WidgetSchema = validateWidgetSchema(leadTableRaw);
export const reminderListSchema: WidgetSchema = validateWidgetSchema(reminderListRaw);
export const successFeedSchema: WidgetSchema = validateWidgetSchema(successFeedRaw);
export const governanceStripSchema: WidgetSchema = validateWidgetSchema(governanceStripRaw);

// All core schemas as array
export const coreWidgetSchemas: WidgetSchema[] = [
  trustMeterSchema,
  pipelineFunnelSchema,
  recoveryChartSchema,
  leadHeatmapSchema,
  kpiCardSchema,
  leadTableSchema,
  reminderListSchema,
  successFeedSchema,
  governanceStripSchema,
];

// Schema map by type
export const coreSchemaMap: Record<string, WidgetSchema> = {
  trust_meter: trustMeterSchema,
  pipeline_funnel: pipelineFunnelSchema,
  recovery_chart: recoveryChartSchema,
  lead_heatmap: leadHeatmapSchema,
  kpi_card: kpiCardSchema,
  lead_table: leadTableSchema,
  reminder_list: reminderListSchema,
  success_feed: successFeedSchema,
  governance_strip: governanceStripSchema,
};

// Export count for validation
export const CORE_WIDGET_COUNT = 9;
