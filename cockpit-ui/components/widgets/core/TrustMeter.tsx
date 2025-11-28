"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  TrustMeterConfig,
  TrustMeterData,
  WidgetProps,
} from "@/lib/widgets/types";

export interface TrustMeterProps extends WidgetProps<TrustMeterConfig, TrustMeterData> {
  className?: string;
}

/**
 * Governance trust score meter widget
 * Shows score with color-coded progress bar and optional breakdown
 */
export function TrustMeter({
  config,
  data,
  state,
  className = "",
}: TrustMeterProps) {
  const score = data?.score ?? 0;
  const clampedScore = Math.max(0, Math.min(100, score));

  const thresholds = config.thresholds || {
    danger: 50,
    warning: 80,
    success: 100,
  };

  const getScoreColor = () => {
    if (clampedScore >= thresholds.warning) return "bg-green-500";
    if (clampedScore >= thresholds.danger) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreTextColor = () => {
    if (clampedScore >= thresholds.warning) return "text-green-600";
    if (clampedScore >= thresholds.danger) return "text-amber-600";
    return "text-red-600";
  };

  const formatLastUpdated = (timestamp: string | undefined) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <WidgetCard title={config.title} className={className}>
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        {/* Score Circle */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${clampedScore * 2.51} 251`}
              className={getScoreTextColor()}
            />
          </svg>
          {/* Score text in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreTextColor()}`}>
              {Math.round(clampedScore)}
            </span>
          </div>
        </div>

        {/* Score label */}
        <div className="text-sm text-gray-600">
          {clampedScore >= thresholds.warning
            ? "Excellent"
            : clampedScore >= thresholds.danger
            ? "Good"
            : "Needs Attention"}
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor()} transition-all duration-500 ease-out`}
              style={{ width: `${clampedScore}%` }}
            />
          </div>
        </div>

        {/* Breakdown */}
        {config.show_breakdown && data?.breakdown && data.breakdown.length > 0 && (
          <div className="w-full space-y-2 pt-2 border-t">
            {data.breakdown.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.value >= 80
                          ? "bg-green-500"
                          : item.value >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="font-medium w-8 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last updated */}
        {data?.last_updated && (
          <div className="text-xs text-gray-400">
            Updated: {formatLastUpdated(data.last_updated)}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
