"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  LeadHeatmapConfig,
  LeadHeatmapData,
  WidgetProps,
} from "@/lib/widgets/types";

export interface LeadHeatmapProps extends WidgetProps<LeadHeatmapConfig, LeadHeatmapData> {
  className?: string;
}

/**
 * Lead activity heatmap widget
 * Shows 2D grid with color intensity based on metric values
 */
export function LeadHeatmap({
  config,
  data,
  state,
  className = "",
}: LeadHeatmapProps) {
  const cells = data?.cells || [];
  const xLabels = data?.x_labels || [];
  const yLabels = data?.y_labels || [];
  const maxValue = data?.max_value || 1;

  // Get cell value
  const getCellValue = (x: string, y: string): number => {
    const cell = cells.find((c) => c.x === x && c.y === y);
    return cell?.value || 0;
  };

  // Get cell color based on value intensity
  const getCellColor = (value: number): string => {
    const intensity = value / maxValue;

    if (intensity === 0) return "bg-gray-100";
    if (intensity < 0.25) return "bg-green-100";
    if (intensity < 0.5) return "bg-green-300";
    if (intensity < 0.75) return "bg-green-500";
    return "bg-green-700";
  };

  // Get cell text color
  const getCellTextColor = (value: number): string => {
    const intensity = value / maxValue;
    return intensity >= 0.5 ? "text-white" : "text-gray-700";
  };

  return (
    <WidgetCard title={config.title} className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2" />
              {xLabels.map((label) => (
                <th
                  key={label}
                  className="p-2 text-xs font-medium text-gray-500 text-center"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yLabels.map((yLabel) => (
              <tr key={yLabel}>
                <td className="p-2 text-xs font-medium text-gray-500 text-right pr-3">
                  {yLabel}
                </td>
                {xLabels.map((xLabel) => {
                  const value = getCellValue(xLabel, yLabel);
                  return (
                    <td key={xLabel} className="p-1">
                      <div
                        className={`
                          w-full aspect-square rounded flex items-center justify-center
                          text-xs font-medium transition-colors
                          ${getCellColor(value)}
                          ${getCellTextColor(value)}
                        `}
                        title={`${xLabel}, ${yLabel}: ${value}`}
                      >
                        {value > 0 ? value : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100" />
          <div className="w-4 h-4 rounded bg-green-100" />
          <div className="w-4 h-4 rounded bg-green-300" />
          <div className="w-4 h-4 rounded bg-green-500" />
          <div className="w-4 h-4 rounded bg-green-700" />
        </div>
        <span>More</span>
      </div>
    </WidgetCard>
  );
}
