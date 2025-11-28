"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  KPICardConfig,
  KPICardData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatPercentage, formatNumber, formatTime } from "@/lib/dashboard/formatters";

export interface KPICardProps extends WidgetProps<KPICardConfig, KPICardData> {
  className?: string;
}

/**
 * KPI metric display widget
 * Supports currency, percentage, number, and time formats
 */
export function KPICard({
  config,
  data,
  state,
  className = "",
}: KPICardProps) {
  const formatValue = (value: number | string | undefined) => {
    if (value === undefined || value === null) return "-";
    if (typeof value === "string") return value;

    switch (config.format) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return formatPercentage(value);
      case "time":
        return formatTime(value);
      case "number":
      default:
        return formatNumber(value);
    }
  };

  const getTrendColor = (trend: number | undefined) => {
    if (trend === undefined) return "";
    const isPositive = trend > 0;
    const isGood =
      config.trend_direction === "up_good" ? isPositive : !isPositive;
    return isGood ? "text-green-600" : "text-red-600";
  };

  const getTrendIcon = (trend: number | undefined) => {
    if (trend === undefined) return null;
    const isPositive = trend > 0;
    return isPositive ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  };

  const colorClasses: Record<string, string> = {
    default: "bg-white",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  };

  const valueColorClasses: Record<string, string> = {
    default: "text-gray-900",
    success: "text-green-700",
    warning: "text-amber-700",
    danger: "text-red-700",
    info: "text-blue-700",
  };

  const cardColor = colorClasses[config.color || "default"] || colorClasses.default;
  const valueColor = valueColorClasses[config.color || "default"] || valueColorClasses.default;

  return (
    <WidgetCard className={`${cardColor} ${className}`}>
      <div className="flex flex-col justify-between h-full">
        {/* Title */}
        <div className="text-sm text-gray-500 font-medium">
          {config.title}
        </div>

        {/* Value */}
        <div className={`text-2xl font-bold ${valueColor} mt-1`}>
          {formatValue(data?.value)}
        </div>

        {/* Trend */}
        {data?.trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor(data.trend)}`}>
            {getTrendIcon(data.trend)}
            <span>
              {data.trend > 0 ? "+" : ""}
              {formatPercentage(Math.abs(data.trend))}
            </span>
            {data.trend_label && (
              <span className="text-gray-500 ml-1">{data.trend_label}</span>
            )}
          </div>
        )}

        {/* Previous value comparison */}
        {data?.previous_value !== undefined && (
          <div className="text-xs text-gray-500 mt-1">
            vs {formatValue(data.previous_value)} previous
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
