"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  PipelineFunnelConfig,
  PipelineFunnelData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/dashboard/formatters";

export interface PipelineFunnelProps extends WidgetProps<PipelineFunnelConfig, PipelineFunnelData> {
  className?: string;
}

/**
 * Sales/recovery pipeline funnel widget
 * Shows stages with count, value, and optional conversion rates
 */
export function PipelineFunnel({
  config,
  data,
  state,
  className = "",
}: PipelineFunnelProps) {
  const stages = config.stages || [];
  const stageData = data?.stages || [];

  // Get data for a stage
  const getStageData = (stageKey: string) => {
    return stageData.find((s) => s.key === stageKey);
  };

  // Get conversion rate between stages
  const getConversionRate = (fromKey: string, toKey: string) => {
    if (!data?.conversions) return null;
    const conversion = data.conversions.find(
      (c) => c.from === fromKey && c.to === toKey
    );
    return conversion?.rate;
  };

  // Calculate max value for width scaling
  const maxCount = Math.max(...stageData.map((s) => s.count), 1);

  return (
    <WidgetCard title={config.title} className={className}>
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const stageInfo = getStageData(stage.key);
          const count = stageInfo?.count ?? 0;
          const value = stageInfo?.value ?? 0;
          const widthPercent = Math.max(20, (count / maxCount) * 100);

          // Get conversion to next stage
          const nextStage = stages[index + 1];
          const conversionRate = nextStage
            ? getConversionRate(stage.key, nextStage.key)
            : null;

          return (
            <div key={stage.key}>
              {/* Stage bar */}
              <div className="relative">
                <div
                  className="h-12 rounded flex items-center justify-between px-4 transition-all duration-300"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stage.color,
                    marginLeft: `${(100 - widthPercent) / 2}%`,
                  }}
                >
                  <span className="text-white text-sm font-medium truncate">
                    {stage.label}
                  </span>
                  <div className="text-white text-right">
                    <div className="text-sm font-bold">{formatNumber(count)}</div>
                    {value > 0 && (
                      <div className="text-xs opacity-80">{formatCurrency(value)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversion arrow */}
              {config.show_conversion && conversionRate != null && index < stages.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>{formatPercentage(conversionRate as number)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
        {stages.map((stage) => (
          <div key={stage.key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-xs text-gray-600">{stage.label}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
