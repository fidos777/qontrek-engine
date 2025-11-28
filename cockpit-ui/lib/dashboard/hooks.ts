"use client";

import { useState, useEffect, useCallback } from "react";
import type { VerticalTemplate, DashboardLayout } from "@/lib/verticals/types";
import type { WidgetInstance, WidgetState } from "@/lib/widgets/types";
import { getVerticalTemplate } from "@/lib/verticals";
import type { UseDashboardReturn } from "./types";

// Demo data for widgets
function getDemoWidgetData(widgetType: string): Record<string, unknown> {
  switch (widgetType) {
    case "kpi_card":
      return {
        value: 1250000,
        label: "Total Pipeline",
        format: "currency",
        trend: 12.5,
        trend_direction: "up",
      };
    case "trust_meter":
      return {
        trust_score: 85,
        last_verified: new Date().toISOString(),
        proof_count: 47,
      };
    case "pipeline_funnel":
      return {
        stages: [
          { id: "new", name: "New Lead", count: 45, value: 450000, color: "#3b82f6" },
          { id: "qualified", name: "Qualified", count: 32, value: 380000, color: "#8b5cf6" },
          { id: "proposal", name: "Proposal", count: 18, value: 290000, color: "#f59e0b" },
          { id: "negotiation", name: "Negotiation", count: 8, value: 180000, color: "#ef4444" },
          { id: "won", name: "Won", count: 5, value: 125000, color: "#22c55e" },
        ],
      };
    case "lead_table":
      return {
        leads: [
          {
            id: "1",
            name: "Ahmad bin Hassan",
            company: "Solar Tech Sdn Bhd",
            value: 85000,
            stage: "Proposal",
            stage_color: "#f59e0b",
            last_activity: new Date(Date.now() - 86400000).toISOString(),
            priority: "high",
          },
          {
            id: "2",
            name: "Siti Aminah",
            company: "Green Energy MY",
            value: 62000,
            stage: "Qualified",
            stage_color: "#8b5cf6",
            last_activity: new Date(Date.now() - 172800000).toISOString(),
            priority: "medium",
          },
          {
            id: "3",
            name: "Raj Kumar",
            company: "EcoPanel Industries",
            value: 95000,
            stage: "Negotiation",
            stage_color: "#ef4444",
            last_activity: new Date(Date.now() - 43200000).toISOString(),
            priority: "high",
          },
        ],
      };
    case "reminder_list":
      return {
        reminders: [
          {
            id: "1",
            title: "Follow up on proposal",
            lead_name: "Ahmad bin Hassan",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            priority: "high",
          },
          {
            id: "2",
            title: "Site visit confirmation",
            lead_name: "Siti Aminah",
            due_date: new Date(Date.now() + 172800000).toISOString(),
            priority: "medium",
          },
          {
            id: "3",
            title: "Send updated quote",
            lead_name: "Raj Kumar",
            due_date: new Date(Date.now() - 3600000).toISOString(),
            priority: "high",
          },
        ],
      };
    case "success_feed":
      return {
        successes: [
          {
            id: "1",
            lead_name: "Lim Wei Ling",
            deal_value: 78000,
            closed_at: new Date(Date.now() - 86400000).toISOString(),
            sales_rep: "Farid",
            product: "10kW Solar System",
          },
          {
            id: "2",
            lead_name: "Mohamed Zain",
            deal_value: 125000,
            closed_at: new Date(Date.now() - 259200000).toISOString(),
            sales_rep: "Mei Ling",
            product: "15kW Commercial",
          },
        ],
      };
    case "governance_strip":
      return {
        merkle_hash: "0xa1b2c3d4e5f6789012345678901234567890abcd",
        last_proof_at: new Date().toISOString(),
        proof_count: 47,
        audit_enabled: true,
        schema_version: "1.0.0",
      };
    default:
      return {};
  }
}

function createWidgetInstance(
  widgetType: string,
  state: WidgetState = "ready"
): WidgetInstance {
  return {
    schema: {
      widget_type: widgetType,
      version: "1.0.0",
      title: widgetType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    },
    data: getDemoWidgetData(widgetType),
    state,
    last_updated: new Date().toISOString(),
  };
}

export function useDashboard(verticalId: string): UseDashboardReturn {
  const [template, setTemplate] = useState<VerticalTemplate | null>(null);
  const [currentDashboard, setCurrentDashboardState] = useState<DashboardLayout | null>(null);
  const [widgetInstances, setWidgetInstances] = useState<Record<string, WidgetInstance>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load template on mount
  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const t = getVerticalTemplate(verticalId);
        if (!t) {
          setError(`Vertical "${verticalId}" not found`);
          setIsLoading(false);
          return;
        }

        setTemplate(t);

        // Set first dashboard as current
        if (t.dashboards.length > 0) {
          setCurrentDashboardState(t.dashboards[0]);

          // Create widget instances for all widgets in the dashboard
          const instances: Record<string, WidgetInstance> = {};
          for (const widget of t.dashboards[0].widgets) {
            instances[widget.widget_type] = createWidgetInstance(widget.widget_type);
          }
          setWidgetInstances(instances);
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template");
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [verticalId]);

  const setCurrentDashboard = useCallback(
    (dashboardId: string) => {
      if (!template) return;
      const dashboard = template.dashboards.find((d: DashboardLayout) => d.id === dashboardId);
      if (dashboard) {
        setCurrentDashboardState(dashboard);

        // Create widget instances for the new dashboard
        const instances: Record<string, WidgetInstance> = {};
        for (const widget of dashboard.widgets) {
          instances[widget.widget_type] = createWidgetInstance(widget.widget_type);
        }
        setWidgetInstances(instances);
      }
    },
    [template]
  );

  const refreshWidget = useCallback(async (widgetType: string) => {
    setWidgetInstances((prev: Record<string, WidgetInstance>) => ({
      ...prev,
      [widgetType]: {
        ...prev[widgetType],
        state: "loading" as WidgetState,
      },
    }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setWidgetInstances((prev: Record<string, WidgetInstance>) => ({
      ...prev,
      [widgetType]: createWidgetInstance(widgetType),
    }));
  }, []);

  return {
    template,
    currentDashboard,
    widgetInstances,
    isLoading,
    error,
    setCurrentDashboard,
    refreshWidget,
  };
}

export function useWidgetData(widgetType: string) {
  const [instance, setInstance] = useState<WidgetInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setInstance(createWidgetInstance(widgetType));
      setIsLoading(false);
    };

    loadData();
  }, [widgetType]);

  return { instance, isLoading };
}
