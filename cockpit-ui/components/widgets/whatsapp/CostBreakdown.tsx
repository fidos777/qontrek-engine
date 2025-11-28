"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  WACostBreakdownConfig,
  WACostBreakdownData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatDate } from "@/lib/dashboard/formatters";

export interface CostBreakdownProps extends WidgetProps<WACostBreakdownConfig, WACostBreakdownData> {
  className?: string;
}

/**
 * WhatsApp cost breakdown widget
 * Shows message costs by category and period
 */
export function CostBreakdown({
  config,
  data,
  state,
  className = "",
}: CostBreakdownProps) {
  const breakdown = data?.breakdown || [];
  const totalCost = data?.total_cost || 0;

  // Calculate percentages
  const getPercentage = (cost: number) => {
    if (totalCost === 0) return 0;
    return (cost / totalCost) * 100;
  };

  // Get category color
  const getCategoryColor = (category: string, index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    return colors[index % colors.length];
  };

  // Get period label
  const getPeriodLabel = () => {
    switch (config.period) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return config.period;
    }
  };

  return (
    <WidgetCard
      title={config.title}
      subtitle={
        data?.period_start && data?.period_end
          ? `${formatDate(data.period_start)} - ${formatDate(data.period_end)}`
          : getPeriodLabel()
      }
      className={className}
    >
      <div className="space-y-4">
        {/* Total cost */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Total Cost</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalCost)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</div>
        </div>

        {/* Breakdown bar chart */}
        {config.show_by_category && breakdown.length > 0 && (
          <>
            {/* Stacked bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
              {breakdown.map((item, index) => (
                <div
                  key={item.category}
                  className={`${getCategoryColor(item.category, index)} transition-all duration-300`}
                  style={{ width: `${getPercentage(item.cost)}%` }}
                  title={`${item.category}: ${formatCurrency(item.cost)}`}
                />
              ))}
            </div>

            {/* Category breakdown list */}
            <div className="space-y-3">
              {breakdown.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded ${getCategoryColor(item.category, index)}`}
                    />
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.cost)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.count} messages ({Math.round(getPercentage(item.cost))}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {breakdown.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No cost data available for this period
          </div>
        )}

        {/* Summary stats */}
        {breakdown.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Messages</span>
              <span className="font-medium">
                {breakdown.reduce((sum, item) => sum + item.count, 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Avg Cost/Message</span>
              <span className="font-medium">
                {formatCurrency(
                  totalCost /
                    Math.max(
                      1,
                      breakdown.reduce((sum, item) => sum + item.count, 0)
                    )
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
