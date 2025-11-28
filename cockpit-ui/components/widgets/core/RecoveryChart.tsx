"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  RecoveryChartConfig,
  RecoveryChartData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatPercentage } from "@/lib/dashboard/formatters";

export interface RecoveryChartProps extends WidgetProps<RecoveryChartConfig, RecoveryChartData> {
  className?: string;
}

/**
 * Payment recovery trend chart widget
 * Shows bar chart with recovered vs outstanding amounts
 */
export function RecoveryChart({
  config,
  data,
  state,
  className = "",
}: RecoveryChartProps) {
  const series = data?.series || [];
  const summary = data?.summary;

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...series.map((s) => Math.max(s.recovered, s.outstanding)),
    1
  );

  // Format date labels
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(date);
  };

  return (
    <WidgetCard title={config.title} className={className}>
      <div className="h-full flex flex-col">
        {/* Summary */}
        {summary && (
          <div className="flex gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-500">Recovered:</span>{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(summary.total_recovered)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Outstanding:</span>{" "}
              <span className="font-semibold text-red-600">
                {formatCurrency(summary.total_outstanding)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Rate:</span>{" "}
              <span className="font-semibold">
                {formatPercentage(summary.average_rate)}
              </span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 flex items-end gap-2">
          {series.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              No data available
            </div>
          ) : (
            series.map((item, index) => {
              const recoveredHeight = (item.recovered / maxValue) * 100;
              const outstandingHeight = (item.outstanding / maxValue) * 100;

              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  {/* Bars */}
                  <div className="w-full flex gap-0.5 items-end h-32">
                    {/* Recovered bar */}
                    <div
                      className="flex-1 bg-green-500 rounded-t transition-all duration-300"
                      style={{ height: `${recoveredHeight}%` }}
                      title={`Recovered: ${formatCurrency(item.recovered)}`}
                    />
                    {/* Outstanding bar */}
                    <div
                      className="flex-1 bg-red-400 rounded-t transition-all duration-300"
                      style={{ height: `${outstandingHeight}%` }}
                      title={`Outstanding: ${formatCurrency(item.outstanding)}`}
                    />
                  </div>

                  {/* Rate indicator */}
                  <div className="text-xs text-gray-600 font-medium">
                    {formatPercentage(item.rate)}
                  </div>

                  {/* Date label */}
                  <div className="text-xs text-gray-400">
                    {formatDate(item.date)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Target line indicator */}
        {config.show_target && config.target_rate && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t text-xs text-gray-500">
            <div className="w-4 h-0.5 bg-amber-500" />
            <span>Target: {formatPercentage(config.target_rate)}</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-gray-600">Recovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span className="text-xs text-gray-600">Outstanding</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
