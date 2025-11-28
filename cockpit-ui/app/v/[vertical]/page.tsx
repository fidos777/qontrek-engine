"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getVerticalTemplate, verticalRegistry } from "@/lib/verticals";
import type { VerticalId } from "@/lib/verticals/types";
import { useDashboard } from "@/lib/dashboard";
import { DashboardShell, DashboardSidebar } from "@/components/dashboard";

export default function VerticalPage() {
  const params = useParams();
  const router = useRouter();
  const verticalId = params.vertical as string;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Validate vertical ID
  const isValidVertical = verticalId in verticalRegistry;

  const {
    template,
    currentDashboard,
    widgetInstances,
    isLoading,
    error,
    setCurrentDashboard,
    refreshWidget,
  } = useDashboard(isValidVertical ? verticalId : "solar");

  const handleVerticalChange = (newVerticalId: VerticalId) => {
    router.push(`/v/${newVerticalId}`);
  };

  // Invalid vertical
  if (!isValidVertical) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Vertical Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The vertical &quot;{verticalId}&quot; does not exist.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Available verticals:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.values(verticalRegistry).map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVerticalChange(v.id)}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: v.color }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading {verticalId} dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-500 dark:text-gray-400">{error || "Failed to load template"}</p>
          <button
            onClick={() => router.push("/v/solar")}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Go to Solar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar
        currentVertical={verticalId as VerticalId}
        onVerticalChange={handleVerticalChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <DashboardShell
        template={template}
        currentDashboard={currentDashboard}
        widgetInstances={widgetInstances}
        onDashboardChange={setCurrentDashboard}
        onWidgetRefresh={refreshWidget}
      />
    </div>
  );
}
