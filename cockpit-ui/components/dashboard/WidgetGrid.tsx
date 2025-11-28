"use client";

import * as React from 'react';
import type { DashboardLayout, DashboardWidget, WidgetPosition } from '@/lib/verticals/types';
import type { WidgetInstance } from '@/lib/widgets/types';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/dashboard/formatters';

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
  // Map widget types to renderer categories
  const chartTypes = ['claims_chart', 'pipeline_chart', 'trend_chart', 'bar_chart', 'line_chart'];
  const tableTypes = ['lead_table', 'claims_table', 'data_table', 'list'];
  const kpiTypes = ['kpi_card', 'metric_card', 'stat_card'];
  const trustTypes = ['trust_meter', 'confidence_meter', 'governance_score'];

  if (chartTypes.some(t => widgetType.includes(t) || widgetType === t)) return 'chart';
  if (tableTypes.some(t => widgetType.includes(t) || widgetType === t)) return 'table';
  if (kpiTypes.some(t => widgetType.includes(t) || widgetType === t)) return 'kpi';
  if (trustTypes.some(t => widgetType.includes(t) || widgetType === t)) return 'trust';

  return 'default';
}

export function WidgetGrid({ layout, widgetInstances, onWidgetRefresh }: WidgetGridProps) {
  const columns = 4;

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: 'minmax(120px, auto)',
      }}
    >
      {layout.widgets.map((widget: DashboardWidget, index: number) => {
        const widgetType = widget.widget_type;
        
        // Create fallback instance with complete schema
        const instance: WidgetInstance = widgetInstances[widgetType] || {
          schema: {
            id: `fallback-${widgetType}-${Date.now()}-${index}`,
            type: widgetType,
            version: '1.0.0',
            title: widgetType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            category: 'metrics' as const,
            data_source: {
              mcp_tool: 'getWidgetData',
              params: { widget_type: widgetType },
            },
            fields: [],
            layout: { min_width: 1, min_height: 1, default_width: 2, default_height: 1 },
            display: {},
          },
          data: {},
          state: 'loading' as const,
          last_updated: new Date().toISOString(),
        };

        const rendererType = getWidgetRenderer(widgetType);

        return (
          <div
            key={`${widgetType}-${index}`}
            style={getGridStyle(widget.position)}
            className="min-h-[120px]"
          >
            <WidgetRenderer
              instance={instance}
              rendererType={rendererType}
              onRefresh={() => onWidgetRefresh?.(widgetType)}
            />
          </div>
        );
      })}
    </div>
  );
}

interface WidgetRendererProps {
  instance: WidgetInstance;
  rendererType: string;
  onRefresh?: () => void;
}

function WidgetRenderer({ instance, rendererType, onRefresh }: WidgetRendererProps) {
  const { schema, data, state, error } = instance;

  if (state === 'loading') {
    return <WidgetSkeleton variant={rendererType as any} />;
  }

  if (state === 'error') {
    return (
      <WidgetCard title={schema.title} error={error} onRefresh={onRefresh}>
        <div className="text-red-500 text-sm">Failed to load widget</div>
      </WidgetCard>
    );
  }

  switch (rendererType) {
    case 'chart':
      return <ChartWidget instance={instance} onRefresh={onRefresh} />;
    case 'table':
      return <TableWidget instance={instance} onRefresh={onRefresh} />;
    case 'kpi':
      return <KPIWidget instance={instance} onRefresh={onRefresh} />;
    case 'trust':
      return <TrustWidget instance={instance} onRefresh={onRefresh} />;
    default:
      return <DefaultWidget instance={instance} onRefresh={onRefresh} />;
  }
}

function ChartWidget({ instance, onRefresh }: { instance: WidgetInstance; onRefresh?: () => void }) {
  const { schema, data } = instance;
  const chartData = (data.chartData as Array<{ label: string; value: number }>) || [];

  return (
    <WidgetCard title={schema.title} onRefresh={onRefresh} className="h-full">
      <div className="flex items-end justify-between h-32 gap-2 pt-2">
        {chartData.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t"
              style={{ height: `${(item.value / 100) * 100}%`, minHeight: '8px' }}
            />
            <span className="text-xs text-gray-500 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function TableWidget({ instance, onRefresh }: { instance: WidgetInstance; onRefresh?: () => void }) {
  const { schema, data } = instance;
  const items = (data.items as Array<{ name: string; value: number; status: string }>) || [];

  return (
    <WidgetCard title={schema.title} onRefresh={onRefresh} className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Name</th>
              <th className="text-right py-2 font-medium">Value</th>
              <th className="text-right py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">{item.name}</td>
                <td className="text-right py-2">{formatCurrency(item.value)}</td>
                <td className="text-right py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      item.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetCard>
  );
}

function KPIWidget({ instance, onRefresh }: { instance: WidgetInstance; onRefresh?: () => void }) {
  const { schema, data } = instance;
  const value = (data.value as number) || 0;

  return (
    <WidgetCard title={schema.title} onRefresh={onRefresh} className="h-full">
      <div className="flex flex-col items-center justify-center h-20">
        <div className="text-3xl font-bold text-gray-900">{formatCurrency(value)}</div>
      </div>
    </WidgetCard>
  );
}

function TrustWidget({ instance, onRefresh }: { instance: WidgetInstance; onRefresh?: () => void }) {
  const { schema, data } = instance;
  const percentage = (data.percentage as number) || 87;

  return (
    <WidgetCard title={schema.title} onRefresh={onRefresh} className="h-full">
      <div className="flex flex-col items-center justify-center h-20">
        <div className="text-4xl font-bold text-gray-900">{percentage}%</div>
      </div>
    </WidgetCard>
  );
}

function DefaultWidget({ instance, onRefresh }: { instance: WidgetInstance; onRefresh?: () => void }) {
  const { schema } = instance;

  return (
    <WidgetCard title={schema.title} onRefresh={onRefresh} className="h-full">
      <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
        Widget content placeholder
      </div>
    </WidgetCard>
  );
}

export default WidgetGrid;
