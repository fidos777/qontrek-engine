// API endpoint to get widget data
// GET /api/mcp/tools/getWidgetData?widget_type=kpi_card&metric=total_leads

import { NextRequest, NextResponse } from "next/server";
import { generateDemoData } from "@/lib/dashboard/demo-data";
import type { WidgetType, WidgetConfig } from "@/lib/widgets/types";

// Valid widget types
const validWidgetTypes: WidgetType[] = [
  "kpi_card",
  "trust_meter",
  "pipeline_funnel",
  "recovery_chart",
  "lead_table",
  "reminder_list",
  "success_feed",
  "governance_strip",
  "lead_heatmap",
  "wa_session_card",
  "wa_conversation_timeline",
  "wa_cost_breakdown",
  "wa_send_panel",
  "cfo_tab_metrics",
  "variance_card",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const widgetType = searchParams.get("widget_type") as WidgetType | null;
  const metric = searchParams.get("metric");
  const variant = searchParams.get("variant");

  // Validate widget type
  if (!widgetType) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing required parameter: widget_type",
        validWidgetTypes,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  if (!validWidgetTypes.includes(widgetType)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid widget_type: ${widgetType}`,
        validWidgetTypes,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Build config based on parameters
  const config: WidgetConfig = {
    id: `api-${widgetType}`,
    widget_type: widgetType,
    title: widgetType.replace(/_/g, " "),
  };

  // Add metric_key for KPI cards
  if (widgetType === "kpi_card" && metric) {
    (config as any).metric_key = metric;
  }

  // Add variant-specific config
  if (variant) {
    (config as any).variant = variant;
  }

  // Add default pipeline stages for funnel
  if (widgetType === "pipeline_funnel") {
    (config as any).stages = [
      { key: "lead", label: "Lead", color: "#3b82f6" },
      { key: "qualified", label: "Qualified", color: "#22c55e" },
      { key: "proposal", label: "Proposal", color: "#eab308" },
      { key: "negotiation", label: "Negotiation", color: "#f97316" },
      { key: "closed", label: "Closed", color: "#10b981" },
    ];
  }

  // Generate demo data
  const data = generateDemoData(widgetType, config);

  return NextResponse.json({
    ok: true,
    widget_type: widgetType,
    data,
    source: "demo",
    timestamp: new Date().toISOString(),
  });
}
