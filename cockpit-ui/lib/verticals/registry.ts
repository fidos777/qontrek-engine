// lib/verticals/registry.ts
import type { VerticalId, VerticalTemplate } from './types';

// Solar vertical template
const solarTemplate: VerticalTemplate = {
  id: 'solar',
  name: 'Solar Energy',
  name_ms: 'Tenaga Solar',
  description: 'Solar panel sales and installation tracking',
  icon: 'sun',
  color: '#f59e0b',
  tenant_defaults: {
    currency: 'MYR',
    timezone: 'Asia/Kuala_Lumpur',
    locale: 'ms-MY',
    date_format: 'DD/MM/YYYY',
  },
  field_mappings: [
    { source_field: 'customer_name', target_field: 'lead_name' },
    { source_field: 'panel_size_kw', target_field: 'product_size' },
    { source_field: 'installation_date', target_field: 'delivery_date' },
  ],
  stages: [
    { id: 'new', name: 'New Lead', name_ms: 'Lead Baru', order: 1, color: '#3b82f6' },
    { id: 'qualified', name: 'Qualified', name_ms: 'Layak', order: 2, color: '#8b5cf6' },
    { id: 'proposal', name: 'Proposal Sent', name_ms: 'Sebut Harga Dihantar', order: 3, color: '#f59e0b' },
    { id: 'negotiation', name: 'Negotiation', name_ms: 'Rundingan', order: 4, color: '#ef4444' },
    { id: 'won', name: 'Won', name_ms: 'Berjaya', order: 5, color: '#22c55e' },
    { id: 'lost', name: 'Lost', name_ms: 'Gagal', order: 6, color: '#6b7280' },
  ],
  kpis: [
    {
      id: 'total_pipeline',
      name: 'Total Pipeline',
      name_ms: 'Jumlah Saluran',
      formula: 'SUM(deal_value)',
      format: 'currency',
    },
    {
      id: 'conversion_rate',
      name: 'Conversion Rate',
      name_ms: 'Kadar Penukaran',
      formula: 'won_deals / total_deals * 100',
      format: 'percentage',
      threshold_warning: 20,
      threshold_critical: 10,
    },
    {
      id: 'avg_deal_size',
      name: 'Avg Deal Size',
      name_ms: 'Purata Saiz Urus Niaga',
      formula: 'SUM(deal_value) / COUNT(deals)',
      format: 'currency',
    },
  ],
  dashboards: [
    {
      id: 'main',
      name: 'Main Dashboard',
      description: 'Overview of solar sales pipeline',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 3, height: 1 }, config: { kpi_id: 'total_pipeline' } },
        { widget_type: 'kpi_card', position: { col: 3, row: 0, width: 3, height: 1 }, config: { kpi_id: 'conversion_rate' } },
        { widget_type: 'kpi_card', position: { col: 6, row: 0, width: 3, height: 1 }, config: { kpi_id: 'avg_deal_size' } },
        { widget_type: 'trust_meter', position: { col: 9, row: 0, width: 3, height: 1 } },
        { widget_type: 'pipeline_funnel', position: { col: 0, row: 1, width: 6, height: 2 } },
        { widget_type: 'lead_table', position: { col: 6, row: 1, width: 6, height: 2 } },
        { widget_type: 'reminder_list', position: { col: 0, row: 3, width: 4, height: 2 } },
        { widget_type: 'success_feed', position: { col: 4, row: 3, width: 4, height: 2 } },
        { widget_type: 'governance_strip', position: { col: 8, row: 3, width: 4, height: 1 } },
      ],
    },
  ],
  whatsapp_templates: [
    { id: 'quote_follow_up', name: 'Quote Follow-up', template_id: 'solar_quote_1', variables: ['customer_name', 'quote_amount'] },
    { id: 'installation_reminder', name: 'Installation Reminder', template_id: 'solar_install_1', variables: ['customer_name', 'install_date'] },
  ],
  governance: {
    audit_trail: true,
    require_proof: true,
    merkle_enabled: true,
  },
  features: {
    whatsapp_enabled: true,
    ai_recommendations: true,
    auto_reminders: true,
  },
};

// Registry of all vertical templates
export const verticalRegistry: Record<VerticalId, VerticalTemplate> = {
  solar: solarTemplate,
  takaful: {
    ...solarTemplate,
    id: 'takaful',
    name: 'Takaful Insurance',
    name_ms: 'Insurans Takaful',
    description: 'Islamic insurance policy management',
    icon: 'shield',
    color: '#059669',
  },
  ecommerce: {
    ...solarTemplate,
    id: 'ecommerce',
    name: 'E-Commerce',
    name_ms: 'E-Dagang',
    description: 'Online store and order management',
    icon: 'shopping-cart',
    color: '#8b5cf6',
  },
  training: {
    ...solarTemplate,
    id: 'training',
    name: 'Training Academy',
    name_ms: 'Akademi Latihan',
    description: 'Course enrollment and certification',
    icon: 'graduation-cap',
    color: '#0ea5e9',
  },
  construction: {
    ...solarTemplate,
    id: 'construction',
    name: 'Construction',
    name_ms: 'Pembinaan',
    description: 'Project and contractor management',
    icon: 'building',
    color: '#f97316',
  },
  automotive: {
    ...solarTemplate,
    id: 'automotive',
    name: 'Automotive',
    name_ms: 'Automotif',
    description: 'Vehicle sales and service',
    icon: 'car',
    color: '#dc2626',
  },
};

// Get template by vertical ID
export function getVerticalTemplate(verticalId: string): VerticalTemplate | undefined {
  return verticalRegistry[verticalId as VerticalId];
}
