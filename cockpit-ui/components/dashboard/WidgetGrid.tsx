'use client';

/**
 * WidgetGrid Component for L5 UI Shell
 * Renders a responsive grid of widget instances
 */

import React from 'react';
import type { WidgetInstance, WidgetSchema } from '@/lib/widgets/types';

interface WidgetGridProps {
  widgets: WidgetInstance[];
  columns?: number;
  gap?: number;
  onWidgetClick?: (widget: WidgetInstance) => void;
}

interface WidgetCardProps {
  widget: WidgetInstance;
  onClick?: () => void;
}

/**
 * Creates a fallback/loading widget instance with all required schema properties
 */
function createFallbackWidget(instanceId: string): WidgetInstance {
  const now = new Date().toISOString();

  const schema: WidgetSchema = {
    id: `fallback-schema-${instanceId}`,
    type: 'placeholder', // Correct: using 'type' not 'widget_type'
    version: '1.0.0',
    title: 'Loading...',
    category: 'metrics',
    data_source: {
      mcp_tool: 'mcp.placeholder.getData',
      params: {},
      refresh_interval_ms: 30000
    },
    fields: [],
    layout: {
      min_width: 1,
      min_height: 1,
      default_width: 2,
      default_height: 2
    },
    display: {}
  };

  return {
    instance_id: instanceId,
    schema,
    data: {},
    state: 'loading', // Correct: using 'loading' for fallback state
    last_updated: now
  };
}

function WidgetCard({ widget, onClick }: WidgetCardProps) {
  const stateStyles: Record<string, string> = {
    loading: 'bg-gray-100 animate-pulse',
    ready: 'bg-white',
    error: 'bg-red-50 border-red-200',
    stale: 'bg-yellow-50 border-yellow-200'
  };

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${stateStyles[widget.state] || 'bg-white'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">
          {widget.schema.title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded ${
          widget.state === 'ready' ? 'bg-green-100 text-green-800' :
          widget.state === 'loading' ? 'bg-blue-100 text-blue-800' :
          widget.state === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {widget.state}
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        Type: {widget.schema.type}
      </div>

      {widget.state === 'loading' && (
        <div className="h-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {widget.state === 'ready' && widget.data && (
        <div className="text-lg font-medium text-gray-900">
          {JSON.stringify(widget.data).slice(0, 50)}
          {JSON.stringify(widget.data).length > 50 ? '...' : ''}
        </div>
      )}

      {widget.state === 'error' && (
        <div className="text-sm text-red-600">
          {widget.error || 'An error occurred'}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">
        Updated: {new Date(widget.last_updated).toLocaleTimeString()}
      </div>
    </div>
  );
}

export function WidgetGrid({
  widgets,
  columns = 3,
  gap = 4,
  onWidgetClick
}: WidgetGridProps) {
  // Ensure we always have valid widget instances
  const validWidgets = widgets.map((widget, index) => {
    if (!widget || !widget.schema) {
      return createFallbackWidget(`fallback-${index}`);
    }
    return widget;
  });

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {validWidgets.map((widget) => (
        <WidgetCard
          key={widget.instance_id}
          widget={widget}
          onClick={() => onWidgetClick?.(widget)}
        />
      ))}
    </div>
  );
}

export default WidgetGrid;
