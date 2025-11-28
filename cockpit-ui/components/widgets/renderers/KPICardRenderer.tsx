"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/dashboard/formatters";

export function KPICardRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error, schema } = instance;

  const value = data.value as number | undefined;
  const label = (data.label as string) || schema.title;
  const format = (data.format as string) || "number";
  const trend = data.trend as number | undefined;
  const trendDirection = data.trend_direction as "up" | "down" | undefined;
  const threshold_warning = data.threshold_warning as number | undefined;
  const threshold_critical = data.threshold_critical as number | undefined;

  const formatValue = (val: number): string => {
    switch (format) {
      case "currency":
        return formatCurrency(val);
      case "percentage":
        return formatPercentage(val);
      default:
        return formatNumber(val);
    }
  };

  const getValueColor = (): string => {
    if (value === undefined) return "text-gray-900 dark:text-white";
    if (threshold_critical !== undefined && value <= threshold_critical) {
      return "text-red-600";
    }
    if (threshold_warning !== undefined && value <= threshold_warning) {
      return "text-amber-600";
    }
    return "text-gray-900 dark:text-white";
  };

  const getTrendIcon = () => {
    if (trendDirection === "up") {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    }
    if (trendDirection === "down") {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return null;
  };

  return (
    <WidgetCard loading={state === "loading"} error={error}>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </p>
        <p className={`text-3xl font-bold ${getValueColor()}`}>
          {value !== undefined ? formatValue(value) : "-"}
        </p>
        {trend !== undefined && (
          <div className="flex items-center justify-center mt-2 space-x-1">
            {getTrendIcon()}
            <span
              className={`text-sm ${
                trendDirection === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export default KPICardRenderer;
