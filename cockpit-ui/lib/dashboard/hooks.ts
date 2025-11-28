/**
 * Dashboard Hooks for L5 UI Shell
 * Provides React hooks for widget management and dashboard state
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  WidgetInstance,
  WidgetSchema,
  WidgetState,
  WidgetCategory
} from '@/lib/widgets/types';

/**
 * Creates a mock widget instance for demo/testing purposes
 * Uses correct schema shape with all required properties
 */
export function createMockWidgetInstance(
  instanceId: string,
  title: string,
  widgetType: string,
  category: WidgetCategory = 'metrics',
  data: Record<string, any> = {}
): WidgetInstance {
  const now = new Date().toISOString();

  const schema: WidgetSchema = {
    id: `schema-${instanceId}`,
    type: widgetType, // Correct: using 'type' not 'widget_type'
    version: '1.0.0',
    title,
    category,
    data_source: {
      mcp_tool: `mcp.${widgetType}.getData`,
      params: {},
      refresh_interval_ms: 30000
    },
    fields: [
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        binding: 'data.value'
      }
    ],
    layout: {
      min_width: 1,
      min_height: 1,
      default_width: 2,
      default_height: 2
    },
    display: {
      showHeader: true,
      showBorder: true
    }
  };

  return {
    instance_id: instanceId,
    schema,
    data,
    state: 'ready', // Correct: using 'ready' not 'success'
    last_updated: now
  };
}

/**
 * Hook for managing a single widget's state
 */
export function useWidget(instanceId: string) {
  const [widget, setWidget] = useState<WidgetInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading a widget
    setIsLoading(true);
    const timer = setTimeout(() => {
      setWidget(createMockWidgetInstance(
        instanceId,
        'Demo Widget',
        'demo',
        'metrics',
        { value: 'Demo Data' }
      ));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [instanceId]);

  const refresh = useCallback(() => {
    if (widget) {
      setWidget({
        ...widget,
        state: 'loading',
        last_updated: new Date().toISOString()
      });
      // Simulate refresh
      setTimeout(() => {
        setWidget(prev => prev ? { ...prev, state: 'ready' } : null);
      }, 300);
    }
  }, [widget]);

  return { widget, isLoading, refresh };
}

/**
 * Hook for managing dashboard with multiple widgets
 */
export function useDashboard(dashboardId: string) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate loading dashboard widgets
    const timer = setTimeout(() => {
      setWidgets([
        createMockWidgetInstance('widget-1', 'Revenue', 'kpi', 'metrics', { value: '$1.2M' }),
        createMockWidgetInstance('widget-2', 'Users', 'kpi', 'metrics', { value: '12,450' }),
        createMockWidgetInstance('widget-3', 'Messages', 'list', 'communication', { count: 42 })
      ]);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [dashboardId]);

  const addWidget = useCallback((widget: WidgetInstance) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const removeWidget = useCallback((instanceId: string) => {
    setWidgets(prev => prev.filter(w => w.instance_id !== instanceId));
  }, []);

  const updateWidgetState = useCallback((instanceId: string, state: WidgetState) => {
    setWidgets(prev => prev.map(w =>
      w.instance_id === instanceId
        ? { ...w, state, last_updated: new Date().toISOString() }
        : w
    ));
  }, []);

  return {
    widgets,
    isLoading,
    addWidget,
    removeWidget,
    updateWidgetState
  };
}
