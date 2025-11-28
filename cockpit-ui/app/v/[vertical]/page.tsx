"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/lib/dashboard/use-dashboard";
import { getVerticalTemplate, isValidVerticalId } from "@/lib/verticals/templates";
import type { VerticalTemplate } from "@/lib/verticals/types";

/**
 * Dynamic vertical dashboard page
 * Route: /v/[vertical]
 * Query params: ?dashboard= to select specific dashboard
 */
export default function VerticalDashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const verticalId = params.vertical as string;
  const dashboardId = searchParams.get("dashboard") || undefined;

  // Validate vertical ID
  const [vertical, setVertical] = useState<VerticalTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isValidVerticalId(verticalId)) {
      setIsLoading(false);
      return;
    }

    const template = getVerticalTemplate(verticalId);
    if (template) {
      setVertical(template);
    }
    setIsLoading(false);
  }, [verticalId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <div className="mt-4 text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Show not found for invalid vertical
  if (!vertical) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600 mb-4">
            Vertical "{verticalId}" not found
          </p>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <VerticalDashboard
      vertical={vertical}
      initialDashboardId={dashboardId}
    />
  );
}

interface VerticalDashboardProps {
  vertical: VerticalTemplate;
  initialDashboardId?: string;
}

function VerticalDashboard({
  vertical,
  initialDashboardId,
}: VerticalDashboardProps) {
  const { state, setDashboard, refreshWidget, refreshAll } = useDashboard(
    vertical,
    initialDashboardId
  );

  return (
    <DashboardShell
      vertical={vertical}
      initialDashboardId={state.currentDashboard?.id}
      widgetData={state.widgetData}
      widgetStates={state.widgetStates}
      widgetErrors={state.widgetErrors}
      onWidgetRefresh={refreshWidget}
      onDashboardChange={setDashboard}
    />
  );
}
