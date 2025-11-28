// components/widgets/renderers/index.ts
import type { FC } from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { KPICardRenderer } from "./KPICardRenderer";
import { TrustMeterRenderer } from "./TrustMeterRenderer";
import { PipelineFunnelRenderer } from "./PipelineFunnelRenderer";
import { LeadTableRenderer } from "./LeadTableRenderer";
import { ReminderListRenderer } from "./ReminderListRenderer";
import { SuccessFeedRenderer } from "./SuccessFeedRenderer";
import { GovernanceStripRenderer } from "./GovernanceStripRenderer";
import { DefaultRenderer } from "./DefaultRenderer";

export { KPICardRenderer } from "./KPICardRenderer";
export { TrustMeterRenderer } from "./TrustMeterRenderer";
export { PipelineFunnelRenderer } from "./PipelineFunnelRenderer";
export { LeadTableRenderer } from "./LeadTableRenderer";
export { ReminderListRenderer } from "./ReminderListRenderer";
export { SuccessFeedRenderer } from "./SuccessFeedRenderer";
export { GovernanceStripRenderer } from "./GovernanceStripRenderer";
export { DefaultRenderer } from "./DefaultRenderer";

type WidgetRenderer = FC<WidgetComponentProps>;

const rendererRegistry: Record<string, WidgetRenderer> = {
  kpi_card: KPICardRenderer,
  trust_meter: TrustMeterRenderer,
  pipeline_funnel: PipelineFunnelRenderer,
  lead_table: LeadTableRenderer,
  reminder_list: ReminderListRenderer,
  success_feed: SuccessFeedRenderer,
  governance_strip: GovernanceStripRenderer,
};

export function getWidgetRenderer(widgetType: string): WidgetRenderer {
  return rendererRegistry[widgetType] || DefaultRenderer;
}
