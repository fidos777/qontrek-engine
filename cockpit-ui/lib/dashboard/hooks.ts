"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VerticalTemplate, DashboardLayout } from '@/lib/verticals/types';
import type { WidgetInstance } from '@/lib/widgets/types';
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

function createMockWidgetInstance(widgetType: string): WidgetInstance {
  const mockData: Record<string, unknown> = {
    value: Math.floor(Math.random() * 100000),
    percentage: Math.floor(Math.random() * 100),
    items: [
      { name: 'Item Alpha', value: 12500, status: 'Active' },
      { name: 'Item Beta', value: 8750, status: 'Pending' },
      { name: 'Item Gamma', value: 15200, status: 'Active' },
      { name: 'Item Delta', value: 6300, status: 'Completed' },
    ],
    chartData: [
      { label: 'Mon', value: 65 },
      { label: 'Tue', value: 78 },
      { label: 'Wed', value: 90 },
      { label: 'Thu', value: 81 },
      { label: 'Fri', value: 56 },
      { label: 'Sat', value: 55 },
      { label: 'Sun', value: 70 },
    ],
  };

  return {
    schema: {
      id: `widget-${widgetType}-${Date.now()}`,
      type: widgetType,
      version: '1.0.0',
      title: widgetType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category: 'metrics' as const,
      data_source: {
        mcp_tool: 'getWidgetData',
        params: { widget_type: widgetType },
        refresh_interval_ms: 30000,
      },
      fields: [
        { key: 'value', label: 'Value', type: 'currency' as const, binding: 'value' },
      ],
      layout: { default_cols: 2, default_rows: 1 },
    },
    data: mockData,
    state: 'ready' as const,
    last_updated: new Date().toISOString(),
  };
}

export function useDashboard(
  verticalId: string,
  initialDashboardId?: string
): UseDashboardReturn {
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [widgetInstances, setWidgetInstances] = useState<Record<string, WidgetInstance>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entry = verticalRegistry.get(verticalId as any);
  const template = entry?.template || null;

  const currentDashboard = template?.dashboards.find(d => d.id === currentDashboardId) || null;

  useEffect(() => {
    if (!template) {
      setError(`Vertical not found: ${verticalId}`);
      setIsLoading(false);
      return;
    }

    const dashboardId = initialDashboardId || template.dashboards[0]?.id;
    if (dashboardId) {
      setCurrentDashboardId(dashboardId);
    }

    setIsLoading(false);
  }, [template, verticalId, initialDashboardId]);

  useEffect(() => {
    if (!currentDashboard) return;

    const instances: Record<string, WidgetInstance> = {};
    
    for (const widget of currentDashboard.widgets) {
      instances[widget.widget_type] = createMockWidgetInstance(widget.widget_type);
    }

    setWidgetInstances(instances);
  }, [currentDashboard]);

  const setDashboard = useCallback((id: string) => {
    setCurrentDashboardId(id);
  }, []);

  const refreshWidget = useCallback((widgetType: string) => {
    setWidgetInstances(prev => ({
      ...prev,
      [widgetType]: createMockWidgetInstance(widgetType),
    }));
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

export { createMockWidgetInstance };
