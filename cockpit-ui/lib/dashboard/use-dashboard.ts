"use client";

import { useReducer, useCallback, useEffect } from "react";
import type { VerticalTemplate, DashboardWidget } from "@/lib/verticals/types";
import type { WidgetData, WidgetState } from "@/lib/widgets/types";
import type { DashboardState, DashboardAction, UseDashboardReturn } from "./types";
import { fetchWidgetData } from "./use-widget-data";

// Initial state
const initialState: DashboardState = {
  vertical: null,
  currentDashboard: null,
  isLoading: true,
  error: null,
  widgetData: {},
  widgetStates: {},
  widgetErrors: {},
};

// Reducer
function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "SET_VERTICAL":
      return {
        ...state,
        vertical: action.payload,
        currentDashboard:
          action.payload.dashboards.find((d) => d.default) ||
          action.payload.dashboards[0] ||
          null,
        isLoading: false,
      };

    case "SET_DASHBOARD":
      if (!state.vertical) return state;
      const dashboard = state.vertical.dashboards.find(
        (d) => d.id === action.payload
      );
      return {
        ...state,
        currentDashboard: dashboard || state.currentDashboard,
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_WIDGET_DATA":
      return {
        ...state,
        widgetData: {
          ...state.widgetData,
          [action.payload.widgetId]: action.payload.data,
        },
      };

    case "SET_WIDGET_STATE":
      return {
        ...state,
        widgetStates: {
          ...state.widgetStates,
          [action.payload.widgetId]: action.payload.state,
        },
      };

    case "SET_WIDGET_ERROR":
      return {
        ...state,
        widgetErrors: {
          ...state.widgetErrors,
          [action.payload.widgetId]: action.payload.error,
        },
        widgetStates: {
          ...state.widgetStates,
          [action.payload.widgetId]: "error",
        },
      };

    case "CLEAR_WIDGET_ERROR":
      const { [action.payload]: _, ...remainingErrors } = state.widgetErrors;
      return {
        ...state,
        widgetErrors: remainingErrors,
      };

    case "SET_ALL_WIDGET_DATA":
      return {
        ...state,
        widgetData: action.payload,
      };

    case "SET_ALL_WIDGET_STATES":
      return {
        ...state,
        widgetStates: action.payload,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/**
 * Hook for managing dashboard state
 */
export function useDashboard(
  verticalTemplate: VerticalTemplate,
  initialDashboardId?: string
): UseDashboardReturn {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    vertical: verticalTemplate,
    currentDashboard:
      verticalTemplate.dashboards.find(
        (d) => d.id === initialDashboardId || d.default
      ) || verticalTemplate.dashboards[0],
    isLoading: false,
  });

  // Fetch widget data for a single widget
  const refreshWidget = useCallback(
    async (widgetId: string) => {
      if (!state.currentDashboard) return;

      const widget = state.currentDashboard.widgets.find(
        (w) => w.widget_id === widgetId
      );
      if (!widget) return;

      dispatch({
        type: "SET_WIDGET_STATE",
        payload: { widgetId, state: "loading" },
      });
      dispatch({ type: "CLEAR_WIDGET_ERROR", payload: widgetId });

      try {
        const data = await fetchWidgetData(widget);
        dispatch({
          type: "SET_WIDGET_DATA",
          payload: { widgetId, data },
        });
        dispatch({
          type: "SET_WIDGET_STATE",
          payload: { widgetId, state: "ready" },
        });
      } catch (error) {
        dispatch({
          type: "SET_WIDGET_ERROR",
          payload: {
            widgetId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    },
    [state.currentDashboard]
  );

  // Fetch all widget data
  const refreshAll = useCallback(async () => {
    if (!state.currentDashboard) return;

    const widgets = state.currentDashboard.widgets;

    // Set all to loading
    const loadingStates: Record<string, WidgetState> = {};
    widgets.forEach((w) => {
      loadingStates[w.widget_id] = "loading";
    });
    dispatch({ type: "SET_ALL_WIDGET_STATES", payload: loadingStates });

    // Fetch all in parallel
    const results = await Promise.allSettled(
      widgets.map(async (widget) => {
        const data = await fetchWidgetData(widget);
        return { widgetId: widget.widget_id, data };
      })
    );

    // Process results
    const newData: Record<string, WidgetData> = {};
    const newStates: Record<string, WidgetState> = {};
    const newErrors: Record<string, string> = {};

    results.forEach((result, index) => {
      const widgetId = widgets[index].widget_id;

      if (result.status === "fulfilled") {
        newData[widgetId] = result.value.data;
        newStates[widgetId] = "ready";
      } else {
        newStates[widgetId] = "error";
        newErrors[widgetId] =
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error";
      }
    });

    dispatch({ type: "SET_ALL_WIDGET_DATA", payload: newData });
    dispatch({ type: "SET_ALL_WIDGET_STATES", payload: newStates });
  }, [state.currentDashboard]);

  // Set dashboard
  const setDashboard = useCallback((dashboardId: string) => {
    dispatch({ type: "SET_DASHBOARD", payload: dashboardId });
  }, []);

  // Initial data fetch when dashboard changes
  useEffect(() => {
    if (state.currentDashboard) {
      refreshAll();
    }
  }, [state.currentDashboard?.id]);

  return {
    state,
    setDashboard,
    refreshWidget,
    refreshAll,
  };
}
