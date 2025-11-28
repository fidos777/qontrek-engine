"use client";

import * as React from 'react';
import type { WidgetComponentProps } from '@/lib/widgets/types';
import { WidgetCard } from '../WidgetCard';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/dashboard/formatters';

interface RendererProps extends WidgetComponentProps {
  onRefresh?: () => void;
}

export function KPICardRenderer({ instance, onRefresh }: RendererProps) {
  const { schema, data, state, error } = instance;

  if (state === 'loading') {
    return <WidgetSkeleton variant="kpi" />;
  }

  if (state === 'error') {
    return <WidgetCard error={error} onRefresh={onRefresh}>{null}</WidgetCard>;
  }

  const value = data.value as number;
  const change = data.change as number | undefined;
  const label = schema.title;
  const widgetType = schema.widget_type;

  // Determine format based on widget type
  let formattedValue: string;
  if (widgetType.includes('ratio') || widgetType.includes('rate') || widgetType === 'conversion_kpi') {
    formattedValue = formatPercentage(value);
  } else if (
    widgetType.includes('revenue') ||
    widgetType.includes('contributions') ||
    widgetType.includes('value') ||
    widgetType.includes('sales') ||
    widgetType.includes('gmv') ||
    widgetType.includes('aov')
  ) {
    formattedValue = formatCurrency(value);
  } else if (widgetType === 'trust_meter') {
    formattedValue = `${value}%`;
  } else if (widgetType.includes('satisfaction')) {
    formattedValue = `${value}/5`;
  } else if (widgetType.includes('nps')) {
    formattedValue = `+${value}`;
  } else {
    formattedValue = formatNumber(value);
  }

  return (
    <WidgetCard
      title={label}
      onRefresh={onRefresh}
      loading={false}
      className="h-full"
    >
      <div className="flex flex-col justify-center">
        <div className="text-3xl font-bold text-gray-900">{formattedValue}</div>
        {change !== undefined && (
          <div
            className={`mt-1 text-sm font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export function ChartRenderer({ instance, onRefresh }: RendererProps) {
  const { schema, state, error } = instance;

  if (state === 'loading') {
    return <WidgetSkeleton variant="chart" />;
  }

  if (state === 'error') {
    return <WidgetCard error={error} onRefresh={onRefresh}>{null}</WidgetCard>;
  }

  // Render a placeholder chart
  const bars = [65, 85, 72, 90, 55, 78, 82];

  return (
    <WidgetCard
      title={schema.title}
      onRefresh={onRefresh}
      loading={false}
      className="h-full"
    >
      <div className="flex items-end justify-between h-32 gap-2 pt-2">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </WidgetCard>
  );
}

export function TableRenderer({ instance, onRefresh }: RendererProps) {
  const { schema, state, error } = instance;

  if (state === 'loading') {
    return <WidgetSkeleton variant="table" />;
  }

  if (state === 'error') {
    return <WidgetCard error={error} onRefresh={onRefresh}>{null}</WidgetCard>;
  }

  // Render placeholder table data
  const rows = [
    { id: 1, name: 'Item Alpha', value: 12500, status: 'Active' },
    { id: 2, name: 'Item Beta', value: 8750, status: 'Pending' },
    { id: 3, name: 'Item Gamma', value: 15200, status: 'Active' },
    { id: 4, name: 'Item Delta', value: 6300, status: 'Completed' },
  ];

  return (
    <WidgetCard
      title={schema.title}
      onRefresh={onRefresh}
      loading={false}
      className="h-full"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-600">Name</th>
              <th className="text-right py-2 font-medium text-gray-600">Value</th>
              <th className="text-right py-2 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 text-gray-900">{row.name}</td>
                <td className="py-2 text-right text-gray-900">
                  {formatCurrency(row.value)}
                </td>
                <td className="py-2 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      row.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : row.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {row.status}
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

export function DefaultRenderer({ instance, onRefresh }: RendererProps) {
  const { schema, state, error } = instance;

  if (state === 'loading') {
    return <WidgetSkeleton variant="default" />;
  }

  if (state === 'error') {
    return <WidgetCard error={error} onRefresh={onRefresh}>{null}</WidgetCard>;
  }

  return (
    <WidgetCard
      title={schema.title}
      onRefresh={onRefresh}
      loading={false}
      className="h-full"
    >
      <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
        Widget content placeholder
      </div>
    </WidgetCard>
  );
}
