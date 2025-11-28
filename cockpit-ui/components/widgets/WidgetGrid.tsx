"use client";

import * as React from "react";
import type { DashboardLayout, DashboardWidget } from "@/lib/verticals/types";
import type { WidgetInstance } from "@/lib/widgets/types";
import { getWidgetRenderer } from "./renderers";
import { WidgetCard } from "./WidgetCard";
import { WidgetSkeleton } from "./WidgetSkeleton";

export interface WidgetGridProps {
  layout: DashboardLayout;
  widgetInstances: Record<string, WidgetInstance>;
  onWidgetRefresh?: (widgetId: string) => void;
}

function getWidgetId(widget: DashboardWidget, index: number): string {
  return `${widget.widget_type}-${widget.position.col}-${widget.position.row}-${index}`;
}

function getGridStyles(widget: DashboardWidget): React.CSSProperties {
  return {
    gridColumn: `span ${widget.position.width}`,
    gridRow: `span ${widget.position.height}`,
  };
}

export function WidgetGrid({
  layout,
  widgetInstances,
  onWidgetRefresh,
}: WidgetGridProps) {
  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-min">
      {layout.widgets.map((widget, index) => {
        const widgetId = getWidgetId(widget, index);
        const instance = widgetInstances[widget.widget_type];
        const Renderer = getWidgetRenderer(widget.widget_type);

        return (
          <div key={widgetId} style={getGridStyles(widget)}>
            {!instance ? (
              <WidgetCard loading>
                <WidgetSkeleton variant="card" />
              </WidgetCard>
            ) : instance.state === "loading" ? (
              <WidgetCard title={instance.schema.title} loading>
                <WidgetSkeleton variant="card" />
              </WidgetCard>
            ) : instance.state === "error" ? (
              <WidgetCard
                title={instance.schema.title}
                error={instance.error || "An error occurred"}
              >
                <div />
              </WidgetCard>
            ) : (
              <div className="h-full">
                <Renderer
                  instance={instance}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WidgetGrid;
