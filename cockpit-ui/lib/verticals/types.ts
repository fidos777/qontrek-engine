// lib/verticals/types.ts
// Vertical template types with Zod schemas for Malaysian SME verticals

import { z } from 'zod';

// Supported verticals
export const VerticalId = z.enum([
  'solar',
  'takaful',
  'ecommerce',
  'training',
  'construction',
  'automotive'
]);
export type VerticalId = z.infer<typeof VerticalId>;

// Field mapping - maps generic fields to vertical-specific labels
export const FieldMappingSchema = z.object({
  generic_field: z.string(),        // e.g., "lead.amount"
  vertical_label: z.string(),       // e.g., "Installation Cost"
  vertical_field: z.string(),       // e.g., "project.system_cost"
  format: z.string().optional(),    // e.g., "RM {{value}}"
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    required: z.boolean().optional(),
    pattern: z.string().optional(),
  }).optional(),
});
export type FieldMapping = z.infer<typeof FieldMappingSchema>;

// Auto action configuration for stages
export const AutoActionSchema = z.object({
  trigger: z.string(),            // e.g., "days_in_stage > 3"
  action: z.string(),             // e.g., "send_reminder"
  template_id: z.string().optional(),
});
export type AutoAction = z.infer<typeof AutoActionSchema>;

// Stage configuration for pipelines
export const StageConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_ms: z.string(),              // Malay translation
  color: z.string(),
  order: z.number(),
  sla_days: z.number().optional(),  // SLA for this stage
  auto_actions: z.array(AutoActionSchema).optional(),
});
export type StageConfig = z.infer<typeof StageConfigSchema>;

// KPI definition
export const KPIDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_ms: z.string(),
  description: z.string(),
  formula: z.string(),              // e.g., "recovered / total * 100"
  unit: z.enum(['percentage', 'currency', 'count', 'days', 'ratio']),
  target: z.number(),
  warning_threshold: z.number(),
  critical_threshold: z.number(),
  higher_is_better: z.boolean().default(true),
});
export type KPIDefinition = z.infer<typeof KPIDefinitionSchema>;

// Widget position in dashboard
export const WidgetPositionSchema = z.object({
  col: z.number(),
  row: z.number(),
  width: z.number(),
  height: z.number(),
});
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;

// Widget configuration in dashboard
export const DashboardWidgetSchema = z.object({
  widget_type: z.string(),
  position: WidgetPositionSchema,
  config: z.record(z.string(), z.any()).optional(),
});
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;

// Dashboard layout
export const DashboardLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  widgets: z.array(DashboardWidgetSchema),
});
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;

// WhatsApp template configuration
export const WhatsAppTemplateConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),              // e.g., "payment_reminder", "appointment_confirm"
  language: z.enum(['en', 'ms', 'zh']),
  category: z.enum(['marketing', 'utility', 'service']),
  body_template: z.string(),
  variables: z.array(z.string()),
  use_cases: z.array(z.string()),   // When to use this template
});
export type WhatsAppTemplateConfig = z.infer<typeof WhatsAppTemplateConfigSchema>;

// Tenant defaults configuration
export const TenantDefaultsSchema = z.object({
  currency: z.string().default('MYR'),
  locale: z.string().default('ms-MY'),
  timezone: z.string().default('Asia/Kuala_Lumpur'),
  date_format: z.string().default('DD/MM/YYYY'),
});
export type TenantDefaults = z.infer<typeof TenantDefaultsSchema>;

// Governance configuration
export const GovernanceConfigSchema = z.object({
  required_gates: z.array(z.string()),    // e.g., ["G13", "G14", "G15"]
  audit_retention_days: z.number().default(2555), // 7 years
  pii_fields: z.array(z.string()),        // Fields requiring PII protection
});
export type GovernanceConfig = z.infer<typeof GovernanceConfigSchema>;

// Feature flags
export const FeatureFlagsSchema = z.object({
  whatsapp_enabled: z.boolean().default(true),
  ai_suggestions_enabled: z.boolean().default(true),
  auto_reminders_enabled: z.boolean().default(true),
  multi_currency: z.boolean().default(false),
});
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

// Complete vertical template
export const VerticalTemplateSchema = z.object({
  id: VerticalId,
  name: z.string(),
  name_ms: z.string(),
  description: z.string(),
  icon: z.string(),                 // Lucide icon name
  color: z.string(),                // Brand color

  // Tenant configuration
  tenant_defaults: TenantDefaultsSchema,

  // Data mappings
  field_mappings: z.array(FieldMappingSchema),

  // Pipeline stages
  stages: z.array(StageConfigSchema),

  // KPI definitions
  kpis: z.array(KPIDefinitionSchema),

  // Dashboard layouts
  dashboards: z.array(DashboardLayoutSchema),

  // WhatsApp templates
  whatsapp_templates: z.array(WhatsAppTemplateConfigSchema),

  // Governance overrides
  governance: GovernanceConfigSchema,

  // Feature flags
  features: FeatureFlagsSchema,
});
export type VerticalTemplate = z.infer<typeof VerticalTemplateSchema>;

// Registry entry
export interface VerticalRegistryEntry {
  template: VerticalTemplate;
  mockData: Record<string, unknown>;
}

// MCP response type for available verticals
export interface MCPVerticalsResponse {
  verticals: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

// API response type for vertical config
export interface VerticalConfigResponse {
  ok: boolean;
  data: VerticalTemplate | null;
  error?: string;
}
