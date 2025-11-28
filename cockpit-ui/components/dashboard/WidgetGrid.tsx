"use client";

import * as React from 'react';
import type { DashboardLayout, DashboardWidget, WidgetPosition } from '@/lib/verticals/types';
import type { WidgetInstance } from '@/lib/widgets/types';
import { KPICardRenderer, ChartRenderer, TableRenderer, DefaultRenderer } from './renderers';

interface WidgetGridProps {
  layout: DashboardLayout;
  widgetInstances: Record<string, WidgetInstance>;
  onWidgetRefresh?: (widgetType: string) => void;
}

function getGridStyle(position: WidgetPosition): React.CSSProperties {
  return {
    gridColumn: `${position.col} / span ${position.width}`,
    gridRow: `${position.row} / span ${position.height}`,
  };
}

function getWidgetRenderer(widgetType: string) {
  if (widgetType.endsWith('_kpi') || widgetType === 'trust_meter') {
    return KPICardRenderer;
  }
  if (widgetType.endsWith('_chart')) {
    return ChartRenderer;
  }
  if (widgetType.endsWith('_table') || widgetType.endsWith('_kanban')) {
    return TableRenderer;
  }
  return DefaultRenderer;
}

export function WidgetGrid({
  layout,
  widgetInstances,
  onWidgetRefresh,
}: WidgetGridProps) {
  const columns = layout.columns || 4;

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: 'minmax(120px, auto)',
      }}
    >
      {layout.widgets.map((widget: DashboardWidget) => {
        const instance = widgetInstances[widget.widget_type];
        const Renderer = getWidgetRenderer(widget.widget_type);

        return (
          <div
            key={widget.widget_type}
            style={getGridStyle(widget.position)}
          >
            <Renderer
              instance={instance || createLoadingInstance(widget.widget_type)}
              onRefresh={onWidgetRefresh ? () => onWidgetRefresh(widget.widget_type) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

function createLoadingInstance(widgetType: string): WidgetInstance {
  return {
    id: `loading-${widgetType}`,
    schema: {
      widget_type: widgetType,
      title: widgetType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      fields: [],
    },
    data: {},
    state: 'loading',
  };
}
