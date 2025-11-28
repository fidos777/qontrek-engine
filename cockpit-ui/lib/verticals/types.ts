// lib/verticals/types.ts
// L4 Vertical Types

export type VerticalId = 'solar' | 'takaful' | 'ecommerce' | 'training' | 'construction' | 'automotive';

export type WidgetPosition = {
  col: number;
  row: number;
  width: number;
  height: number;
};

export type DashboardWidget = {
  widget_type: string;
  position: WidgetPosition;
  config?: Record<string, unknown>;
};

export type DashboardLayout = {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
};

export type TenantDefaults = {
  currency: string;
  timezone: string;
  locale: string;
  date_format: string;
};

export type FieldMapping = {
  source_field: string;
  target_field: string;
  transform?: string;
};

export type StageConfig = {
  id: string;
  name: string;
  name_ms: string;
  order: number;
  color: string;
};

export type KPIDefinition = {
  id: string;
  name: string;
  name_ms: string;
  formula: string;
  format: string;
  threshold_warning?: number;
  threshold_critical?: number;
};

export type WhatsAppTemplateConfig = {
  id: string;
  name: string;
  template_id: string;
  variables: string[];
};

export type GovernanceConfig = {
  audit_trail: boolean;
  require_proof: boolean;
  merkle_enabled: boolean;
};

export type FeatureFlags = {
  whatsapp_enabled: boolean;
  ai_recommendations: boolean;
  auto_reminders: boolean;
};

export type VerticalTemplate = {
  id: VerticalId;
  name: string;
  name_ms: string;
  description: string;
  icon: string;
  color: string;
  tenant_defaults: TenantDefaults;
  field_mappings: FieldMapping[];
  stages: StageConfig[];
  kpis: KPIDefinition[];
  dashboards: DashboardLayout[];
  whatsapp_templates: WhatsAppTemplateConfig[];
  governance: GovernanceConfig;
  features: FeatureFlags;
};
