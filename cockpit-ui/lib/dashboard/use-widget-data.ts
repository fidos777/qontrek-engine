"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardWidget } from "@/lib/verticals/types";
import type { WidgetData, WidgetState } from "@/lib/widgets/types";
import type { UseWidgetDataOptions, UseWidgetDataReturn } from "./types";
import { generateDemoData } from "./demo-data";

/**
 * Fetch widget data from API or generate demo data
 */
export async function fetchWidgetData(
  widget: DashboardWidget
): Promise<WidgetData> {
  const dataSource = widget.data_source;

  // If no data source or static data, use demo data
  if (!dataSource || dataSource.type === "static") {
    if (dataSource?.static_data) {
      return dataSource.static_data as WidgetData;
    }
    // Generate demo data based on widget type
    return generateDemoData(widget.config.widget_type, widget.config);
  }

  // API data source
  if (dataSource.type === "api" && dataSource.endpoint) {
    try {
      const params = new URLSearchParams();
      if (dataSource.params) {
        Object.entries(dataSource.params).forEach(([key, value]) => {
          params.set(key, String(value));
        });
      }

      const url = `${dataSource.endpoint}${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle API envelope format
      if (result.data !== undefined) {
        return result.data;
      }

      return result;
    } catch (error) {
      console.warn(
        `Failed to fetch widget data for ${widget.widget_id}, using demo data:`,
        error
      );
      // Fallback to demo data
      return generateDemoData(widget.config.widget_type, widget.config);
    }
  }

  // Computed data source (not implemented yet)
  if (dataSource.type === "computed") {
    console.warn("Computed data sources not implemented, using demo data");
    return generateDemoData(widget.config.widget_type, widget.config);
  }

  // Default to demo data
  return generateDemoData(widget.config.widget_type, widget.config);
}

/**
 * Hook for fetching single widget data
 */
export function useWidgetData<T = WidgetData>(
  widget: DashboardWidget,
  options: UseWidgetDataOptions = {}
): UseWidgetDataReturn<T> {
  const { autoFetch = true, refreshInterval, onError } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [state, setState] = useState<WidgetState>("loading");
  const [error, setError] = useState<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    setState("loading");
    setError(undefined);

    try {
      const result = await fetchWidgetData(widget);
      setData(result as T);
      setState("ready");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setState("error");
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [widget, onError]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, widget.widget_id]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(refresh, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, refresh]);

  return { data, state, error, refresh };
}
