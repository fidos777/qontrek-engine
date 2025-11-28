// lib/dashboard/types.ts
// Dashboard-specific types

import type { VerticalTemplate, DashboardLayout } from "@/lib/verticals/types";
import type { WidgetInstance } from "@/lib/widgets/types";

export interface DashboardState {
  template: VerticalTemplate | null;
  currentDashboard: DashboardLayout | null;
  widgetInstances: Record<string, WidgetInstance>;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardContextValue extends DashboardState {
  setCurrentDashboard: (dashboardId: string) => void;
  refreshWidget: (widgetType: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export interface UseDashboardReturn {
  template: VerticalTemplate | null;
  currentDashboard: DashboardLayout | null;
  widgetInstances: Record<string, WidgetInstance>;
  isLoading: boolean;
  error: string | null;
  setCurrentDashboard: (dashboardId: string) => void;
  refreshWidget: (widgetType: string) => Promise<void>;
}
