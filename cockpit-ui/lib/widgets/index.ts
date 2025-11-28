/**
 * Widget OS Layer
 *
 * Central exports for the Qontrek JSON-schema-driven widget system.
 * Provides widget registration, data binding, and rendering utilities.
 *
 * @module lib/widgets
 */

// Core types
export {
  // Zod schemas
  WidgetSchemaBase,
  WidgetCategory,
  FieldType,
  WidgetActionSchema,
  WidgetFieldSchema,
  DataSourceSchema,
  WidgetLayoutSchema,
  WidgetGovernanceSchema,
  WidgetState,

  // Type inferences
  type WidgetSchema,
  type WidgetAction,
  type WidgetField,
  type DataSource,
  type WidgetLayout,
  type WidgetGovernance,

  // Interfaces
  type WidgetInstance,
  type WidgetComponentProps,
  type WidgetRegistryEntry,
  type WidgetListResponse,
  type WidgetDataEnvelope,

  // Utilities
  validateWidgetSchema,
  isWidgetSchema,
} from './types';

// Registry
export { widgetRegistry, WidgetRegistry } from './registry';

// Renderer utilities
export {
  resolveBinding,
  resolveAllBindings,
  formatRelativeTime,
  formatValue,
  evaluateCondition,
  shouldShowWidget,
  shouldEnableWidget,
  resolveFieldValues,
  getBadgeStyle,
  parseCountdown,
  formatCountdown,
} from './renderer';

// Core widget schemas
export {
  trustMeterSchema,
  pipelineFunnelSchema,
  recoveryChartSchema,
  leadHeatmapSchema,
  kpiCardSchema,
  leadTableSchema,
  reminderListSchema,
  successFeedSchema,
  governanceStripSchema,
  coreWidgetSchemas,
  coreSchemaMap,
  CORE_WIDGET_COUNT,
} from './schemas';

// WhatsApp widgets (re-export namespace)
export * as whatsapp from './whatsapp';

// Re-export specific WhatsApp items for convenience
export {
  whatsappWidgetSchemas,
  whatsappSchemaMap,
  WHATSAPP_WIDGET_COUNT,
  whatsappMockData,
  getMockDataForWidget,
} from './whatsapp';

// Initialize registry with all widgets
import { widgetRegistry } from './registry';
import { coreWidgetSchemas } from './schemas';
import { whatsappWidgetSchemas } from './whatsapp';

/**
 * Register all built-in widget schemas
 * Call this function to populate the registry with all default widgets
 */
export function initializeWidgetRegistry(): void {
  // Register core widgets
  for (const schema of coreWidgetSchemas) {
    widgetRegistry.register(schema);
  }

  // Register WhatsApp widgets
  for (const schema of whatsappWidgetSchemas) {
    widgetRegistry.register(schema);
  }
}

/**
 * Total count of built-in widgets
 */
export const TOTAL_WIDGET_COUNT = 16; // 9 core + 7 WhatsApp
