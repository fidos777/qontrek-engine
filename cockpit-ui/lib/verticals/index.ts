// lib/verticals/index.ts
// Vertical registry containing all vertical templates

import type { VerticalId, VerticalTemplate } from './types';

interface VerticalRegistryEntry {
  template: VerticalTemplate;
}

const solarTemplate: VerticalTemplate = {
  id: 'solar',
  name: 'Solar Energy',
  description: 'Solar panel installation and energy management',
  icon: 'sun',
  defaultDashboardId: 'overview',
  dashboards: [
    {
      id: 'overview',
      name: 'Overview',
      description: 'Solar operations overview',
      columns: 4,
      widgets: [
        { widget_type: 'revenue_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'installations_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'energy_generated_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'trust_meter', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'revenue_chart', position: { col: 1, row: 2, width: 2, height: 2 } },
        { widget_type: 'pipeline_table', position: { col: 3, row: 2, width: 2, height: 2 } },
      ],
    },
    {
      id: 'sales',
      name: 'Sales Pipeline',
      description: 'Sales and lead management',
      columns: 4,
      widgets: [
        { widget_type: 'leads_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'conversion_rate_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'avg_deal_value_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'sales_target_kpi', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'pipeline_kanban', position: { col: 1, row: 2, width: 4, height: 3 } },
      ],
    },
  ],
  kpis: [
    { id: 'revenue', label: 'Total Revenue', binding: 'metrics.revenue', format: 'currency' },
    { id: 'installations', label: 'Installations', binding: 'metrics.installations', format: 'number' },
    { id: 'energy', label: 'Energy Generated', binding: 'metrics.energy_kwh', format: 'number' },
  ],
  stages: [
    { id: 'lead', name: 'Lead', order: 1, color: '#94a3b8' },
    { id: 'qualified', name: 'Qualified', order: 2, color: '#3b82f6' },
    { id: 'proposal', name: 'Proposal', order: 3, color: '#f59e0b' },
    { id: 'negotiation', name: 'Negotiation', order: 4, color: '#8b5cf6' },
    { id: 'closed', name: 'Closed Won', order: 5, color: '#22c55e' },
  ],
};

const takafulTemplate: VerticalTemplate = {
  id: 'takaful',
  name: 'Takaful Insurance',
  description: 'Islamic insurance products and claims management',
  icon: 'shield',
  defaultDashboardId: 'overview',
  dashboards: [
    {
      id: 'overview',
      name: 'Overview',
      description: 'Takaful operations overview',
      columns: 4,
      widgets: [
        { widget_type: 'contributions_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'policies_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'claims_ratio_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'trust_meter', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'contributions_chart', position: { col: 1, row: 2, width: 2, height: 2 } },
        { widget_type: 'claims_table', position: { col: 3, row: 2, width: 2, height: 2 } },
      ],
    },
  ],
  kpis: [
    { id: 'contributions', label: 'Total Contributions', binding: 'metrics.contributions', format: 'currency' },
    { id: 'policies', label: 'Active Policies', binding: 'metrics.policies', format: 'number' },
    { id: 'claims_ratio', label: 'Claims Ratio', binding: 'metrics.claims_ratio', format: 'percentage' },
  ],
};

const ecommerceTemplate: VerticalTemplate = {
  id: 'ecommerce',
  name: 'E-Commerce',
  description: 'Online retail and order management',
  icon: 'shopping-cart',
  defaultDashboardId: 'overview',
  dashboards: [
    {
      id: 'overview',
      name: 'Overview',
      columns: 4,
      widgets: [
        { widget_type: 'gmv_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'orders_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'aov_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'conversion_kpi', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'sales_chart', position: { col: 1, row: 2, width: 2, height: 2 } },
        { widget_type: 'orders_table', position: { col: 3, row: 2, width: 2, height: 2 } },
      ],
    },
  ],
  kpis: [
    { id: 'gmv', label: 'GMV', binding: 'metrics.gmv', format: 'currency' },
    { id: 'orders', label: 'Orders', binding: 'metrics.orders', format: 'number' },
    { id: 'aov', label: 'Avg Order Value', binding: 'metrics.aov', format: 'currency' },
  ],
};

const trainingTemplate: VerticalTemplate = {
  id: 'training',
  name: 'Training & Education',
  description: 'Course delivery and student management',
  icon: 'book',
  defaultDashboardId: 'overview',
  dashboards: [
    {
      id: 'overview',
      name: 'Overview',
      columns: 4,
      widgets: [
        { widget_type: 'enrollments_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'revenue_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'completion_rate_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'nps_kpi', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'enrollments_chart', position: { col: 1, row: 2, width: 2, height: 2 } },
        { widget_type: 'courses_table', position: { col: 3, row: 2, width: 2, height: 2 } },
      ],
    },
  ],
  kpis: [
    { id: 'enrollments', label: 'Enrollments', binding: 'metrics.enrollments', format: 'number' },
    { id: 'revenue', label: 'Revenue', binding: 'metrics.revenue', format: 'currency' },
    { id: 'completion', label: 'Completion Rate', binding: 'metrics.completion_rate', format: 'percentage' },
  ],
};

const constructionTemplate: VerticalTemplate = {
  id: 'construction',
  name: 'Construction',
  description: 'Project management and contractor oversight',
  icon: 'building',
  defaultDashboardId: 'overview',
  dashboards: [
    {
      id: 'overview',
      name: 'Overview',
      columns: 4,
      widgets: [
        { widget_type: 'project_value_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'active_projects_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'on_time_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'safety_score_kpi', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'progress_chart', position: { col: 1, row: 2, width: 2, height: 2 } },
        { widget_type: 'projects_table', position: { col: 3, row: 2, width: 2, height: 2 } },
      ],
    },
  ],
  kpis: [
    { id: 'project_value', label: 'Project Value', binding: 'metrics.project_value', format: 'currency' },
    { id: 'active_projects', label: 'Active Projects', binding: 'metrics.active_projects', format: 'number' },
    { id: 'on_time', label: 'On-Time Delivery', binding: 'metrics.on_time_rate', format: 'percentage' },
  ],
};

const automotiveTemplate: VerticalTemplate = {
  id: 'automotive',
  name: 'Automotive',
  description: 'Vehicle sales and service management',
  icon: 'car',
  defaultDashboardId: 'overview',
  dashboards: [
    {
      id: 'overview',
      name: 'Overview',
      columns: 4,
      widgets: [
        { widget_type: 'sales_kpi', position: { col: 1, row: 1, width: 1, height: 1 } },
        { widget_type: 'units_sold_kpi', position: { col: 2, row: 1, width: 1, height: 1 } },
        { widget_type: 'service_revenue_kpi', position: { col: 3, row: 1, width: 1, height: 1 } },
        { widget_type: 'customer_satisfaction_kpi', position: { col: 4, row: 1, width: 1, height: 1 } },
        { widget_type: 'sales_chart', position: { col: 1, row: 2, width: 2, height: 2 } },
        { widget_type: 'inventory_table', position: { col: 3, row: 2, width: 2, height: 2 } },
      ],
    },
  ],
  kpis: [
    { id: 'sales', label: 'Total Sales', binding: 'metrics.sales', format: 'currency' },
    { id: 'units', label: 'Units Sold', binding: 'metrics.units_sold', format: 'number' },
    { id: 'service', label: 'Service Revenue', binding: 'metrics.service_revenue', format: 'currency' },
  ],
};

const registry = new Map<VerticalId, VerticalRegistryEntry>([
  ['solar', { template: solarTemplate }],
  ['takaful', { template: takafulTemplate }],
  ['ecommerce', { template: ecommerceTemplate }],
  ['training', { template: trainingTemplate }],
  ['construction', { template: constructionTemplate }],
  ['automotive', { template: automotiveTemplate }],
]);

export const verticalRegistry = {
  get(id: VerticalId): VerticalRegistryEntry | undefined {
    return registry.get(id);
  },

  getAll(): VerticalRegistryEntry[] {
    return Array.from(registry.values());
  },

  has(id: VerticalId): boolean {
    return registry.has(id);
  },

  getIds(): VerticalId[] {
    return Array.from(registry.keys());
  },
};
