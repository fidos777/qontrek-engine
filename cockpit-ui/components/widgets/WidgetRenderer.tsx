"use client";

import * as React from "react";
import type {
  WidgetConfig,
  WidgetData,
  WidgetState,
  WidgetType,
  KPICardConfig,
  KPICardData,
  TrustMeterConfig,
  TrustMeterData,
  PipelineFunnelConfig,
  PipelineFunnelData,
  RecoveryChartConfig,
  RecoveryChartData,
  LeadTableConfig,
  LeadTableData,
  ReminderListConfig,
  ReminderListData,
  SuccessFeedConfig,
  SuccessFeedData,
  GovernanceStripConfig,
  GovernanceStripData,
  LeadHeatmapConfig,
  LeadHeatmapData,
  WASessionCardConfig,
  WASessionCardData,
  WAConversationTimelineConfig,
  WAConversationTimelineData,
  WACostBreakdownConfig,
  WACostBreakdownData,
  WASendPanelConfig,
  WASendPanelData,
} from "@/lib/widgets/types";
import { WidgetSkeleton, type SkeletonVariant } from "./WidgetSkeleton";
import { WidgetCard } from "./WidgetCard";

// Core widgets
import { KPICard } from "./core/KPICard";
import { TrustMeter } from "./core/TrustMeter";
import { PipelineFunnel } from "./core/PipelineFunnel";
import { RecoveryChart } from "./core/RecoveryChart";
import { LeadTable } from "./core/LeadTable";
import { ReminderList } from "./core/ReminderList";
import { SuccessFeed } from "./core/SuccessFeed";
import { GovernanceStrip } from "./core/GovernanceStrip";
import { LeadHeatmap } from "./core/LeadHeatmap";

// WhatsApp widgets
import { SessionCard } from "./whatsapp/SessionCard";
import { ConversationTimeline } from "./whatsapp/ConversationTimeline";
import { CostBreakdown } from "./whatsapp/CostBreakdown";
import { SendPanel } from "./whatsapp/SendPanel";

export interface WidgetRendererProps {
  config: WidgetConfig;
  data?: WidgetData;
  state: WidgetState;
  error?: string;
  onRefresh?: () => void;
  className?: string;
}

// Map widget type to skeleton variant
const skeletonVariantMap: Record<WidgetType, SkeletonVariant> = {
  kpi_card: "kpi",
  trust_meter: "meter",
  pipeline_funnel: "funnel",
  recovery_chart: "chart",
  lead_table: "table",
  reminder_list: "list",
  success_feed: "list",
  governance_strip: "default",
  lead_heatmap: "heatmap",
  wa_session_card: "kpi",
  wa_conversation_timeline: "list",
  wa_cost_breakdown: "chart",
  wa_send_panel: "default",
  cfo_tab_metrics: "kpi",
  variance_card: "kpi",
  custom: "default",
};

/**
 * Dynamic widget renderer that maps widget_type to React component
 */
export function WidgetRenderer({
  config,
  data,
  state,
  error,
  onRefresh,
  className = "",
}: WidgetRendererProps) {
  // Handle loading state
  if (state === "loading") {
    return (
      <WidgetSkeleton
        variant={skeletonVariantMap[config.widget_type] || "default"}
        title={config.title}
        className={className}
      />
    );
  }

  // Handle error state
  if (state === "error") {
    return (
      <WidgetCard title={config.title} error={error} className={className}>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </WidgetCard>
    );
  }

  // Handle empty state
  if (state === "empty" || !data) {
    return (
      <WidgetCard title={config.title} className={className}>
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No data available
        </div>
      </WidgetCard>
    );
  }

  // Render the appropriate widget with type assertions
  switch (config.widget_type) {
    case "kpi_card":
      return (
        <KPICard
          config={config as KPICardConfig}
          data={data as KPICardData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "trust_meter":
      return (
        <TrustMeter
          config={config as TrustMeterConfig}
          data={data as TrustMeterData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "pipeline_funnel":
      return (
        <PipelineFunnel
          config={config as PipelineFunnelConfig}
          data={data as PipelineFunnelData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "recovery_chart":
      return (
        <RecoveryChart
          config={config as RecoveryChartConfig}
          data={data as RecoveryChartData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "lead_table":
      return (
        <LeadTable
          config={config as LeadTableConfig}
          data={data as LeadTableData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "reminder_list":
      return (
        <ReminderList
          config={config as ReminderListConfig}
          data={data as ReminderListData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "success_feed":
      return (
        <SuccessFeed
          config={config as SuccessFeedConfig}
          data={data as SuccessFeedData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "governance_strip":
      return (
        <GovernanceStrip
          config={config as GovernanceStripConfig}
          data={data as GovernanceStripData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "lead_heatmap":
      return (
        <LeadHeatmap
          config={config as LeadHeatmapConfig}
          data={data as LeadHeatmapData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "wa_session_card":
      return (
        <SessionCard
          config={config as WASessionCardConfig}
          data={data as WASessionCardData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "wa_conversation_timeline":
      return (
        <ConversationTimeline
          config={config as WAConversationTimelineConfig}
          data={data as WAConversationTimelineData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "wa_cost_breakdown":
      return (
        <CostBreakdown
          config={config as WACostBreakdownConfig}
          data={data as WACostBreakdownData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "wa_send_panel":
      return (
        <SendPanel
          config={config as WASendPanelConfig}
          data={data as WASendPanelData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    // CFO widgets can use KPICard variant
    case "cfo_tab_metrics":
    case "variance_card":
      return (
        <KPICard
          config={config as KPICardConfig}
          data={data as KPICardData}
          state={state}
          error={error}
          onRefresh={onRefresh}
          className={className}
        />
      );

    case "custom":
    default:
      return (
        <WidgetCard title={config.title} className={className}>
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Unknown widget type: {config.widget_type}
          </div>
        </WidgetCard>
      );
  }
}
