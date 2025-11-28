/**
 * Widget OS Layer - Type Definitions
 *
 * JSON-schema-driven widget system for Qontrek dashboards.
 * Provides Zod schemas and TypeScript types for widget validation.
 */

import { z } from 'zod';
import type { ComponentType } from 'react';

// Widget categories
export const WidgetCategory = z.enum([
  'metrics',
  'data',
  'communication',
  'governance',
  'whatsapp'
]);
export type WidgetCategory = z.infer<typeof WidgetCategory>;

// Field types supported in widget schemas
export const FieldType = z.enum([
  'text',
  'number',
  'currency',
  'percentage',
  'date',
  'badge',
  'progress',
  'chart',
  'list',
  'action'
]);
export type FieldType = z.infer<typeof FieldType>;

// Widget action definition
export const WidgetActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  mcp_tool: z.string(),
  params: z.record(z.string(), z.any()),
  confirm: z.boolean().optional(),
});
export type WidgetAction = z.infer<typeof WidgetActionSchema>;

// Widget field definition
export const WidgetFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: FieldType,
  binding: z.string(),                    // e.g., "{{lead.amount}}"
  format: z.string().optional(),          // e.g., "RM {{value}}"
  style: z.record(z.string(), z.string()).optional(),
  actions: z.array(WidgetActionSchema).optional(),
});
export type WidgetField = z.infer<typeof WidgetFieldSchema>;

// Widget data source configuration
export const DataSourceSchema = z.object({
  mcp_tool: z.string(),
  params: z.record(z.string(), z.any()).optional(),
  refresh_interval_ms: z.number().optional(),
});
export type DataSource = z.infer<typeof DataSourceSchema>;

// Widget layout configuration
export const WidgetLayoutSchema = z.object({
  min_width: z.number().optional(),
  min_height: z.number().optional(),
  default_cols: z.number().default(1),
  default_rows: z.number().default(1),
});
export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;

// Widget governance configuration
export const WidgetGovernanceSchema = z.object({
  gate_id: z.string().optional(),         // e.g., "G13"
  proof_required: z.boolean().default(false),
  audit_actions: z.boolean().default(true),
});
export type WidgetGovernance = z.infer<typeof WidgetGovernanceSchema>;

// Base widget schema - the core definition for all widgets
export const WidgetSchemaBase = z.object({
  id: z.string(),
  type: z.string(),
  version: z.string().default('1.0.0'),
  title: z.string(),
  description: z.string().optional(),
  category: WidgetCategory,

  // Data binding
  data_source: DataSourceSchema,

  // Layout
  layout: WidgetLayoutSchema.optional(),

  // Conditional rendering
  show_if: z.string().optional(),         // e.g., "{{trust_index}} < 80"
  hide_if: z.string().optional(),
  enable_if: z.string().optional(),
  disable_if: z.string().optional(),

  // Fields/sections definition
  fields: z.array(WidgetFieldSchema),

  // Governance
  governance: WidgetGovernanceSchema.optional(),
});
export type WidgetSchema = z.infer<typeof WidgetSchemaBase>;

// Widget state - tracks loading/ready/error states
export const WidgetState = z.enum(['loading', 'ready', 'error', 'stale']);
export type WidgetState = z.infer<typeof WidgetState>;

// Widget instance with runtime data
export interface WidgetInstance {
  schema: WidgetSchema;
  data: Record<string, unknown>;
  state: WidgetState;
  last_updated: string;
  error?: string;
}

// Widget component props
export interface WidgetComponentProps {
  instance: WidgetInstance;
}

// Registry entry for widget registration
export interface WidgetRegistryEntry {
  schema: WidgetSchema;
  component?: ComponentType<WidgetComponentProps>;
  validator: z.ZodSchema;
}

// MCP response format for widget listing
export interface WidgetListResponse {
  widgets: Array<{
    type: string;
    title: string;
    category: WidgetCategory;
  }>;
}

// Widget data envelope - follows BaseEnvelope pattern from gates.ts
export interface WidgetDataEnvelope<T = Record<string, unknown>> {
  ok: boolean;
  rel: string;                           // e.g., "widget_trust_meter_v1.json"
  source: 'real' | 'fallback';
  widget_type: string;
  schema_version: string;
  data: T;
  last_updated: string;
}

// Validated widget schema helper
export function validateWidgetSchema(data: unknown): WidgetSchema {
  return WidgetSchemaBase.parse(data);
}

// Type guard for widget schema
export function isWidgetSchema(data: unknown): data is WidgetSchema {
  return WidgetSchemaBase.safeParse(data).success;
}
