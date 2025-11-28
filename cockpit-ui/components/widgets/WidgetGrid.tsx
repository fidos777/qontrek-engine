"use client";

import * as React from "react";
import type { DashboardLayout, DashboardWidget } from "@/lib/verticals/types";
import type { WidgetData, WidgetState } from "@/lib/widgets/types";
import { WidgetRenderer } from "./WidgetRenderer";

export interface WidgetGridProps {
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  widgetData: Record<string, WidgetData>;
  widgetStates: Record<string, WidgetState>;
  widgetErrors?: Record<string, string>;
  onWidgetRefresh?: (widgetId: string) => void;
  className?: string;
}

/**
 * Grid layout for dashboard widgets
 * Converts position (col, row, width, height) to CSS Grid placement
 */
export function WidgetGrid({
  layout,
  widgets,
  widgetData,
  widgetStates,
  widgetErrors = {},
  onWidgetRefresh,
  className = "",
}: WidgetGridProps) {
  const { columns, row_height, gap } = layout;

  // Calculate the number of rows needed based on widget positions
  const maxRow = Math.max(
    ...widgets.map((w) => w.position.row + w.position.height)
  );

  // Generate responsive grid classes
  const getGridStyle = (): React.CSSProperties => ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: `${row_height}px`,
    gap: `${gap}px`,
  });

  // Convert widget position to grid placement
  const getWidgetStyle = (position: DashboardWidget["position"]): React.CSSProperties => ({
    gridColumn: `${position.col + 1} / span ${position.width}`,
    gridRow: `${position.row + 1} / span ${position.height}`,
  });

  // Filter visible widgets
  const visibleWidgets = widgets.filter((w) => w.visible !== false);

  return (
    <div className={className}>
      {/* Desktop Grid */}
      <div className="hidden lg:block" style={getGridStyle()}>
        {visibleWidgets.map((widget) => (
          <div key={widget.widget_id} style={getWidgetStyle(widget.position)}>
            <WidgetRenderer
              config={widget.config}
              data={widgetData[widget.widget_id]}
              state={widgetStates[widget.widget_id] || "loading"}
              error={widgetErrors[widget.widget_id]}
              onRefresh={() => onWidgetRefresh?.(widget.widget_id)}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Tablet Grid (6 columns) */}
      <div
        className="hidden md:block lg:hidden"
        style={{
          ...getGridStyle(),
          gridTemplateColumns: `repeat(${layout.breakpoints?.md || 6}, minmax(0, 1fr))`,
        }}
      >
        {visibleWidgets.map((widget) => {
          // Recalculate positions for tablet
          const mdCols = layout.breakpoints?.md || 6;
          const scaleFactor = mdCols / columns;
          const mdPosition = {
            col: Math.floor(widget.position.col * scaleFactor),
            row: widget.position.row,
            width: Math.max(1, Math.ceil(widget.position.width * scaleFactor)),
            height: widget.position.height,
          };
          // Ensure widget doesn't exceed grid bounds
          if (mdPosition.col + mdPosition.width > mdCols) {
            mdPosition.col = 0;
            mdPosition.width = mdCols;
          }
          return (
            <div key={widget.widget_id} style={getWidgetStyle(mdPosition)}>
              <WidgetRenderer
                config={widget.config}
                data={widgetData[widget.widget_id]}
                state={widgetStates[widget.widget_id] || "loading"}
                error={widgetErrors[widget.widget_id]}
                onRefresh={() => onWidgetRefresh?.(widget.widget_id)}
                className="h-full"
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Stack (1 column) */}
      <div className="md:hidden space-y-4">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.widget_id}
            style={{
              minHeight: `${widget.position.height * row_height}px`,
            }}
          >
            <WidgetRenderer
              config={widget.config}
              data={widgetData[widget.widget_id]}
              state={widgetStates[widget.widget_id] || "loading"}
              error={widgetErrors[widget.widget_id]}
              onRefresh={() => onWidgetRefresh?.(widget.widget_id)}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
