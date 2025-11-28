// lib/dashboard/types.ts
// Dashboard state and hook types

import type { VerticalTemplate, DashboardDefinition } from "@/lib/verticals/types";
import type { WidgetData, WidgetState } from "@/lib/widgets/types";

/**
 * Dashboard state
 */
export interface DashboardState {
  vertical: VerticalTemplate | null;
  currentDashboard: DashboardDefinition | null;
  isLoading: boolean;
  error: string | null;
  widgetData: Record<string, WidgetData>;
  widgetStates: Record<string, WidgetState>;
  widgetErrors: Record<string, string>;
}

/**
 * Dashboard actions
 */
export type DashboardAction =
  | { type: "SET_VERTICAL"; payload: VerticalTemplate }
  | { type: "SET_DASHBOARD"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_WIDGET_DATA"; payload: { widgetId: string; data: WidgetData } }
  | { type: "SET_WIDGET_STATE"; payload: { widgetId: string; state: WidgetState } }
  | { type: "SET_WIDGET_ERROR"; payload: { widgetId: string; error: string } }
  | { type: "CLEAR_WIDGET_ERROR"; payload: string }
  | { type: "SET_ALL_WIDGET_DATA"; payload: Record<string, WidgetData> }
  | { type: "SET_ALL_WIDGET_STATES"; payload: Record<string, WidgetState> }
  | { type: "RESET" };

/**
 * Dashboard hook return type
 */
export interface UseDashboardReturn {
  state: DashboardState;
  setDashboard: (dashboardId: string) => void;
  refreshWidget: (widgetId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

/**
 * Widget data hook options
 */
export interface UseWidgetDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
}

/**
 * Widget data hook return type
 */
export interface UseWidgetDataReturn<T = WidgetData> {
  data: T | undefined;
  state: WidgetState;
  error: string | undefined;
  refresh: () => Promise<void>;
}
