"use client";

import * as React from "react";
import type { VerticalTemplate, DashboardDefinition } from "@/lib/verticals/types";
import type { WidgetData, WidgetState } from "@/lib/widgets/types";
import { getAllVerticalsMeta } from "@/lib/verticals/templates";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";

export interface DashboardShellProps {
  vertical: VerticalTemplate;
  initialDashboardId?: string;
  widgetData: Record<string, WidgetData>;
  widgetStates: Record<string, WidgetState>;
  widgetErrors?: Record<string, string>;
  onWidgetRefresh?: (widgetId: string) => void;
  onDashboardChange?: (dashboardId: string) => void;
  className?: string;
}

/**
 * Main dashboard container that combines header, sidebar, and widget grid
 */
export function DashboardShell({
  vertical,
  initialDashboardId,
  widgetData,
  widgetStates,
  widgetErrors = {},
  onWidgetRefresh,
  onDashboardChange,
  className = "",
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [currentDashboardId, setCurrentDashboardId] = React.useState<string>(
    initialDashboardId || vertical.dashboards.find((d) => d.default)?.id || vertical.dashboards[0]?.id || ""
  );

  // Get all verticals for sidebar
  const allVerticals = getAllVerticalsMeta();

  // Get current dashboard
  const currentDashboard = vertical.dashboards.find(
    (d) => d.id === currentDashboardId
  ) || vertical.dashboards[0];

  // Handle dashboard change
  const handleDashboardChange = (dashboardId: string) => {
    setCurrentDashboardId(dashboardId);
    onDashboardChange?.(dashboardId);
  };

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-gray-500 text-lg">No dashboard available</div>
          <div className="text-gray-400 text-sm mt-1">
            This vertical has no configured dashboards.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${className}`}>
      {/* Sidebar */}
      <DashboardSidebar
        verticals={allVerticals}
        activeVertical={vertical.meta.id}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          vertical={vertical.meta}
          dashboard={currentDashboard}
          dashboards={vertical.dashboards}
          onDashboardChange={handleDashboardChange}
        />

        {/* Widget grid */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <WidgetGrid
            layout={currentDashboard.layout}
            widgets={currentDashboard.widgets}
            widgetData={widgetData}
            widgetStates={widgetStates}
            widgetErrors={widgetErrors}
            onWidgetRefresh={onWidgetRefresh}
          />
        </main>
      </div>
    </div>
  );
}
