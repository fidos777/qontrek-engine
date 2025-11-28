"use client";

import * as React from 'react';
import type { VerticalTemplate } from '@/lib/verticals/types';
import { useDashboard } from '@/lib/dashboard/hooks';
import { WidgetGrid } from './WidgetGrid';
import { WidgetSkeleton } from './WidgetSkeleton';

interface DashboardShellProps {
  template: VerticalTemplate;
  initialDashboardId?: string;
}

export function DashboardShell({ template, initialDashboardId }: DashboardShellProps) {
  const {
    currentDashboard,
    widgetInstances,
    isLoading,
    error,
    setDashboard,
    refreshWidget,
  } = useDashboard(template.id, initialDashboardId);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <WidgetSkeleton variant="default" className="h-12 w-64" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <WidgetSkeleton variant="kpi" />
          <WidgetSkeleton variant="kpi" />
          <WidgetSkeleton variant="kpi" />
          <WidgetSkeleton variant="kpi" />
          <WidgetSkeleton variant="chart" className="col-span-2" />
          <WidgetSkeleton variant="table" className="col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium">Error Loading Dashboard</h2>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-medium">No Dashboard Available</h2>
          <p className="text-yellow-600 text-sm mt-1">
            No dashboard configuration found for this vertical.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{template.description}</p>
          </div>
        </div>

        {/* Dashboard tabs */}
        {template.dashboards.length > 1 && (
          <div className="flex gap-2 mt-4">
            {template.dashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => setDashboard(dashboard.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentDashboard.id === dashboard.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {dashboard.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Widget Grid */}
      <WidgetGrid
        layout={currentDashboard}
        widgetInstances={widgetInstances}
        onWidgetRefresh={refreshWidget}
      />
    </div>
  );
}
