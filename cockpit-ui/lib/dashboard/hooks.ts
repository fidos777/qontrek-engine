// lib/dashboard/hooks.ts
// React hooks for dashboard state management

import { useState, useEffect, useCallback } from 'react';
import type { VerticalTemplate, DashboardLayout } from '@/lib/verticals/types';
import type { WidgetInstance, WidgetState } from '@/lib/widgets/types';
import { verticalRegistry } from '@/lib/verticals';

interface UseDashboardReturn {
  template: VerticalTemplate | null;
  currentDashboard: DashboardLayout | null;
  widgetInstances: Record<string, WidgetInstance>;
  isLoading: boolean;
  error: string | null;
  setDashboard: (id: string) => void;
  refreshWidget: (widgetType: string) => void;
}

// Mock data for widget instances - in production this would come from API
function createMockWidgetInstance(widgetType: string): WidgetInstance {
  const mockData: Record<string, Record<string, unknown>> = {
    revenue_kpi: { value: 2500000, change: 12.5 },
    installations_kpi: { value: 156, change: 8.2 },
    energy_generated_kpi: { value: 45000, unit: 'kWh' },
    trust_meter: { value: 87, level: 'high' },
    contributions_kpi: { value: 8500000, change: 15.3 },
    policies_kpi: { value: 12450, change: 5.7 },
    claims_ratio_kpi: { value: 42.5 },
    gmv_kpi: { value: 15000000, change: 22.1 },
    orders_kpi: { value: 8520, change: 18.4 },
    aov_kpi: { value: 185, change: 3.2 },
    conversion_kpi: { value: 3.8 },
    enrollments_kpi: { value: 2340, change: 25.5 },
    completion_rate_kpi: { value: 78.5 },
    nps_kpi: { value: 72 },
    project_value_kpi: { value: 45000000, change: 8.9 },
    active_projects_kpi: { value: 23 },
    on_time_kpi: { value: 91.2 },
    safety_score_kpi: { value: 98.5 },
    sales_kpi: { value: 12500000, change: 14.2 },
    units_sold_kpi: { value: 145, change: 11.8 },
    service_revenue_kpi: { value: 2800000, change: 9.5 },
    customer_satisfaction_kpi: { value: 4.6, max: 5 },
    leads_kpi: { value: 342, change: 15.7 },
    conversion_rate_kpi: { value: 28.5 },
    avg_deal_value_kpi: { value: 85000 },
    sales_target_kpi: { value: 78, target: 100 },
  };

  const data = mockData[widgetType] || { value: 0 };

  return {
    id: `${widgetType}-${Date.now()}`,
    schema: {
      widget_type: widgetType,
      title: formatWidgetTitle(widgetType),
      fields: [{ name: 'value', type: 'number', binding: 'value' }],
    },
    data,
    state: 'success' as WidgetState,
    lastUpdated: new Date(),
  };
}

function formatWidgetTitle(widgetType: string): string {
  return widgetType
    .replace(/_kpi$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useDashboard(
  verticalId: string,
  initialDashboardId?: string
): UseDashboardReturn {
  const [template, setTemplate] = useState<VerticalTemplate | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardLayout | null>(null);
  const [widgetInstances, setWidgetInstances] = useState<Record<string, WidgetInstance>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vertical template
  useEffect(() => {
    const entry = verticalRegistry.get(verticalId as never);
    if (!entry) {
      setError(`Vertical not found: ${verticalId}`);
      setIsLoading(false);
      return;
    }

    setTemplate(entry.template);

    // Set initial dashboard
    const dashboardId = initialDashboardId || entry.template.defaultDashboardId;
    const dashboard = entry.template.dashboards.find((d) => d.id === dashboardId);

    if (dashboard) {
      setCurrentDashboard(dashboard);
      loadWidgetInstances(dashboard);
    } else if (entry.template.dashboards.length > 0) {
      setCurrentDashboard(entry.template.dashboards[0]);
      loadWidgetInstances(entry.template.dashboards[0]);
    }

    setIsLoading(false);
  }, [verticalId, initialDashboardId]);

  const loadWidgetInstances = useCallback((dashboard: DashboardLayout) => {
    const instances: Record<string, WidgetInstance> = {};

    for (const widget of dashboard.widgets) {
      instances[widget.widget_type] = createMockWidgetInstance(widget.widget_type);
    }

    setWidgetInstances(instances);
  }, []);

  const setDashboard = useCallback(
    (id: string) => {
      if (!template) return;

      const dashboard = template.dashboards.find((d) => d.id === id);
      if (dashboard) {
        setCurrentDashboard(dashboard);
        loadWidgetInstances(dashboard);
      }
    },
    [template, loadWidgetInstances]
  );

  const refreshWidget = useCallback((widgetType: string) => {
    setWidgetInstances((prev) => ({
      ...prev,
      [widgetType]: {
        ...prev[widgetType],
        state: 'loading' as WidgetState,
      },
    }));

    // Simulate async refresh
    setTimeout(() => {
      setWidgetInstances((prev) => ({
        ...prev,
        [widgetType]: createMockWidgetInstance(widgetType),
      }));
    }, 500);
  }, []);

  return {
    template,
    currentDashboard,
    widgetInstances,
    isLoading,
    error,
    setDashboard,
    refreshWidget,
  };
}
