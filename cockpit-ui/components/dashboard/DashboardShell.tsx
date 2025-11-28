"use client";

import * as React from "react";
import type { VerticalTemplate, DashboardLayout } from "@/lib/verticals/types";
import type { WidgetInstance } from "@/lib/widgets/types";
import { WidgetGrid } from "@/components/widgets";
import { DashboardHeader } from "./DashboardHeader";

export interface DashboardShellProps {
  template: VerticalTemplate;
  currentDashboard: DashboardLayout | null;
  widgetInstances: Record<string, WidgetInstance>;
  onDashboardChange?: (dashboardId: string) => void;
  onWidgetRefresh?: (widgetId: string) => void;
}

export function DashboardShell({
  template,
  currentDashboard,
  widgetInstances,
  onDashboardChange,
  onWidgetRefresh,
}: DashboardShellProps) {
  if (!currentDashboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        template={template}
        currentDashboard={currentDashboard}
        onDashboardChange={onDashboardChange}
      />

      <main className="flex-1 overflow-auto p-6">
        <WidgetGrid
          layout={currentDashboard}
          widgetInstances={widgetInstances}
          onWidgetRefresh={onWidgetRefresh}
        />
      </main>
    </div>
  );
}

export default DashboardShell;
